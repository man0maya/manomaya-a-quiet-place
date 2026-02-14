import { Tile, TileType, World, Sage } from './types';
import { MAP_WIDTH, MAP_HEIGHT, SAGE_DEFINITIONS, WEATHER_CHANGE_MIN, WEATHER_CHANGE_MAX } from './constants';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Multi-octave noise for richer terrain
function fractalNoise(x: number, y: number, seed: number, octaves: number = 3): number {
  let val = 0, amp = 1, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise2D(x * freq * 0.15, y * freq * 0.15, seed + i * 100) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / total;
}

function generateTerrain(seed: number): Tile[][] {
  const tiles: Tile[][] = [];
  const cx = MAP_WIDTH / 2;
  const cy = MAP_HEIGHT / 2;
  const maxR = Math.min(cx, cy) - 3;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const d = distance(x, y, cx, cy);
      const edgeNoise = noise2D(x * 0.2, y * 0.2, seed) * 4;
      const islandEdge = maxR - 2 + edgeNoise;

      let type: TileType = 'water';
      if (d < islandEdge) {
        const nY = y / MAP_HEIGHT;
        const nX = x / MAP_WIDTH;
        const n1 = fractalNoise(x, y, seed + 100);
        const n2 = fractalNoise(x, y, seed + 200);
        const n3 = noise2D(x * 0.4, y * 0.4, seed + 300);

        // Beach ring
        if (d > islandEdge - 3) {
          type = n3 > 0.6 ? 'sand' : 'beach';
        }
        // MOUNTAIN ZONE (top 15%) - Mountain of Vows + Vashistha Ridge
        else if (nY < 0.18) {
          if (n1 > 0.55) type = 'mountain';
          else if (n1 > 0.4) type = 'stone';
          else type = 'grass';
        }
        // FOREST ZONE (15-30%) - Forest of Silence
        else if (nY < 0.32) {
          if (n1 > 0.45) type = 'forest';
          else if (n1 > 0.35) type = 'tall_grass';
          else type = 'grass';
        }
        // UPPER-MID ZONE (30-45%) - Daksha Plains + paths
        else if (nY < 0.45) {
          if (n1 > 0.7) type = 'tall_grass';
          else if (n1 > 0.55) type = 'flower';
          else type = 'grass';
          // Stone paths
          if (Math.abs(nX - 0.5) < 0.02 && n3 > 0.3) type = 'stone_path';
        }
        // CENTER ZONE (45-60%) - Sage Village + Lake (River of Memory)
        else if (nY < 0.6) {
          if (nX < 0.4) {
            // Lake area
            const lakeDist = distance(x, y, cx - 10, cy + 2);
            if (lakeDist < 6 + n2 * 2) type = 'lake';
            else if (lakeDist < 8) type = 'grass';
            else type = 'grass';
          } else if (nX > 0.55 && nX < 0.75) {
            // Village cluster
            if (n3 > 0.6) type = 'village';
            else if (n3 > 0.45) type = 'hut';
            else type = 'grass';
          } else {
            type = n1 > 0.6 ? 'tall_grass' : 'grass';
          }
        }
        // GARDEN ZONE (60-72%) - Garden of Atri
        else if (nY < 0.72) {
          if (nX > 0.3 && nX < 0.6 && n1 > 0.35) type = 'garden';
          else if (n1 > 0.6) type = 'grove';
          else if (n1 > 0.4) type = 'flower';
          else type = 'grass';
        }
        // LOWER ZONE (72-85%) - clearings + groves
        else if (nY < 0.85) {
          if (n1 > 0.65) type = 'grove';
          else if (n1 > 0.45) type = 'flower';
          else if (n1 > 0.35) type = 'grass';
          else type = 'tall_grass';
        }
        // BOTTOM ZONE - Beach Ruins
        else {
          if (n1 > 0.6) type = 'sand';
          else type = 'grass';
        }
      }
      tiles[y][x] = { type, x, y };
    }
  }

  // === RIVER OF MEMORY (winding river top to bottom) ===
  let rx = cx + Math.floor((noise2D(0, 0, seed + 400) - 0.5) * 6);
  for (let ry = 4; ry < MAP_HEIGHT - 4; ry++) {
    if (tiles[ry][rx].type !== 'water' && tiles[ry][rx].type !== 'lake') {
      tiles[ry][rx].type = 'river';
      if (rx + 1 < MAP_WIDTH && tiles[ry][rx + 1].type !== 'water' && tiles[ry][rx + 1].type !== 'lake') {
        tiles[ry][rx + 1].type = 'river';
      }
    }
    rx += Math.floor((noise2D(rx, ry, seed + 500) - 0.4) * 2.5);
    rx = Math.max(5, Math.min(MAP_WIDTH - 6, rx));
  }

  // === BRIDGES over river ===
  for (let i = 0; i < 3; i++) {
    const by = 15 + i * 20 + Math.floor(noise2D(i, 0, seed + 550) * 5);
    for (let bx = 3; bx < MAP_WIDTH - 3; bx++) {
      if (tiles[by]?.[bx]?.type === 'river') {
        tiles[by][bx].type = 'bridge';
      }
    }
  }

  // === TEMPLE (top-center) ===
  const templeX = cx - 2 + Math.floor(noise2D(5, 5, seed + 600) * 4);
  const templeY = 6 + Math.floor(noise2D(6, 6, seed + 600) * 3);
  placeStructure(tiles, templeX, templeY, 4, 3, 'temple');

  // === SHRINES (3 scattered) ===
  const shrinePositions = [
    { x: 15, y: 25 }, { x: cx + 12, y: cy - 5 }, { x: cx - 8, y: cy + 15 }
  ];
  for (const sp of shrinePositions) {
    const sx = sp.x + Math.floor(noise2D(sp.x, sp.y, seed + 700) * 4);
    const sy = sp.y + Math.floor(noise2D(sp.y, sp.x, seed + 700) * 3);
    placeStructure(tiles, sx, sy, 2, 2, 'shrine');
  }

  // === CAVE OF MARICHI (right side, mid-height) ===
  const caveX = MAP_WIDTH - 15 + Math.floor(noise2D(7, 7, seed + 800) * 4);
  const caveY = cy - 5 + Math.floor(noise2D(8, 8, seed + 800) * 4);
  placeStructure(tiles, caveX, caveY, 3, 3, 'cave');

  // === RUINS (bottom-right) ===
  const ruinsX = cx + 10 + Math.floor(noise2D(3, 3, seed + 900) * 6);
  const ruinsY = MAP_HEIGHT - 12 + Math.floor(noise2D(4, 4, seed + 900) * 3);
  placeStructure(tiles, ruinsX, ruinsY, 4, 3, 'ruins');

  // === HUT CLUSTERS (Sage Village) ===
  const hutX = cx + 5;
  const hutY = cy - 2;
  for (let dy = 0; dy < 5; dy++) {
    for (let dx = 0; dx < 6; dx++) {
      const ty = hutY + dy, tx = hutX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        if (tiles[ty][tx].type === 'grass' || tiles[ty][tx].type === 'tall_grass' || tiles[ty][tx].type === 'flower') {
          if ((dx + dy) % 3 === 0) tiles[ty][tx].type = 'hut';
          else if ((dx + dy) % 3 === 1) tiles[ty][tx].type = 'stone_path';
          else tiles[ty][tx].type = 'village';
        }
      }
    }
  }

  // === CLEARINGS (meditation spots) ===
  for (let i = 0; i < 5; i++) {
    const clX = Math.floor(noise2D(i, 0, seed + 1000) * (MAP_WIDTH - 14)) + 7;
    const clY = Math.floor(noise2D(0, i, seed + 1000) * (MAP_HEIGHT - 14)) + 7;
    placeStructure(tiles, clX, clY, 3, 3, 'clearing');
  }

  // === STONE PATHS connecting village to key locations ===
  // Village to temple
  let pathX = hutX + 3;
  for (let py = hutY; py > templeY + 3; py--) {
    if (tiles[py]?.[pathX] && tiles[py][pathX].type === 'grass') {
      tiles[py][pathX].type = 'stone_path';
    }
    pathX += Math.floor((noise2D(pathX, py, seed + 1100) - 0.5) * 1.5);
    pathX = Math.max(5, Math.min(MAP_WIDTH - 5, pathX));
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
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = Math.floor(noise2D(attempt, index, seed + 1200) * MAP_WIDTH);
    const y = Math.floor(noise2D(index, attempt, seed + 1300) * MAP_HEIGHT);
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
        energy: 40 + Math.random() * 40,
        hunger: 20 + Math.random() * 30,
        social: 30 + Math.random() * 40,
        purpose: 30 + Math.random() * 40,
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
