import * as THREE from 'three';
import { MaterialFinish } from '../types/resume';
import { ProceduralTextureSet } from './proceduralTextures';

export interface StudioMaterialLibrary {
  plinthStone: THREE.MeshStandardMaterial;
  brushedChassis: THREE.MeshPhysicalMaterial;
  accentBrass: THREE.MeshPhysicalMaterial;
  darkAnodized: THREE.MeshStandardMaterial;
  opticalGlass: THREE.MeshPhysicalMaterial;
  warmEmissive: THREE.MeshStandardMaterial;
  coolEmissive: THREE.MeshStandardMaterial;
  floorMat: THREE.MeshStandardMaterial;
  contactShadowMat: THREE.MeshBasicMaterial;
  nameplateMat: THREE.MeshStandardMaterial;
  displayPrimaryMat: THREE.MeshStandardMaterial;
  displaySecondaryMat: THREE.MeshStandardMaterial;
  pipelineDisplayMat: THREE.MeshStandardMaterial;
  folioCoverMat: THREE.MeshStandardMaterial;
  instancedOrbitalMat: THREE.MeshStandardMaterial;
  instancedBollardMat: THREE.MeshStandardMaterial;
  proxyColliderMat: THREE.MeshBasicMaterial;
  applyFinish: (finish: MaterialFinish) => void;
  dispose: () => void;
}

const FINISH_PALETTES: Record<
  MaterialFinish,
  {
    chassisColor: number;
    chassisRoughness: number;
    accentColor: number;
    stoneColor: number;
    emissiveWarm: number;
  }
> = {
  titanium: {
    chassisColor: 0x9aa6b8,
    chassisRoughness: 0.24,
    accentColor: 0xd4a359,
    stoneColor: 0x1c222d,
    emissiveWarm: 0xf59e0b,
  },
  brass: {
    chassisColor: 0x3b332d,
    chassisRoughness: 0.28,
    accentColor: 0xe2b365,
    stoneColor: 0x241f1c,
    emissiveWarm: 0xfbbf24,
  },
  obsidian: {
    chassisColor: 0x1f2530,
    chassisRoughness: 0.2,
    accentColor: 0x38bdf8,
    stoneColor: 0x12161f,
    emissiveWarm: 0x38bdf8,
  },
};

export function createStudioMaterials(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): StudioMaterialLibrary {
  const initial = FINISH_PALETTES.titanium;

  const plinthStone = new THREE.MeshStandardMaterial({
    color: initial.stoneColor,
    roughness: 0.8,
    metalness: 0.06,
    bumpMap: textures.stoneBump,
    bumpScale: 0.015,
  });

  const brushedChassis = new THREE.MeshPhysicalMaterial({
    color: initial.chassisColor,
    metalness: 0.92,
    roughness: initial.chassisRoughness,
    roughnessMap: textures.brushedRoughness,
    anisotropy: 0.85,
    anisotropyRotation: 0.3,
    clearcoat: 0.25,
    clearcoatRoughness: 0.25,
  });

  const accentBrass = new THREE.MeshPhysicalMaterial({
    color: initial.accentColor,
    metalness: 0.94,
    roughness: 0.2,
    roughnessMap: textures.brushedRoughness,
    anisotropy: 0.75,
    clearcoat: 0.35,
  });

  const darkAnodized = new THREE.MeshStandardMaterial({
    color: 0x181d26,
    metalness: 0.42,
    roughness: 0.56,
  });

  const opticalGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    metalness: 0.0,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.38 : 1.0,
    ior: 1.62,
    thickness: 1.1,
    attenuationColor: new THREE.Color(0x93c5fd),
    attenuationDistance: 2.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    depthWrite: false,
  });

  const warmEmissive = new THREE.MeshStandardMaterial({
    color: initial.emissiveWarm,
    emissive: initial.emissiveWarm,
    emissiveIntensity: 1.4,
    roughness: 0.35,
    metalness: 0.1,
  });

  const coolEmissive = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.15,
    roughness: 0.35,
    metalness: 0.1,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floorAlbedo,
    roughness: 0.86,
    metalness: 0.08,
    bumpMap: textures.stoneBump,
    bumpScale: 0.008,
  });

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });

  const nameplateMat = new THREE.MeshStandardMaterial({
    map: textures.nameplateAlbedo,
    roughness: 0.42,
    metalness: 0.25,
  });

  const displayPrimaryMat = new THREE.MeshStandardMaterial({
    map: textures.displayPrimaryAlbedo,
    emissiveMap: textures.displayPrimaryAlbedo,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.05,
  });

  const displaySecondaryMat = new THREE.MeshStandardMaterial({
    map: textures.displaySecondaryAlbedo,
    emissiveMap: textures.displaySecondaryAlbedo,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.05,
  });

  const pipelineDisplayMat = new THREE.MeshStandardMaterial({
    map: textures.pipelineDisplayAlbedo,
    emissiveMap: textures.pipelineDisplayAlbedo,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.05,
  });

  const folioCoverMat = new THREE.MeshStandardMaterial({
    map: textures.folioCoverAlbedo,
    roughness: 0.62,
    metalness: 0.18,
  });

  const instancedOrbitalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.25,
  });

  const instancedBollardMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.65,
    roughness: 0.45,
  });

  const proxyColliderMat = new THREE.MeshBasicMaterial({
    visible: false,
  });

  const allMaterials: THREE.Material[] = [
    plinthStone,
    brushedChassis,
    accentBrass,
    darkAnodized,
    opticalGlass,
    warmEmissive,
    coolEmissive,
    floorMat,
    contactShadowMat,
    nameplateMat,
    displayPrimaryMat,
    displaySecondaryMat,
    pipelineDisplayMat,
    folioCoverMat,
    instancedOrbitalMat,
    instancedBollardMat,
    proxyColliderMat,
  ];

  return {
    plinthStone,
    brushedChassis,
    accentBrass,
    darkAnodized,
    opticalGlass,
    warmEmissive,
    coolEmissive,
    floorMat,
    contactShadowMat,
    nameplateMat,
    displayPrimaryMat,
    displaySecondaryMat,
    pipelineDisplayMat,
    folioCoverMat,
    instancedOrbitalMat,
    instancedBollardMat,
    proxyColliderMat,
    applyFinish(finish: MaterialFinish) {
      const p = FINISH_PALETTES[finish];
      brushedChassis.color.setHex(p.chassisColor);
      brushedChassis.roughness = p.chassisRoughness;
      accentBrass.color.setHex(p.accentColor);
      plinthStone.color.setHex(p.stoneColor);
      warmEmissive.color.setHex(p.emissiveWarm);
      warmEmissive.emissive.setHex(p.emissiveWarm);
    },
    dispose() {
      allMaterials.forEach((m) => m.dispose());
    },
  };
}
