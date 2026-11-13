import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CameraViewId,
  ChapterId,
  MaterialFinish,
  ResumeProfile,
} from '../types/resume';
import { buildExhibitionScene, BuiltExhibition } from './exhibits';
import { createStudioMaterials, StudioMaterialLibrary } from './materials';
import {
  createProceduralTextures,
  ProceduralTextureSet,
} from './proceduralTextures';

const BG_HEX = 0x0b0e14;
const GALLERY_CAMERA_POS = new THREE.Vector3(0.4, 7.6, 15.2);
const GALLERY_CAMERA_TARGET = new THREE.Vector3(0, 1.35, 0.8);

// Pre-allocated scratch math helpers (Zero GC in render loop)
const _projVec = new THREE.Vector3();
const _tmpVec = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface SceneManagerCallbacks {
  onSelectExhibit: (chapter: ChapterId) => void;
  onHoverExhibit: (chapter: ChapterId | null) => void;
  onContextLostChange: (lost: boolean) => void;
}

export class ResumeSceneManager {
  private container: HTMLElement;
  private callbacks: SceneManagerCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: ProceduralTextureSet;
  private materials: StudioMaterialLibrary;
  private exhibition: BuiltExhibition;
  private envRenderTarget: THREE.WebGLRenderTarget;

  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private pointerDownPos = new THREE.Vector2();
  private lastHoverCheckMs = 0;
  private hoveredChapter: ChapterId | null = null;
  private activeChapter: ChapterId = 'overview';

  private clock = new THREE.Clock();
  private rafId = 0;
  private timeoutId = 0;
  private disposed = false;
  private contextLost = false;
  private reducedMotion = false;

  private isTransitioningCamera = false;
  private desiredCamPos = GALLERY_CAMERA_POS.clone();
  private desiredLookAt = GALLERY_CAMERA_TARGET.clone();

  private targetExplode = 0;
  private currentExplode = 0;
  private autoRotateEnabled = false;

