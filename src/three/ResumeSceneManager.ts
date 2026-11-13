import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
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

// Pre-allocated scratch math helpers (Zero GC in render loop)
const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _tmpVec = new THREE.Vector3();
const _dummy = new THREE.Object3D();

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
  private keyLight!: THREE.DirectionalLight;
  private softboxWarm: THREE.RectAreaLight | null = null;
  private softboxCool: THREE.RectAreaLight | null = null;

  private textures: ProceduralTextureSet;
  private materials: StudioMaterialLibrary;
  private exhibition: BuiltExhibition;
  private envRenderTarget: THREE.WebGLRenderTarget;

  private cameraSpline: THREE.CatmullRomCurve3;
  private lookAtSpline: THREE.CatmullRomCurve3;

  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private pointerDownPos = new THREE.Vector2();
  private lastDragX = 0;
  private isDraggingSculpture = false;
  private lastHoverCheckMs = 0;
  private hoveredChapter: ChapterId | null = null;
  private activeChapter: ChapterId = 'overview';

  private clock = new THREE.Clock();
  private rafId = 0;
  private timeoutId = 0;
  private disposed = false;
  private contextLost = false;
  private reducedMotion = false;

  private targetScrollProgress = 0;
  private currentScrollProgress = 0;
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private dampedParallaxX = 0;
  private dampedParallaxY = 0;

  private sculptureYawTarget = 0;
  private sculptureYawCurrent = 0;

  private targetExplode = 0;
  private currentExplode = 0;
  private autoRotateEnabled = false;

  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    initialProfile: ResumeProfile,
    callbacks: SceneManagerCallbacks,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

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
    this.scene.fog = new THREE.FogExp2(BG_HEX, 0.024);

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);

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

    // Smooth winding spline choreography synced to vertical page scroll
    const camPoints = this.exhibition.orderedChapters.map((id) =>
      this.exhibition.exhibits[id].cameraPosition.clone(),
    );
    const lookPoints = this.exhibition.orderedChapters.map((id) =>
      this.exhibition.exhibits[id].cameraTarget.clone(),
    );
    this.cameraSpline = new THREE.CatmullRomCurve3(
      camPoints,
      false,
      'catmullrom',
      0.45,
    );
    this.lookAtSpline = new THREE.CatmullRomCurve3(
      lookPoints,
      false,
      'catmullrom',
      0.45,
    );

    this.camera.position.copy(camPoints[0]);
    this.camera.lookAt(lookPoints[0]);

    this.raycaster.layers.set(1);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.tick();
  }

  private setupLighting(): void {
    // 1. Warm Key Directional Light whose frustum glides with scroll corridor Z
    this.keyLight = new THREE.DirectionalLight(0xfff1dc, 2.35);
    this.keyLight.position.set(9, 14, 10);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 42;
    const d = 12;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    // 2. Cool Sky / Dark Ground Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x8cb8ff, 0x161b26, 0.85);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Cool Rim / Backlight
    const rimLight = new THREE.DirectionalLight(0x6ea8fe, 1.15);
    rimLight.position.set(-10, 8, -12);
    this.scene.add(rimLight);

    // 4. Studio Softboxes (RectAreaLight) on hardware GPUs
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      this.softboxWarm = new THREE.RectAreaLight(0xffe7c2, 2.6, 6, 3);
      this.softboxWarm.position.set(6, 5.5, 5);
      this.softboxWarm.lookAt(0, 1.4, 0);
      this.scene.add(this.softboxWarm);

      this.softboxCool = new THREE.RectAreaLight(0x7dd3fc, 1.8, 6, 3);
      this.softboxCool.position.set(-6, 5.0, -5);
      this.softboxCool.lookAt(0, 1.4, 0);
      this.scene.add(this.softboxCool);
    }
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointermove', this.onWindowPointerMove);
    dom.addEventListener('webglcontextlost', this.onContextLost);
    dom.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private unbindEvents(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
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

  private onWindowPointerMove = (e: PointerEvent): void => {
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    const nx = (e.clientX / w) * 2 - 1;
    const ny = (e.clientY / h) * 2 - 1;
    this.pointerParallaxX = THREE.MathUtils.clamp(nx, -1, 1) * 0.28;
    this.pointerParallaxY = THREE.MathUtils.clamp(-ny, -1, 1) * 0.14;

    if (this.isDraggingSculpture) {
      const dx = e.clientX - this.lastDragX;
      this.lastDragX = e.clientX;
      this.sculptureYawTarget += dx * 0.011;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.isDraggingSculpture) return;
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
    this.lastDragX = e.clientX;
    this.isDraggingSculpture = true;
    this.renderer.domElement.style.cursor = 'grabbing';
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.isDraggingSculpture) return;
    this.isDraggingSculpture = false;
    this.renderer.domElement.style.cursor = this.hoveredChapter
      ? 'pointer'
      : 'grab';

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
      this.pulseExhibit(chapterId);
      this.callbacks.onSelectExhibit(chapterId);
    }
  };

  public setScrollProgress(progress: number): void {
    this.targetScrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
    if (this.reducedMotion) {
      this.currentScrollProgress = this.targetScrollProgress;
    }
  }

  public setActiveChapter(chapter: ChapterId): void {
    if (this.activeChapter !== chapter) {
      this.activeChapter = chapter;
      this.sculptureYawTarget = 0;
    }
  }

  public pulseExhibit(chapter: ChapterId): void {
    const ex = this.exhibition.exhibits[chapter];
    if (ex) {
      ex.pulse = 1.0;
    }
  }

  public setExplodeAmount(value: number): void {
    this.targetExplode = THREE.MathUtils.clamp(value, 0, 1);
  }

  public setFinish(finish: MaterialFinish): void {
    this.materials.applyFinish(finish);
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;
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

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync
      ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
      : null;
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
      // 1. Scroll-synchronized spline choreography with exponential damping
      if (!this.reducedMotion) {
        this.currentScrollProgress = THREE.MathUtils.damp(
          this.currentScrollProgress,
          this.targetScrollProgress,
          6.5,
          dt,
        );
        this.dampedParallaxX = THREE.MathUtils.damp(
          this.dampedParallaxX,
          this.pointerParallaxX,
          5.5,
          dt,
        );
        this.dampedParallaxY = THREE.MathUtils.damp(
          this.dampedParallaxY,
          this.pointerParallaxY,
          5.5,
          dt,
        );
      } else {
        this.currentScrollProgress = this.targetScrollProgress;
        this.dampedParallaxX = 0;
        this.dampedParallaxY = 0;
      }

      const t = THREE.MathUtils.clamp(this.currentScrollProgress, 0, 1);
      this.cameraSpline.getPointAt(t, _camPos);
      this.lookAtSpline.getPointAt(t, _camLook);

      _camPos.x += this.dampedParallaxX;
      _camPos.y += this.dampedParallaxY;
      this.camera.position.copy(_camPos);
      this.camera.lookAt(_camLook);

      // Keep tight shadow-casting frustum tracking the active corridor Z
      this.keyLight.position.set(9, 14, _camLook.z + 10);
      this.keyLight.target.position.set(0, 0, _camLook.z);
      this.keyLight.target.updateMatrixWorld();

      if (this.softboxWarm && this.softboxCool) {
        this.softboxWarm.position.set(6, 5.5, _camLook.z + 5);
        this.softboxWarm.lookAt(_camLook.x, 1.4, _camLook.z);
        this.softboxCool.position.set(-6, 5.0, _camLook.z - 5);
        this.softboxCool.lookAt(_camLook.x, 1.4, _camLook.z);
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

      // 3. Interactive sculpture turntable rotation & pulse accent
      if (this.autoRotateEnabled && !this.isDraggingSculpture && !this.reducedMotion) {
        this.sculptureYawTarget += dt * 0.42;
      }
      this.sculptureYawCurrent = THREE.MathUtils.damp(
        this.sculptureYawCurrent,
        this.sculptureYawTarget,
        8.0,
        dt,
      );

      this.exhibition.orderedChapters.forEach((id) => {
        const ex = this.exhibition.exhibits[id];
        ex.pulse = THREE.MathUtils.damp(ex.pulse, 0, 5.5, dt);
        const targetYaw =
          id === this.activeChapter ? this.sculptureYawCurrent + ex.pulse * 0.45 : 0;
        ex.rotatableGroup.rotation.y = THREE.MathUtils.damp(
          ex.rotatableGroup.rotation.y,
          targetYaw,
          6.0,
          dt,
        );

        const mat = ex.ringHighlight.material as THREE.MeshStandardMaterial;
        const targetOpacity =
          id === this.activeChapter
            ? 0.56 + ex.pulse * 0.35
            : id === this.hoveredChapter
              ? 0.38
              : 0.12;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 8, dt);
      });

      // 4. Subtle kinetic sculpture motion (respects reduced motion)
      if (!this.reducedMotion) {
        const { kinetic } = this.exhibition;
        kinetic.overviewOuterRing.rotation.y += dt * 0.32;
        kinetic.overviewInnerRing.rotation.x += dt * 0.42;
        kinetic.overviewPrism.rotation.y -= dt * 0.45;
        kinetic.overviewPrism.position.y = Math.sin(elapsed * 1.4) * 0.045;

        kinetic.cloudCore.rotation.y += dt * 0.55;
        kinetic.cloudPods.rotation.y += dt * 0.14;
        kinetic.cloudRings[0].rotation.y += dt * 0.3;
        kinetic.cloudRings[1].rotation.x -= dt * 0.22;

        kinetic.cicdTurbine.rotation.y += dt * 0.85;
        kinetic.cicdScannerRing.rotation.z += dt * 0.45;

        kinetic.obsRadarDish.rotation.y = Math.sin(elapsed * 0.75) * 0.65;

        const barCount = kinetic.obsSpectrumBars.count;
        for (let i = 0; i < barCount; i += 1) {
          const wave = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * 2.6 + i * 0.55));
          _dummy.position.set(kinetic.obsBarBaseX[i], 1.3, kinetic.obsBarBaseZ[i]);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.set(1, wave, 1);
          _dummy.updateMatrix();
          kinetic.obsSpectrumBars.setMatrixAt(i, _dummy.matrix);
        }
        kinetic.obsSpectrumBars.instanceMatrix.needsUpdate = true;

        kinetic.vaultWheel.rotation.z += dt * 0.28;
        kinetic.vaultCore.rotation.y -= dt * 0.65;

        for (let i = 0; i < kinetic.careerBeacons.length; i += 1) {
          kinetic.careerBeacons[i].position.y =
            1.12 + Math.sin(elapsed * 1.8 + i * 1.4) * 0.02;
        }
      }

      this.renderer.render(this.scene, this.camera);
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
