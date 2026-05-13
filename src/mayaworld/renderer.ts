import { World, Sage, DroppedItem, Weather, TimeOfDay } from './types';
import { TILE_SIZE, TILE_COLORS, DAY_CYCLE_TICKS, SAGE_DEFINITIONS } from './constants';
export { renderWorldIso, renderIsoMinimap } from './iso/renderIso';
export { gridToScreen, screenToGrid, ISO_TILE_W, ISO_TILE_H } from './iso/projection';

interface Camera {
  x: number;
  y: number;
}

// === SPRITE DIRECTION ===
type Direction = 'down' | 'up' | 'left' | 'right';

function getSageDirection(sage: Sage): Direction {
  if (sage.state !== 'walking') return 'down';
  const dx = sage.targetX - sage.x;
  const dy = sage.targetY - sage.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
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

// === RICH TILE DRAWING ===
function drawTile(ctx: CanvasRenderingContext2D, type: string, sx: number, sy: number, animFrame: number, tileX: number, tileY: number, timeOfDay: TimeOfDay) {
  const T = TILE_SIZE;
  const seed = (tileX * 7 + tileY * 13) % 100;
  const seed2 = (tileX * 31 + tileY * 17) % 100;

  // Base fill
  ctx.fillStyle = TILE_COLORS[type] || '#444';
  ctx.fillRect(sx, sy, T, T);

  switch (type) {
    case 'grass': {
      // Varied grass with multiple shades
      const shades = ['#3A9038', '#45A045', '#4DAA4D', '#389035'];
      ctx.fillStyle = shades[seed % 4] + '40';
      if (seed < 40) { ctx.fillRect(sx + 2, sy + 10, 1, 3); ctx.fillRect(sx + 9, sy + 7, 1, 2); }
      if (seed > 60) { ctx.fillRect(sx + 12, sy + 5, 1, 2); ctx.fillRect(sx + 6, sy + 12, 1, 2); }
      // Tiny flowers on some grass tiles
      if (seed > 90) {
        ctx.fillStyle = '#E8E870';
        ctx.fillRect(sx + 5, sy + 3, 1, 1);
      }
      if (seed2 > 92) {
        ctx.fillStyle = '#E87090';
        ctx.fillRect(sx + 11, sy + 9, 1, 1);
      }
      break;
    }
    case 'tall_grass': {
      // Dense grass blades with sway
      const sway = Math.sin(animFrame * 0.025 + seed * 0.3) * 1;
      ctx.fillStyle = '#2A7828';
      for (let i = 0; i < 6; i++) {
        const gx = 1 + (i * 2.3) + (seed % 2);
        const gy = 3 + (i % 3);
        const gh = 4 + (i % 2) * 2;
        ctx.fillRect(sx + gx + (i % 2 === 0 ? sway : 0), sy + gy, 1, gh);
      }
      // Tips lighter
      ctx.fillStyle = '#48B04080';
      ctx.fillRect(sx + 3 + sway, sy + 2, 1, 2);
      ctx.fillRect(sx + 8, sy + 3, 1, 2);
      ctx.fillRect(sx + 12 + sway, sy + 4, 1, 2);
      break;
    }
    case 'forest': {
      // Rich tree with trunk, canopy layers, shadow
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx + 5, sy + 12, 8, 2);
      // Trunk
      ctx.fillStyle = '#4A2810';
      ctx.fillRect(sx + 7, sy + 9, 2, 5);
      // Canopy - dark layer
      ctx.fillStyle = '#0D4018';
      ctx.fillRect(sx + 3, sy + 4, 10, 6);
      // Canopy - mid layer
      ctx.fillStyle = '#185828';
      ctx.fillRect(sx + 4, sy + 3, 8, 4);
      // Canopy - highlights
      ctx.fillStyle = '#28783850';
      ctx.fillRect(sx + 5, sy + 2, 4, 2);
      ctx.fillRect(sx + 4, sy + 4, 3, 2);
      // Light dapple
      if (seed > 60) {
        ctx.fillStyle = 'rgba(120,200,80,0.15)';
        ctx.fillRect(sx + 6, sy + 3, 2, 1);
      }
      break;
    }
    case 'mountain': {
      // Layered mountain with depth
      // Far peak
      ctx.fillStyle = '#4A5258';
      ctx.fillRect(sx + 2, sy + 5, 12, 11);
      ctx.fillRect(sx + 4, sy + 2, 8, 4);
      ctx.fillRect(sx + 6, sy + 1, 4, 2);
      // Rock texture
      ctx.fillStyle = '#586068';
      ctx.fillRect(sx + 3, sy + 8, 4, 3);
      ctx.fillRect(sx + 9, sy + 6, 3, 4);
      // Snow cap
      ctx.fillStyle = '#E8E8F0';
      ctx.fillRect(sx + 6, sy + 1, 4, 1);
      ctx.fillRect(sx + 5, sy + 2, 6, 1);
      // Snow highlight
      ctx.fillStyle = '#F8F8FF';
      ctx.fillRect(sx + 7, sy, 2, 1);
      break;
    }
    case 'temple': {
      // Ornate temple structure
      // Base platform
      ctx.fillStyle = '#C8B890';
      ctx.fillRect(sx + 2, sy + 11, 12, 3);
      // Walls
      ctx.fillStyle = '#D8C8A0';
      ctx.fillRect(sx + 3, sy + 5, 10, 7);
      // Roof - layered
      ctx.fillStyle = '#C02020';
      ctx.fillRect(sx + 2, sy + 3, 12, 3);
      ctx.fillStyle = '#A01818';
      ctx.fillRect(sx + 4, sy + 2, 8, 2);
      ctx.fillStyle = '#801010';
      ctx.fillRect(sx + 5, sy + 1, 6, 1);
      // Roof tip
      ctx.fillStyle = '#FFD040';
      ctx.fillRect(sx + 7, sy, 2, 1);
      // Door
      ctx.fillStyle = '#4A3020';
      ctx.fillRect(sx + 7, sy + 10, 2, 4);
      // Window glow
      const glow = 0.3 + Math.sin(animFrame * 0.03 + seed) * 0.15;
      ctx.fillStyle = `rgba(255, 200, 80, ${glow})`;
      ctx.fillRect(sx + 4, sy + 7, 2, 2);
      ctx.fillRect(sx + 10, sy + 7, 2, 2);
      break;
    }
    case 'shrine': {
      // Small sacred structure with glow
      ctx.fillStyle = '#C8A860';
      ctx.fillRect(sx + 5, sy + 3, 6, 2);
      ctx.fillRect(sx + 4, sy + 2, 8, 1);
      ctx.fillStyle = '#D8C890';
      ctx.fillRect(sx + 6, sy + 5, 4, 7);
      // Pillar details
      ctx.fillStyle = '#B89840';
      ctx.fillRect(sx + 6, sy + 5, 1, 7);
      ctx.fillRect(sx + 9, sy + 5, 1, 7);
      // Sacred glow
      const sg = 0.12 + Math.sin(animFrame * 0.035 + seed) * 0.08;
      const grad = ctx.createRadialGradient(sx + 8, sy + 6, 0, sx + 8, sy + 6, 8);
      grad.addColorStop(0, `rgba(255, 215, 80, ${sg})`);
      grad.addColorStop(1, `rgba(255, 215, 80, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, T, T);
      break;
    }
    case 'flower': {
      // Flower field with animated blooms
      const colors = ['#E87070', '#E8D050', '#D070E8', '#70B0E8', '#E89070', '#FF90B0'];
      const sway = Math.sin(animFrame * 0.02 + seed * 0.7) * 0.5;
      // Multiple flowers
      for (let f = 0; f < 3; f++) {
        const fx = 2 + ((seed + f * 17) % 10);
        const fy = 3 + ((seed2 + f * 13) % 8);
        const c = colors[(seed + f) % colors.length];
        // Stem
        ctx.fillStyle = '#308028';
        ctx.fillRect(sx + fx, sy + fy + 2, 1, 3);
        // Petals
        ctx.fillStyle = c;
        ctx.fillRect(sx + fx - 1 + sway, sy + fy, 3, 2);
        ctx.fillRect(sx + fx + sway, sy + fy - 1, 1, 1);
      }
      break;
    }
    case 'grove': {
      // Ancient sacred trees with golden shimmer
      // Multiple dark trunks
      ctx.fillStyle = '#1A2808';
      ctx.fillRect(sx + 2, sy + 8, 2, 6);
      ctx.fillRect(sx + 10, sy + 7, 2, 7);
      // Dense canopy
      ctx.fillStyle = '#0D3818';
      ctx.fillRect(sx + 1, sy + 3, 6, 6);
      ctx.fillRect(sx + 8, sy + 2, 6, 6);
      ctx.fillRect(sx + 4, sy + 5, 6, 5);
      // Highlight leaves
      ctx.fillStyle = '#1A501A50';
      ctx.fillRect(sx + 2, sy + 3, 3, 2);
      ctx.fillRect(sx + 9, sy + 2, 3, 2);
      // Golden particle shimmer
      const shimmer1 = Math.sin(animFrame * 0.04 + seed) * 0.4 + 0.3;
      const shimmer2 = Math.sin(animFrame * 0.04 + seed + 2) * 0.4 + 0.3;
      ctx.fillStyle = `rgba(255, 220, 100, ${shimmer1})`;
      ctx.fillRect(sx + 3 + (seed % 5), sy + 4, 1, 1);
      ctx.fillStyle = `rgba(255, 220, 100, ${shimmer2})`;
      ctx.fillRect(sx + 9 + (seed % 3), sy + 3, 1, 1);
      if (seed > 60) {
        const s3 = Math.sin(animFrame * 0.05 + seed + 4) * 0.3 + 0.2;
        ctx.fillStyle = `rgba(255, 230, 120, ${s3})`;
        ctx.fillRect(sx + 6, sy + 6, 1, 1);
      }
      break;
    }
    case 'beach': {
      // Sandy with shells, foam, and texture
      ctx.fillStyle = '#D8C898';
      if (seed < 40) ctx.fillRect(sx + 3 + (seed % 7), sy + 5, 2, 1);
      if (seed > 50) ctx.fillRect(sx + 8, sy + 10, 3, 1);
      // Shells
      if (seed2 < 15) {
        ctx.fillStyle = '#F0D8C0';
        ctx.fillRect(sx + 5 + (seed % 5), sy + 7, 2, 1);
      }
      // Foam edge
      if (seed > 80) {
        const foam = Math.sin(animFrame * 0.03 + tileX) * 0.3 + 0.2;
        ctx.fillStyle = `rgba(220, 240, 255, ${foam})`;
        ctx.fillRect(sx, sy + 14, T, 2);
      }
      break;
    }
    case 'ruins': {
      // Crumbling columns and scattered stones
      ctx.fillStyle = '#585050';
      ctx.fillRect(sx + 2, sy + 3, 3, 11);
      ctx.fillRect(sx + 10, sy + 5, 3, 9);
      // Broken column top
      ctx.fillStyle = '#686060';
      ctx.fillRect(sx + 1, sy + 2, 5, 2);
      // Rubble
      ctx.fillStyle = '#504848';
      ctx.fillRect(sx + 6, sy + 12, 3, 2);
      ctx.fillRect(sx + 8, sy + 10, 2, 2);
      // Moss
      ctx.fillStyle = '#406838';
      ctx.fillRect(sx + 2, sy + 8, 2, 1);
      ctx.fillRect(sx + 11, sy + 7, 1, 2);
      // Mystery glow
      if (seed > 75) {
        const mg = Math.sin(animFrame * 0.025 + seed) * 0.1 + 0.05;
        ctx.fillStyle = `rgba(160, 140, 220, ${mg})`;
        ctx.fillRect(sx + 5, sy + 8, 4, 4);
      }
      break;
    }
    case 'lake': {
      // Deep water with reflections and ripples
      const waveOff = Math.sin(animFrame * 0.04 + tileX * 0.3 + tileY * 0.2);
      // Depth layers
      ctx.fillStyle = '#205888';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Ripples
      ctx.fillStyle = `rgba(100, 170, 230, ${0.2 + waveOff * 0.1})`;
      ctx.fillRect(sx + 2, sy + 5 + Math.floor(waveOff * 1.5), 5, 1);
      ctx.fillRect(sx + 8, sy + 10 + Math.floor(waveOff), 4, 1);
      // Light reflection
      ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + waveOff * 0.06})`;
      ctx.fillRect(sx + 4, sy + 3, 2, 1);
      break;
    }
    case 'water': {
      // Ocean water with gentle waves
      const waveOff = Math.sin(animFrame * 0.03 + tileX * 0.4 + tileY * 0.15);
      ctx.fillStyle = `rgba(60, 120, 180, ${0.1 + waveOff * 0.06})`;
      ctx.fillRect(sx + 1, sy + 4 + Math.floor(waveOff), 5, 1);
      ctx.fillRect(sx + 8, sy + 9 + Math.floor(waveOff * 0.7), 5, 1);
      // Foam
      ctx.fillStyle = `rgba(200, 230, 255, ${0.06 + waveOff * 0.04})`;
      ctx.fillRect(sx + 3, sy + 7, 3, 1);
      break;
    }
    case 'river': {
      // Flowing river with current lines
      const flow = animFrame * 0.06 + tileY * 0.4;
      const waveOff = Math.sin(flow);
      ctx.fillStyle = `rgba(80, 170, 230, ${0.15 + waveOff * 0.08})`;
      ctx.fillRect(sx + 1, sy + 3 + Math.floor(waveOff * 1.5), 6, 1);
      ctx.fillRect(sx + 6, sy + 8 + Math.floor(waveOff), 5, 1);
      // Current streaks
      const streak = ((animFrame * 2 + tileY * 10) % T);
      ctx.fillStyle = 'rgba(120, 190, 240, 0.12)';
      ctx.fillRect(sx + 3, sy + streak % T, 2, 2);
      break;
    }
    case 'bridge': {
      // Wooden plank bridge with railings
      ctx.fillStyle = '#7A5830';
      ctx.fillRect(sx, sy + 3, T, 10);
      // Planks with gaps
      ctx.fillStyle = '#8B6840';
      for (let px = 0; px < T; px += 4) {
        ctx.fillRect(sx + px, sy + 4, 3, 8);
      }
      // Railing
      ctx.fillStyle = '#604020';
      ctx.fillRect(sx, sy + 3, T, 1);
      ctx.fillRect(sx, sy + 12, T, 1);
      // Railing posts
      ctx.fillRect(sx, sy + 1, 1, 3);
      ctx.fillRect(sx + 7, sy + 1, 1, 3);
      ctx.fillRect(sx + 15, sy + 1, 1, 3);
      // Nail dots
      ctx.fillStyle = '#504020';
      ctx.fillRect(sx + 2, sy + 5, 1, 1);
      ctx.fillRect(sx + 10, sy + 5, 1, 1);
      break;
    }
    case 'cave': {
      // Dark cave entrance with depth
      ctx.fillStyle = '#302828';
      ctx.fillRect(sx + 1, sy + 2, 14, 12);
      // Entrance - deeper darkness
      ctx.fillStyle = '#180C18';
      ctx.fillRect(sx + 3, sy + 5, 10, 9);
      // Inner depth
      ctx.fillStyle = '#0C0408';
      ctx.fillRect(sx + 5, sy + 7, 6, 7);
      // Rock arch
      ctx.fillStyle = '#403838';
      ctx.fillRect(sx + 1, sy + 1, 14, 2);
      ctx.fillRect(sx + 1, sy + 2, 2, 5);
      ctx.fillRect(sx + 13, sy + 2, 2, 5);
      // Stalagmite
      ctx.fillStyle = '#282020';
      ctx.fillRect(sx + 4, sy + 11, 1, 3);
      ctx.fillRect(sx + 11, sy + 10, 1, 4);
      // Subtle inner glow
      if (seed > 70) {
        const cg = Math.sin(animFrame * 0.02 + seed) * 0.06 + 0.04;
        ctx.fillStyle = `rgba(100, 60, 140, ${cg})`;
        ctx.fillRect(sx + 6, sy + 8, 4, 4);
      }
      break;
    }
    case 'garden': {
      // Organized garden rows with plants
      // Soil rows
      ctx.fillStyle = '#5A4030';
      for (let gy = 0; gy < 3; gy++) {
        ctx.fillRect(sx + 1, sy + 2 + gy * 5, 14, 3);
      }
      // Plants in rows
      const plantColors = ['#70C050', '#50A838', '#90D068', '#60B840'];
      for (let gy = 0; gy < 3; gy++) {
        const pc = plantColors[(seed + gy) % plantColors.length];
        ctx.fillStyle = pc;
        ctx.fillRect(sx + 2 + (gy * 2), sy + 1 + gy * 5, 2, 2);
        ctx.fillRect(sx + 8 + (gy % 2), sy + 1 + gy * 5, 2, 2);
        ctx.fillRect(sx + 12, sy + 1 + gy * 5, 2, 2);
      }
      // Water drops
      if (seed > 70) {
        ctx.fillStyle = 'rgba(100, 180, 230, 0.3)';
        ctx.fillRect(sx + 5, sy + 4, 1, 1);
      }
      break;
    }
    case 'village': {
      // Village building with more detail
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(sx + 4, sy + 13, 10, 1);
      // Walls
      ctx.fillStyle = '#A09070';
      ctx.fillRect(sx + 2, sy + 6, 12, 8);
      // Roof
      ctx.fillStyle = '#785840';
      ctx.fillRect(sx + 1, sy + 4, 14, 3);
      ctx.fillRect(sx + 3, sy + 3, 10, 2);
      // Door
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(sx + 7, sy + 10, 2, 4);
      // Window
      ctx.fillStyle = '#E8D888';
      ctx.fillRect(sx + 3, sy + 8, 2, 2);
      ctx.fillRect(sx + 11, sy + 8, 2, 2);
      // Chimney smoke
      if (seed > 65) {
        const smoke = Math.sin(animFrame * 0.02 + seed) * 0.1 + 0.08;
        ctx.fillStyle = `rgba(180, 180, 190, ${smoke})`;
        ctx.fillRect(sx + 12, sy + 1 - Math.floor(Math.sin(animFrame * 0.015) * 1), 1, 2);
      }
      break;
    }
    case 'hut': {
      // Thatched hut with detail
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(sx + 4, sy + 13, 9, 1);
      // Walls
      ctx.fillStyle = '#6B4B2A';
      ctx.fillRect(sx + 3, sy + 7, 10, 7);
      // Thatch roof layers
      ctx.fillStyle = '#A05228';
      ctx.fillRect(sx + 1, sy + 5, 14, 3);
      ctx.fillStyle = '#B86030';
      ctx.fillRect(sx + 3, sy + 4, 10, 2);
      ctx.fillStyle = '#C87040';
      ctx.fillRect(sx + 5, sy + 3, 6, 1);
      // Door
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(sx + 7, sy + 11, 2, 3);
      // Window glow
      const wg = timeOfDay === 'night' || timeOfDay === 'evening' ? 0.5 : 0.2;
      ctx.fillStyle = `rgba(230, 210, 130, ${wg})`;
      ctx.fillRect(sx + 4, sy + 8, 2, 2);
      break;
    }
    case 'stone_path': {
      // Detailed stone path
      ctx.fillStyle = '#908880';
      ctx.fillRect(sx + 1, sy + 1, 5, 4);
      ctx.fillRect(sx + 7, sy + 2, 6, 5);
      ctx.fillRect(sx + 2, sy + 8, 5, 4);
      ctx.fillRect(sx + 9, sy + 9, 5, 4);
      // Gap lines
      ctx.fillStyle = '#706860';
      ctx.fillRect(sx + 6, sy + 1, 1, 5);
      ctx.fillRect(sx + 1, sy + 6, 7, 1);
      ctx.fillRect(sx + 8, sy + 8, 1, 5);
      break;
    }
    case 'clearing': {
      // Open clearing with soft golden light
      const gAlpha = 0.06 + Math.sin(animFrame * 0.02 + seed) * 0.04;
      ctx.fillStyle = `rgba(255, 245, 180, ${gAlpha})`;
      ctx.fillRect(sx, sy, T, T);
      // Small stones
      ctx.fillStyle = '#A0988880';
      if (seed < 30) ctx.fillRect(sx + 5, sy + 10, 2, 1);
      if (seed > 70) ctx.fillRect(sx + 10, sy + 6, 1, 1);
      // Grass tufts
      ctx.fillStyle = '#58A84830';
      ctx.fillRect(sx + 3, sy + 12, 1, 2);
      ctx.fillRect(sx + 12, sy + 11, 1, 2);
      break;
    }
    case 'sand': {
      // Textured sand
      if (seed < 35) { ctx.fillStyle = 'rgba(200, 180, 140, 0.35)'; ctx.fillRect(sx + 4 + (seed % 6), sy + 7, 2, 1); }
      if (seed2 > 80) { ctx.fillStyle = 'rgba(210, 195, 160, 0.25)'; ctx.fillRect(sx + 9, sy + 3, 3, 1); }
      break;
    }
    case 'stone': {
      // Rock formations
      ctx.fillStyle = '#606060';
      ctx.fillRect(sx + 3, sy + 7, 4, 3);
      ctx.fillRect(sx + 9, sy + 5, 5, 4);
      // Highlight
      ctx.fillStyle = '#78787840';
      ctx.fillRect(sx + 3, sy + 7, 2, 1);
      ctx.fillRect(sx + 10, sy + 5, 2, 1);
      break;
    }
  }

  // Subtle grid line
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(sx, sy, T, T);
}

// === SAGE PROP MAP (signature object per sage, by index) ===
const SAGE_PROPS: Array<'staff' | 'scroll' | 'bowl' | 'lotus' | 'beads' | 'flame' | 'crystal' | 'fan' | 'gourd'> = [
  'flame',   // Bhrigu (fiery)
  'fan',     // Pulastya (social wanderer)
  'lotus',   // Pulaha (gentle)
  'staff',   // Kratu (resolute mover)
  'crystal', // Angiras (luminous)
  'beads',   // Marichi (silent)
  'bowl',    // Atri (healer)
  'scroll',  // Vashistha (teacher)
  'gourd',   // Daksha (organizer)
];

// === REFINED CHARACTER SPRITES — taller silhouette, hood, signature prop ===
function drawSage(ctx: CanvasRenderingContext2D, sage: Sage, sx: number, sy: number, animFrame: number, isBound: boolean, sageIndex: number) {
  const isWalking = sage.state === 'walking';
  const isMeditating = sage.state === 'meditating';
  const isResting = sage.state === 'resting';
  const dir = getSageDirection(sage);

  const walkCycle = Math.floor(animFrame * 0.14 + sageIndex * 1.3) % 4;
  const stepBob = isWalking ? (walkCycle % 2 === 0 ? -1 : 0) : 0;
  const idleBob = !isWalking && !isResting ? Math.sin(animFrame * 0.035 + sageIndex) * 0.6 : 0;
  const bob = stepBob + idleBob;

  const bx = sx;
  const by = sy + bob;

  const robe = getSageRobeColor(sage.name);
  const robeDark = darkenColor(robe, 0.7);
  const robeLight = lightenColor(robe, 1.18);
  const accent = sage.color;

  // === Soft elliptical contact shadow ===
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(bx, by + 9, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // === Aura glow (subtle, accent color) ===
  if (isBound || isMeditating) {
    const auraAlpha = isBound ? 0.22 : 0.13;
    const auraRadius = isBound ? 16 : 13;
    const grad = ctx.createRadialGradient(bx, by - 2, 0, bx, by - 2, auraRadius);
    grad.addColorStop(0, `rgba(${hexToRgb(accent)},${auraAlpha})`);
    grad.addColorStop(1, `rgba(${hexToRgb(accent)},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by - 2, auraRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Meditation ripple
  if (isMeditating) {
    const mRing = (animFrame * 0.4 + sageIndex * 20) % 18 + 6;
    const mAlpha = Math.max(0, 0.18 - mRing * 0.008);
    ctx.strokeStyle = `rgba(${hexToRgb(accent)}, ${mAlpha})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(bx, by + 4, mRing, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isResting) {
    // Sitting pose — compact rounded form
    ctx.fillStyle = robeDark;
    ctx.beginPath();
    ctx.ellipse(bx, by + 4, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = robe;
    ctx.fillRect(bx - 4, by - 1, 8, 5);
    // Head
    ctx.fillStyle = '#E8D0B0';
    ctx.beginPath();
    ctx.arc(bx, by - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    // Hood
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(bx, by - 4, 3.2, Math.PI, 0);
    ctx.fill();
    // Zzz
    const zAlpha = Math.sin(animFrame * 0.06) * 0.25 + 0.45;
    ctx.font = 'italic 6px serif';
    ctx.fillStyle = `rgba(220, 230, 245, ${zAlpha})`;
    ctx.textAlign = 'left';
    ctx.fillText('z', bx + 5, by - 3);
    ctx.fillText('z', bx + 7, by - 6);
  } else {
    // === Standing silhouette: feet → robe → torso → head → hood → prop ===

    // Feet (small pixels)
    ctx.fillStyle = '#2A1B0E';
    if (isWalking) {
      if (dir === 'left' || dir === 'right') {
        const flipX = dir === 'left' ? -1 : 1;
        const fo = walkCycle < 2 ? 1 : -1;
        ctx.fillRect(bx - 1 + fo * flipX, by + 7, 2, 1);
      } else {
        ctx.fillRect(bx - 2, by + 7 + (walkCycle % 2 === 0 ? 0 : -1), 1, 1);
        ctx.fillRect(bx + 1, by + 7 + (walkCycle % 2 === 0 ? -1 : 0), 1, 1);
      }
    } else {
      ctx.fillRect(bx - 2, by + 7, 1, 1);
      ctx.fillRect(bx + 1, by + 7, 1, 1);
    }

    // Lower robe (trapezoid via two rects)
    ctx.fillStyle = robeDark;
    ctx.fillRect(bx - 4, by + 4, 8, 3);
    ctx.fillRect(bx - 3, by + 2, 6, 2);

    // Mid robe / torso
    ctx.fillStyle = robe;
    ctx.fillRect(bx - 3, by - 2, 6, 4);

    // Robe sash (accent stripe)
    ctx.fillStyle = accent;
    ctx.fillRect(bx - 3, by + 1, 6, 1);

    // Robe fold highlight
    ctx.fillStyle = robeLight;
    if (dir === 'down') ctx.fillRect(bx - 1, by - 1, 1, 5);
    else if (dir === 'left') ctx.fillRect(bx - 3, by - 1, 1, 5);
    else if (dir === 'right') ctx.fillRect(bx + 2, by - 1, 1, 5);

    // Arms — draped sleeves
    ctx.fillStyle = robeDark;
    const armSwing = isWalking ? Math.sin(animFrame * 0.18 + sageIndex) * 1 : 0;
    if (dir === 'left' || dir === 'right') {
      const flipX = dir === 'left' ? -1 : 1;
      ctx.fillRect(bx + 2 * flipX, by + armSwing, 1, 3);
    } else {
      ctx.fillRect(bx - 4, by + (armSwing | 0), 1, 3);
      ctx.fillRect(bx + 3, by - (armSwing | 0), 1, 3);
    }

    // Head (skin)
    ctx.fillStyle = '#E8CFA8';
    ctx.beginPath();
    ctx.arc(bx, by - 4, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Hood (dome over head, in accent color)
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(bx, by - 5, 3.2, Math.PI, 0);
    ctx.fill();
    // Hood shadow line
    ctx.fillStyle = darkenColor(accent, 0.6);
    ctx.fillRect(bx - 3, by - 5, 6, 1);

    // Eyes
    ctx.fillStyle = '#1A1208';
    if (dir === 'down') {
      ctx.fillRect(bx - 1, by - 4, 1, 1);
      ctx.fillRect(bx + 1, by - 4, 1, 1);
    } else if (dir === 'left') {
      ctx.fillRect(bx - 1, by - 4, 1, 1);
    } else if (dir === 'right') {
      ctx.fillRect(bx + 1, by - 4, 1, 1);
    }

    // Signature prop — held in hand
    drawSageProp(ctx, SAGE_PROPS[sageIndex % SAGE_PROPS.length], bx, by, dir, accent, animFrame);
  }

  // === Name label (cleaner serif, soft glow) ===
  const labelY = by - 13;
  ctx.font = isBound ? 'bold 8px "Cormorant Garamond", serif' : '7px "Cormorant Garamond", serif';
  ctx.textAlign = 'center';
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(sage.name, bx + 0.5, labelY + 0.5);
  ctx.fillStyle = isBound ? '#F0D894' : 'rgba(245, 242, 236, 0.78)';
  ctx.fillText(sage.name, bx, labelY);

  // Bound marker — small gold diamond above
  if (isBound) {
    const indicAlpha = Math.sin(animFrame * 0.05) * 0.3 + 0.65;
    ctx.fillStyle = `rgba(212, 175, 106, ${indicAlpha})`;
    ctx.beginPath();
    ctx.moveTo(bx, by - 19);
    ctx.lineTo(bx + 2, by - 17);
    ctx.lineTo(bx, by - 15);
    ctx.lineTo(bx - 2, by - 17);
    ctx.closePath();
    ctx.fill();
  }

  // === Refined dialogue bubble — rounded serif card with tail ===
  if (sage.dialogue) {
    const raw = sage.dialogue;
    const max = 36;
    const text = raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
    ctx.font = 'italic 8px "Cormorant Garamond", serif';
    const tw = ctx.measureText(text).width;
    const pw = Math.max(tw + 12, 36);
    const ph = 14;
    const px = bx - pw / 2;
    const py = by - 30;

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, px + 1, py + 1.5, pw, ph, 4);
    ctx.fill();

    // Bubble bg — off-white parchment
    ctx.fillStyle = 'rgba(245, 242, 236, 0.96)';
    roundRect(ctx, px, py, pw, ph, 4);
    ctx.fill();

    // Accent left border
    ctx.fillStyle = `rgba(${hexToRgb(accent)}, 0.85)`;
    ctx.fillRect(px, py + 2, 1.5, ph - 4);

    // Tail (triangle pointing to head)
    ctx.fillStyle = 'rgba(245, 242, 236, 0.96)';
    ctx.beginPath();
    ctx.moveTo(bx - 2.5, py + ph);
    ctx.lineTo(bx, py + ph + 3);
    ctx.lineTo(bx + 2.5, py + ph);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#1F2A2A';
    ctx.textAlign = 'center';
    ctx.fillText(text, bx, py + 9.5);
  }
}

// Draw the signature prop a sage carries — keeps each character distinct
function drawSageProp(
  ctx: CanvasRenderingContext2D,
  prop: 'staff' | 'scroll' | 'bowl' | 'lotus' | 'beads' | 'flame' | 'crystal' | 'fan' | 'gourd',
  bx: number, by: number, dir: Direction, accent: string, animFrame: number
) {
  const side = dir === 'left' ? -1 : 1;
  const handX = bx + (dir === 'down' || dir === 'up' ? -4 : 3 * side);
  const handY = by + 1;

  switch (prop) {
    case 'staff': {
      ctx.fillStyle = '#6B4A28';
      ctx.fillRect(handX, by - 6, 1, 12);
      ctx.fillStyle = accent;
      ctx.fillRect(handX - 1, by - 7, 3, 1);
      break;
    }
    case 'scroll': {
      ctx.fillStyle = '#E8D8B0';
      ctx.fillRect(handX, handY - 1, 3, 2);
      ctx.fillStyle = '#8B6B3A';
      ctx.fillRect(handX, handY - 1, 1, 2);
      ctx.fillRect(handX + 2, handY - 1, 1, 2);
      break;
    }
    case 'bowl': {
      ctx.fillStyle = '#7A5230';
      ctx.fillRect(handX - 1, handY, 4, 1);
      ctx.fillStyle = `rgba(${hexToRgb(accent)}, 0.7)`;
      ctx.fillRect(handX, handY - 1, 2, 1);
      break;
    }
    case 'lotus': {
      ctx.fillStyle = '#F0B0C8';
      ctx.fillRect(handX, handY - 1, 2, 1);
      ctx.fillStyle = '#E090B8';
      ctx.fillRect(handX, handY, 2, 1);
      ctx.fillStyle = '#FFE070';
      ctx.fillRect(handX + 0.5, handY - 0.5, 1, 1);
      break;
    }
    case 'beads': {
      ctx.fillStyle = accent;
      ctx.fillRect(handX, handY, 1, 1);
      ctx.fillRect(handX + 1, handY + 1, 1, 1);
      ctx.fillRect(handX, handY + 2, 1, 1);
      ctx.fillStyle = darkenColor(accent, 0.6);
      ctx.fillRect(handX - 1, handY + 1, 1, 1);
      break;
    }
    case 'flame': {
      const flick = (animFrame % 12) < 6 ? 0 : 1;
      ctx.fillStyle = '#FFB040';
      ctx.fillRect(handX, by - 4 - flick, 1, 2);
      ctx.fillStyle = '#FFE090';
      ctx.fillRect(handX, by - 5 - flick, 1, 1);
      ctx.fillStyle = '#7A4A20';
      ctx.fillRect(handX, by - 2, 1, 4);
      break;
    }
    case 'crystal': {
      ctx.fillStyle = `rgba(${hexToRgb(accent)}, 0.95)`;
      ctx.fillRect(handX, handY - 1, 1, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(handX, handY - 1, 1, 1);
      break;
    }
    case 'fan': {
      ctx.fillStyle = accent;
      ctx.fillRect(handX, handY - 1, 3, 1);
      ctx.fillRect(handX + 1, handY - 2, 1, 1);
      break;
    }
    case 'gourd': {
      ctx.fillStyle = '#A87838';
      ctx.fillRect(handX, handY, 2, 2);
      ctx.fillStyle = '#7A5828';
      ctx.fillRect(handX, handY - 1, 1, 1);
      break;
    }
  }
}

function lightenColor(hex: string, factor: number): string {
  const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
  return `rgb(${r},${g},${b})`;
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

function darkenColor(hex: string, factor: number): string {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

function drawDroppedItems(ctx: CanvasRenderingContext2D, items: DroppedItem[], offsetX: number, offsetY: number, animFrame: number) {
  for (const di of items) {
    const sx = di.x * TILE_SIZE + offsetX + TILE_SIZE / 2;
    const sy = di.y * TILE_SIZE + offsetY + TILE_SIZE / 2;
    const bob = Math.sin(animFrame * 0.06 + di.x + di.y) * 1.5;
    const colors: Record<string, string> = {
      fruit: '#E87050', offering: '#FFD700', artifact: '#A090D8',
      flower: '#E87090', herb: '#50A850', water: '#50A0E0',
      meal: '#C8A060', scroll: '#E8D090', stone: '#C8C0B0',
      crystal: '#80C0E8', leaf: '#60A060',
    };
    // Item shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(sx - 1, sy + 3, 3, 1);
    // Item glow
    const glowAlpha = 0.15 + Math.sin(animFrame * 0.05 + di.x * 3) * 0.1;
    ctx.fillStyle = `rgba(255, 255, 200, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    // Item dot
    ctx.fillStyle = colors[di.item.type] || '#FFF';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(sx - 0.5, sy + bob - 0.5, 1, 1);
  }
}

// Weather effects
function drawWeather(ctx: CanvasRenderingContext2D, weather: Weather, canvasW: number, canvasH: number, animFrame: number) {
  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const rx = ((i * 37 + animFrame * 2.5) % canvasW);
      const ry = ((i * 53 + animFrame * 5) % canvasH);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 1, ry + 8);
      ctx.stroke();
    }
    // Splash effects
    for (let i = 0; i < 15; i++) {
      const splashX = ((i * 97 + animFrame * 3) % canvasW);
      const splashY = ((i * 131 + animFrame * 5) % canvasH);
      const splashFrame = (animFrame + i * 7) % 20;
      if (splashFrame < 5) {
        ctx.fillStyle = `rgba(180, 210, 240, ${0.15 - splashFrame * 0.03})`;
        ctx.fillRect(splashX - 1, splashY, 2, 1);
        ctx.fillRect(splashX, splashY - 1, 1, 1);
      }
    }
    // Dim overlay
    ctx.fillStyle = 'rgba(30, 50, 80, 0.1)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (weather === 'mist') {
    ctx.fillStyle = `rgba(200, 210, 220, ${0.1 + Math.sin(animFrame * 0.008) * 0.04})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
    for (let i = 0; i < 8; i++) {
      const fx = ((i * 180 + animFrame * 0.2) % (canvasW + 300)) - 150;
      const fy = 80 + i * 70 + Math.sin(animFrame * 0.004 + i) * 40;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 100);
      g.addColorStop(0, 'rgba(200, 215, 225, 0.15)');
      g.addColorStop(1, 'rgba(200, 215, 225, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(fx - 100, fy - 100, 200, 200);
    }
  } else if (weather === 'wind') {
    ctx.strokeStyle = 'rgba(200, 220, 230, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const wy = ((i * 50 + animFrame * 0.4) % canvasH);
      const wx = ((animFrame * 4 + i * 80) % (canvasW + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 15, wy - 2, wx + 35 + Math.sin(i) * 10, wy + 1);
      ctx.stroke();
    }
    // Leaf particles
    for (let i = 0; i < 5; i++) {
      const lx = ((animFrame * 3 + i * 200) % (canvasW + 100)) - 50;
      const ly = 100 + i * 80 + Math.sin(animFrame * 0.03 + i * 2) * 30;
      ctx.fillStyle = `rgba(100, 160, 80, ${0.2 + Math.sin(animFrame * 0.04 + i) * 0.1})`;
      ctx.fillRect(lx, ly, 2, 1);
    }
  }
}

// === MINIMAP ===
function drawMinimap(ctx: CanvasRenderingContext2D, world: World, boundSageName: string, canvasW: number, canvasH: number) {
  const mmSize = 100;
  const mmX = canvasW - mmSize - 12;
  const mmY = canvasH - mmSize - 12;
  const scale = mmSize / Math.max(world.width, world.height);

  // Background
  ctx.fillStyle = 'rgba(5, 10, 15, 0.75)';
  roundRect(ctx, mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 106, 0.2)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 3);
  ctx.stroke();

  // Simplified terrain
  const step = 2;
  for (let y = 0; y < world.height; y += step) {
    for (let x = 0; x < world.width; x += step) {
      const tile = world.tiles[y][x];
      const miniColors: Record<string, string> = {
        water: '#1A3858', lake: '#205080', river: '#2870A0',
        sand: '#C8B888', beach: '#C8B888', grass: '#3A8838',
        tall_grass: '#2A6828', forest: '#145020', grove: '#0D3818',
        mountain: '#505858', stone: '#686868', temple: '#A02020',
        shrine: '#B89840', hut: '#6B4B2A', village: '#907858',
        cave: '#282028', ruins: '#585050', flower: '#48A038',
        garden: '#50A040', clearing: '#68B858', bridge: '#7A5830',
        stone_path: '#888078',
      };
      ctx.fillStyle = miniColors[tile.type] || '#333';
      ctx.fillRect(mmX + x * scale, mmY + y * scale, Math.max(1, step * scale), Math.max(1, step * scale));
    }
  }

  // Sages as dots
  for (const sage of world.sages) {
    const isBound = sage.name === boundSageName;
    ctx.fillStyle = isBound ? '#FFD700' : sage.color;
    const dotSize = isBound ? 3 : 2;
    ctx.fillRect(mmX + sage.x * scale - dotSize / 2, mmY + sage.y * scale - dotSize / 2, dotSize, dotSize);
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

  // Sky color based on time of day
  const phase = world.dayPhase;
  let skyColor = '#1A2840';
  if (phase > 0.15 && phase < 0.55) skyColor = '#182838'; // day
  else if (phase > 0.55 && phase < 0.75) skyColor = '#1A2030'; // evening
  else skyColor = '#0A1020'; // night

  ctx.fillStyle = skyColor;
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
      drawTile(ctx, tile.type, sx, sy, animFrame, x, y, world.timeOfDay);
    }
  }

  // Dropped items
  drawDroppedItems(ctx, world.droppedItems, offsetX, offsetY, animFrame);

  // Draw sages (bound last for z-ordering)
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
    drawSage(ctx, sage, ssx, ssy, animFrame, sage.name === boundSageName, i);
  }

  // Day/night overlay
  let nightAlpha = 0;
  if (phase > 0.75) nightAlpha = (phase - 0.75) / 0.25 * 0.4;
  else if (phase < 0.15) nightAlpha = (1 - phase / 0.15) * 0.4;
  else if (phase > 0.55 && phase <= 0.75) nightAlpha = (phase - 0.55) / 0.2 * 0.18;

  if (nightAlpha > 0.01) {
    ctx.fillStyle = `rgba(5, 8, 30, ${nightAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Stars at night
    if (nightAlpha > 0.2) {
      for (let s = 0; s < 30; s++) {
        const starX = (s * 137 + 50) % canvasW;
        const starY = (s * 89 + 30) % (canvasH * 0.4);
        const twinkle = Math.sin(animFrame * 0.05 + s * 0.7) * 0.3 + 0.4;
        ctx.fillStyle = `rgba(255, 255, 240, ${twinkle * (nightAlpha / 0.4)})`;
        ctx.fillRect(starX, starY, 1, 1);
      }
    }
  }

  // Morning golden tint
  if (phase > 0.12 && phase < 0.22) {
    const morningAlpha = (1 - Math.abs(phase - 0.17) / 0.05) * 0.08;
    ctx.fillStyle = `rgba(255, 200, 100, ${morningAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Evening warm tint
  if (phase > 0.55 && phase < 0.65) {
    const eveningAlpha = (1 - Math.abs(phase - 0.6) / 0.05) * 0.1;
    ctx.fillStyle = `rgba(255, 130, 50, ${eveningAlpha})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Weather
  drawWeather(ctx, world.weather, canvasW, canvasH, animFrame);

  // Minimap
  drawMinimap(ctx, world, boundSageName, canvasW, canvasH);

  ctx.textAlign = 'start';
}