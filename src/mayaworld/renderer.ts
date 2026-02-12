import { World, Sage, DroppedItem } from './types';
import { TILE_SIZE, TILE_COLORS, DAY_CYCLE_TICKS, SAGE_DEFINITIONS } from './constants';

interface Camera {
  x: number;
  y: number;
}

function getSageRobeColor(name: string): string {
  const def = SAGE_DEFINITIONS.find(d => d.name === name);
  return def?.robeColor || '#888';
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// 16x16 pixel-art tile drawing
function drawTile(
  ctx: CanvasRenderingContext2D,
  type: string,
  sx: number,
  sy: number,
  animFrame: number,
  tileX: number,
  tileY: number
) {
  const T = TILE_SIZE;
  ctx.fillStyle = TILE_COLORS[type] || '#444';
  ctx.fillRect(sx, sy, T, T);

  const seed = (tileX * 7 + tileY * 13) % 100;

  switch (type) {
    case 'grass': {
      // Pixel grass tufts
      ctx.fillStyle = '#48904038';
      if (seed < 40) {
        ctx.fillRect(sx + 3, sy + 10, 1, 2);
        ctx.fillRect(sx + 9, sy + 7, 1, 2);
      }
      if (seed > 80) {
        ctx.fillRect(sx + 12, sy + 11, 1, 2);
      }
      break;
    }
    case 'forest': {
      // Pixel tree: trunk + canopy
      ctx.fillStyle = '#4A2810';
      ctx.fillRect(sx + 7, sy + 10, 2, 4);
      ctx.fillStyle = '#105020';
      ctx.fillRect(sx + 4, sy + 3, 8, 4);
      ctx.fillRect(sx + 5, sy + 2, 6, 2);
      ctx.fillRect(sx + 3, sy + 7, 10, 3);
      // Highlight
      ctx.fillStyle = '#18682840';
      ctx.fillRect(sx + 5, sy + 3, 3, 2);
      break;
    }
    case 'mountain': {
      // Pixel mountain peak
      ctx.fillStyle = '#606868';
      ctx.fillRect(sx + 3, sy + 6, 10, 10);
      ctx.fillRect(sx + 5, sy + 3, 6, 3);
      ctx.fillRect(sx + 7, sy + 1, 2, 2);
      // Snow cap
      ctx.fillStyle = '#E8E8F0';
      ctx.fillRect(sx + 6, sy + 1, 4, 2);
      ctx.fillRect(sx + 7, sy + 0, 2, 1);
      break;
    }
    case 'temple': {
      // Pixel shrine
      ctx.fillStyle = '#C83030';
      ctx.fillRect(sx + 3, sy + 2, 10, 3); // roof
      ctx.fillRect(sx + 5, sy + 1, 6, 1);
      ctx.fillStyle = '#D8C8A0';
      ctx.fillRect(sx + 4, sy + 5, 8, 9); // walls
      ctx.fillStyle = '#6B4B2A';
      ctx.fillRect(sx + 7, sy + 10, 2, 4); // door
      // Window
      ctx.fillStyle = '#F0E070';
      ctx.fillRect(sx + 5, sy + 7, 2, 2);
      break;
    }
    case 'flower': {
      // Green base with colored pixel flowers
      const colors = ['#E87070', '#E8D050', '#D070E8', '#70B0E8'];
      const c = colors[seed % colors.length];
      ctx.fillStyle = c;
      ctx.fillRect(sx + 3 + (seed % 5), sy + 4, 2, 2);
      ctx.fillRect(sx + 9 + (seed % 3), sy + 8, 2, 2);
      if (seed > 50) ctx.fillRect(sx + 6, sy + 12, 2, 2);
      // Stems
      ctx.fillStyle = '#30802840';
      ctx.fillRect(sx + 4 + (seed % 5), sy + 6, 1, 3);
      ctx.fillRect(sx + 10 + (seed % 3), sy + 10, 1, 3);
      break;
    }
    case 'grove': {
      // Dark dense trees with golden shimmer
      ctx.fillStyle = '#0D3818';
      ctx.fillRect(sx + 2, sy + 4, 5, 8);
      ctx.fillRect(sx + 9, sy + 3, 5, 9);
      ctx.fillRect(sx + 5, sy + 6, 5, 6);
      // Golden particles
      const shimmer = Math.sin(animFrame * 0.04 + seed) * 0.3 + 0.3;
      ctx.fillStyle = `rgba(255, 220, 100, ${shimmer})`;
      ctx.fillRect(sx + 4 + (seed % 6), sy + 3 + (seed % 5), 1, 1);
      ctx.fillRect(sx + 8 + (seed % 4), sy + 7, 1, 1);
      break;
    }
    case 'beach': {
      // Sandy with shell dots
      if (seed < 30) {
        ctx.fillStyle = '#C0B08080';
        ctx.fillRect(sx + 4 + (seed % 8), sy + 6, 2, 1);
      }
      if (seed > 70) {
        ctx.fillStyle = '#F0E8D0';
        ctx.fillRect(sx + 8, sy + 10, 1, 1);
      }
      break;
    }
    case 'ruins': {
      // Broken columns
      ctx.fillStyle = '#686060';
      ctx.fillRect(sx + 3, sy + 4, 3, 10);
      ctx.fillRect(sx + 10, sy + 6, 3, 8);
      ctx.fillStyle = '#585050';
      ctx.fillRect(sx + 3, sy + 3, 4, 2); // top
      // Rubble
      ctx.fillStyle = '#787070';
      ctx.fillRect(sx + 7, sy + 12, 2, 2);
      break;
    }
    case 'lake': {
      // Animated wave pixels
      const waveOff = Math.sin(animFrame * 0.05 + tileX * 0.3 + tileY * 0.2);
      ctx.fillStyle = `rgba(100, 160, 220, ${0.2 + waveOff * 0.1})`;
      const wy = Math.floor(waveOff * 2);
      ctx.fillRect(sx + 2, sy + 6 + wy, 4, 1);
      ctx.fillRect(sx + 8, sy + 10 + wy, 5, 1);
      break;
    }
    case 'water': {
      const waveOff = Math.sin(animFrame * 0.04 + tileX * 0.5);
      ctx.fillStyle = `rgba(80, 140, 200, ${0.1 + waveOff * 0.06})`;
      ctx.fillRect(sx + 2, sy + 5 + Math.floor(waveOff), 5, 1);
      ctx.fillRect(sx + 9, sy + 10, 4, 1);
      break;
    }
    case 'river': {
      const waveOff = Math.sin(animFrame * 0.06 + tileX * 0.4 + tileY * 0.3);
      ctx.fillStyle = `rgba(100, 170, 230, ${0.15 + waveOff * 0.08})`;
      ctx.fillRect(sx + 1, sy + 4 + Math.floor(waveOff * 1.5), 6, 1);
      ctx.fillRect(sx + 7, sy + 9 + Math.floor(waveOff), 5, 1);
      break;
    }
    case 'hut': {
      // Pixel hut
      ctx.fillStyle = '#6B4B2A';
      ctx.fillRect(sx + 2, sy + 7, 12, 7);
      // Roof
      ctx.fillStyle = '#A05228';
      ctx.fillRect(sx + 1, sy + 5, 14, 3);
      ctx.fillRect(sx + 3, sy + 4, 10, 1);
      // Door
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(sx + 7, sy + 11, 2, 3);
      // Window
      ctx.fillStyle = '#E8D888';
      ctx.fillRect(sx + 3, sy + 8, 2, 2);
      break;
    }
    case 'clearing': {
      // Soft golden glow
      const gAlpha = 0.06 + Math.sin(animFrame * 0.025 + seed) * 0.04;
      ctx.fillStyle = `rgba(255, 245, 180, ${gAlpha})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }
    case 'sand': {
      if (seed < 35) {
        ctx.fillStyle = 'rgba(200, 180, 140, 0.3)';
        ctx.fillRect(sx + 5 + (seed % 6), sy + 7, 1, 1);
      }
      break;
    }
    case 'stone': {
      ctx.fillStyle = '#78707040';
      ctx.fillRect(sx + 3, sy + 8, 3, 2);
      ctx.fillRect(sx + 9, sy + 5, 4, 3);
      break;
    }
  }

  // Tile border (subtle grid)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(sx, sy, T, T);
}

// Draw sage in 16px style
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
  const bob = Math.sin(animFrame * 0.08 + sageIndex * 1.3) * (isWalking ? 1.5 : 0.5);

  const baseX = sx;
  const baseY = sy + bob;

  // Aura glow (smaller for 16px)
  const auraAlpha = isBound ? 0.2 : 0.08;
  const auraRadius = isBound ? 10 : 7;
  const grad = ctx.createRadialGradient(baseX, baseY - 1, 0, baseX, baseY - 1, auraRadius);
  grad.addColorStop(0, `rgba(${hexToRgb(sage.color)},${auraAlpha})`);
  grad.addColorStop(1, `rgba(${hexToRgb(sage.color)},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(baseX, baseY - 1, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // Meditation glow
  if (sage.state === 'meditating') {
    const mAlpha = 0.1 + Math.sin(animFrame * 0.04 + sageIndex) * 0.06;
    ctx.fillStyle = `rgba(255, 255, 200, ${mAlpha})`;
    ctx.beginPath();
    ctx.arc(baseX, baseY - 1, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Robe body (small triangle)
  const robeColor = getSageRobeColor(sage.name);
  ctx.fillStyle = robeColor;
  ctx.fillRect(baseX - 3, baseY - 1, 6, 5);

  // Head
  ctx.fillStyle = '#E8D0B0';
  ctx.beginPath();
  ctx.arc(baseX, baseY - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Resting zzz
  if (sage.state === 'resting') {
    ctx.font = '6px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('z', baseX + 4, baseY - 5);
  }

  // Name label
  ctx.font = isBound ? 'bold 7px monospace' : '7px monospace';
  ctx.fillStyle = isBound ? '#D4AF6A' : 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(sage.name, baseX, baseY - 8);

  // Dialogue bubble
  if (sage.dialogue) {
    const text = sage.dialogue.length > 30 ? sage.dialogue.slice(0, 28) + '…' : sage.dialogue;
    ctx.font = '6px monospace';
    const tw = ctx.measureText(text).width;
    const pw = tw + 8;
    const px = baseX - pw / 2;
    const py = baseY - 20;

    ctx.fillStyle = 'rgba(10, 20, 30, 0.75)';
    ctx.fillRect(px, py, pw, 10);
    ctx.fillStyle = '#E8D8C0';
    ctx.textAlign = 'center';
    ctx.fillText(text, baseX, py + 7);
  }
}

// Draw dropped items
function drawDroppedItems(
  ctx: CanvasRenderingContext2D,
  items: DroppedItem[],
  offsetX: number,
  offsetY: number,
  animFrame: number
) {
  for (const di of items) {
    const sx = di.x * TILE_SIZE + offsetX + TILE_SIZE / 2;
    const sy = di.y * TILE_SIZE + offsetY + TILE_SIZE / 2;
    const bob = Math.sin(animFrame * 0.06 + di.x + di.y) * 1;

    // Small colored dot
    const colors: Record<string, string> = {
      fruit: '#E87050', offering: '#FFD700', artifact: '#A090D8',
      flower: '#E87090', herb: '#50A850', water: '#50A0E0',
      meal: '#C8A060', scroll: '#E8D090',
    };
    ctx.fillStyle = colors[di.item.type] || '#FFF';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 2, 0, Math.PI * 2);
    ctx.fill();
    // Sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(sx - 0.5, sy + bob - 0.5, 1, 1);
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

  // Deep water background
  ctx.fillStyle = '#283858';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const offsetX = canvasW / 2 - camera.x * TILE_SIZE;
  const offsetY = canvasH / 2 - camera.y * TILE_SIZE;

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

  // Draw dropped items
  drawDroppedItems(ctx, world.droppedItems, offsetX, offsetY, animFrame);

  // Draw sages (bound sage last)
  const sorted = [...world.sages].sort((a, b) => {
    if (a.name === boundSageName) return 1;
    if (b.name === boundSageName) return -1;
    return a.y - b.y;
  });

  for (let i = 0; i < sorted.length; i++) {
    const sage = sorted[i];
    const ssx = sage.x * TILE_SIZE + offsetX + TILE_SIZE / 2;
    const ssy = sage.y * TILE_SIZE + offsetY + TILE_SIZE / 2;
    if (ssx < -30 || ssx > canvasW + 30 || ssy < -30 || ssy > canvasH + 30) continue;
    const isBound = sage.name === boundSageName;
    drawSage(ctx, sage, ssx, ssy, animFrame, isBound, i);
  }

  // Day/night overlay
  const phase = (world.tick % DAY_CYCLE_TICKS) / DAY_CYCLE_TICKS;
  const nightIntensity = Math.sin(phase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  if (nightIntensity > 0.1) {
    ctx.fillStyle = `rgba(10, 20, 50, ${nightIntensity * 0.4})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.textAlign = 'start';
}
