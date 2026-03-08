import { Tile, TileType, World, Sage } from './types';
import { MAP_WIDTH, MAP_HEIGHT, SAGE_DEFINITIONS, WEATHER_CHANGE_MIN, WEATHER_CHANGE_MAX } from './constants';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function fractalNoise(x: number, y: number, seed: number, octaves: number = 4): number {
  let val = 0, amp = 1, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise2D(x * freq * 0.12, y * freq * 0.12, seed + i * 100) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return val / total;
}

// Smooth noise for biome blending
function smoothNoise(x: number, y: number, seed: number, scale: number = 0.08): number {
  return fractalNoise(x * scale, y * scale, seed, 3);
}

function generateTerrain(seed: number): Tile[][] {
  const tiles: Tile[][] = [];
  const cx = MAP_WIDTH / 2;
  const cy = MAP_HEIGHT / 2;
  const maxR = Math.min(cx, cy) - 2;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const d = distance(x, y, cx, cy);
      const edgeNoise = noise2D(x * 0.18, y * 0.18, seed) * 5;
      const islandEdge = maxR - 1.5 + edgeNoise;

      let type: TileType = 'water';
      if (d < islandEdge) {
        const nY = y / MAP_HEIGHT;
        const nX = x / MAP_WIDTH;
        const n1 = fractalNoise(x, y, seed + 100);
        const n2 = fractalNoise(x, y, seed + 200);
        const n3 = noise2D(x * 0.35, y * 0.35, seed + 300);
        const n4 = smoothNoise(x, y, seed + 400);
        const elevation = fractalNoise(x, y, seed + 500);

        // Beach ring (outer edge)
        if (d > islandEdge - 3.5) {
          type = n3 > 0.55 ? 'sand' : 'beach';
        }
        // === MOUNTAIN OF VOWS (top, 0-15%) ===
        else if (nY < 0.15) {
          if (elevation > 0.52) type = 'mountain';
          else if (elevation > 0.4) type = 'stone';
          else if (n1 > 0.5) type = 'grass';
          else type = 'tall_grass';
        }
        // === VASHISTHA RIDGE + FOREST OF SILENCE (15-30%) ===
        else if (nY < 0.3) {
          if (nY < 0.2 && elevation > 0.5) type = 'mountain';
          else if (n1 > 0.5) type = 'forest';
          else if (n1 > 0.38) type = 'tall_grass';
          else if (n4 > 0.55) type = 'grove';
          else type = 'grass';
        }
        // === DAKSHA PLAINS (30-42%) ===
        else if (nY < 0.42) {
          if (n1 > 0.65) type = 'tall_grass';
          else if (n1 > 0.5) type = 'flower';
          else if (n4 > 0.6) type = 'clearing';
          else type = 'grass';
          // Central stone path
          if (Math.abs(nX - 0.5) < 0.02 && n3 > 0.25) type = 'stone_path';
        }
        // === SAGE VILLAGE + RIVER OF MEMORY (42-58%) ===
        else if (nY < 0.58) {
          // Lake area (left)
          if (nX < 0.38) {
            const lakeDist = distance(x, y, cx - 12, cy + 1);
            if (lakeDist < 7 + n2 * 2.5) type = 'lake';
            else if (lakeDist < 9) {
              type = n3 > 0.5 ? 'sand' : 'grass';
            } else {
              type = n1 > 0.5 ? 'tall_grass' : 'grass';
            }
          }
          // Village cluster (center-right)
          else if (nX > 0.5 && nX < 0.75) {
            if (n3 > 0.62) type = 'village';
            else if (n3 > 0.5) type = 'hut';
            else if (n3 > 0.4) type = 'stone_path';
            else type = 'grass';
          }
          // Open plains between
          else {
            if (n1 > 0.6) type = 'flower';
            else if (n1 > 0.45) type = 'tall_grass';
            else type = 'grass';
          }
        }
        // === GARDEN OF ATRI (58-70%) ===
        else if (nY < 0.7) {
          if (nX > 0.28 && nX < 0.62 && n1 > 0.32) type = 'garden';
          else if (n1 > 0.58) type = 'grove';
          else if (n1 > 0.42) type = 'flower';
          else if (n4 > 0.55) type = 'clearing';
          else type = 'grass';
        }
        // === SOUTHERN GROVES & CLEARINGS (70-85%) ===
        else if (nY < 0.85) {
          if (n1 > 0.62) type = 'grove';
          else if (n1 > 0.48) type = 'flower';
          else if (n1 > 0.38) type = 'forest';
          else if (n4 > 0.55) type = 'clearing';
          else type = 'grass';
        }
        // === BEACH RUINS (85-100%) ===
        else {
          if (n1 > 0.6) type = 'sand';
          else if (n1 > 0.45) type = 'beach';
          else type = 'grass';
        }
      }
      tiles[y][x] = { type, x, y };
    }
  }

  // === RIVER OF MEMORY (winding, wider) ===
  let rx = cx + Math.floor((noise2D(0, 0, seed + 600) - 0.5) * 8);
  for (let ry = 3; ry < MAP_HEIGHT - 3; ry++) {
    const riverWidth = 2 + Math.floor(noise2D(rx, ry, seed + 650) * 1.5);
    for (let rw = 0; rw < riverWidth; rw++) {
      const rrx = rx + rw;
      if (rrx >= 0 && rrx < MAP_WIDTH && tiles[ry][rrx].type !== 'water' && tiles[ry][rrx].type !== 'lake') {
        tiles[ry][rrx].type = 'river';
      }
    }
    rx += Math.floor((noise2D(rx, ry, seed + 700) - 0.42) * 2.2);
    rx = Math.max(6, Math.min(MAP_WIDTH - 7, rx));
  }

  // === BRIDGES over river ===
  for (let i = 0; i < 4; i++) {
    const by = 12 + i * 16 + Math.floor(noise2D(i, 0, seed + 750) * 6);
    for (let bx = 3; bx < MAP_WIDTH - 3; bx++) {
      if (tiles[by]?.[bx]?.type === 'river') {
        tiles[by][bx].type = 'bridge';
      }
    }
  }

  // === TEMPLE (top-center, larger) ===
  const templeX = cx - 3 + Math.floor(noise2D(5, 5, seed + 800) * 5);
  const templeY = 5 + Math.floor(noise2D(6, 6, seed + 800) * 3);
  placeStructure(tiles, templeX, templeY, 5, 4, 'temple');
  // Temple clearing around it
  for (let dy = -1; dy <= 4; dy++) {
    for (let dx = -1; dx <= 5; dx++) {
      const ty = templeY + dy, tx = templeX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        if (tiles[ty][tx].type === 'mountain' || tiles[ty][tx].type === 'stone') {
          tiles[ty][tx].type = 'stone_path';
        }
      }
    }
  }

  // === SHRINES (4 scattered) ===
  const shrinePositions = [
    { x: 14, y: 24 }, { x: cx + 14, y: cy - 6 }, { x: cx - 10, y: cy + 16 }, { x: cx + 8, y: cy + 22 }
  ];
  for (const sp of shrinePositions) {
    const sx = sp.x + Math.floor(noise2D(sp.x, sp.y, seed + 900) * 4);
    const sy = sp.y + Math.floor(noise2D(sp.y, sp.x, seed + 900) * 3);
    placeStructure(tiles, sx, sy, 2, 2, 'shrine');
    // Small clearing around shrine
    for (let dy = -1; dy <= 2; dy++) {
      for (let dx = -1; dx <= 2; dx++) {
        const ty = sy + dy, tx = sx + dx;
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH &&
          tiles[ty][tx].type !== 'shrine' && tiles[ty][tx].type !== 'water') {
          if (noise2D(tx, ty, seed + 950) > 0.4) tiles[ty][tx].type = 'clearing';
        }
      }
    }
  }

  // === CAVE OF MARICHI (right side) ===
  const caveX = MAP_WIDTH - 14 + Math.floor(noise2D(7, 7, seed + 1000) * 4);
  const caveY = cy - 4 + Math.floor(noise2D(8, 8, seed + 1000) * 5);
  placeStructure(tiles, caveX, caveY, 4, 3, 'cave');
  // Stone around cave
  for (let dy = -1; dy <= 3; dy++) {
    for (let dx = -1; dx <= 4; dx++) {
      const ty = caveY + dy, tx = caveX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH &&
        tiles[ty][tx].type !== 'cave' && tiles[ty][tx].type !== 'water') {
        if (noise2D(tx, ty, seed + 1050) > 0.5) tiles[ty][tx].type = 'stone';
      }
    }
  }

  // === RUINS (bottom-right, larger) ===
  const ruinsX = cx + 12 + Math.floor(noise2D(3, 3, seed + 1100) * 5);
  const ruinsY = MAP_HEIGHT - 13 + Math.floor(noise2D(4, 4, seed + 1100) * 3);
  placeStructure(tiles, ruinsX, ruinsY, 5, 4, 'ruins');

  // === HUT CLUSTERS (Sage Village, more structured) ===
  const hutX = cx + 4;
  const hutY = cy - 3;
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 8; dx++) {
      const ty = hutY + dy, tx = hutX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        const curType = tiles[ty][tx].type;
        if (curType === 'grass' || curType === 'tall_grass' || curType === 'flower') {
          if ((dx + dy) % 4 === 0 && dx % 2 === 0) tiles[ty][tx].type = 'hut';
          else if ((dx + dy) % 4 === 2) tiles[ty][tx].type = 'stone_path';
          else if ((dx + dy) % 5 === 0) tiles[ty][tx].type = 'village';
          else tiles[ty][tx].type = 'grass';
        }
      }
    }
  }

  // === CLEARINGS (meditation spots, more) ===
  for (let i = 0; i < 7; i++) {
    const clX = Math.floor(noise2D(i, 0, seed + 1200) * (MAP_WIDTH - 16)) + 8;
    const clY = Math.floor(noise2D(0, i, seed + 1200) * (MAP_HEIGHT - 16)) + 8;
    placeStructure(tiles, clX, clY, 3, 3, 'clearing');
  }

  // === STONE PATHS connecting areas ===
  // Village to temple
  let pathX = hutX + 4;
  for (let py = hutY; py > templeY + 4; py--) {
    if (tiles[py]?.[pathX] && (tiles[py][pathX].type === 'grass' || tiles[py][pathX].type === 'tall_grass' || tiles[py][pathX].type === 'flower')) {
      tiles[py][pathX].type = 'stone_path';
    }
    pathX += Math.floor((noise2D(pathX, py, seed + 1300) - 0.5) * 1.3);
    pathX = Math.max(6, Math.min(MAP_WIDTH - 6, pathX));
  }

  // Village to garden
  let pathX2 = hutX + 2;
  for (let py = hutY + 7; py < cy + 15; py++) {
    if (tiles[py]?.[pathX2] && (tiles[py][pathX2].type === 'grass' || tiles[py][pathX2].type === 'tall_grass' || tiles[py][pathX2].type === 'flower')) {
      tiles[py][pathX2].type = 'stone_path';
    }
    pathX2 += Math.floor((noise2D(pathX2, py, seed + 1350) - 0.5) * 1.2);
    pathX2 = Math.max(6, Math.min(MAP_WIDTH - 6, pathX2));
  }

  // === SECONDARY FOREST PATCHES ===
  for (let i = 0; i < 3; i++) {
    const fx = 10 + Math.floor(noise2D(i * 3, 0, seed + 1400) * (MAP_WIDTH - 20));
    const fy = 20 + Math.floor(noise2D(0, i * 3, seed + 1400) * (MAP_HEIGHT - 40));
    const size = 3 + Math.floor(noise2D(i, i, seed + 1450) * 3);
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const ty = fy + dy, tx = fx + dx;
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
          if (tiles[ty][tx].type === 'grass' || tiles[ty][tx].type === 'tall_grass') {
            tiles[ty][tx].type = 'forest';
          }
        }
      }
    }
  }

  return tiles;
}

