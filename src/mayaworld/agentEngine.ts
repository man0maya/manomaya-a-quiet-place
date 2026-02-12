import { Sage, SageState, Mood, World, SageAction, Item } from './types';
import { MAP_WIDTH, MAP_HEIGHT, LOCATION_AURAS, ITEMS } from './constants';
import { getRandomDialogue } from './dialogueBank';

const WALKABLE = ['grass', 'sand', 'clearing', 'stone', 'hut', 'beach', 'flower', 'grove', 'mountain', 'ruins', 'temple'];

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

// Try to search for items at current tile
function trySearch(sage: Sage, world: World): Item | null {
  const tileType = world.tiles[sage.y]?.[sage.x]?.type;
  if (!tileType) return null;
  const aura = LOCATION_AURAS[tileType];
  if (!aura || aura.resources.length === 0) return null;

  // Curiosity boosts rarity
  const curiosityBonus = sage.personality.curiosity * 0.1;
  for (const res of aura.resources) {
    if (Math.random() < res.rarity + curiosityBonus) {
      return { ...res.item };
    }
  }
  return null;
}

// Perform action effects on sage needs
export function performAction(sage: Sage, action: SageAction, world: World, nearbySage?: Sage): { narrationKey: string; item?: Item } {
  switch (action) {
    case 'eat': {
      const foodIdx = sage.inventory.findIndex(i => i.type === 'fruit' || i.type === 'meal');
      if (foodIdx >= 0) {
        sage.inventory.splice(foodIdx, 1);
        sage.needs.hunger = clamp(sage.needs.hunger - 30, 0, 100);
        return { narrationKey: 'eat' };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'rest':
      sage.needs.energy = clamp(sage.needs.energy + 40, 0, 100);
      sage.state = 'resting';
      sage.stateTimer = 12;
      return { narrationKey: 'rest' };
    case 'drink':
      sage.needs.energy = clamp(sage.needs.energy + 15, 0, 100);
      sage.needs.hunger = clamp(sage.needs.hunger - 5, 0, 100);
      return { narrationKey: 'drink' };
    case 'meditate':
      sage.needs.purpose = clamp(sage.needs.purpose - 40, 0, 100);
      sage.needs.energy = clamp(sage.needs.energy + 10, 0, 100);
      sage.state = 'meditating';
      sage.stateTimer = 16;
      return { narrationKey: 'meditate' };
    case 'pray':
      sage.needs.purpose = clamp(sage.needs.purpose - 50, 0, 100);
      sage.state = 'meditating';
      sage.stateTimer = 12;
      return { narrationKey: 'pray' };
    case 'search': {
      const found = trySearch(sage, world);
      if (found) {
        sage.inventory.push(found);
        return { narrationKey: 'search_found', item: found };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'craft_offering': {
      if (sage.inventory.length >= 2) {
        sage.inventory.splice(0, 2);
        const offering = { ...ITEMS.offering };
        sage.inventory.push(offering);
        return { narrationKey: 'craft_offering', item: offering };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'gift': {
      if (nearbySage && sage.inventory.length > 0) {
        const item = sage.inventory.shift()!;
        nearbySage.inventory.push(item);
        sage.needs.social = clamp(sage.needs.social - 30, 0, 100);
        nearbySage.needs.social = clamp(nearbySage.needs.social - 30, 0, 100);
        return { narrationKey: 'gift', item };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'talk': {
      if (nearbySage) {
        sage.needs.social = clamp(sage.needs.social - 20, 0, 100);
        if (!nearbySage.userControlled) {
          nearbySage.needs.social = clamp(nearbySage.needs.social - 20, 0, 100);
        }
        sage.dialogue = getRandomDialogue();
        sage.dialogueTimer = 16;
        return { narrationKey: 'talk' };
      }
      return { narrationKey: 'search_empty' };
    }
    default:
      return { narrationKey: 'search_empty' };
  }
}

function decideNextState(sage: Sage, world: World): { state: SageState; targetX: number; targetY: number } {
  const { needs, personality } = sage;
  const calmBias = personality.calm * 20;
  const curiosityBias = personality.curiosity * 15;

  if (needs.energy < 25) {
    return { state: 'resting', targetX: sage.x, targetY: sage.y };
  }
  if (needs.hunger > 70) {
    // Try to eat from inventory first
    const hasFood = sage.inventory.some(i => i.type === 'fruit' || i.type === 'meal');
    if (hasFood) {
      performAction(sage, 'eat', world);
      return { state: 'observing', targetX: sage.x, targetY: sage.y };
    }
    // Go to hut or forest to find food
    const target = Math.random() < 0.5
      ? findNearestOfType(world, sage.x, sage.y, 'hut')
      : findNearestOfType(world, sage.x, sage.y, 'forest');
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }
  if (needs.purpose + calmBias > 65) {
    const cl = Math.random() < 0.4
      ? findNearestOfType(world, sage.x, sage.y, 'temple')
      : findNearestOfType(world, sage.x, sage.y, 'clearing');
    return { state: 'meditating', targetX: cl.x, targetY: cl.y };
  }
  if (needs.social + curiosityBias > 60) {
    const others = world.sages.filter(s => s.name !== sage.name);
    const target = others[Math.floor(Math.random() * others.length)];
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }

  // Curiosity-driven exploration
  if (Math.random() < personality.curiosity * 0.4) {
    const types = ['forest', 'grove', 'ruins', 'mountain', 'flower'];
    const targetType = types[Math.floor(Math.random() * types.length)];
    const target = findNearestOfType(world, sage.x, sage.y, targetType);
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }

  const wander = pickRandomWalkable(world);
  if (Math.random() < (1 - personality.movementTendency) * 0.4) {
    return { state: 'observing', targetX: sage.x, targetY: sage.y };
  }
  return { state: 'walking', targetX: wander.x, targetY: wander.y };
}

// Autonomous action decisions for AI sages
function tryAutonomousAction(sage: Sage, world: World): void {
  if (sage.state !== 'observing' && sage.state !== 'resting') return;
  if (Math.random() > 0.08) return; // Low chance per tick

  const tileType = world.tiles[sage.y]?.[sage.x]?.type;
  if (!tileType) return;

  // Context-sensitive autonomous actions
  if (tileType === 'forest' || tileType === 'grove' || tileType === 'flower') {
    if (Math.random() < sage.personality.curiosity * 0.5) {
      performAction(sage, 'search', world);
    }
  } else if (tileType === 'temple') {
    if (Math.random() < sage.personality.calm * 0.5) {
      performAction(sage, 'pray', world);
    }
  } else if (tileType === 'clearing') {
    if (Math.random() < sage.personality.calm * 0.5) {
      performAction(sage, 'meditate', world);
    }
  } else if (tileType === 'lake' || tileType === 'river') {
    performAction(sage, 'drink', world);
  } else if (tileType === 'hut') {
    if (sage.needs.hunger > 40) {
      performAction(sage, 'eat', world);
    }
  }
}

export function isWalkable(world: World, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  return WALKABLE.includes(world.tiles[y][x].type);
}

export function tickSage(sage: Sage, world: World): void {
  if (sage.userControlled) {
    sage.needs.energy = clamp(sage.needs.energy - 0.1, 0, 100);
    sage.needs.hunger = clamp(sage.needs.hunger + 0.08, 0, 100);
    sage.needs.social = clamp(sage.needs.social + 0.05, 0, 100);
    sage.needs.purpose = clamp(sage.needs.purpose + 0.06, 0, 100);

    if (sage.y >= 0 && sage.y < MAP_HEIGHT && sage.x >= 0 && sage.x < MAP_WIDTH) {
      if (world.tiles[sage.y][sage.x].type === 'hut') {
        sage.needs.hunger = clamp(sage.needs.hunger - 0.5, 0, 100);
      }
      if (world.tiles[sage.y][sage.x].type === 'clearing' || world.tiles[sage.y][sage.x].type === 'temple') {
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

  // Autonomous actions
  tryAutonomousAction(sage, world);

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
