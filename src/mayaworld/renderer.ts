import { World } from './types';
import { TILE_SIZE, TILE_COLORS, DAY_CYCLE_TICKS } from './constants';

interface Camera {
  x: number;
  y: number;
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

  // Draw tiles
  const startTX = Math.max(0, Math.floor((0 - offsetX) / TILE_SIZE));
  const endTX = Math.min(world.width, Math.ceil((canvasW - offsetX) / TILE_SIZE));
  const startTY = Math.max(0, Math.floor((0 - offsetY) / TILE_SIZE));
  const endTY = Math.min(world.height, Math.ceil((canvasH - offsetY) / TILE_SIZE));

  for (let y = startTY; y < endTY; y++) {
    for (let x = startTX; x < endTX; x++) {
      const tile = world.tiles[y][x];
      const sx = x * TILE_SIZE + offsetX;
      const sy = y * TILE_SIZE + offsetY;

      ctx.fillStyle = TILE_COLORS[tile.type] || '#444';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      // Tile detail
      if (tile.type === 'forest') {
        ctx.fillStyle = '#1D5530';
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5A3A20';
        ctx.fillRect(sx + TILE_SIZE / 2 - 1, sy + TILE_SIZE / 2 + 3, 3, 5);
      } else if (tile.type === 'hut') {
        ctx.fillStyle = '#6B4B2A';
        ctx.fillRect(sx + 3, sy + 6, TILE_SIZE - 6, TILE_SIZE - 8);
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 6);
        ctx.lineTo(sx + TILE_SIZE / 2, sy + 1);
        ctx.lineTo(sx + TILE_SIZE - 2, sy + 6);
        ctx.fill();
      } else if (tile.type === 'water' || tile.type === 'river') {
        // Water shimmer
        const shimmer = Math.sin(animFrame * 0.05 + x * 0.5 + y * 0.3) * 8;
        ctx.fillStyle = `rgba(255,255,255,${0.05 + shimmer * 0.005})`;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      } else if (tile.type === 'clearing') {
        ctx.fillStyle = 'rgba(255,255,200,0.15)';
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw sages
  for (const sage of world.sages) {
    const sx = sage.x * TILE_SIZE + offsetX + TILE_SIZE / 2;
    const sy = sage.y * TILE_SIZE + offsetY + TILE_SIZE / 2;

    // Off screen? Skip
    if (sx < -30 || sx > canvasW + 30 || sy < -30 || sy > canvasH + 30) continue;

    const bob = Math.sin(animFrame * 0.06 + world.sages.indexOf(sage)) * 1.5;
    const isBound = sage.name === boundSageName;

    // Glow for bound sage
    if (isBound) {
      ctx.save();
      ctx.shadowColor = '#D4AF6A';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy + bob, 8, 0, Math.PI * 2);
      ctx.fillStyle = sage.color;
      ctx.fill();
      ctx.restore();
    }

    // Body
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 7, 0, Math.PI * 2);
    ctx.fillStyle = sage.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // State indicator
    if (sage.state === 'meditating') {
      ctx.fillStyle = 'rgba(255,255,200,0.3)';
      ctx.beginPath();
      ctx.arc(sx, sy + bob, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (sage.state === 'resting') {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('z', sx + 8, sy + bob - 6);
    }

    // Name
    ctx.font = '9px "Outfit", sans-serif';
    ctx.fillStyle = isBound ? '#D4AF6A' : 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(sage.name, sx, sy + bob - 14);

    // Dialogue bubble
    if (sage.dialogue) {
      const dw = Math.min(ctx.measureText(sage.dialogue).width + 12, 160);
      const dx = sx - dw / 2;
      const dy = sy + bob - 34;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect(dx, dy - 12, dw, 16, 4);
      ctx.fill();
      ctx.font = '8px "Outfit", sans-serif';
      ctx.fillStyle = '#E8D8C0';
      ctx.textAlign = 'center';
      ctx.fillText(sage.dialogue.slice(0, 40) + (sage.dialogue.length > 40 ? '…' : ''), sx, dy);
    }
  }

  // Day/night overlay
  const phase = (world.tick % DAY_CYCLE_TICKS) / DAY_CYCLE_TICKS;
  const nightIntensity = Math.sin(phase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  if (nightIntensity > 0.1) {
    ctx.fillStyle = `rgba(10, 20, 50, ${nightIntensity * 0.45})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.textAlign = 'start'; // reset
}