function placeStructure(tiles: Tile[][], x: number, y: number, w: number, h: number, type: TileType) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ty = y + dy, tx = x + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH && tiles[ty][tx].type !== 'water') {
        tiles[ty][tx].type = type;
      }
    }
  }
}

function findWalkableTile(tiles: Tile[][], seed: number, index: number): { x: number; y: number } {
  const walkable: TileType[] = ['grass', 'tall_grass', 'sand', 'clearing', 'stone', 'stone_path', 'hut', 'beach', 'flower', 'village', 'garden'];
  for (let attempt = 0; attempt < 400; attempt++) {
    const x = Math.floor(noise2D(attempt, index, seed + 1500) * MAP_WIDTH);
    const y = Math.floor(noise2D(index, attempt, seed + 1600) * MAP_HEIGHT);
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && walkable.includes(tiles[y][x].type)) {
      return { x, y };
    }
  }
  return { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
}

export function generateWorld(): World {
  const seed = Math.random() * 100000;
  const tiles = generateTerrain(seed);

  const sages: Sage[] = SAGE_DEFINITIONS.map((def, i) => {
    const pos = findWalkableTile(tiles, seed, i);
    const tgt = findWalkableTile(tiles, seed, i + 100);
    return {
      name: def.name,
      temperament: def.temperament,
      description: def.description,
      x: pos.x,
      y: pos.y,
      targetX: tgt.x,
      targetY: tgt.y,
      needs: {
        energy: 45 + Math.random() * 35,
        hunger: 15 + Math.random() * 25,
        social: 25 + Math.random() * 40,
        purpose: 25 + Math.random() * 40,
      },
      personality: { ...def.personality },
      state: 'walking' as const,
      mood: 'serene' as const,
      color: def.color,
      dialogue: null,
      dialogueTimer: 0,
      stateTimer: 0,
      conversationPartner: null,
      userControlled: false,
      inventory: [],
      currentAction: null,
      relationship: 10,
    };
  });

  return {
    tiles,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    sages,
    tick: Math.floor(Math.random() * 200) + 50,
    dayPhase: Math.random(),
    droppedItems: [],
    weather: 'clear',
    weatherTimer: WEATHER_CHANGE_MIN + Math.floor(Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN)),
    timeOfDay: 'morning',
  };
}