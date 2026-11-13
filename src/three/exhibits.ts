import * as THREE from 'three';
import { ChapterId } from '../types/resume';
import { StudioMaterialLibrary } from './materials';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePos: THREE.Vector3;
  offset: THREE.Vector3;
}

export interface ExhibitDefinition {
  id: ChapterId;
  indexLabel: string;
  title: string;
  group: THREE.Group;
  rotatableGroup: THREE.Group;
  anchorWorld: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  proxyCollider: THREE.Mesh;
  ringHighlight: THREE.Mesh;
  pulse: number;
}

export interface KineticNodes {
  overviewOuterRing: THREE.Object3D;
  overviewInnerRing: THREE.Object3D;
  overviewPrism: THREE.Object3D;
  cloudCore: THREE.Object3D;
  cloudRings: THREE.Object3D[];
  cloudPods: THREE.Object3D;
  cicdTurbine: THREE.Object3D;
  cicdScannerRing: THREE.Object3D;
  obsRadarDish: THREE.Object3D;
  obsSpectrumBars: THREE.InstancedMesh;
  obsBarBaseX: number[];
  obsBarBaseZ: number[];
  vaultWheel: THREE.Object3D;
  vaultCore: THREE.Object3D;
  careerBeacons: THREE.Object3D[];
}

export interface BuiltExhibition {
  exhibits: Record<ChapterId, ExhibitDefinition>;
  orderedChapters: ChapterId[];
  proxyColliders: THREE.Mesh[];
  explodableParts: ExplodablePart[];
  kinetic: KineticNodes;
  dispose: () => void;
}

