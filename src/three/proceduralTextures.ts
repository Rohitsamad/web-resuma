import * as THREE from 'three';
import { ResumeProfile } from '../types/resume';

export interface ProceduralTextureSet {
  brushedRoughness: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  floorAlbedo: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  nameplateAlbedo: THREE.CanvasTexture;
  displayPrimaryAlbedo: THREE.CanvasTexture;
  displaySecondaryAlbedo: THREE.CanvasTexture;
  pipelineDisplayAlbedo: THREE.CanvasTexture;
  folioCoverAlbedo: THREE.CanvasTexture;
  updateDynamicTextures: (profile: ResumeProfile) => void;
  dispose: () => void;
}

function createCanvas(
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable');
  }
  return [canvas, ctx];
}

function drawBrushedRoughnessCanvas(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 1) {
    const tone =
      112 + Math.floor(Math.sin(y * 0.43) * 18 + Math.random() * 24);
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(0, y, 512, 1);
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 600; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 140;
    const tone = Math.random() > 0.5 ? 210 : 75;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(x, y, len, 1);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function drawStoneBumpCanvas(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(512, 512);
  ctx.fillStyle = '#7e7e7e';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.6 + Math.random() * 1.9;
    const v = 90 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

function drawFloorAlbedoCanvas(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(512, 512);

  // Architectural slate tile base for seamless corridor tiling
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile panel variation
  ctx.fillStyle = '#141a24';
  ctx.fillRect(4, 4, 248, 248);
  ctx.fillRect(260, 260, 248, 248);

  // Fine drafting grid seams
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Micro calibration crosshairs at tile intersections
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 1.5;
  [0, 256].forEach((gx) => {
    [0, 256].forEach((gy) => {
      ctx.beginPath();
      ctx.moveTo(gx - 10, gy);
      ctx.lineTo(gx + 10, gy);
      ctx.moveTo(gx, gy - 10);
      ctx.lineTo(gx, gy + 10);
      ctx.stroke();
    });
  });

  return canvas;
}

function drawContactShadowCanvas(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

function paintNameplateCanvas(
  canvas: HTMLCanvasElement,
  profile: ResumeProfile,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#141922';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.strokeStyle = 'rgba(212, 163, 89, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = '#d4a359';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('CORE SKILLS & PLATFORM PORTFOLIO', 46, 66);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 48px "Outfit", sans-serif';
  ctx.fillText(profile.name.slice(0, 26), 46, 132);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(profile.headline.slice(0, 52), 46, 174);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 18px "IBM Plex Mono", monospace';
  ctx.fillText(
    `${profile.yearsExperience}  ·  99.98% SLA  ·  ${profile.location}`,
    46,
    218,
  );
}

function paintPrimaryDisplayCanvas(
  canvas: HTMLCanvasElement,
  profile: ResumeProfile,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0c1119';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#151e2c';
  ctx.fillRect(0, 0, canvas.width, 54);
  ctx.fillStyle = '#f59e0b';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('OBSERVABILITY · PROMETHEUS / GRAFANA / ELK / AI4OPS', 28, 34);

  const cx = 568;
  const cy = 235;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  const nodeAngles = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3);
  nodeAngles.forEach((ang) => {
    const nx = cx + Math.cos(ang) * 108;
    const ny = cy + Math.sin(ang) * 108;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    ctx.fillStyle = '#151e2c';
    ctx.beginPath();
    ctx.arc(nx, ny, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
  });

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0b0e14';
  ctx.font = '700 13px "IBM Plex Mono", monospace';
  ctx.fillText('SLA', cx - 14, cy + 5);

  profile.projects.slice(0, 3).forEach((proj, idx) => {
    const y = 92 + idx * 98;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
    ctx.fillRect(28, y, 375, 80);
    ctx.strokeStyle = idx === 0 ? '#f59e0b' : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, y, 375, 80);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 19px "Outfit", sans-serif';
    ctx.fillText(proj.name.slice(0, 29), 44, y + 32);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 14px "IBM Plex Mono", monospace';
    ctx.fillText(
      `${proj.category} · ${proj.metric.slice(0, 22)}`,
      44,
      y + 58,
    );
  });
}

function paintSecondaryDisplayCanvas(
  canvas: HTMLCanvasElement,
  profile: ResumeProfile,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0d131d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('CORE SKILL MATRIX', 28, 46);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 66);
  ctx.lineTo(canvas.width - 28, 66);
  ctx.stroke();

  const items = profile.skills.flatMap((g) => g.items).slice(0, 8);
  items.forEach((skill, i) => {
    const y = 104 + i * 48;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(skill.slice(0, 34), 28, y);

    const barW = 300;
    const fillW = 225 + ((i * 19) % 68);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(28, y + 10, barW, 6);
    ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(28, y + 10, fillW, 6);
  });
}

function paintPipelineDisplayCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0c1119';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#151e2c';
  ctx.fillRect(0, 0, canvas.width, 52);
  ctx.fillStyle = '#f59e0b';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('DEVSECOPS PIPELINE · GITLAB CI / KANIKO / VAULT', 28, 33);

  const stages = [
    { name: '01 TEST & LINT', detail: 'Automated Suite', color: '#38bdf8' },
    { name: '02 KANIKO BUILD', detail: 'Rootless OCI', color: '#f59e0b' },
    { name: '03 GITLEAKS', detail: 'Secrets Scan', color: '#34d399' },
    { name: '04 DEFECTDOJO', detail: 'Compliance Gate', color: '#38bdf8' },
    { name: '05 HELM DEPLOY', detail: '99.98% Rolling', color: '#f59e0b' },
  ];

  stages.forEach((st, idx) => {
    const x = 28 + idx * 144;
    const y = 94;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fillRect(x, y, 128, 220);
    ctx.strokeStyle = st.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 128, 220);

    ctx.fillStyle = st.color;
    ctx.fillRect(x, y, 128, 8);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 13px "IBM Plex Mono", monospace';
    ctx.fillText(st.name, x + 10, y + 48);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(st.detail, x + 10, y + 84);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 12, y + 170, 104, 10);
    ctx.fillStyle = st.color;
    ctx.fillRect(x + 12, y + 170, 92, 10);
  });
}

