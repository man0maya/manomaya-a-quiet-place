import { World, Sage } from './types';
import { TILE_SIZE, TILE_COLORS, DAY_CYCLE_TICKS, SAGE_DEFINITIONS } from './constants';

interface Camera {
  x: number;
  y: number;
}

function getSageRobeColor(name: string): string {
  const def = SAGE_DEFINITIONS.find(d => d.name === name);
  return def?.robeColor || '#888';
}

// Draw a rishi-style sage figure
function drawSage(
  ctx: CanvasRenderingContext2D,
  sage: Sage,
  sx: number,
  sy: number,
  animFrame: number,
  isBound: boolean,
  sageIndex: number
) {
  const isWalking = sage.state === 'walking';
  const bob = Math.sin(animFrame * 0.06 + sageIndex * 1.3) * (isWalking ? 2.5 : 1.0);
  const sway = isWalking ? Math.sin(animFrame * 0.12 + sageIndex) * 1.5 : 0;

  const baseY = sy + bob;
  const baseX = sx + sway;

  // Aura glow
  const auraAlpha = isBound ? 0.25 : 0.1;
  const auraRadius = isBound ? 18 : 12;
  const auraColor = isBound ? 'rgba(212, 175, 106,' : `rgba(${hexToRgb(sage.color)},`;
  const grad = ctx.createRadialGradient(baseX, baseY - 4, 0, baseX, baseY - 4, auraRadius);
  grad.addColorStop(0, `${auraColor}${auraAlpha})`);
  grad.addColorStop(1, `${auraColor}0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(baseX, baseY - 4, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // Meditation glow
  if (sage.state === 'meditating') {
    const mAlpha = 0.15 + Math.sin(animFrame * 0.03 + sageIndex) * 0.08;
    const mGrad = ctx.createRadialGradient(baseX, baseY - 4, 0, baseX, baseY - 4, 22);
    mGrad.addColorStop(0, `rgba(255, 255, 200, ${mAlpha})`);
    mGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(baseX, baseY - 4, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Robe (triangular body)
  const robeColor = getSageRobeColor(sage.name);
  ctx.fillStyle = robeColor;
  ctx.beginPath();
  ctx.moveTo(baseX - 6, baseY + 6);
  ctx.lineTo(baseX + 6, baseY + 6);
  ctx.lineTo(baseX + 2, baseY - 4);
  ctx.lineTo(baseX - 2, baseY - 4);
  ctx.closePath();
  ctx.fill();

  // Robe outline
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#E8D0B0';
  ctx.beginPath();
  ctx.arc(baseX, baseY - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Resting zzz
  if (sage.state === 'resting') {
    ctx.font = '8px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('z', baseX + 7, baseY - 12);
    ctx.font = '6px "Outfit", sans-serif';
    ctx.fillText('z', baseX + 11, baseY - 16);
  }

  // Name label
  ctx.font = isBound ? 'bold 9px "Outfit", sans-serif' : '9px "Outfit", sans-serif';
  ctx.fillStyle = isBound ? '#D4AF6A' : 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'center';
  ctx.fillText(sage.name, baseX, baseY - 16);

  // Dialogue bubble
  if (sage.dialogue) {
    drawDialogueBubble(ctx, sage.dialogue, baseX, baseY - 28);
  }
}

function drawDialogueBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const displayText = text.length > 42 ? text.slice(0, 40) + '…' : text;
  ctx.font = '8px "Outfit", sans-serif';
  const tw = ctx.measureText(displayText).width;
  const pw = tw + 14;
  const px = x - pw / 2;
  const py = y - 14;

  ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
  ctx.beginPath();
  ctx.roundRect(px, py, pw, 16, 5);
  ctx.fill();

  // Small triangle
  ctx.beginPath();
  ctx.moveTo(x - 3, py + 16);
  ctx.lineTo(x + 3, py + 16);
  ctx.lineTo(x, py + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#E8D8C0';
  ctx.textAlign = 'center';
  ctx.fillText(displayText, x, py + 11);
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// Draw enhanced tiles
function drawTile(
  ctx: CanvasRenderingContext2D,
  type: string,
  sx: number,
  sy: number,
  animFrame: number,
  tileX: number,
  tileY: number
) {
  ctx.fillStyle = TILE_COLORS[type] || '#444';
  ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

  const seed = (tileX * 7 + tileY * 13) % 100;

  if (type === 'grass') {
    // Grass tufts and occasional flowers
    if (seed < 30) {
      ctx.fillStyle = '#5A9A50';
      ctx.fillRect(sx + 4 + (seed % 8), sy + 10, 1, 3);
      ctx.fillRect(sx + 12 + (seed % 6), sy + 8, 1, 4);
    }
    if (seed > 85) {
      // Small flower
      const fx = sx + 6 + (seed % 12);
      const fy = sy + 6 + ((seed * 3) % 10);
      ctx.fillStyle = seed % 2 === 0 ? '#E8A0A0' : '#E8D870';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'forest') {
    // Layered canopy tree
    const tcx = sx + TILE_SIZE / 2;
    const tcy = sy + TILE_SIZE / 2;
    
    // Trunk
    ctx.fillStyle = '#5A3A20';
    ctx.fillRect(tcx - 1.5, tcy + 2, 3, 6);

    // Canopy layers
    ctx.fillStyle = '#1D5530';
    ctx.beginPath();
    ctx.arc(tcx, tcy - 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2D6540';
    ctx.beginPath();
    ctx.arc(tcx - 2, tcy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tcx + 2, tcy - 1, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'hut') {
    // Detailed hut
    const hx = sx + 3;
    const hy = sy + 7;
    const hw = TILE_SIZE - 6;
    const hh = TILE_SIZE - 9;

    // Walls
    ctx.fillStyle = '#6B4B2A';
    ctx.fillRect(hx, hy, hw, hh);

    // Roof
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.moveTo(sx + 1, hy);
    ctx.lineTo(sx + TILE_SIZE / 2, sy + 1);
    ctx.lineTo(sx + TILE_SIZE - 1, hy);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#3A2510';
    ctx.fillRect(sx + TILE_SIZE / 2 - 2, hy + hh - 6, 4, 6);

    // Window
    ctx.fillStyle = '#E8D888';
    ctx.fillRect(hx + 2, hy + 2, 3, 3);
  } else if (type === 'water' || type === 'river') {
    // Animated wave lines
    const waveOffset = Math.sin(animFrame * 0.04 + tileX * 0.5 + tileY * 0.3);
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + waveOffset * 0.04})`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const wy = sy + 5 + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx, wy + Math.sin(animFrame * 0.03 + i + tileX) * 1.5);
      ctx.quadraticCurveTo(
        sx + TILE_SIZE / 2, wy + Math.sin(animFrame * 0.03 + i + tileX + 1) * 2,
        sx + TILE_SIZE, wy + Math.sin(animFrame * 0.03 + i + tileX + 2) * 1.5
      );
      ctx.stroke();
    }
  } else if (type === 'clearing') {
    // Golden glow particles
    const pAlpha = 0.08 + Math.sin(animFrame * 0.02 + seed) * 0.05;
    const grad = ctx.createRadialGradient(
      sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 0,
      sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2
    );
    grad.addColorStop(0, `rgba(255, 245, 200, ${pAlpha})`);
    grad.addColorStop(1, 'rgba(255, 245, 200, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
  } else if (type === 'sand') {
    // Sand dots
    if (seed < 40) {
      ctx.fillStyle = 'rgba(200, 180, 140, 0.4)';
      ctx.beginPath();
      ctx.arc(sx + 5 + (seed % 10), sy + 8 + (seed % 8), 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  camera: Camera,
  canvasW: number,
  canvasH: number,
  boundSageName: string,
  animFrame: number
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background water
  ctx.fillStyle = '#3A7898';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const offsetX = canvasW / 2 - camera.x * TILE_SIZE;
  const offsetY = canvasH / 2 - camera.y * TILE_SIZE;

  // Visible tile range
  const startTX = Math.max(0, Math.floor((0 - offsetX) / TILE_SIZE));
  const endTX = Math.min(world.width, Math.ceil((canvasW - offsetX) / TILE_SIZE));
  const startTY = Math.max(0, Math.floor((0 - offsetY) / TILE_SIZE));
  const endTY = Math.min(world.height, Math.ceil((canvasH - offsetY) / TILE_SIZE));

  // Draw tiles
  for (let y = startTY; y < endTY; y++) {
    for (let x = startTX; x < endTX; x++) {
      const tile = world.tiles[y][x];
      const sx = x * TILE_SIZE + offsetX;
      const sy = y * TILE_SIZE + offsetY;
      drawTile(ctx, tile.type, sx, sy, animFrame, x, y);
    }
  }

  // Draw sages (bound sage last for z-ordering)
  const sorted = [...world.sages].sort((a, b) => {
    if (a.name === boundSageName) return 1;
    if (b.name === boundSageName) return -1;
    return a.y - b.y;
  });

  for (let i = 0; i < sorted.length; i++) {
    const sage = sorted[i];
    const ssx = sage.x * TILE_SIZE + offsetX + TILE_SIZE / 2;
    const ssy = sage.y * TILE_SIZE + offsetY + TILE_SIZE / 2;
    if (ssx < -40 || ssx > canvasW + 40 || ssy < -40 || ssy > canvasH + 40) continue;
    const isBound = sage.name === boundSageName;
    drawSage(ctx, sage, ssx, ssy, animFrame, isBound, i);
  }

  // Day/night overlay
  const phase = (world.tick % DAY_CYCLE_TICKS) / DAY_CYCLE_TICKS;
  const nightIntensity = Math.sin(phase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  if (nightIntensity > 0.1) {
    ctx.fillStyle = `rgba(10, 20, 50, ${nightIntensity * 0.45})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.textAlign = 'start';
}
