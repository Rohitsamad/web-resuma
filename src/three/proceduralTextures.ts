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
  folioCoverAlbedo: THREE.CanvasTexture;
  updateDynamicTextures: (profile: ResumeProfile) => void;
  dispose: () => void;
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
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

  // Fine directional anisotropic grain
  for (let y = 0; y < 512; y += 1) {
    const tone = 112 + Math.floor(Math.sin(y * 0.43) * 18 + Math.random() * 24);
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
  const [canvas, ctx] = createCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;

  // Deep architectural slate radial gradient
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 512);
  grad.addColorStop(0, '#161b24');
  grad.addColorStop(0.55, '#11161f');
  grad.addColorStop(1, '#0b0e14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle architectural radial rings
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1.5;
  [120, 220, 340, 460].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Orthogonal & 45-deg drafting crosshairs
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 70, cy + Math.sin(angle) * 70);
    ctx.lineTo(cx + Math.cos(angle) * 485, cy + Math.sin(angle) * 485);
    ctx.stroke();
  }

  // Fine perimeter degree ticks
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const inner = deg % 30 === 0 ? 330 : 336;
    const outer = 344;
    ctx.lineWidth = deg % 30 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
    ctx.lineTo(cx + Math.cos(rad) * outer, cy + Math.sin(rad) * outer);
    ctx.stroke();
  }

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

function paintNameplateCanvas(canvas: HTMLCanvasElement, profile: ResumeProfile): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#141922';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brushed hairline border
  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.strokeStyle = 'rgba(212, 163, 89, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = '#d4a359';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('ARCHITECTURAL DOSSIER · 01', 46, 66);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 50px "Outfit", sans-serif';
  const safeName = profile.name.slice(0, 26);
  ctx.fillText(safeName, 46, 132);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  const safeHeadline = profile.headline.slice(0, 52);
  ctx.fillText(safeHeadline, 46, 174);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 18px "IBM Plex Mono", monospace';
  ctx.fillText(`${profile.location}  ·  ${profile.yearsExperience}`, 46, 218);
}

function paintPrimaryDisplayCanvas(canvas: HTMLCanvasElement, profile: ResumeProfile): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0c1119';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle infrastructure grid
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

  // Header strip
  ctx.fillStyle = '#151e2c';
  ctx.fillRect(0, 0, canvas.width, 54);
  ctx.fillStyle = '#f59e0b';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('PLATFORM ARCHITECTURE · K8S / CI-CD / OBSERVABILITY', 28, 34);

  // Kubernetes & Observability Mesh Topology Diagram
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
  ctx.font = '700 14px "IBM Plex Mono", monospace';
  ctx.fillText('K8S', cx - 14, cy + 5);

  // Render production platform systems
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
    ctx.fillText(`${proj.category} · ${proj.metric.slice(0, 22)}`, 44, y + 58);
  });
}

function paintSecondaryDisplayCanvas(canvas: HTMLCanvasElement, profile: ResumeProfile): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0d131d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('INFRASTRUCTURE & SRE STACK', 28, 46);

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
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(skill.slice(0, 32), 28, y);

    const barW = 300;
    const fillW = 225 + ((i * 19) % 68);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(28, y + 10, barW, 6);
    ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(28, y + 10, fillW, 6);
  });
}

function paintFolioCoverCanvas(canvas: HTMLCanvasElement, profile: ResumeProfile): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#1b2230';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Embossed gold frame
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

  const brushedRoughness = new THREE.CanvasTexture(drawBrushedRoughnessCanvas());
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
      folioCoverAlbedo.dispose();
    },
  };
}
