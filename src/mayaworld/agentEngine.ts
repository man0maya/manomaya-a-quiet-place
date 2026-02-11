import { Sage, SageState, Mood, World } from './types';
import { MAP_WIDTH, MAP_HEIGHT } from './constants';
import { getRandomDialogue } from './dialogueBank';

const WALKABLE = ['grass', 'sand', 'clearing', 'stone', 'hut'];

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function dist(a: Sage, b: Sage) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function deriveMood(needs: Sage['needs']): Mood {
  const avg = (needs.energy + (100 - needs.hunger) + needs.social + needs.purpose) / 4;
  if (avg > 70) return 'serene';
  if (avg > 55) return 'content';
  if (avg > 40) return 'contemplative';
  if (needs.energy < 25) return 'weary';
  return 'restless';
}

function pickRandomWalkable(world: World): { x: number; y: number } {
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * MAP_WIDTH);
    const y = Math.floor(Math.random() * MAP_HEIGHT);
    if (WALKABLE.includes(world.tiles[y][x].type)) return { x, y };
  }
  return { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
}

function findNearestOfType(world: World, sx: number, sy: number, type: string): { x: number; y: number } {
  let best = pickRandomWalkable(world);
  let bestD = Infinity;
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (world.tiles[y][x].type === type) {
        const d = Math.abs(x - sx) + Math.abs(y - sy);
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
    }
  }
  return best;
}

function decideNextState(sage: Sage, world: World): { state: SageState; targetX: number; targetY: number } {
  const { needs, personality } = sage;

  // Personality influences thresholds
  const calmBias = personality.calm * 20;
  const curiosityBias = personality.curiosity * 15;
  const moveBias = personality.movementTendency;

  if (needs.energy < 25) {
    return { state: 'resting', targetX: sage.x, targetY: sage.y };
  }
  if (needs.hunger > 70) {
    const hut = findNearestOfType(world, sage.x, sage.y, 'hut');
    return { state: 'walking', targetX: hut.x, targetY: hut.y };
  }
  if (needs.purpose + calmBias > 65) {
    const cl = findNearestOfType(world, sage.x, sage.y, 'clearing');
    return { state: 'meditating', targetX: cl.x, targetY: cl.y };
  }
  if (needs.social + curiosityBias > 60) {
    const others = world.sages.filter(s => s.name !== sage.name);
    const target = others[Math.floor(Math.random() * others.length)];
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }

  // Personality-driven: curious sages explore more
  if (Math.random() < personality.curiosity * 0.4) {
    const forest = findNearestOfType(world, sage.x, sage.y, 'forest');
    return { state: 'walking', targetX: forest.x, targetY: forest.y };
  }

  const wander = pickRandomWalkable(world);
  if (Math.random() < (1 - moveBias) * 0.4) {
    return { state: 'observing', targetX: sage.x, targetY: sage.y };
  }
  return { state: 'walking', targetX: wander.x, targetY: wander.y };
}

export function isWalkable(world: World, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  return WALKABLE.includes(world.tiles[y][x].type);
}

export function tickSage(sage: Sage, world: World): void {
  // Skip AI for user-controlled sages
  if (sage.userControlled) {
    // Still update needs and mood
    sage.needs.energy = clamp(sage.needs.energy - 0.1, 0, 100);
    sage.needs.hunger = clamp(sage.needs.hunger + 0.08, 0, 100);
    sage.needs.social = clamp(sage.needs.social + 0.05, 0, 100);
    sage.needs.purpose = clamp(sage.needs.purpose + 0.06, 0, 100);

    if (sage.y >= 0 && sage.y < MAP_HEIGHT && sage.x >= 0 && sage.x < MAP_WIDTH) {
      if (world.tiles[sage.y][sage.x].type === 'hut') {
        sage.needs.hunger = clamp(sage.needs.hunger - 0.5, 0, 100);
      }
      if (world.tiles[sage.y][sage.x].type === 'clearing') {
        sage.needs.purpose = clamp(sage.needs.purpose - 0.3, 0, 100);
      }
    }

    if (sage.dialogueTimer > 0) {
      sage.dialogueTimer--;
      if (sage.dialogueTimer <= 0) {
        sage.dialogue = null;
        sage.conversationPartner = null;
      }
    }
    sage.mood = deriveMood(sage.needs);
    return;
  }

  // Update needs gradually
  sage.needs.energy = clamp(sage.needs.energy - 0.15, 0, 100);
  sage.needs.hunger = clamp(sage.needs.hunger + 0.12, 0, 100);
  sage.needs.social = clamp(sage.needs.social + 0.08, 0, 100);
  sage.needs.purpose = clamp(sage.needs.purpose + 0.1, 0, 100);

  if (sage.state === 'resting') {
    sage.needs.energy = clamp(sage.needs.energy + 0.8, 0, 100);
  } else if (sage.state === 'meditating') {
    sage.needs.purpose = clamp(sage.needs.purpose - 1.0, 0, 100);
    sage.needs.energy = clamp(sage.needs.energy + 0.2, 0, 100);
  } else if (sage.state === 'conversing') {
    sage.needs.social = clamp(sage.needs.social - 0.8, 0, 100);
  }

  if (sage.y >= 0 && sage.y < MAP_HEIGHT && sage.x >= 0 && sage.x < MAP_WIDTH) {
    if (world.tiles[sage.y][sage.x].type === 'hut') {
      sage.needs.hunger = clamp(sage.needs.hunger - 0.5, 0, 100);
    }
  }

  if (sage.dialogueTimer > 0) {
    sage.dialogueTimer--;
    if (sage.dialogueTimer <= 0) {
      sage.dialogue = null;
      sage.conversationPartner = null;
    }
  }

  sage.stateTimer--;

  // Movement
  if (sage.state === 'walking') {
    const dx = sage.targetX - sage.x;
    const dy = sage.targetY - sage.y;
    if (Math.abs(dx) + Math.abs(dy) <= 1) {
      sage.stateTimer = 0;
    } else {
      let nx = sage.x, ny = sage.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        nx += dx > 0 ? 1 : -1;
      } else {
        ny += dy > 0 ? 1 : -1;
      }
      nx = clamp(nx, 0, MAP_WIDTH - 1);
      ny = clamp(ny, 0, MAP_HEIGHT - 1);
      if (WALKABLE.includes(world.tiles[ny][nx].type)) {
        sage.x = nx;
        sage.y = ny;
      } else {
        sage.stateTimer = 0;
      }
    }
  }

  // Conversation
  if (sage.state !== 'conversing' && sage.dialogueTimer <= 0) {
    for (const other of world.sages) {
      if (other.name !== sage.name && dist(sage, other) <= 2 && other.dialogueTimer <= 0 && Math.random() < 0.02) {
        sage.state = 'conversing';
        sage.conversationPartner = other.name;
        sage.dialogue = getRandomDialogue();
        sage.dialogueTimer = 20;
        sage.stateTimer = 20;
        if (!other.userControlled) {
          other.state = 'conversing';
          other.conversationPartner = sage.name;
          other.dialogue = getRandomDialogue();
          other.dialogueTimer = 20;
          other.stateTimer = 20;
        }
        break;
      }
    }
  }

  if (sage.stateTimer <= 0) {
    const next = decideNextState(sage, world);
    sage.state = next.state;
    sage.targetX = next.targetX;
    sage.targetY = next.targetY;
    sage.stateTimer = 15 + Math.floor(Math.random() * 25);
  }

  sage.mood = deriveMood(sage.needs);
}