function paintFolioCoverCanvas(
  canvas: HTMLCanvasElement,
  profile: ResumeProfile,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#1b2230';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = '#d4a359';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('CURRICULUM VITAE', 52, 86);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 40px "Outfit", sans-serif';
  ctx.fillText(profile.name.slice(0, 20), 52, 152);

  const primaryEdu = profile.education[0];
  if (primaryEdu) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(primaryEdu.institution.slice(0, 32), 52, 230);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 16px "IBM Plex Mono", monospace';
    ctx.fillText(primaryEdu.degree.slice(0, 34), 52, 264);
  }

  ctx.fillStyle = '#d4a359';
  ctx.font = '400 16px "IBM Plex Mono", monospace';
  ctx.fillText(profile.email.slice(0, 34), 52, canvas.height - 64);
}

export function createProceduralTextures(
  maxAnisotropy: number,
  initialProfile: ResumeProfile,
): ProceduralTextureSet {
  const anisotropy = Math.min(maxAnisotropy, 8);

  const brushedRoughness = new THREE.CanvasTexture(
    drawBrushedRoughnessCanvas(),
  );
  brushedRoughness.wrapS = THREE.RepeatWrapping;
  brushedRoughness.wrapT = THREE.RepeatWrapping;
  brushedRoughness.repeat.set(2, 2);
  brushedRoughness.anisotropy = anisotropy;

  const stoneBump = new THREE.CanvasTexture(drawStoneBumpCanvas());
  stoneBump.wrapS = THREE.RepeatWrapping;
  stoneBump.wrapT = THREE.RepeatWrapping;
  stoneBump.repeat.set(3, 3);
  stoneBump.anisotropy = anisotropy;

  const floorAlbedo = new THREE.CanvasTexture(drawFloorAlbedoCanvas());
  floorAlbedo.colorSpace = THREE.SRGBColorSpace;
  floorAlbedo.wrapS = THREE.RepeatWrapping;
  floorAlbedo.wrapT = THREE.RepeatWrapping;
  floorAlbedo.repeat.set(16, 40);
  floorAlbedo.anisotropy = anisotropy;

  const contactShadow = new THREE.CanvasTexture(drawContactShadowCanvas());
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  const [nameplateCanvas] = createCanvas(768, 256);
  paintNameplateCanvas(nameplateCanvas, initialProfile);
  const nameplateAlbedo = new THREE.CanvasTexture(nameplateCanvas);
  nameplateAlbedo.colorSpace = THREE.SRGBColorSpace;
  nameplateAlbedo.anisotropy = anisotropy;

  const [disp1Canvas] = createCanvas(768, 448);
  paintPrimaryDisplayCanvas(disp1Canvas, initialProfile);
  const displayPrimaryAlbedo = new THREE.CanvasTexture(disp1Canvas);
  displayPrimaryAlbedo.colorSpace = THREE.SRGBColorSpace;
  displayPrimaryAlbedo.anisotropy = anisotropy;

  const [disp2Canvas] = createCanvas(384, 512);
  paintSecondaryDisplayCanvas(disp2Canvas, initialProfile);
  const displaySecondaryAlbedo = new THREE.CanvasTexture(disp2Canvas);
  displaySecondaryAlbedo.colorSpace = THREE.SRGBColorSpace;
  displaySecondaryAlbedo.anisotropy = anisotropy;

  const [pipelineCanvas] = createCanvas(768, 384);
  paintPipelineDisplayCanvas(pipelineCanvas);
  const pipelineDisplayAlbedo = new THREE.CanvasTexture(pipelineCanvas);
  pipelineDisplayAlbedo.colorSpace = THREE.SRGBColorSpace;
  pipelineDisplayAlbedo.anisotropy = anisotropy;

  const [folioCanvas] = createCanvas(512, 640);
  paintFolioCoverCanvas(folioCanvas, initialProfile);
  const folioCoverAlbedo = new THREE.CanvasTexture(folioCanvas);
  folioCoverAlbedo.colorSpace = THREE.SRGBColorSpace;
  folioCoverAlbedo.anisotropy = anisotropy;

  return {
    brushedRoughness,
    stoneBump,
    floorAlbedo,
    contactShadow,
    nameplateAlbedo,
    displayPrimaryAlbedo,
    displaySecondaryAlbedo,
    pipelineDisplayAlbedo,
    folioCoverAlbedo,
    updateDynamicTextures(profile: ResumeProfile) {
      paintNameplateCanvas(nameplateCanvas, profile);
      nameplateAlbedo.needsUpdate = true;

      paintPrimaryDisplayCanvas(disp1Canvas, profile);
      displayPrimaryAlbedo.needsUpdate = true;

      paintSecondaryDisplayCanvas(disp2Canvas, profile);
      displaySecondaryAlbedo.needsUpdate = true;

      paintFolioCoverCanvas(folioCanvas, profile);
      folioCoverAlbedo.needsUpdate = true;
    },
    dispose() {
      brushedRoughness.dispose();
      stoneBump.dispose();
      floorAlbedo.dispose();
      contactShadow.dispose();
      nameplateAlbedo.dispose();
      displayPrimaryAlbedo.dispose();
      displaySecondaryAlbedo.dispose();
      pipelineDisplayAlbedo.dispose();
      folioCoverAlbedo.dispose();
    },
  };
}