  private markerElements: Partial<Record<ChapterId, HTMLElement | null>> = {};
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    initialProfile: ResumeProfile,
    callbacks: SceneManagerCallbacks,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches ?? false;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_HEX);
    this.scene.fog = new THREE.FogExp2(BG_HEX, 0.025);

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);
    this.camera.position.set(2.9, 2.75, 4.9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 26;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.target.set(0, 1.55, 0);
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.65;

    // Cancel scripted camera transitions immediately if user grabs orbit controls
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // Studio IBL via RoomEnvironment on every device
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRenderTarget = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    );
    this.scene.environment = this.envRenderTarget.texture;
    pmremGenerator.dispose();

    this.setupLighting();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso, initialProfile);
    this.materials = createStudioMaterials(this.textures, this.isSoftwareGl);
    this.exhibition = buildExhibitionScene(this.scene, this.materials);

    this.raycaster.layers.set(1);

    // Pre-warm shaders on hardware GPUs
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.tick();
  }

  private setupLighting(): void {
    // 1. Warm Key Directional Light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.3);
    keyLight.position.set(9, 14, 10);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // 2. Cool Sky / Dark Ground Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x8cb8ff, 0x161b26, 0.85);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Cool Rim / Backlight to carve architectural silhouettes
    const rimLight = new THREE.DirectionalLight(0x6ea8fe, 1.15);
    rimLight.position.set(-10, 8, -11);
    this.scene.add(rimLight);

    // 4. Studio Softboxes (RectAreaLight) on hardware GPUs
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxWarm = new THREE.RectAreaLight(0xffe7c2, 2.8, 6, 3);
      softboxWarm.position.set(6, 5.5, 6);
      softboxWarm.lookAt(0, 1.4, 0);
      this.scene.add(softboxWarm);

      const softboxCool = new THREE.RectAreaLight(0x7dd3fc, 1.9, 6, 3);
      softboxCool.position.set(-6, 5.0, -5);
      softboxCool.lookAt(0, 1.4, 0);
      this.scene.add(softboxCool);
    }
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('webglcontextlost', this.onContextLost);
    dom.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private unbindEvents(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('webglcontextlost', this.onContextLost);
    dom.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextLostChange(true);
  };

  private onContextRestored = (): void => {
    this.contextLost = false;
    this.callbacks.onContextLostChange(false);
    this.clock.getDelta();
  };

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastHoverCheckMs < 48) return;
    this.lastHoverCheckMs = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.exhibition.proxyColliders,
      false,
    );
    const nextHover =
      hits.length > 0
        ? (hits[0].object.userData.chapterId as ChapterId)
        : null;

    if (nextHover !== this.hoveredChapter) {
      this.hoveredChapter = nextHover;
      this.renderer.domElement.style.cursor = nextHover ? 'pointer' : 'grab';
      this.callbacks.onHoverExhibit(nextHover);
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDownPos.set(e.clientX, e.clientY);
  };

  private onPointerUp = (e: PointerEvent): void => {
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.exhibition.proxyColliders,
      false,
    );
    if (hits.length > 0) {
      const chapterId = hits[0].object.userData.chapterId as ChapterId;
      this.focusView(chapterId);
      this.callbacks.onSelectExhibit(chapterId);
    }
  };

  public registerMarkerElement(
    id: ChapterId,
    el: HTMLElement | null,
  ): void {
    this.markerElements[id] = el;
  }

  public focusView(view: CameraViewId): void {
    if (view === 'gallery') {
      this.desiredCamPos.copy(GALLERY_CAMERA_POS);
      this.desiredLookAt.copy(GALLERY_CAMERA_TARGET);
    } else {
      const exhibit = this.exhibition.exhibits[view];
      this.activeChapter = view;
      this.desiredCamPos.copy(exhibit.cameraPosition);
      this.desiredLookAt.copy(exhibit.cameraTarget);
    }

    if (this.reducedMotion) {
      this.camera.position.copy(this.desiredCamPos);
      this.controls.target.copy(this.desiredLookAt);
      this.controls.update();
      this.isTransitioningCamera = false;
    } else {
      this.isTransitioningCamera = true;
    }
  }

  public setActiveChapter(chapter: ChapterId): void {
    this.activeChapter = chapter;
  }

  public setExplodeAmount(value: number): void {
    this.targetExplode = THREE.MathUtils.clamp(value, 0, 1);
  }

  public setFinish(finish: MaterialFinish): void {
    this.materials.applyFinish(finish);
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;
    this.controls.autoRotate = !this.isSoftwareGl && enabled;
  }

  public updateResumeProfile(profile: ResumeProfile): void {
    this.textures.updateDynamicTextures(profile);
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateProjections(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w <= 0 || h <= 0) return;

    (Object.keys(this.exhibition.exhibits) as ChapterId[]).forEach((id) => {
      const el = this.markerElements[id];
      if (!el) return;

      const ex = this.exhibition.exhibits[id];
      _projVec.copy(ex.anchorWorld);
      _projVec.project(this.camera);

      if (_projVec.z > 1 || _projVec.z < -1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }

      const sx = ((_projVec.x + 1) * 0.5) * w;
      const sy = ((-_projVec.y + 1) * 0.5) * h;

      // Keep markers hidden if near screen edge or behind top bar
      const inBounds = sx > 60 && sx < w - 60 && sy > 70 && sy < h - 130;
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = inBounds ? '1' : '0';
      el.style.pointerEvents = inBounds ? 'auto' : 'none';
    });
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    if (!sync) {
      this.timeoutId = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.timeoutId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.timeoutId = window.setTimeout(cb, 80);
      }
    };
    this.timeoutId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (!this.contextLost) {
      // 1. Exponential camera choreography
      if (this.isTransitioningCamera) {
        const alpha = 1 - Math.exp(-5.5 * dt);
        this.camera.position.lerp(this.desiredCamPos, alpha);
        this.controls.target.lerp(this.desiredLookAt, alpha);

        const posDist = this.camera.position.distanceTo(this.desiredCamPos);
        const tgtDist = this.controls.target.distanceTo(this.desiredLookAt);
        if (posDist < 0.02 && tgtDist < 0.02) {
          this.camera.position.copy(this.desiredCamPos);
          this.controls.target.copy(this.desiredLookAt);
          this.isTransitioningCamera = false;
        }
      }

      // 2. Smooth exploded-assembly damping
      if (Math.abs(this.currentExplode - this.targetExplode) > 0.0005) {
        this.currentExplode = THREE.MathUtils.damp(
          this.currentExplode,
          this.targetExplode,
          6.5,
          dt,
        );
        for (let i = 0; i < this.exhibition.explodableParts.length; i += 1) {
          const part = this.exhibition.explodableParts[i];
          _tmpVec
            .copy(part.basePos)
            .addScaledVector(part.offset, this.currentExplode);
          part.object.position.copy(_tmpVec);
        }
      }

      // 3. Subtle kinetic studio sculpture motion (respects reduced motion)
      if (!this.reducedMotion) {
        const { kinetic } = this.exhibition;
        kinetic.overviewOuterRing.rotation.y += dt * 0.28;
        kinetic.overviewInnerRing.rotation.x += dt * 0.36;
        kinetic.overviewInnerRing.rotation.z += dt * 0.16;
        kinetic.overviewPrism.rotation.y -= dt * 0.42;
        kinetic.overviewPrism.position.y = Math.sin(elapsed * 1.4) * 0.045;

        kinetic.skillsCore.rotation.y += dt * 0.45;
        kinetic.skillsRings[0].rotation.y += dt * 0.32;
        kinetic.skillsRings[1].rotation.x -= dt * 0.24;
        kinetic.skillsRings[2].rotation.z += dt * 0.18;

        for (let i = 0; i < kinetic.experienceBeacons.length; i += 1) {
          const beacon = kinetic.experienceBeacons[i];
          beacon.position.y = 0.22 + Math.sin(elapsed * 1.8 + i * 0.9) * 0.015;
        }
      }

      // 4. Highlight ring opacity feedback for active / hovered exhibit
      (Object.keys(this.exhibition.exhibits) as ChapterId[]).forEach((id) => {
        const ex = this.exhibition.exhibits[id];
        const mat = ex.ringHighlight.material as THREE.MeshStandardMaterial;
        const targetOpacity =
          id === this.activeChapter
            ? 0.58
            : id === this.hoveredChapter
              ? 0.38
              : 0.12;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 8, dt);
      });

      this.controls.autoRotate = !this.isSoftwareGl && this.autoRotateEnabled;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.updateProjections();
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.timeoutId);
    this.resizeObserver.disconnect();
    this.unbindEvents();
    this.controls.dispose();
    this.exhibition.dispose();
    this.materials.dispose();
    this.textures.dispose();
    this.envRenderTarget.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