function createPolygonShape(sides: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < sides; i += 1) {
    const angle = (i / sides) * Math.PI * 2 + Math.PI / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function createRoundedRectShape(
  width: number,
  height: number,
  r: number,
): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function createArchShape(
  width: number,
  height: number,
  thickness: number,
): THREE.Shape {
  const outer = new THREE.Shape();
  const hw = width / 2;
  const archR = hw;
  const legH = height - archR;

  outer.moveTo(-hw, 0);
  outer.lineTo(-hw, legH);
  outer.absarc(0, legH, archR, Math.PI, 0, true);
  outer.lineTo(hw, 0);
  outer.lineTo(hw - thickness, 0);
  outer.lineTo(hw - thickness, legH);
  outer.absarc(0, legH, archR - thickness, 0, Math.PI, false);
  outer.lineTo(-hw + thickness, 0);
  outer.closePath();
  return outer;
}

export function buildExhibitionScene(
  scene: THREE.Scene,
  mats: StudioMaterialLibrary,
): BuiltExhibition {
  const geometries: THREE.BufferGeometry[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const explodableParts: ExplodablePart[] = [];
  const registerExplode = (
    object: THREE.Object3D,
    ox: number,
    oy: number,
    oz: number,
  ) => {
    explodableParts.push({
      object,
      basePos: object.position.clone(),
      offset: new THREE.Vector3(ox, oy, oz),
    });
  };

  const enableShadows = (obj: THREE.Object3D, cast = true, receive = true) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = cast;
        mesh.receiveShadow = receive;
      }
    });
  };

  const shadowPlaneGeo = trackGeo(new THREE.PlaneGeometry(4.4, 4.4));
  shadowPlaneGeo.rotateX(-Math.PI / 2);

  const highlightRingGeo = trackGeo(new THREE.RingGeometry(1.75, 1.84, 64));
  highlightRingGeo.rotateX(-Math.PI / 2);

  const createExhibitBase = (
    chapterId: ChapterId,
    pos: [number, number, number],
    rotY: number,
    scale = 1,
    colliderSize: [number, number, number] = [3.4, 3.8, 3.4],
  ): {
    group: THREE.Group;
    rotatableGroup: THREE.Group;
    proxyCollider: THREE.Mesh;
    ringHighlight: THREE.Mesh;
  } => {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.y = rotY;
    scene.add(group);

    const rotatableGroup = new THREE.Group();
    group.add(rotatableGroup);

    const shadow = new THREE.Mesh(shadowPlaneGeo, mats.contactShadowMat);
    shadow.position.y = 0.01;
    shadow.scale.setScalar(scale);
    shadow.renderOrder = 1;
    group.add(shadow);

    const ringMat = mats.warmEmissive.clone();
    ringMat.transparent = true;
    ringMat.opacity = 0.16;
    const ringHighlight = new THREE.Mesh(highlightRingGeo, ringMat);
    ringHighlight.position.y = 0.025;
    ringHighlight.scale.setScalar(scale * 0.96);
    group.add(ringHighlight);

    const proxyGeo = trackGeo(
      new THREE.BoxGeometry(colliderSize[0], colliderSize[1], colliderSize[2]),
    );
    const proxyCollider = new THREE.Mesh(proxyGeo, mats.proxyColliderMat);
    proxyCollider.position.y = colliderSize[1] / 2;
    proxyCollider.layers.set(1);
    proxyCollider.userData.chapterId = chapterId;
    group.add(proxyCollider);

    return { group, rotatableGroup, proxyCollider, ringHighlight };
  };

  // =========================================================================
  // ARCHITECTURAL CORRIDOR FLOOR & BOLLARDS (InstancedMesh)
  // =========================================================================
  const floorGeo = trackGeo(new THREE.PlaneGeometry(88, 150));
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, mats.floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.position.set(0, 0, -32);
  scene.add(floorMesh);

  // Subtle runway guide rails along the winding corridor
  const railGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.02, 82));
  const railMat = mats.darkAnodized;
  const railL = new THREE.Mesh(railGeo, railMat);
  railL.position.set(-4.9, 0.01, -29);
  const railR = new THREE.Mesh(railGeo, railMat);
  railR.position.set(4.9, 0.01, -29);
  scene.add(railL, railR);

  // Corridor light bollards (36 instances flanking the runway)
  const bollardGeo = trackGeo(
    new THREE.CylinderGeometry(0.075, 0.105, 0.92, 12),
  );
  bollardGeo.translate(0, 0.46, 0);
  const bollardCount = 36;
  const bollards = new THREE.InstancedMesh(
    bollardGeo,
    mats.instancedBollardMat,
    bollardCount,
  );
  bollards.castShadow = true;
  bollards.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < bollardCount; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const zPos = 6 - row * 4.1;
    const xPos = side * (5.3 + (row % 2) * 0.45);
    dummy.position.set(xPos, 0, zPos);
    dummy.rotation.set(0, 0, 0);
    const s = 0.88 + (i % 3) * 0.1;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    bollards.setMatrixAt(i, dummy.matrix);
  }
  bollards.instanceMatrix.needsUpdate = true;
  bollards.computeBoundingSphere();
  scene.add(bollards);

  // =========================================================================
  // STAGE 00 — OVERVIEW: Architectural Reliability Monolith
  // =========================================================================
  const ov = createExhibitBase('overview', [1.55, 0, 0], -0.22, 1.12);
  const hexBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(6, 1.5), {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    }),
  );
  hexBaseGeo.rotateX(-Math.PI / 2);
  const hexBase = new THREE.Mesh(hexBaseGeo, mats.plinthStone);
  hexBase.position.y = 0.05;
  ov.rotatableGroup.add(hexBase);

  const collarPoints = [
    new THREE.Vector2(1.15, 0),
    new THREE.Vector2(1.22, 0.04),
    new THREE.Vector2(1.15, 0.16),
    new THREE.Vector2(0.84, 0.2),
    new THREE.Vector2(0.8, 0.26),
    new THREE.Vector2(0.0, 0.26),
  ];
  const collar = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(collarPoints, 48)),
    mats.brushedChassis,
  );
  collar.position.y = 0.42;
  ov.rotatableGroup.add(collar);
  registerExplode(collar, 0, 0.24, 0);

  const plaqueFrameGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(1.56, 0.56, 0.04), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    }),
  );
  const plaqueGroup = new THREE.Group();
  plaqueGroup.position.set(0, 0.44, 1.24);
  plaqueGroup.rotation.x = -0.52;
  const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, mats.darkAnodized);
  const plaqueFace = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.44, 0.48)),
    mats.nameplateMat,
  );
  plaqueFace.position.z = 0.068;
  plaqueGroup.add(plaqueFrame, plaqueFace);
  ov.rotatableGroup.add(plaqueGroup);
  registerExplode(plaqueGroup, 0, 0.12, 0.55);

  const cradleL = new THREE.Mesh(
    trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.76, 0.68, 0),
          new THREE.Vector3(-1.02, 1.35, 0),
          new THREE.Vector3(-0.94, 2.08, 0),
        ]),
        28,
        0.044,
        12,
        false,
      ),
    ),
    mats.accentBrass,
  );
  const cradleR = new THREE.Mesh(
    trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.76, 0.68, 0),
          new THREE.Vector3(1.02, 1.35, 0),
          new THREE.Vector3(0.94, 2.08, 0),
        ]),
        28,
        0.044,
        12,
        false,
      ),
    ),
    mats.accentBrass,
  );
  ov.rotatableGroup.add(cradleL, cradleR);
  registerExplode(cradleL, -0.45, 0.25, 0);
  registerExplode(cradleR, 0.45, 0.25, 0);

  const kineticPivot = new THREE.Group();
  kineticPivot.position.set(0, 2.05, 0);
  ov.rotatableGroup.add(kineticPivot);
  registerExplode(kineticPivot, 0, 0.72, 0);

  const overviewOuterRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.9, 0.036, 16, 72)),
    mats.brushedChassis,
  );
  const overviewInnerRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.66, 0.028, 16, 64)),
    mats.accentBrass,
  );
  overviewInnerRing.rotation.x = Math.PI / 3;
  const overviewPrism = new THREE.Group();
  const prismMesh = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.42, 0)),
    mats.opticalGlass,
  );
  prismMesh.renderOrder = 2;
  const prismCore = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.14, 0)),
    mats.warmEmissive,
  );
  overviewPrism.add(prismCore, prismMesh);
  kineticPivot.add(overviewOuterRing, overviewInnerRing, overviewPrism);

  const lampArm = new THREE.Mesh(
    trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.62, 0.65, -0.58),
          new THREE.Vector3(-1.12, 1.9, -0.82),
          new THREE.Vector3(-0.55, 2.95, -0.35),
          new THREE.Vector3(-0.18, 2.86, -0.15),
        ]),
        32,
        0.028,
        10,
        false,
      ),
    ),
    mats.darkAnodized,
  );
  const lampShade = new THREE.Mesh(
    trackGeo(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.03, 0.24),
          new THREE.Vector2(0.08, 0.22),
          new THREE.Vector2(0.22, 0.02),
          new THREE.Vector2(0.2, 0),
        ],
        28,
      ),
    ),
    mats.accentBrass,
  );
  lampShade.position.set(-0.18, 2.66, -0.15);
  lampShade.rotation.z = -0.35;
  const lampBulb = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.065, 16, 16)),
    mats.warmEmissive,
  );
  lampBulb.position.set(-0.15, 2.68, -0.15);
  ov.rotatableGroup.add(lampArm, lampShade, lampBulb);
  registerExplode(lampArm, -0.35, 0.4, -0.35);
  registerExplode(lampShade, -0.35, 0.55, -0.35);
  registerExplode(lampBulb, -0.35, 0.55, -0.35);
  enableShadows(ov.group);

  // =========================================================================
  // STAGE 01 — CLOUD & KUBERNETES: Orchestrated Cluster & IaC Matrix
  // =========================================================================
  const cl = createExhibitBase('cloud', [2.25, 0, -11.5], -0.38, 1.08);
  const clBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(8, 1.48), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    }),
  );
  clBaseGeo.rotateX(-Math.PI / 2);
  const clBase = new THREE.Mesh(clBaseGeo, mats.plinthStone);
  clBase.position.y = 0.04;
  cl.rotatableGroup.add(clBase);

  // Central Kubernetes control-plane spire
  const cpSpine = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.2, 0.28, 2.45, 16)),
    mats.brushedChassis,
  );
  cpSpine.position.y = 1.54;
  cl.rotatableGroup.add(cpSpine);

  const cloudPivot = new THREE.Group();
  cloudPivot.position.y = 2.05;
  cl.rotatableGroup.add(cloudPivot);
  registerExplode(cloudPivot, 0, 0.55, 0);

  const cloudCore = new THREE.Mesh(
    trackGeo(new THREE.IcosahedronGeometry(0.32, 1)),
    mats.coolEmissive,
  );
  const cloudGlass = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.48, 32, 24)),
    mats.opticalGlass,
  );
  cloudGlass.renderOrder = 2;
  cloudPivot.add(cloudCore, cloudGlass);

  // 6 cantilevered worker pod blades + curved fiber mesh conduits
  const cloudPods = new THREE.Group();
  cloudPivot.add(cloudPods);
  const podBladeGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(0.62, 0.36, 0.06), {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    }),
  );
  podBladeGeo.rotateX(-Math.PI / 2);

  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2;
    const rx = Math.cos(ang) * 1.05;
    const rz = Math.sin(ang) * 1.05;
    const ry = ((i % 3) - 1) * 0.32;

    const podGroup = new THREE.Group();
    podGroup.position.set(rx, ry, rz);
    podGroup.rotation.y = -ang;

    const blade = new THREE.Mesh(
      podBladeGeo,
      i % 2 === 0 ? mats.darkAnodized : mats.brushedChassis,
    );
    const led = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.08, 0.08, 0.24)),
      i % 2 === 0 ? mats.warmEmissive : mats.coolEmissive,
    );
    led.position.set(0.24, 0.11, 0);
    podGroup.add(blade, led);
    cloudPods.add(podGroup);
    registerExplode(podGroup, Math.cos(ang) * 0.45, ry * 0.6, Math.sin(ang) * 0.45);

    // Fiber conduit linking spine to each pod
    const conduit = new THREE.Mesh(
      trackGeo(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.4, 0),
            new THREE.Vector3(rx * 0.55, ry - 0.18, rz * 0.55),
            new THREE.Vector3(rx * 0.85, ry, rz * 0.85),
          ]),
          18,
          0.022,
          8,
          false,
        ),
      ),
      mats.accentBrass,
    );
    cloudPods.add(conduit);
  }

  // Concentric Helm & Terraform orbital rings + InstancedMesh 24 ingress nodes
  const cloudRings: THREE.Object3D[] = [];
  [
    { r: 0.85, tube: 0.024, tx: 0.48, tz: 0.25, mat: mats.accentBrass },
    { r: 1.24, tube: 0.026, tx: -0.52, tz: -0.35, mat: mats.brushedChassis },
  ].forEach((cfg) => {
    const rMesh = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(cfg.r, cfg.tube, 14, 64)),
      cfg.mat,
    );
    rMesh.rotation.set(cfg.tx, 0, cfg.tz);
    cloudPivot.add(rMesh);
    cloudRings.push(rMesh);
  });

  const ingressNodeGeo = trackGeo(new THREE.SphereGeometry(0.052, 12, 12));
  const ingressCount = 24;
  const ingressNodes = new THREE.InstancedMesh(
    ingressNodeGeo,
    mats.instancedOrbitalMat,
    ingressCount,
  );
  const nodeColor = new THREE.Color();
  for (let i = 0; i < ingressCount; i += 1) {
    const band = i % 2;
    const radius = band === 0 ? 0.85 : 1.24;
    const tilt = band === 0 ? 0.48 : -0.52;
    const theta = (i / ingressCount) * Math.PI * 2 * 2;
    dummy.position.set(
      Math.cos(theta) * radius,
      Math.sin(theta) * radius * Math.sin(tilt),
      Math.sin(theta) * radius * Math.cos(tilt),
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(0.85 + (i % 4) * 0.1);
    dummy.updateMatrix();
    ingressNodes.setMatrixAt(i, dummy.matrix);
    nodeColor.setHex(band === 0 ? 0xf59e0b : 0x38bdf8);
    ingressNodes.setColorAt(i, nodeColor);
  }
  ingressNodes.instanceMatrix.needsUpdate = true;
  if (ingressNodes.instanceColor) ingressNodes.instanceColor.needsUpdate = true;
  ingressNodes.computeBoundingSphere();
  cloudPivot.add(ingressNodes);
  enableShadows(cl.group);

  // =========================================================================
  // STAGE 02 — CI/CD & DEVSECOPS: Automated Pipeline Forge & Security Gate
  // =========================================================================
  const ci = createExhibitBase('cicd', [-2.25, 0, -23.0], 0.36, 1.08, [3.6, 3.4, 3.4]);
  const ciBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.6, 1.55, 0.14), {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 2,
    }),
  );
  ciBaseGeo.rotateX(-Math.PI / 2);
  const ciBase = new THREE.Mesh(ciBaseGeo, mats.plinthStone);
  ciBase.position.y = 0.04;
  ci.rotatableGroup.add(ciBase);

  // Brushed gantry deck & parallel rails
  const deckGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.45, 1.18, 0.08), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }),
  );
  deckGeo.rotateX(-Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckGeo, mats.brushedChassis);
  deckMesh.position.y = 0.92;
  ci.rotatableGroup.add(deckMesh);
  registerExplode(deckMesh, 0, 0.24, 0);

  const gantryLegGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.65, 0.85));
  const ciLegL = new THREE.Mesh(gantryLegGeo, mats.darkAnodized);
  ciLegL.position.set(-0.92, 0.58, 0);
  const ciLegR = new THREE.Mesh(gantryLegGeo, mats.darkAnodized);
  ciLegR.position.set(0.92, 0.58, 0);
  ci.rotatableGroup.add(ciLegL, ciLegR);

  // Kaniko Build Turbine (left stage)
  const turbinePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.32, 0),
    new THREE.Vector2(0.34, 0.16),
    new THREE.Vector2(0.24, 0.28),
    new THREE.Vector2(0.28, 0.42),
    new THREE.Vector2(0.16, 0.58),
    new THREE.Vector2(0, 0.64),
  ];
  const cicdTurbine = new THREE.Group();
  cicdTurbine.position.set(-0.75, 1.06, 0);
  const turbineMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(turbinePoints, 24)),
    mats.accentBrass,
  );
  const turbineCore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.12, 0.12, 0.72, 16)),
    mats.warmEmissive,
  );
  turbineCore.position.y = 0.36;
  cicdTurbine.add(turbineMesh, turbineCore);
  ci.rotatableGroup.add(cicdTurbine);
  registerExplode(cicdTurbine, -0.35, 0.48, 0);

  // Gitleaks / DefectDojo Security Gate Arch (center stage)
  const gateArchGeo = trackGeo(
    new THREE.ExtrudeGeometry(createArchShape(1.05, 1.38, 0.16), {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }),
  );
  gateArchGeo.translate(0, 0, -0.12);
  const gateArch = new THREE.Mesh(gateArchGeo, mats.darkAnodized);
  gateArch.position.set(0.12, 1.05, 0);
  gateArch.rotation.y = Math.PI / 2;
  ci.rotatableGroup.add(gateArch);
  registerExplode(gateArch, 0, 0.56, 0);

  const cicdScannerRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.36, 0.028, 12, 42)),
    mats.coolEmissive,
  );
  cicdScannerRing.position.set(0.12, 1.65, 0);
  cicdScannerRing.rotation.y = Math.PI / 2;
  ci.rotatableGroup.add(cicdScannerRing);

  const scannerLens = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 24)),
    mats.opticalGlass,
  );
  scannerLens.rotation.z = Math.PI / 2;
  scannerLens.position.set(0.12, 1.65, 0);
  scannerLens.renderOrder = 2;
  ci.rotatableGroup.add(scannerLens);

  // Live Pipeline Console Display
  const pipeConsoleGroup = new THREE.Group();
  pipeConsoleGroup.position.set(0, 2.38, -0.45);
  pipeConsoleGroup.rotation.x = 0.12;
  const pipeChassis = new THREE.Mesh(
    trackGeo(
      new THREE.ExtrudeGeometry(createRoundedRectShape(1.86, 0.92, 0.04), {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
    ),
    mats.darkAnodized,
  );
  const pipeScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.74, 0.82)),
    mats.pipelineDisplayMat,
  );
  pipeScreen.position.z = 0.064;
  pipeConsoleGroup.add(pipeChassis, pipeScreen);
  ci.rotatableGroup.add(pipeConsoleGroup);
  registerExplode(pipeConsoleGroup, 0, 0.72, -0.35);

  // InstancedMesh 10 pipeline artifact blocks along conveyor track
  const artifactGeo = trackGeo(new THREE.BoxGeometry(0.15, 0.15, 0.24));
  const artifactCount = 10;
  const artifacts = new THREE.InstancedMesh(
    artifactGeo,
    mats.instancedOrbitalMat,
    artifactCount,
  );
  for (let i = 0; i < artifactCount; i += 1) {
    dummy.position.set(-1.0 + i * 0.22, 1.13, 0.28 - (i % 2) * 0.56);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(0.9 + (i % 3) * 0.12);
    dummy.updateMatrix();
    artifacts.setMatrixAt(i, dummy.matrix);
    nodeColor.setHex(i % 2 === 0 ? 0xf59e0b : 0x38bdf8);
    artifacts.setColorAt(i, nodeColor);
  }
  artifacts.instanceMatrix.needsUpdate = true;
  if (artifacts.instanceColor) artifacts.instanceColor.needsUpdate = true;
  artifacts.computeBoundingSphere();
  ci.rotatableGroup.add(artifacts);
  enableShadows(ci.group);

  // =========================================================================
  // STAGE 03 — OBSERVABILITY & AI4OPS: Telemetry Console & Radar Array
  // =========================================================================
  const ob = createExhibitBase('observability', [2.25, 0, -34.5], -0.4, 1.1, [3.6, 3.5, 3.2]);
  const obPedestalGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.4, 1.35, 0.12), {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    }),
  );
  obPedestalGeo.rotateX(-Math.PI / 2);
  const obPedestal = new THREE.Mesh(obPedestalGeo, mats.plinthStone);
  obPedestal.position.y = 0.03;
  ob.rotatableGroup.add(obPedestal);

  const obLegL = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.12, 0.92, 0.95)),
    mats.darkAnodized,
  );
  obLegL.position.set(-0.98, 0.72, 0);
  const obLegR = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.12, 0.92, 0.95)),
    mats.darkAnodized,
  );
  obLegR.position.set(0.98, 0.72, 0);
  ob.rotatableGroup.add(obLegL, obLegR);

  const obTopGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.65, 1.42, 0.08), {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    }),
  );
  obTopGeo.rotateX(-Math.PI / 2);
  const obTop = new THREE.Mesh(obTopGeo, mats.brushedChassis);
  obTop.position.y = 1.2;
  ob.rotatableGroup.add(obTop);
  registerExplode(obTop, 0, 0.24, 0);

  // Dual Telemetry Monitors
  const mainMonitorGroup = new THREE.Group();
  mainMonitorGroup.position.set(-0.26, 1.92, -0.26);
  mainMonitorGroup.rotation.x = -0.06;
  const mainChassis = new THREE.Mesh(
    trackGeo(
      new THREE.ExtrudeGeometry(createRoundedRectShape(1.56, 0.92, 0.04), {
        depth: 0.045,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
    ),
    mats.darkAnodized,
  );
  const mainScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.44, 0.82)),
    mats.displayPrimaryMat,
  );
  mainScreen.position.z = 0.058;
  mainMonitorGroup.add(mainChassis, mainScreen);
  ob.rotatableGroup.add(mainMonitorGroup);
  registerExplode(mainMonitorGroup, -0.22, 0.56, -0.25);

  const sideMonitorGroup = new THREE.Group();
  sideMonitorGroup.position.set(0.84, 1.88, -0.08);
  sideMonitorGroup.rotation.y = -0.38;
  const sideChassis = new THREE.Mesh(
    trackGeo(
      new THREE.ExtrudeGeometry(createRoundedRectShape(0.66, 0.88, 0.035), {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      }),
    ),
    mats.darkAnodized,
  );
  const sideScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.58, 0.78)),
    mats.displaySecondaryMat,
  );
  sideScreen.position.z = 0.052;
  sideMonitorGroup.add(sideChassis, sideScreen);
  ob.rotatableGroup.add(sideMonitorGroup);
  registerExplode(sideMonitorGroup, 0.45, 0.52, -0.12);

  // Parabolic AI4Ops Radar Dish on pedestal corner
  const obsRadarDish = new THREE.Group();
  obsRadarDish.position.set(-0.92, 1.56, 0.25);
  const dishPoints = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.18, 0.03),
    new THREE.Vector2(0.32, 0.14),
    new THREE.Vector2(0.36, 0.22),
  ];
  const dishBowl = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(dishPoints, 28)),
    mats.accentBrass,
  );
  dishBowl.rotation.x = 0.6;
  const emitterNeedle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10)),
    mats.coolEmissive,
  );
  emitterNeedle.rotation.x = 0.6;
  emitterNeedle.position.set(0, 0.12, 0.09);
  obsRadarDish.add(dishBowl, emitterNeedle);
  ob.rotatableGroup.add(obsRadarDish);
  registerExplode(obsRadarDish, -0.45, 0.58, 0.28);

  // InstancedMesh 18 Telemetry Spectrum Columns along front desk lip
  const specBarGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.35, 0.06));
  specBarGeo.translate(0, 0.175, 0);
  const specCount = 18;
  const obsSpectrumBars = new THREE.InstancedMesh(
    specBarGeo,
    mats.instancedOrbitalMat,
    specCount,
  );
  const obsBarBaseX: number[] = [];
  const obsBarBaseZ: number[] = [];
  for (let i = 0; i < specCount; i += 1) {
    const bx = -0.35 + i * 0.075;
    const bz = 0.45;
    obsBarBaseX.push(bx);
    obsBarBaseZ.push(bz);
    dummy.position.set(bx, 1.3, bz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 0.5 + (i % 5) * 0.22, 1);
    dummy.updateMatrix();
    obsSpectrumBars.setMatrixAt(i, dummy.matrix);
    nodeColor.setHex(i % 3 === 0 ? 0xf59e0b : 0x38bdf8);
    obsSpectrumBars.setColorAt(i, nodeColor);
  }
  obsSpectrumBars.instanceMatrix.needsUpdate = true;
  if (obsSpectrumBars.instanceColor) obsSpectrumBars.instanceColor.needsUpdate = true;
  obsSpectrumBars.computeBoundingSphere();
  obsSpectrumBars.frustumCulled = false;
  ob.rotatableGroup.add(obsSpectrumBars);
  enableShadows(ob.group);

  // =========================================================================
  // STAGE 04 — SECURITY, IDENTITY & LINUX: Cryptographic Vault & LDAP Ring
  // =========================================================================
  const sc = createExhibitBase('security', [-2.25, 0, -46.0], 0.34, 1.08);
  const scBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(8, 1.46), {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 3,
    }),
  );
  scBaseGeo.rotateX(-Math.PI / 2);
  const scBase = new THREE.Mesh(scBaseGeo, mats.plinthStone);
  scBase.position.y = 0.04;
  sc.rotatableGroup.add(scBase);

  // Armored Vault Frame
  const vaultFrameGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(6, 1.15), {
      depth: 0.52,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    }),
  );
  vaultFrameGeo.translate(0, 0, -0.26);
  const vaultFrame = new THREE.Mesh(vaultFrameGeo, mats.darkAnodized);
  vaultFrame.position.set(0, 1.78, 0);
  sc.rotatableGroup.add(vaultFrame);
  registerExplode(vaultFrame, 0, 0.3, -0.35);

  // Optical Glass Core + Golden Vault Crystal
  const vaultCoreGroup = new THREE.Group();
  vaultCoreGroup.position.set(0, 1.78, 0.24);
  const vaultCore = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.28, 0)),
    mats.warmEmissive,
  );
  const vaultCrystal = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.54, 0.54, 0.14, 32)),
    mats.opticalGlass,
  );
  vaultCrystal.rotation.x = Math.PI / 2;
  vaultCrystal.renderOrder = 2;
  vaultCoreGroup.add(vaultCore, vaultCrystal);
  sc.rotatableGroup.add(vaultCoreGroup);
  registerExplode(vaultCoreGroup, 0, 0.35, 0.28);

  // Rotating Mechanical Vault Locking Wheel + 12 Instanced Radial Locking Bolts
  const vaultWheel = new THREE.Group();
  vaultWheel.position.set(0, 1.78, 0.42);
  const outerWheel = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.68, 0.055, 16, 48)),
    mats.accentBrass,
  );
  const innerHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 24)),
    mats.brushedChassis,
  );
  innerHub.rotation.x = Math.PI / 2;
  vaultWheel.add(outerWheel, innerHub);

  for (let s = 0; s < 4; s += 1) {
    const spoke = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 1.32, 10)),
      mats.brushedChassis,
    );
    spoke.rotation.z = (s * Math.PI) / 4;
    vaultWheel.add(spoke);
  }

  const boltGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.18, 12));
  const boltCount = 12;
  const vaultBolts = new THREE.InstancedMesh(
    boltGeo,
    mats.accentBrass,
    boltCount,
  );
  for (let i = 0; i < boltCount; i += 1) {
    const a = (i / boltCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.82, Math.sin(a) * 0.82, -0.06);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    vaultBolts.setMatrixAt(i, dummy.matrix);
  }
  vaultBolts.instanceMatrix.needsUpdate = true;
  vaultBolts.computeBoundingSphere();
  vaultWheel.add(vaultBolts);
  sc.rotatableGroup.add(vaultWheel);
  registerExplode(vaultWheel, 0, 0.38, 0.62);

  // Twin Bash/OpenLDAP Synchronization Conduits
  [-1, 1].forEach((dir) => {
    const syncTube = new THREE.Mesh(
      trackGeo(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(dir * 0.95, 0.4, 0.2),
            new THREE.Vector3(dir * 1.18, 1.15, 0.12),
            new THREE.Vector3(dir * 0.88, 1.78, 0.0),
          ]),
          22,
          0.036,
          10,
          false,
        ),
      ),
      mats.brushedChassis,
    );
    sc.rotatableGroup.add(syncTube);
    registerExplode(syncTube, dir * 0.4, 0.2, 0);
  });
  enableShadows(sc.group);

  // =========================================================================
  // STAGE 05 — CAREER & CREDENTIALS: Chronology Arch & Bound Folio
  // =========================================================================
  const cr = createExhibitBase('career', [1.95, 0, -57.5], -0.35, 1.08);
  const crBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.35, 1.75, 0.14), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 2,
    }),
  );
  crBaseGeo.rotateX(-Math.PI / 2);
  const crBase = new THREE.Mesh(crBaseGeo, mats.plinthStone);
  crBase.position.y = 0.035;
  cr.rotatableGroup.add(crBase);

  const archMesh = new THREE.Mesh(
    trackGeo(
      new THREE.ExtrudeGeometry(createArchShape(1.9, 2.55, 0.24), {
        depth: 0.26,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 2,
      }),
    ),
    mats.brushedChassis,
  );
  archMesh.position.set(0, 0.34, -0.38);
  cr.rotatableGroup.add(archMesh);
  registerExplode(archMesh, 0, 0.35, -0.38);

  const compassGroup = new THREE.Group();
  compassGroup.position.set(0, 2.38, -0.25);
  const pivotPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 24)),
    mats.accentBrass,
  );
  pivotPin.rotation.x = Math.PI / 2;
  const legGeoCompass = trackGeo(new THREE.ConeGeometry(0.055, 1.12, 12));
  legGeoCompass.rotateX(Math.PI);
  const compassLegL = new THREE.Mesh(legGeoCompass, mats.accentBrass);
  compassLegL.position.set(-0.24, -0.52, 0);
  compassLegL.rotation.z = -0.36;
  const compassLegR = new THREE.Mesh(legGeoCompass, mats.accentBrass);
  compassLegR.position.set(0.24, -0.52, 0);
  compassLegR.rotation.z = 0.36;
  compassGroup.add(pivotPin, compassLegL, compassLegR);
  cr.rotatableGroup.add(compassGroup);
  registerExplode(compassGroup, 0, 0.68, -0.18);

  // Career Milestone Beacons flanking the folio
  const careerBeacons: THREE.Object3D[] = [];
  [-0.78, 0.78].forEach((bx) => {
    const col = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 0.68, 18)),
      mats.darkAnodized,
    );
    col.position.set(bx, 0.66, 0.32);
    const beacon = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.075, 0.085, 0.18, 18)),
      mats.warmEmissive,
    );
    beacon.position.set(bx, 1.12, 0.32);
    careerBeacons.push(beacon);
    cr.rotatableGroup.add(col, beacon);
  });

  const lecternStand = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.06, 0.12, 0.62, 18)),
    mats.darkAnodized,
  );
  lecternStand.position.set(0, 0.64, 0.42);
  cr.rotatableGroup.add(lecternStand);

  const folioGroup = new THREE.Group();
  folioGroup.position.set(0, 1.0, 0.45);
  folioGroup.rotation.x = -0.95;
  const folioBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.92, 1.16, 0.09)),
    mats.darkAnodized,
  );
  const folioCover = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.88, 1.12)),
    mats.folioCoverMat,
  );
  folioCover.position.z = 0.047;
  const brassClasp = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.14, 0.24, 0.11)),
    mats.accentBrass,
  );
  brassClasp.position.set(0.43, 0, 0);
  folioGroup.add(folioBlock, folioCover, brassClasp);
  cr.rotatableGroup.add(folioGroup);
  registerExplode(folioGroup, 0, 0.42, 0.42);
  enableShadows(cr.group);

  // =========================================================================
  // EXHIBIT REGISTRY & CURATED CAMERA WAYPOINTS
  // =========================================================================
  const exhibits: Record<ChapterId, ExhibitDefinition> = {
    overview: {
      id: 'overview',
      indexLabel: '00',
      title: 'Reliability Core',
      group: ov.group,
      rotatableGroup: ov.rotatableGroup,
      anchorWorld: new THREE.Vector3(1.55, 3.25, 0),
      cameraPosition: new THREE.Vector3(0.4, 2.55, 5.4),
      cameraTarget: new THREE.Vector3(0.25, 1.55, 0),
      proxyCollider: ov.proxyCollider,
      ringHighlight: ov.ringHighlight,
      pulse: 0,
    },
    cloud: {
      id: 'cloud',
      indexLabel: '01',
      title: 'Cloud & Kubernetes',
      group: cl.group,
      rotatableGroup: cl.rotatableGroup,
      anchorWorld: new THREE.Vector3(2.25, 3.35, -11.5),
      cameraPosition: new THREE.Vector3(-0.2, 2.65, -5.8),
      cameraTarget: new THREE.Vector3(0.75, 1.55, -11.5),
      proxyCollider: cl.proxyCollider,
      ringHighlight: cl.ringHighlight,
      pulse: 0,
    },
    cicd: {
      id: 'cicd',
      indexLabel: '02',
      title: 'CI/CD & DevSecOps',
      group: ci.group,
      rotatableGroup: ci.rotatableGroup,
      anchorWorld: new THREE.Vector3(-2.25, 3.15, -23.0),
      cameraPosition: new THREE.Vector3(0.2, 2.65, -17.3),
      cameraTarget: new THREE.Vector3(-0.75, 1.55, -23.0),
      proxyCollider: ci.proxyCollider,
      ringHighlight: ci.ringHighlight,
      pulse: 0,
    },
    observability: {
      id: 'observability',
      indexLabel: '03',
      title: 'Observability & AI4Ops',
      group: ob.group,
      rotatableGroup: ob.rotatableGroup,
      anchorWorld: new THREE.Vector3(2.25, 3.2, -34.5),
      cameraPosition: new THREE.Vector3(-0.2, 2.75, -28.8),
      cameraTarget: new THREE.Vector3(0.75, 1.55, -34.5),
      proxyCollider: ob.proxyCollider,
      ringHighlight: ob.ringHighlight,
      pulse: 0,
    },
    security: {
      id: 'security',
      indexLabel: '04',
      title: 'Linux, IAM & Vault',
      group: sc.group,
      rotatableGroup: sc.rotatableGroup,
      anchorWorld: new THREE.Vector3(-2.25, 3.3, -46.0),
      cameraPosition: new THREE.Vector3(0.2, 2.65, -40.3),
      cameraTarget: new THREE.Vector3(-0.75, 1.55, -46.0),
      proxyCollider: sc.proxyCollider,
      ringHighlight: sc.ringHighlight,
      pulse: 0,
    },
    career: {
      id: 'career',
      indexLabel: '05',
      title: 'Career & Credentials',
      group: cr.group,
      rotatableGroup: cr.rotatableGroup,
      anchorWorld: new THREE.Vector3(1.95, 3.35, -57.5),
      cameraPosition: new THREE.Vector3(-0.2, 2.65, -51.6),
      cameraTarget: new THREE.Vector3(0.6, 1.55, -57.5),
      proxyCollider: cr.proxyCollider,
      ringHighlight: cr.ringHighlight,
      pulse: 0,
    },
  };

  const orderedChapters: ChapterId[] = [
    'overview',
    'cloud',
    'cicd',
    'observability',
    'security',
    'career',
  ];

  return {
    exhibits,
    orderedChapters,
    proxyColliders: orderedChapters.map((id) => exhibits[id].proxyCollider),
    explodableParts,
    kinetic: {
      overviewOuterRing,
      overviewInnerRing,
      overviewPrism,
      cloudCore,
      cloudRings,
      cloudPods,
      cicdTurbine,
      cicdScannerRing,
      obsRadarDish,
      obsSpectrumBars,
      obsBarBaseX,
      obsBarBaseZ,
      vaultWheel,
      vaultCore,
      careerBeacons,
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      orderedChapters.forEach((id) => {
        (exhibits[id].ringHighlight.material as THREE.Material).dispose();
      });
    },
  };
}
