import { World, Sage, DroppedItem, Weather, TimeOfDay } from '../types';
import { TILE_COLORS, SAGE_DEFINITIONS } from '../constants';
import { ISO_TILE_W, ISO_TILE_H, ISO_ELEV, RAISED, gridToScreen } from './projection';
import { drawSageSprite, getSageSprite } from './spriteAtlas';

interface Camera { x: number; y: number; }

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function shade(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`;
}

// Draw a single iso diamond (top face) at (cx, cy) — cx,cy is the TOP point of the diamond
function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, fill: string) {
  const w = ISO_TILE_W, h = ISO_TILE_H;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx, cy);                // top
  ctx.lineTo(cx + w / 2, cy + h / 2); // right
  ctx.lineTo(cx, cy + h);             // bottom
  ctx.lineTo(cx - w / 2, cy + h / 2); // left
  ctx.closePath();
  ctx.fill();
}

function drawSideWalls(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, base: string) {
  const left = shade(base, 0.55);
  const right = shade(base, 0.4);
  const w = ISO_TILE_W, th = ISO_TILE_H;
  // Left face
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + th / 2);
  ctx.lineTo(cx, cy + th);
  ctx.lineTo(cx, cy + th + h);
  ctx.lineTo(cx - w / 2, cy + th / 2 + h);
  ctx.closePath();
  ctx.fill();
  // Right face
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(cx + w / 2, cy + th / 2);
  ctx.lineTo(cx, cy + th);
  ctx.lineTo(cx, cy + th + h);
  ctx.lineTo(cx + w / 2, cy + th / 2 + h);
  ctx.closePath();
  ctx.fill();
}

// Decoration on top of certain tiles (trees, huts, temples) — kept minimal & crisp
function drawDecor(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number, animFrame: number, seed: number) {
  switch (type) {
    case 'forest': case 'grove': {
      // canopy ball
      const trunkY = cy - 4;
      ctx.fillStyle = '#4A2810';
      ctx.fillRect(cx - 1, trunkY, 2, 6);
      const canopy = type === 'grove' ? '#0D3818' : '#185828';
      ctx.fillStyle = canopy;
      ctx.beginPath(); ctx.arc(cx, trunkY - 3, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(canopy, 1.3);
      ctx.beginPath(); ctx.arc(cx - 1.5, trunkY - 4, 2.5, 0, Math.PI * 2); ctx.fill();
      if (type === 'grove') {
        const tw = Math.sin(animFrame * 0.05 + seed) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,220,110,${0.3 + tw * 0.4})`;
        ctx.fillRect(cx + 2, trunkY - 5, 1, 1);
      }
      break;
    }
    case 'mountain': {
      ctx.fillStyle = '#4A5258';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + ISO_TILE_H / 2);
      ctx.lineTo(cx, cy - 12);
      ctx.lineTo(cx + 8, cy + ISO_TILE_H / 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E8E8F0';
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 7);
      ctx.lineTo(cx, cy - 12);
      ctx.lineTo(cx + 2, cy - 7);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'hut': {
      ctx.fillStyle = '#6B4B2A';
      ctx.fillRect(cx - 5, cy - 6, 10, 8);
      ctx.fillStyle = '#A05228';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 6);
      ctx.lineTo(cx, cy - 12);
      ctx.lineTo(cx + 7, cy - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(cx - 1, cy - 2, 2, 4);
      break;
    }
    case 'village': {
      ctx.fillStyle = '#A09070';
      ctx.fillRect(cx - 6, cy - 7, 12, 9);
      ctx.fillStyle = '#785840';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 7);
      ctx.lineTo(cx, cy - 13);
      ctx.lineTo(cx + 7, cy - 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E8D888';
      ctx.fillRect(cx - 4, cy - 4, 2, 2);
      ctx.fillRect(cx + 2, cy - 4, 2, 2);
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(cx - 1, cy - 1, 2, 3);
      break;
    }
    case 'temple': {
      ctx.fillStyle = '#D8C8A0';
      ctx.fillRect(cx - 7, cy - 8, 14, 10);
      ctx.fillStyle = '#C02020';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 8);
      ctx.lineTo(cx, cy - 16);
      ctx.lineTo(cx + 9, cy - 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFD040';
      ctx.fillRect(cx - 1, cy - 17, 2, 2);
      const glow = 0.4 + Math.sin(animFrame * 0.04 + seed) * 0.2;
      ctx.fillStyle = `rgba(255,200,80,${glow})`;
      ctx.fillRect(cx - 5, cy - 4, 2, 2);
      ctx.fillRect(cx + 3, cy - 4, 2, 2);
      ctx.fillStyle = '#4A3020';
      ctx.fillRect(cx - 1, cy, 2, 2);
      break;
    }
    case 'shrine': {
      ctx.fillStyle = '#D8C890';
      ctx.fillRect(cx - 3, cy - 6, 6, 8);
      ctx.fillStyle = '#C8A860';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 6);
      ctx.lineTo(cx, cy - 11);
      ctx.lineTo(cx + 5, cy - 6);
      ctx.closePath(); ctx.fill();
      const sg = 0.18 + Math.sin(animFrame * 0.035 + seed) * 0.12;
      ctx.fillStyle = `rgba(255,215,80,${sg})`;
      ctx.beginPath(); ctx.arc(cx, cy - 7, 7, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ruins': {
      ctx.fillStyle = '#585050';
      ctx.fillRect(cx - 5, cy - 5, 2, 7);
      ctx.fillRect(cx + 3, cy - 4, 2, 6);
      ctx.fillStyle = '#686060';
      ctx.fillRect(cx - 6, cy - 6, 4, 1);
      break;
    }
    case 'cave': {
      ctx.fillStyle = '#180C18';
      ctx.beginPath(); ctx.arc(cx, cy - 2, 5, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 5, cy - 2, 10, 4);
      ctx.fillStyle = '#0C0408';
      ctx.beginPath(); ctx.arc(cx, cy, 3, Math.PI, 0); ctx.fill();
      break;
    }
    case 'flower': {
      const colors = ['#E87070', '#E8D050', '#D070E8', '#70B0E8'];
      for (let i = 0; i < 3; i++) {
        const fx = cx - 6 + ((seed + i * 5) % 12);
        const fy = cy + 4 + ((seed + i * 3) % 6);
        ctx.fillStyle = colors[(seed + i) % colors.length];
        ctx.fillRect(fx, fy, 2, 2);
      }
      break;
    }
    case 'tall_grass': {
      const sway = Math.sin(animFrame * 0.04 + seed) * 1;
      ctx.strokeStyle = '#2A7828';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const gx = cx - 6 + i * 4;
        ctx.beginPath();
        ctx.moveTo(gx, cy + 9);
        ctx.lineTo(gx + sway, cy + 4);
        ctx.stroke();
      }
      break;
    }
    case 'lake': case 'water': case 'river': {
      const wo = Math.sin(animFrame * 0.04 + seed * 0.3);
      ctx.fillStyle = `rgba(180,220,255,${0.18 + wo * 0.1})`;
      ctx.fillRect(cx - 4, cy + 6 + (wo > 0 ? 0 : 1), 4, 1);
      ctx.fillRect(cx + 2, cy + 9 + (wo > 0 ? 1 : 0), 3, 1);
      break;
    }
  }
}

