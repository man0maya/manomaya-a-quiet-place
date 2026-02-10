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
        if (d > islandEdge - 2) {
          type = 'sand';
        } else {
          const terrainNoise = noise2D(x * 0.5, y * 0.5, seed + 100);
          if (terrainNoise > 0.7) type = 'forest';
          else if (terrainNoise > 0.15) type = 'grass';
          else type = 'stone';
        }
      }
      tiles[y][x] = { type, x, y };
    }
  }

  // River: a winding path from top-ish to bottom-ish
  let rx = cx + Math.floor((noise2D(0, 0, seed + 200) - 0.5) * 6);
  for (let ry = 4; ry < MAP_HEIGHT - 4; ry++) {
    if (tiles[ry][rx].type !== 'water') {
      tiles[ry][rx].type = 'river';
      if (rx + 1 < MAP_WIDTH && tiles[ry][rx + 1].type !== 'water') {
        tiles[ry][rx + 1].type = 'river';
      }
    }
    rx += Math.floor((noise2D(rx, ry, seed + 300) - 0.45) * 3);
    rx = Math.max(3, Math.min(MAP_WIDTH - 4, rx));
  }

  // Huts cluster
  const hutX = cx - 4 + Math.floor(noise2D(1, 1, seed + 400) * 8);
  const hutY = cy - 2 + Math.floor(noise2D(2, 2, seed + 400) * 4);
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      const ty = hutY + dy;
      const tx = hutX + dx;
      if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
        if (tiles[ty][tx].type === 'grass' || tiles[ty][tx].type === 'stone') {
          if ((dx + dy) % 2 === 0) tiles[ty][tx].type = 'hut';
          else tiles[ty][tx].type = 'sand';
        }
      }
    }
  }

  // Meditation clearings
  for (let i = 0; i < 3; i++) {
    const clX = Math.floor(noise2D(i, 0, seed + 500) * (MAP_WIDTH - 10)) + 5;
    const clY = Math.floor(noise2D(0, i, seed + 500) * (MAP_HEIGHT - 10)) + 5;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ty = clY + dy;
        const tx = clX + dx;
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
          if (tiles[ty][tx].type !== 'water' && tiles[ty][tx].type !== 'river') {
            tiles[ty][tx].type = 'clearing';
          }
        }
      }
    }
  }

  return tiles;
}

function findWalkableTile(tiles: Tile[][], seed: number, index: number): { x: number; y: number } {
  const walkable: TileType[] = ['grass', 'sand', 'clearing', 'stone'];
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(noise2D(attempt, index, seed + 600) * MAP_WIDTH);
    const y = Math.floor(noise2D(index, attempt, seed + 700) * MAP_HEIGHT);
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
      state: 'walking' as const,
      mood: 'serene' as const,
      color: def.color,
      dialogue: null,
      dialogueTimer: 0,
      stateTimer: 0,
      conversationPartner: null,
    };
  });

  // Pre-simulate a few ticks so the world feels "already in progress"
  return { tiles, width: MAP_WIDTH, height: MAP_HEIGHT, sages, tick: Math.floor(Math.random() * 200) + 50, dayPhase: Math.random() };
}
