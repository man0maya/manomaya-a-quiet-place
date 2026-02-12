import { Tile, TileType, World, Sage } from './types';
import { MAP_WIDTH, MAP_HEIGHT, SAGE_DEFINITIONS } from './constants';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
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
      const nVal = noise2D(x * 0.3, y * 0.3, seed);
      const islandEdge = maxR - 1 + nVal * 3;

      let type: TileType = 'water';
      if (d < islandEdge) {
        // Zone-based layout
        const normalY = y / MAP_HEIGHT; // 0=top, 1=bottom
        const normalX = x / MAP_WIDTH;
        const terrainNoise = noise2D(x * 0.5, y * 0.5, seed + 100);

        // Beach ring (near edge)
        if (d > islandEdge - 2.5) {
          type = 'beach';
        }
        // Mountain zone (top 20%)
        else if (normalY < 0.25) {
          if (terrainNoise > 0.6) type = 'mountain';
          else if (terrainNoise > 0.45) type = 'stone';
          else type = 'grass';
        }
        // Forest band (20-40%)
        else if (normalY < 0.45) {
          if (terrainNoise > 0.5) type = 'forest';
          else if (terrainNoise > 0.3) type = 'grass';
          else type = 'forest';
        }
        // Center zone (40-65%) - village and lake
        else if (normalY < 0.65) {
          if (normalX < 0.45) {
            // Lake area (left-center)
            const lakeDist = distance(x, y, cx - 5, cy + 1);
            if (lakeDist < 3 + terrainNoise * 1.5) type = 'lake';
            else type = 'grass';
          } else {
            // Village area (right-center)
            type = 'grass';
          }
        }
        // Lower zone (65-85%) - flower fields and groves
        else if (normalY < 0.85) {
          if (terrainNoise > 0.65) type = 'grove';
          else if (terrainNoise > 0.4) type = 'flower';
          else type = 'grass';
        }
        // Bottom zone - sand/beach leading to ruins
        else {
          if (terrainNoise > 0.6) type = 'sand';
          else type = 'grass';
        }
      }
      tiles[y][x] = { type, x, y };
    }
  }

  // River from top to bottom
  let rx = cx + Math.floor((noise2D(0, 0, seed + 200) - 0.5) * 4);
  for (let ry = 3; ry < MAP_HEIGHT - 3; ry++) {
    if (tiles[ry][rx].type !== 'water' && tiles[ry][rx].type !== 'lake') {
      tiles[ry][rx].type = 'river';
      if (rx + 1 < MAP_WIDTH && tiles[ry][rx + 1].type !== 'water' && tiles[ry][rx + 1].type !== 'lake') {
        tiles[ry][rx + 1].type = 'river';
      }
    }
    rx += Math.floor((noise2D(rx, ry, seed + 300) - 0.45) * 2.5);
    rx = Math.max(3, Math.min(MAP_WIDTH - 4, rx));
  }

  // Temple at mountain top
  const templeX = cx - 1 + Math.floor(noise2D(5, 5, seed + 400) * 3);
  const templeY = 4 + Math.floor(noise2D(6, 6, seed + 400) * 2);
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const ty = templeY + dy;
      const tx = templeX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH && tiles[ty][tx].type !== 'water') {
        tiles[ty][tx].type = 'temple';
      }
    }
  }

  // Huts cluster in center-right
  const hutX = cx + 2 + Math.floor(noise2D(1, 1, seed + 500) * 4);
  const hutY = cy - 1 + Math.floor(noise2D(2, 2, seed + 500) * 2);
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      const ty = hutY + dy;
      const tx = hutX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        if (tiles[ty][tx].type === 'grass' || tiles[ty][tx].type === 'flower') {
          if ((dx + dy) % 2 === 0) tiles[ty][tx].type = 'hut';
          else tiles[ty][tx].type = 'sand';
        }
      }
    }
  }

  // Ruins at bottom-right
  const ruinsX = cx + 4 + Math.floor(noise2D(3, 3, seed + 600) * 4);
  const ruinsY = MAP_HEIGHT - 6 + Math.floor(noise2D(4, 4, seed + 600) * 2);
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const ty = ruinsY + dy;
      const tx = ruinsX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH && tiles[ty][tx].type !== 'water') {
        tiles[ty][tx].type = 'ruins';
      }
    }
  }

  // Meditation clearings
  for (let i = 0; i < 3; i++) {
    const clX = Math.floor(noise2D(i, 0, seed + 700) * (MAP_WIDTH - 10)) + 5;
    const clY = Math.floor(noise2D(0, i, seed + 700) * (MAP_HEIGHT - 10)) + 5;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ty = clY + dy;
        const tx = clX + dx;
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
          if (tiles[ty][tx].type !== 'water' && tiles[ty][tx].type !== 'river' && tiles[ty][tx].type !== 'lake' && tiles[ty][tx].type !== 'temple') {
            tiles[ty][tx].type = 'clearing';
          }
        }
      }
    }
  }

  return tiles;
}

function findWalkableTile(tiles: Tile[][], seed: number, index: number): { x: number; y: number } {
  const walkable: TileType[] = ['grass', 'sand', 'clearing', 'stone', 'hut', 'beach', 'flower'];
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(noise2D(attempt, index, seed + 800) * MAP_WIDTH);
    const y = Math.floor(noise2D(index, attempt, seed + 900) * MAP_HEIGHT);
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
    };
  });

  return { tiles, width: MAP_WIDTH, height: MAP_HEIGHT, sages, tick: Math.floor(Math.random() * 200) + 50, dayPhase: Math.random(), droppedItems: [] };
}