const SAGE_PROPS = ['flame', 'fan', 'lotus', 'staff', 'crystal', 'beads', 'bowl', 'scroll', 'gourd'] as const;

// Iso character — uses generated sprite when loaded, falls back to procedural
function drawIsoSage(ctx: CanvasRenderingContext2D, sage: Sage, cx: number, cy: number, animFrame: number, isBound: boolean, sageIndex: number, reduceMotion = false) {
  const def = SAGE_DEFINITIONS.find(d => d.name === sage.name);
  const robe = def?.robeColor || '#888';
  const accent = sage.color;

  const isWalking = sage.state === 'walking';
  const isMeditating = sage.state === 'meditating';
  const isResting = sage.state === 'resting';

  const walk = Math.floor(animFrame * 0.14 + sageIndex) % 4;
  const stepBob = !reduceMotion && isWalking ? (walk % 2 === 0 ? -1 : 0) : 0;
  const idleBob = !reduceMotion && !isWalking && !isResting ? Math.sin(animFrame * 0.04 + sageIndex) * 0.7 : 0;
  const bx = cx;
  const by = cy + stepBob + idleBob - 4; // lift onto top face
  const facingLeft = (sage.targetX - sage.x) < -0.05;

  // Contact shadow on the diamond
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(bx, by + 12, 9, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aura
  if (isBound || isMeditating) {
    const a = isBound ? 0.34 : 0.22;
    const r = isBound ? 28 : 20;
    const [rR, gR, bR] = hexToRgb(accent);
    const grad = ctx.createRadialGradient(bx, by + 4, 0, bx, by + 4, r);
    grad.addColorStop(0, `rgba(${rR},${gR},${bR},${a})`);
    grad.addColorStop(1, `rgba(${rR},${gR},${bR},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(bx, by + 4, r, 0, Math.PI * 2); ctx.fill();
  }

  // Meditation ripple
  if (isMeditating) {
    const ring = (animFrame * 0.5 + sageIndex * 12) % 22 + 8;
    const [rR, gR, bR] = hexToRgb(accent);
    ctx.strokeStyle = `rgba(${rR},${gR},${bR},${Math.max(0, 0.22 - ring * 0.008)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bx, by + 12, ring, ring * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Sprite (preferred) — height tuned so sage feet sit on tile, head is comfortably readable
  const spriteH = isBound ? 56 : 50;
  const drewSprite = !!getSageSprite(sage.name);
  if (drewSprite) {
    drawSageSprite(ctx, sage.name, bx, by + 13, spriteH, facingLeft);
  } else {
    // === Procedural fallback (kept for safety while sprites preload) ===
    ctx.fillStyle = shade(robe, 0.7);
    ctx.beginPath();
    ctx.moveTo(bx - 5, by + 11); ctx.lineTo(bx + 5, by + 11);
    ctx.lineTo(bx + 3, by + 2); ctx.lineTo(bx - 3, by + 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = robe; ctx.fillRect(bx - 4, by, 8, 5);
    ctx.fillStyle = accent; ctx.fillRect(bx - 4, by + 4, 8, 1);
    ctx.fillStyle = '#E8CFA8'; ctx.beginPath(); ctx.arc(bx, by - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(bx, by - 4, 3.6, Math.PI, 0); ctx.fill();
  }

  // Name label — positioned above the sprite head
  const labelY = by - (drewSprite ? spriteH - 8 : 12);
  ctx.font = isBound ? 'bold 12px "Cormorant Garamond", serif' : '11px "Cormorant Garamond", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillText(sage.name, bx + 0.5, labelY + 0.5);
  ctx.fillStyle = isBound ? '#F5D88A' : 'rgba(245,242,236,0.95)';
  ctx.fillText(sage.name, bx, labelY);

  // Bound diamond marker
  if (isBound) {
    const a = Math.sin(animFrame * 0.06) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(212,175,106,${a})`;
    const my = labelY - 9;
    ctx.beginPath();
    ctx.moveTo(bx, my - 3);
    ctx.lineTo(bx + 3, my);
    ctx.lineTo(bx, my + 3);
    ctx.lineTo(bx - 3, my);
    ctx.closePath(); ctx.fill();
  }

// Dialogue bubble — parchment, serif, multi-line word-wrap (up to 3 lines)
  if (sage.dialogue) {
    ctx.font = 'italic 13px "Cormorant Garamond", serif';
    const maxLineW = 172;
    const lineH = 17;
    const padX = 11, padY = 9;

    // Word-wrap into lines
    const words = sage.dialogue.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxLineW && cur) {
        lines.push(cur);
        cur = word;
        if (lines.length >= 3) { cur = ''; break; }
      } else {
        cur = test;
      }
    }
    if (cur && lines.length < 3) lines.push(cur);
    if (!lines.length) lines.push(sage.dialogue.slice(0, 38) + '…');

    const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
    const pw = Math.min(widestLine + padX * 2, maxLineW + padX * 2);
    const ph = lines.length * lineH + padY * 2;
    const px = bx - pw / 2;
    const py = labelY - ph - 10;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, px + 1, py + 2, pw, ph, 7); ctx.fill();
    // Parchment body
    ctx.fillStyle = 'rgba(246,243,237,0.97)';
    roundRect(ctx, px, py, pw, ph, 7); ctx.fill();
    // Accent left bar
    const [rA, gA, bA] = hexToRgb(accent);
    ctx.fillStyle = `rgba(${rA},${gA},${bA},0.85)`;
    ctx.fillRect(px, py + 6, 2.5, ph - 12);
    // Tail pointer
    ctx.fillStyle = 'rgba(246,243,237,0.97)';
    ctx.beginPath();
    ctx.moveTo(bx - 4, py + ph);
    ctx.lineTo(bx, py + ph + 6);
    ctx.lineTo(bx + 4, py + ph);
    ctx.closePath(); ctx.fill();
    // Text
    ctx.fillStyle = '#1C2828';
    ctx.textAlign = 'center';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bx, py + padY + i * lineH + 11);
    }
  }
}

function drawIsoProp(ctx: CanvasRenderingContext2D, prop: typeof SAGE_PROPS[number], bx: number, by: number, accent: string, animFrame: number) {
  switch (prop) {
    case 'staff': {
      ctx.fillStyle = '#6B4A28'; ctx.fillRect(bx + 4, by - 8, 1, 14);
      ctx.fillStyle = accent; ctx.fillRect(bx + 3, by - 9, 3, 2); break;
    }
    case 'flame': {
      const f = (animFrame % 12) < 6 ? 0 : 1;
      ctx.fillStyle = '#7A4A20'; ctx.fillRect(bx + 4, by - 1, 1, 5);
      ctx.fillStyle = '#FFB040'; ctx.fillRect(bx + 4, by - 4 - f, 1, 3);
      ctx.fillStyle = '#FFE090'; ctx.fillRect(bx + 4, by - 5 - f, 1, 1); break;
    }
    case 'crystal': {
      const [r, g, b] = hexToRgb(accent);
      ctx.fillStyle = `rgba(${r},${g},${b},0.95)`; ctx.fillRect(bx + 4, by - 2, 1, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bx + 4, by - 2, 1, 1); break;
    }
    case 'lotus': {
      ctx.fillStyle = '#F0B0C8'; ctx.fillRect(bx + 4, by, 2, 1);
      ctx.fillStyle = '#FFE070'; ctx.fillRect(bx + 4.5, by - 0.5, 1, 1); break;
    }
    case 'beads': {
      ctx.fillStyle = accent;
      ctx.fillRect(bx + 4, by + 1, 1, 1); ctx.fillRect(bx + 5, by + 2, 1, 1); ctx.fillRect(bx + 4, by + 3, 1, 1); break;
    }
    case 'bowl': {
      ctx.fillStyle = '#7A5230'; ctx.fillRect(bx + 3, by + 2, 4, 1);
      const [r, g, b] = hexToRgb(accent);
      ctx.fillStyle = `rgba(${r},${g},${b},0.7)`; ctx.fillRect(bx + 4, by + 1, 2, 1); break;
    }
    case 'scroll': {
      ctx.fillStyle = '#E8D8B0'; ctx.fillRect(bx + 4, by + 1, 4, 2);
      ctx.fillStyle = '#8B6B3A'; ctx.fillRect(bx + 4, by + 1, 1, 2); ctx.fillRect(bx + 7, by + 1, 1, 2); break;
    }
    case 'fan': {
      ctx.fillStyle = accent; ctx.fillRect(bx + 4, by, 4, 1); ctx.fillRect(bx + 5, by - 1, 2, 1); break;
    }
    case 'gourd': {
      ctx.fillStyle = '#A87838'; ctx.fillRect(bx + 4, by + 1, 2, 2);
      ctx.fillStyle = '#7A5828'; ctx.fillRect(bx + 4, by, 1, 1); break;
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// === MAIN ===
export function renderWorldIso(
  ctx: CanvasRenderingContext2D,
  world: World,
  camera: Camera,
  canvasW: number,
  canvasH: number,
  boundSageName: string,
  animFrame: number,
  zoom: number,
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  // === Layered ambient backdrop (parallax + time-of-day) ===
  drawAmbientSky(ctx, world.dayPhase, world.weather, camera, canvasW, canvasH, animFrame);

  ctx.save();
  ctx.scale(zoom, zoom);

  const vw = canvasW / zoom, vh = canvasH / zoom;

  // World origin in iso space: pick so camera tile is centered
  const camIso = gridToScreen(camera.x, camera.y);
  const offX = vw / 2 - camIso.sx;
  const offY = vh / 2 - camIso.sy;

  // Determine visible tile range — bounding box around camera
  const halfTilesX = Math.ceil(vw / ISO_TILE_W) + 4;
  const halfTilesY = Math.ceil(vh / ISO_TILE_H) + 8;
  const cx = Math.floor(camera.x), cy = Math.floor(camera.y);
  const minX = Math.max(0, cx - halfTilesX);
  const maxX = Math.min(world.width - 1, cx + halfTilesX);
  const minY = Math.max(0, cy - halfTilesY);
  const maxY = Math.min(world.height - 1, cy + halfTilesY);

  // Ground pass (painter order: y+x ascending automatically via nested loops)
  for (let gy = minY; gy <= maxY; gy++) {
    for (let gx = minX; gx <= maxX; gx++) {
      const tile = world.tiles[gy][gx];
      const { sx, sy } = gridToScreen(gx, gy);
      const px = sx + offX - ISO_TILE_W / 2; // shift so cx points to top of diamond? we use top point
      const top = sy + offY;
      const cxp = sx + offX;

      // Quick cull
      if (cxp < -ISO_TILE_W || cxp > vw + ISO_TILE_W || top < -ISO_TILE_H * 4 || top > vh + ISO_TILE_H * 4) continue;

      const base = TILE_COLORS[tile.type] || '#444';
      const elev = RAISED[tile.type] || 0;

      if (elev > 0) drawSideWalls(ctx, cxp, top, elev, base);
      drawDiamond(ctx, cxp, top, base);
      // top highlight strip
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(cxp, top + 1);
      ctx.lineTo(cxp + ISO_TILE_W / 2 - 1, top + ISO_TILE_H / 2);
      ctx.lineTo(cxp, top + ISO_TILE_H - 1);
      ctx.lineTo(cxp - ISO_TILE_W / 2 + 1, top + ISO_TILE_H / 2);
      ctx.closePath();
      ctx.fill();
      // decorations live above top face
      const seed = (gx * 7 + gy * 13) % 100;
      drawDecor(ctx, tile.type, cxp, top, animFrame, seed);
    }
  }

  // Dropped items
  for (const di of world.droppedItems) {
    if (di.x < minX || di.x > maxX || di.y < minY || di.y > maxY) continue;
    const { sx, sy } = gridToScreen(di.x, di.y);
    const cxp = sx + offX, top = sy + offY + ISO_TILE_H / 2;
    const bob = Math.sin(animFrame * 0.06 + di.x + di.y) * 1.5;
    ctx.fillStyle = 'rgba(255,255,200,0.25)';
    ctx.beginPath(); ctx.arc(cxp, top + bob, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(cxp, top + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Sages — painter order with bound last
  const sortedSages = [...world.sages].sort((a, b) => {
    if (a.name === boundSageName) return 1;
    if (b.name === boundSageName) return -1;
    return (a.x + a.y) - (b.x + b.y);
  });
  for (let i = 0; i < sortedSages.length; i++) {
    const s = sortedSages[i];
    const { sx, sy } = gridToScreen(s.x, s.y);
    const cxp = sx + offX, top = sy + offY;
    if (cxp < -40 || cxp > vw + 40 || top < -60 || top > vh + 40) continue;
    drawIsoSage(ctx, s, cxp, top + ISO_TILE_H / 2, animFrame, s.name === boundSageName, i);
  }

  ctx.restore();

  // Day/night overlay (drawn at native scale)
  const phase = world.dayPhase;
  let nightAlpha = 0;
  if (phase > 0.75) nightAlpha = (phase - 0.75) / 0.25 * 0.45;
  else if (phase < 0.15) nightAlpha = (1 - phase / 0.15) * 0.4;
  else if (phase > 0.55 && phase <= 0.75) nightAlpha = (phase - 0.55) / 0.2 * 0.2;
  if (nightAlpha > 0.01) {
    ctx.fillStyle = `rgba(5,8,30,${nightAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
    if (nightAlpha > 0.2) {
      for (let s = 0; s < 40; s++) {
        const sx = (s * 137 + 50) % canvasW;
        const sy = (s * 89 + 30) % (canvasH * 0.5);
        const tw = Math.sin(animFrame * 0.05 + s * 0.7) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255,255,240,${tw * (nightAlpha / 0.45)})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }
  }

// Ambient particles (fireflies, pollen, mist wisps)
  drawAmbientParticles(ctx, world, canvasW, canvasH, animFrame);
  // Weather
  drawAmbientParticles(ctx, world, canvasW, canvasH, animFrame);
  drawWeather(ctx, world.weather, canvasW, canvasH, animFrame);

  ctx.textAlign = 'start';
}

// === Ambient sky: gradient + parallax cloud bands tinted by time-of-day ===
// Anchor stops: dawn, day, dusk, night → interpolated via dayPhase 0..1
// dayPhase: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk, ~1=midnight again
type Stop = [number, number, number]; // RGB
const SKY_TOP: Record<string, Stop> = {
  night: [10, 14, 32], dawn: [212, 140, 110], day: [120, 178, 210], dusk: [180, 90, 110],
};
const SKY_BOT: Record<string, Stop> = {
  night: [22, 28, 56], dawn: [240, 200, 160], day: [200, 220, 230], dusk: [60, 40, 80],
};
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpStop(a: Stop, b: Stop, t: number): Stop {
  return [lerp(a[0], b[0], t) | 0, lerp(a[1], b[1], t) | 0, lerp(a[2], b[2], t) | 0];
}
function pickPalette(phase: number): { top: Stop; bot: Stop } {
  // Keyframes: 0 night, 0.22 dawn, 0.5 day, 0.78 dusk, 1 night
  const keys: { p: number; key: keyof typeof SKY_TOP }[] = [
    { p: 0, key: 'night' }, { p: 0.22, key: 'dawn' }, { p: 0.5, key: 'day' },
    { p: 0.78, key: 'dusk' }, { p: 1, key: 'night' },
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    if (phase >= keys[i].p && phase <= keys[i + 1].p) {
      const t = (phase - keys[i].p) / (keys[i + 1].p - keys[i].p);
      return {
        top: lerpStop(SKY_TOP[keys[i].key], SKY_TOP[keys[i + 1].key], t),
        bot: lerpStop(SKY_BOT[keys[i].key], SKY_BOT[keys[i + 1].key], t),
      };
    }
  }
  return { top: SKY_TOP.night, bot: SKY_BOT.night };
}

function drawAmbientSky(
  ctx: CanvasRenderingContext2D,
  phase: number,
  weather: Weather,
  camera: { x: number; y: number },
  canvasW: number,
  canvasH: number,
  animFrame: number,
) {
  const { top, bot } = pickPalette(phase);
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`);
  grad.addColorStop(1, `rgb(${bot[0]},${bot[1]},${bot[2]})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Parallax cloud bands — drift with camera + slow time
  const bandAlpha = weather === 'mist' ? 0.22 : weather === 'rain' ? 0.14 : 0.10;
  const cloudColor = phase > 0.78 || phase < 0.22 ? '210,220,240' : '255,250,240';
  const bands = [
    { y: canvasH * 0.18, h: canvasH * 0.18, speed: 0.06, parX: 0.4, parY: 0.18, op: bandAlpha },
    { y: canvasH * 0.32, h: canvasH * 0.16, speed: 0.12, parX: 0.7, parY: 0.28, op: bandAlpha * 0.85 },
    { y: canvasH * 0.46, h: canvasH * 0.10, speed: 0.20, parX: 1.0, parY: 0.42, op: bandAlpha * 0.6 },
  ];
  for (const b of bands) {
    const offset = animFrame * b.speed - camera.x * b.parX * 6 + camera.y * b.parY * 2;
    const cy = b.y + Math.sin(animFrame * 0.003) * 4;
    for (let i = -2; i < 14; i++) {
      const cx = ((i * 180 + offset) % (canvasW + 360)) - 180;
      const cw = 130 + (i % 3) * 40;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
      g.addColorStop(0, `rgba(${cloudColor},${b.op})`);
      g.addColorStop(1, `rgba(${cloudColor},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, cw, b.h * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Ambient particles — slow drifting motes that make the world breathe at idle
function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  world: World,
  canvasW: number,
  canvasH: number,
  animFrame: number,
) {
  const phase = world.dayPhase;
  const isNight = phase < 0.18 || phase > 0.82;
  const isDusk  = phase > 0.68 && phase <= 0.82;
  const isDay   = phase >= 0.3 && phase <= 0.6;

  // Fireflies — appear at dusk and night, warm amber glow, slow drift
  if (isNight || isDusk) {
    const count = isNight ? 18 : 9;
    for (let i = 0; i < count; i++) {
      const seed = i * 137.508;
      const x = ((seed * 1.7 + animFrame * 0.18 + Math.sin(animFrame * 0.012 + i) * 28) % canvasW + canvasW) % canvasW;
      const y = ((seed * 0.9 + animFrame * 0.06 + Math.cos(animFrame * 0.009 + i * 0.7) * 18) % (canvasH * 0.75) + canvasH * 0.12);
      const blink = Math.sin(animFrame * 0.11 + i * 2.3);
      if (blink < -0.2) continue; // off phase
      const alpha = Math.max(0, blink) * (isNight ? 0.75 : 0.45);
      const r = 1.2 + Math.abs(blink) * 1.1;
      // glow halo
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      g.addColorStop(0, `rgba(255,220,110,${alpha * 0.5})`);
      g.addColorStop(1, `rgba(255,200,80,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();
      // bright core
      ctx.fillStyle = `rgba(255,240,160,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Pollen motes — daytime, slow upward drift, near-invisible
  if (isDay && world.weather === 'clear') {
    for (let i = 0; i < 22; i++) {
      const seed = i * 97.4;
      const x = ((seed * 2.3 + animFrame * 0.22 + Math.sin(animFrame * 0.007 + i) * 14) % canvasW + canvasW) % canvasW;
      const y = ((canvasH - (seed * 1.1 + animFrame * 0.28 + i * 30) % canvasH));
      const alpha = 0.08 + Math.sin(animFrame * 0.02 + i) * 0.05;
      ctx.fillStyle = `rgba(255,230,140,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Mist wisps — weather=mist, slow horizontal drift at ground level
  if (world.weather === 'mist') {
    for (let i = 0; i < 8; i++) {
      const seed = i * 211;
      const x = ((seed * 1.4 + animFrame * 0.6) % (canvasW + 200)) - 100;
      const y = canvasH * (0.55 + (i % 4) * 0.1);
      const alpha = 0.06 + Math.sin(animFrame * 0.006 + i) * 0.03;
      const mw = 80 + (i % 3) * 40;
      const mg = ctx.createRadialGradient(x, y, 0, x, y, mw);
      mg.addColorStop(0, `rgba(210,220,230,${alpha})`);
      mg.addColorStop(1, `rgba(210,220,230,0)`);
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.ellipse(x, y, mw, mw * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}


function drawWeather(ctx: CanvasRenderingContext2D, weather: Weather, canvasW: number, canvasH: number, animFrame: number) {
  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(150,180,220,0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const rx = ((i * 37 + animFrame * 2.5) % canvasW);
      const ry = ((i * 53 + animFrame * 5) % canvasH);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry + 8); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,50,80,0.12)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (weather === 'mist') {
    ctx.fillStyle = `rgba(200,210,220,${0.12 + Math.sin(animFrame * 0.008) * 0.04})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (weather === 'wind') {
    ctx.strokeStyle = 'rgba(200,220,230,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const wy = ((i * 50 + animFrame * 0.4) % canvasH);
      const wx = ((animFrame * 4 + i * 80) % (canvasW + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 15, wy - 2, wx + 35 + Math.sin(i) * 10, wy + 1);
      ctx.stroke();
    }
  }
}

// === Iso minimap (top-down dot grid) ===
export function renderIsoMinimap(ctx: CanvasRenderingContext2D, world: World, boundSageName: string, canvasW: number, canvasH: number, size = 96) {
  const mmSize = size;
  const mmX = canvasW - mmSize - 12;
  const mmY = canvasH - mmSize - 12;
  const sc = mmSize / Math.max(world.width, world.height);

  ctx.fillStyle = 'rgba(5,10,15,0.78)';
  roundRect(ctx, mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212,175,106,0.25)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 4); ctx.stroke();

  const step = 2;
  const palette: Record<string, string> = {
    water: '#1A3858', lake: '#205080', river: '#2870A0',
    sand: '#C8B888', beach: '#C8B888', grass: '#3A8838',
    tall_grass: '#2A6828', forest: '#145020', grove: '#0D3818',
    mountain: '#505858', stone: '#686868', temple: '#A02020',
    shrine: '#B89840', hut: '#6B4B2A', village: '#907858',
    cave: '#282028', ruins: '#585050', flower: '#48A038',
    garden: '#50A040', clearing: '#68B858', bridge: '#7A5830',
    stone_path: '#888078',
  };
  for (let y = 0; y < world.height; y += step) {
    for (let x = 0; x < world.width; x += step) {
      ctx.fillStyle = palette[world.tiles[y][x].type] || '#333';
      ctx.fillRect(mmX + x * sc, mmY + y * sc, Math.max(1, step * sc), Math.max(1, step * sc));
    }
  }
  for (const s of world.sages) {
    const isB = s.name === boundSageName;
    ctx.fillStyle = isB ? '#FFD88A' : s.color;
    const ds = isB ? 3 : 2;
    ctx.fillRect(mmX + s.x * sc - ds / 2, mmY + s.y * sc - ds / 2, ds, ds);
  }
}
