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
  anchorWorld: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  proxyCollider: THREE.Mesh;
  ringHighlight: THREE.Mesh;
}

export interface KineticNodes {
  overviewOuterRing: THREE.Object3D;
  overviewInnerRing: THREE.Object3D;
  overviewPrism: THREE.Object3D;
  skillsRings: THREE.Object3D[];
  skillsCore: THREE.Object3D;
  experienceBeacons: THREE.Object3D[];
}

export interface BuiltExhibition {
  exhibits: Record<ChapterId, ExhibitDefinition>;
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

function createRoundedRectShape(width: number, height: number, r: number): THREE.Shape {
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

function createArchShape(width: number, height: number, thickness: number): THREE.Shape {
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

  // Shared contact shadow & highlight ring geometries
  const shadowPlaneGeo = trackGeo(new THREE.PlaneGeometry(4.4, 4.4));
  shadowPlaneGeo.rotateX(-Math.PI / 2);

  const highlightRingGeo = trackGeo(new THREE.RingGeometry(1.75, 1.84, 64));
  highlightRingGeo.rotateX(-Math.PI / 2);

  const addGroundedHelpers = (
    group: THREE.Group,
    chapterId: ChapterId,
    scale = 1,
    colliderSize: [number, number, number] = [3.2, 3.6, 3.2],
  ): { proxyCollider: THREE.Mesh; ringHighlight: THREE.Mesh } => {
    const shadow = new THREE.Mesh(shadowPlaneGeo, mats.contactShadowMat);
    shadow.position.y = 0.01;
    shadow.scale.setScalar(scale);
    shadow.renderOrder = 1;
    group.add(shadow);

    const ringMat = mats.warmEmissive.clone();
    ringMat.transparent = true;
    ringMat.opacity = 0.18;
    const ringHighlight = new THREE.Mesh(highlightRingGeo, ringMat);
    ringHighlight.position.y = 0.025;
    ringHighlight.scale.setScalar(scale * 0.95);
    group.add(ringHighlight);

    const proxyGeo = trackGeo(
      new THREE.BoxGeometry(colliderSize[0], colliderSize[1], colliderSize[2]),
    );
    const proxyCollider = new THREE.Mesh(proxyGeo, mats.proxyColliderMat);
    proxyCollider.position.y = colliderSize[1] / 2;
    proxyCollider.layers.set(1);
    proxyCollider.userData.chapterId = chapterId;
    group.add(proxyCollider);

    return { proxyCollider, ringHighlight };
  };

  // =========================================================================
  // GALLERY FLOOR & PERIMETER BOLLARDS (InstancedMesh)
  // =========================================================================
  const floorGeo = trackGeo(new THREE.CircleGeometry(56, 72));
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, mats.floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.position.y = 0;
  scene.add(floorMesh);

  // Perimeter light bollards (28 instances)
  const bollardGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.11, 0.95, 12));
  bollardGeo.translate(0, 0.475, 0);
  const bollardCount = 28;
  const bollards = new THREE.InstancedMesh(bollardGeo, mats.instancedBollardMat, bollardCount);
  bollards.castShadow = true;
  bollards.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < bollardCount; i += 1) {
    const angle = (i / bollardCount) * Math.PI * 2;
    const radius = 15.5 + (i % 2) * 1.4;
    dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    dummy.rotation.set(0, -angle, 0);
    const s = 0.88 + (i % 3) * 0.12;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    bollards.setMatrixAt(i, dummy.matrix);
  }
  bollards.instanceMatrix.needsUpdate = true;
  bollards.computeBoundingSphere();
  scene.add(bollards);

  // =========================================================================
  // EXHIBIT 01 — OVERVIEW: Kinetic Drafting Monolith & Nameplate Plinth
  // =========================================================================
  const overviewGroup = new THREE.Group();
  overviewGroup.position.set(0, 0, 0);
  scene.add(overviewGroup);
  const overviewHelpers = addGroundedHelpers(overviewGroup, 'overview', 1.15, [3.4, 3.8, 3.4]);

  // 1. Hexagonal beveled architectural plinth
  const hexBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(6, 1.55), {
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
  overviewGroup.add(hexBase);

  // 2. Lathe-turned brushed metal collar ring
  const collarPoints = [
    new THREE.Vector2(1.18, 0),
    new THREE.Vector2(1.24, 0.04),
    new THREE.Vector2(1.18, 0.16),
    new THREE.Vector2(0.86, 0.2),
    new THREE.Vector2(0.82, 0.26),
    new THREE.Vector2(0.0, 0.26),
  ];
  const collarGeo = trackGeo(new THREE.LatheGeometry(collarPoints, 48));
  const collar = new THREE.Mesh(collarGeo, mats.brushedChassis);
  collar.position.y = 0.42;
  overviewGroup.add(collar);
  registerExplode(collar, 0, 0.25, 0);

  // 3. Engraved Nameplate Stand (angled toward front-right hero view)
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
  plaqueGroup.position.set(0, 0.44, 1.28);
  plaqueGroup.rotation.x = -0.52;
  const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, mats.darkAnodized);
  const plaqueFaceGeo = trackGeo(new THREE.PlaneGeometry(1.44, 0.48));
  const plaqueFace = new THREE.Mesh(plaqueFaceGeo, mats.nameplateMat);
  plaqueFace.position.z = 0.068;
  plaqueGroup.add(plaqueFrame, plaqueFace);
  overviewGroup.add(plaqueGroup);
  registerExplode(plaqueGroup, 0, 0.12, 0.55);

  // 4. Twin curved brass gimbal cradle arms (TubeGeometry)
  const cradleCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 0.68, 0),
    new THREE.Vector3(-1.05, 1.35, 0),
    new THREE.Vector3(-0.96, 2.08, 0),
  ]);
  const cradleGeoL = trackGeo(new THREE.TubeGeometry(cradleCurveL, 28, 0.045, 12, false));
  const cradleL = new THREE.Mesh(cradleGeoL, mats.accentBrass);
  overviewGroup.add(cradleL);
  registerExplode(cradleL, -0.45, 0.25, 0);

  const cradleCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.78, 0.68, 0),
    new THREE.Vector3(1.05, 1.35, 0),
    new THREE.Vector3(0.96, 2.08, 0),
  ]);
  const cradleGeoR = trackGeo(new THREE.TubeGeometry(cradleCurveR, 28, 0.045, 12, false));
  const cradleR = new THREE.Mesh(cradleGeoR, mats.accentBrass);
  overviewGroup.add(cradleR);
  registerExplode(cradleR, 0.45, 0.25, 0);

  // 5. Kinetic Gimbal Rings + Optical Prism Core
  const kineticPivot = new THREE.Group();
  kineticPivot.position.set(0, 2.05, 0);
  overviewGroup.add(kineticPivot);
  registerExplode(kineticPivot, 0, 0.72, 0);

  const outerRingGeo = trackGeo(new THREE.TorusGeometry(0.92, 0.036, 16, 72));
  const overviewOuterRing = new THREE.Mesh(outerRingGeo, mats.brushedChassis);
  kineticPivot.add(overviewOuterRing);

  const innerRingGeo = trackGeo(new THREE.TorusGeometry(0.68, 0.028, 16, 64));
  const overviewInnerRing = new THREE.Mesh(innerRingGeo, mats.accentBrass);
  overviewInnerRing.rotation.x = Math.PI / 3;
  kineticPivot.add(overviewInnerRing);

  // Optical glass prism + glowing core filament
  const prismGroup = new THREE.Group();
  const prismGeo = trackGeo(new THREE.OctahedronGeometry(0.42, 0));
  const prismMesh = new THREE.Mesh(prismGeo, mats.opticalGlass);
  prismMesh.renderOrder = 2;
  const prismCoreGeo = trackGeo(new THREE.OctahedronGeometry(0.14, 0));
  const prismCore = new THREE.Mesh(prismCoreGeo, mats.warmEmissive);
  prismGroup.add(prismCore, prismMesh);
  kineticPivot.add(prismGroup);

  // 6. Articulated Architectural Drafting Lamp
  const lampCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.62, 0.65, -0.58),
    new THREE.Vector3(-1.12, 1.9, -0.82),
    new THREE.Vector3(-0.55, 2.95, -0.35),
    new THREE.Vector3(-0.18, 2.86, -0.15),
  ]);
  const lampArmGeo = trackGeo(new THREE.TubeGeometry(lampCurve, 32, 0.028, 10, false));
  const lampArm = new THREE.Mesh(lampArmGeo, mats.darkAnodized);
  const lampShadePoints = [
    new THREE.Vector2(0.03, 0.24),
    new THREE.Vector2(0.08, 0.22),
    new THREE.Vector2(0.22, 0.02),
    new THREE.Vector2(0.2, 0),
  ];
  const lampShadeGeo = trackGeo(new THREE.LatheGeometry(lampShadePoints, 28));
  const lampShade = new THREE.Mesh(lampShadeGeo, mats.accentBrass);
  lampShade.position.set(-0.18, 2.66, -0.15);
  lampShade.rotation.z = -0.35;
  const lampBulbGeo = trackGeo(new THREE.SphereGeometry(0.065, 16, 16));
  const lampBulb = new THREE.Mesh(lampBulbGeo, mats.warmEmissive);
  lampBulb.position.set(-0.15, 2.68, -0.15);
  overviewGroup.add(lampArm, lampShade, lampBulb);
  registerExplode(lampArm, -0.35, 0.4, -0.35);
  registerExplode(lampShade, -0.35, 0.55, -0.35);
  registerExplode(lampBulb, -0.35, 0.55, -0.35);

  enableShadows(overviewGroup);

  // =========================================================================
  // EXHIBIT 02 — EXPERIENCE: Stepped Chronology Tower
  // =========================================================================
  const expGroup = new THREE.Group();
  expGroup.position.set(-6.8, 0, -2.4);
  expGroup.rotation.y = 0.42;
  scene.add(expGroup);
  const expHelpers = addGroundedHelpers(expGroup, 'experience', 1.05, [3.2, 4.2, 3.2]);

  // 1. Chamfered circular-octagonal base slab
  const expBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createPolygonShape(8, 1.45), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    }),
  );
  expBaseGeo.rotateX(-Math.PI / 2);
  const expBase = new THREE.Mesh(expBaseGeo, mats.plinthStone);
  expBase.position.y = 0.04;
  expGroup.add(expBase);

  // 2. Central brushed precision spine column + top finial
  const spineGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.22, 3.25, 24));
  const spine = new THREE.Mesh(spineGeo, mats.brushedChassis);
  spine.position.y = 1.94;
  expGroup.add(spine);

  const finialGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.2, 0.24, 24));
  const finial = new THREE.Mesh(finialGeo, mats.accentBrass);
  finial.position.y = 3.68;
  expGroup.add(finial);
  registerExplode(finial, 0, 0.65, 0);

  // 3. Four cantilevered stepped role platforms + brass tie-rods + glass milestone beacons
  const stepPlateGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(1.42, 0.78, 0.1), {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }),
  );
  stepPlateGeo.rotateX(-Math.PI / 2);

  const beaconCapGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 20));
  const tieRodGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.65, 10));
  const experienceBeacons: THREE.Object3D[] = [];

  for (let i = 0; i < 4; i += 1) {
    const tierGroup = new THREE.Group();
    const yLevel = 0.75 + i * 0.68;
    const angle = i * 1.15 - 0.8;
    tierGroup.position.set(0, yLevel, 0);
    tierGroup.rotation.y = angle;

    const plate = new THREE.Mesh(
      stepPlateGeo,
      i % 2 === 0 ? mats.darkAnodized : mats.brushedChassis,
    );
    plate.position.set(0.55, 0, 0);
    tierGroup.add(plate);

    const collarRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.24, 0.028, 12, 32)),
      mats.accentBrass,
    );
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.y = 0.06;
    tierGroup.add(collarRing);

    const beacon = new THREE.Mesh(beaconCapGeo, mats.warmEmissive);
    beacon.position.set(1.06, 0.22, 0);
    tierGroup.add(beacon);
    experienceBeacons.push(beacon);

    const glassSleeve = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.26, 20)),
      mats.opticalGlass,
    );
    glassSleeve.position.set(1.06, 0.24, 0);
    glassSleeve.renderOrder = 2;
    tierGroup.add(glassSleeve);

    if (i < 3) {
      const rod = new THREE.Mesh(tieRodGeo, mats.accentBrass);
      rod.position.set(0.88, 0.36, 0.22);
      tierGroup.add(rod);
    }

    expGroup.add(tierGroup);
    registerExplode(tierGroup, Math.cos(angle) * 0.42, (i + 1) * 0.24, -Math.sin(angle) * 0.42);
  }

  enableShadows(expGroup);

  // =========================================================================
  // EXHIBIT 03 — PROJECTS: Engineering Workstation & Prototype Rig
  // =========================================================================
  const projGroup = new THREE.Group();
  projGroup.position.set(6.8, 0, -2.4);
  projGroup.rotation.y = -0.45;
  scene.add(projGroup);
  const projHelpers = addGroundedHelpers(projGroup, 'projects', 1.1, [3.6, 3.2, 3.2]);

  // 1. Architectural trestle plinth + cantilevered desk surface
  const deskPedestalGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.4, 1.35, 0.12), {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    }),
  );
  deskPedestalGeo.rotateX(-Math.PI / 2);
  const deskPedestal = new THREE.Mesh(deskPedestalGeo, mats.plinthStone);
  deskPedestal.position.y = 0.03;
  projGroup.add(deskPedestal);

  const legGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.92, 0.95));
  const legL = new THREE.Mesh(legGeo, mats.darkAnodized);
  legL.position.set(-0.98, 0.72, 0);
  const legR = new THREE.Mesh(legGeo, mats.darkAnodized);
  legR.position.set(0.98, 0.72, 0);
  projGroup.add(legL, legR);

  const tabletopGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.65, 1.42, 0.08), {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    }),
  );
  tabletopGeo.rotateX(-Math.PI / 2);
  const tabletop = new THREE.Mesh(tabletopGeo, mats.brushedChassis);
  tabletop.position.y = 1.2;
  projGroup.add(tabletop);
  registerExplode(tabletop, 0, 0.24, 0);

  // 2. Primary Ultrawide Display + Brass Stand Arm
  const monitorArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 1.29, -0.46),
    new THREE.Vector3(-0.22, 1.72, -0.52),
    new THREE.Vector3(-0.22, 1.88, -0.34),
  ]);
  const monitorArm = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(monitorArmCurve, 18, 0.035, 10, false)),
    mats.accentBrass,
  );
  projGroup.add(monitorArm);

  const mainMonitorGroup = new THREE.Group();
  mainMonitorGroup.position.set(-0.22, 1.92, -0.26);
  mainMonitorGroup.rotation.x = -0.06;
  const mainChassisGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(1.56, 0.92, 0.04), {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    }),
  );
  const mainChassis = new THREE.Mesh(mainChassisGeo, mats.darkAnodized);
  const mainScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.44, 0.82)),
    mats.displayPrimaryMat,
  );
  mainScreen.position.z = 0.058;
  mainMonitorGroup.add(mainChassis, mainScreen);
  projGroup.add(mainMonitorGroup);
  registerExplode(mainMonitorGroup, -0.2, 0.56, -0.25);

  // 3. Secondary Vertical Reference Display
  const sideMonitorGroup = new THREE.Group();
  sideMonitorGroup.position.set(0.84, 1.88, -0.1);
  sideMonitorGroup.rotation.y = -0.38;
  const sideChassisGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(0.66, 0.88, 0.035), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    }),
  );
  const sideChassis = new THREE.Mesh(sideChassisGeo, mats.darkAnodized);
  const sideScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.58, 0.78)),
    mats.displaySecondaryMat,
  );
  sideScreen.position.z = 0.052;
  sideMonitorGroup.add(sideChassis, sideScreen);
  projGroup.add(sideMonitorGroup);
  registerExplode(sideMonitorGroup, 0.45, 0.52, -0.12);

  // 4. Milled Mechanical Keyboard Deck + Precision Rotary Encoder Puck
  const kbDeckGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(0.95, 0.36, 0.025), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    }),
  );
  kbDeckGeo.rotateX(-Math.PI / 2);
  const kbDeck = new THREE.Mesh(kbDeckGeo, mats.darkAnodized);
  kbDeck.position.set(-0.25, 1.31, 0.28);
  kbDeck.rotation.x = 0.08;
  projGroup.add(kbDeck);
  registerExplode(kbDeck, -0.15, 0.42, 0.32);

  const dialPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.14, 0),
    new THREE.Vector2(0.14, 0.055),
    new THREE.Vector2(0.11, 0.075),
    new THREE.Vector2(0.11, 0.13),
    new THREE.Vector2(0, 0.13),
  ];
  const dialPuck = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(dialPoints, 32)),
    mats.accentBrass,
  );
  dialPuck.position.set(0.55, 1.31, 0.28);
  projGroup.add(dialPuck);
  registerExplode(dialPuck, 0.28, 0.48, 0.32);

  // 5. Optical Lens Prototype Unit on Desk Corner
  const lensBarrelPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.16, 0.16),
    new THREE.Vector2(0.18, 0.19),
    new THREE.Vector2(0.18, 0.28),
    new THREE.Vector2(0.13, 0.28),
  ];
  const lensGroup = new THREE.Group();
  lensGroup.position.set(-0.96, 1.31, 0.22);
  const lensBarrel = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(lensBarrelPoints, 32)),
    mats.darkAnodized,
  );
  const lensGlass = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.125, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45)),
    mats.opticalGlass,
  );
  lensGlass.position.y = 0.22;
  lensGlass.renderOrder = 2;
  lensGroup.add(lensBarrel, lensGlass);
  projGroup.add(lensGroup);
  registerExplode(lensGroup, -0.4, 0.52, 0.25);

  enableShadows(projGroup);

  // =========================================================================
  // EXHIBIT 04 — SKILLS: Orbital Stack Orrery (with InstancedMesh nodes)
  // =========================================================================
  const skillsGroup = new THREE.Group();
  skillsGroup.position.set(-4.4, 0, 5.2);
  scene.add(skillsGroup);
  const skillsHelpers = addGroundedHelpers(skillsGroup, 'skills', 1.05, [3.2, 3.6, 3.2]);

  // 1. Lathe-turned pedestal base & brass bearing cup
  const orreryBasePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1.22, 0),
    new THREE.Vector2(1.16, 0.18),
    new THREE.Vector2(0.88, 0.28),
    new THREE.Vector2(0.42, 0.42),
    new THREE.Vector2(0.28, 0.88),
    new THREE.Vector2(0.46, 0.96),
    new THREE.Vector2(0, 0.96),
  ];
  const orreryBase = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(orreryBasePoints, 40)),
    mats.plinthStone,
  );
  skillsGroup.add(orreryBase);

  const bearingCup = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.52, 0.4, 0.12, 36)),
    mats.accentBrass,
  );
  bearingCup.position.y = 1.02;
  skillsGroup.add(bearingCup);
  registerExplode(bearingCup, 0, 0.24, 0);

  // 2. Central glowing core & glass containment dome
  const orreryPivot = new THREE.Group();
  orreryPivot.position.y = 2.15;
  skillsGroup.add(orreryPivot);
  registerExplode(orreryPivot, 0, 0.65, 0);

  const skillsCore = new THREE.Mesh(
    trackGeo(new THREE.IcosahedronGeometry(0.28, 1)),
    mats.coolEmissive,
  );
  const domeGlass = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.46, 32, 24)),
    mats.opticalGlass,
  );
  domeGlass.renderOrder = 2;
  orreryPivot.add(skillsCore, domeGlass);

  // 3. Three tilted concentric gimbal rings
  const skillsRings: THREE.Object3D[] = [];
  const ringConfigs = [
    { radius: 0.72, tube: 0.025, tiltX: 0.45, tiltZ: 0.2, mat: mats.accentBrass },
    { radius: 0.96, tube: 0.03, tiltX: -0.65, tiltZ: 0.5, mat: mats.brushedChassis },
    { radius: 1.2, tube: 0.026, tiltX: 1.05, tiltZ: -0.35, mat: mats.darkAnodized },
  ];

  ringConfigs.forEach((cfg, idx) => {
    const ring = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 72)),
      cfg.mat,
    );
    ring.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
    orreryPivot.add(ring);
    skillsRings.push(ring);
    registerExplode(ring, 0, (idx + 1) * 0.18, 0);
  });

  // 4. InstancedMesh of 32 precision orbital calibration nodes
  const orbitalNodeGeo = trackGeo(new THREE.SphereGeometry(0.055, 14, 14));
  const nodeCount = 32;
  const orbitalNodes = new THREE.InstancedMesh(
    orbitalNodeGeo,
    mats.instancedOrbitalMat,
    nodeCount,
  );
  const nodeColor = new THREE.Color();
  for (let i = 0; i < nodeCount; i += 1) {
    const ringBand = i % 3;
    const r = ringBand === 0 ? 0.72 : ringBand === 1 ? 0.96 : 1.2;
    const theta = (i / nodeCount) * Math.PI * 2 * 3;
    const tilt = ringBand === 0 ? 0.45 : ringBand === 1 ? -0.65 : 1.05;
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r * Math.sin(tilt);
    const z = Math.sin(theta) * r * Math.cos(tilt);

    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    const s = 0.85 + ((i * 7) % 5) * 0.08; // +/-15% subtle instance variation
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    orbitalNodes.setMatrixAt(i, dummy.matrix);

    if (ringBand === 0) nodeColor.setHex(0xf59e0b);
    else if (ringBand === 1) nodeColor.setHex(0x38bdf8);
    else nodeColor.setHex(0xcbd5e1);
    orbitalNodes.setColorAt(i, nodeColor);
  }
  orbitalNodes.instanceMatrix.needsUpdate = true;
  if (orbitalNodes.instanceColor) orbitalNodes.instanceColor.needsUpdate = true;
  orbitalNodes.computeBoundingSphere();
  orreryPivot.add(orbitalNodes);

  enableShadows(skillsGroup);

  // =========================================================================
  // EXHIBIT 05 — CREDENTIALS: Architectural Arch, Caliper & Bound Folio
  // =========================================================================
  const credGroup = new THREE.Group();
  credGroup.position.set(4.4, 0, 5.2);
  credGroup.rotation.y = -0.35;
  scene.add(credGroup);
  const credHelpers = addGroundedHelpers(credGroup, 'credentials', 1.05, [3.2, 3.6, 3.2]);

  // 1. Stepped exhibition plinth
  const credBaseGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.35, 1.75, 0.14), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 2,
    }),
  );
  credBaseGeo.rotateX(-Math.PI / 2);
  const credBase = new THREE.Mesh(credBaseGeo, mats.plinthStone);
  credBase.position.y = 0.035;
  credGroup.add(credBase);

  // 2. Architectural Portal Arch (ExtrudeGeometry)
  const archGeo = trackGeo(
    new THREE.ExtrudeGeometry(createArchShape(1.9, 2.55, 0.24), {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 2,
    }),
  );
  archGeo.translate(0, 0, -0.13);
  const archMesh = new THREE.Mesh(archGeo, mats.brushedChassis);
  archMesh.position.set(0, 0.34, -0.38);
  credGroup.add(archMesh);
  registerExplode(archMesh, 0, 0.35, -0.38);

  // 3. Suspended Precision Drafting Compass / Caliper Monument
  const compassGroup = new THREE.Group();
  compassGroup.position.set(0, 2.38, -0.38);
  const pivotPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 24)),
    mats.accentBrass,
  );
  pivotPin.rotation.x = Math.PI / 2;
  const legGeoCompass = trackGeo(new THREE.ConeGeometry(0.055, 1.12, 12));
  legGeoCompass.rotateX(Math.PI); // tip pointing down
  const compassLegL = new THREE.Mesh(legGeoCompass, mats.accentBrass);
  compassLegL.position.set(-0.24, -0.52, 0);
  compassLegL.rotation.z = -0.36;
  const compassLegR = new THREE.Mesh(legGeoCompass, mats.accentBrass);
  compassLegR.position.set(0.24, -0.52, 0);
  compassLegR.rotation.z = 0.36;
  const crossbar = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.32, 0.018, 10, 32, Math.PI * 0.65)),
    mats.darkAnodized,
  );
  crossbar.position.y = -0.55;
  crossbar.rotation.z = Math.PI * 1.175;
  compassGroup.add(pivotPin, compassLegL, compassLegR, crossbar);
  credGroup.add(compassGroup);
  registerExplode(compassGroup, 0, 0.68, -0.18);

  // 4. Angled Lectern + Hardcover Bound Portfolio Folio
  const lecternStand = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.06, 0.12, 0.62, 18)),
    mats.darkAnodized,
  );
  lecternStand.position.set(0, 0.64, 0.42);
  credGroup.add(lecternStand);

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
  credGroup.add(folioGroup);
  registerExplode(folioGroup, 0, 0.42, 0.42);

  enableShadows(credGroup);

  // =========================================================================
  // EXHIBIT REGISTRY & CAMERA CHOREOGRAPHY PRESETS
  // =========================================================================
  const exhibits: Record<ChapterId, ExhibitDefinition> = {
    overview: {
      id: 'overview',
      indexLabel: '01',
      title: 'Profile & Philosophy',
      group: overviewGroup,
      anchorWorld: new THREE.Vector3(0, 3.25, 0),
      cameraPosition: new THREE.Vector3(2.9, 2.75, 4.9),
      cameraTarget: new THREE.Vector3(0, 1.55, 0),
      ...overviewHelpers,
    },
    experience: {
      id: 'experience',
      indexLabel: '02',
      title: 'Experience Chronology',
      group: expGroup,
      anchorWorld: new THREE.Vector3(-6.8, 3.95, -2.4),
      cameraPosition: new THREE.Vector3(-3.2, 3.2, 2.1),
      cameraTarget: new THREE.Vector3(-6.5, 1.85, -2.3),
      ...expHelpers,
    },
    projects: {
      id: 'projects',
      indexLabel: '03',
      title: 'Selected Engineering',
      group: projGroup,
      anchorWorld: new THREE.Vector3(6.8, 3.1, -2.4),
      cameraPosition: new THREE.Vector3(4.1, 2.55, 2.3),
      cameraTarget: new THREE.Vector3(6.8, 1.65, -2.3),
      ...projHelpers,
    },
    skills: {
      id: 'skills',
      indexLabel: '04',
      title: 'Technical Stack Orrery',
      group: skillsGroup,
      anchorWorld: new THREE.Vector3(-4.4, 3.45, 5.2),
      cameraPosition: new THREE.Vector3(-1.4, 2.8, 9.2),
      cameraTarget: new THREE.Vector3(-4.4, 1.85, 5.2),
      ...skillsHelpers,
    },
    credentials: {
      id: 'credentials',
      indexLabel: '05',
      title: 'Education & Contact',
      group: credGroup,
      anchorWorld: new THREE.Vector3(4.4, 3.35, 5.2),
      cameraPosition: new THREE.Vector3(2.0, 2.45, 9.3),
      cameraTarget: new THREE.Vector3(4.4, 1.55, 5.2),
      ...credHelpers,
    },
  };

  return {
    exhibits,
    proxyColliders: Object.values(exhibits).map((e) => e.proxyCollider),
    explodableParts,
    kinetic: {
      overviewOuterRing,
      overviewInnerRing,
      overviewPrism: prismGroup,
      skillsRings,
      skillsCore,
      experienceBeacons,
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      Object.values(exhibits).forEach((ex) => {
        (ex.ringHighlight.material as THREE.Material).dispose();
      });
    },
  };
}
