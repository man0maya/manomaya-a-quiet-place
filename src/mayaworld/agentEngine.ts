import { Sage, SageState, Mood, World, SageAction, Item, Weather, TimeOfDay } from './types';
import { MAP_WIDTH, MAP_HEIGHT, LOCATION_AURAS, ITEMS, DAY_CYCLE_TICKS, WEATHER_CHANGE_MIN, WEATHER_CHANGE_MAX } from './constants';
import { getRandomDialogue } from './dialogueBank';

const WALKABLE = ['grass', 'tall_grass', 'sand', 'clearing', 'stone', 'stone_path', 'hut', 'beach', 'flower', 'grove', 'mountain', 'ruins', 'temple', 'bridge', 'cave', 'garden', 'village', 'shrine'];

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
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(Math.random() * MAP_WIDTH);
    const y = Math.floor(Math.random() * MAP_HEIGHT);
    if (WALKABLE.includes(world.tiles[y][x].type)) return { x, y };
  }
  return { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
}

function findNearestOfType(world: World, sx: number, sy: number, type: string, maxDist: number = 30): { x: number; y: number } {
  let best = pickRandomWalkable(world);
  let bestD = Infinity;
  const minY = Math.max(0, sy - maxDist), maxY = Math.min(MAP_HEIGHT, sy + maxDist);
  const minX = Math.max(0, sx - maxDist), maxX = Math.min(MAP_WIDTH, sx + maxDist);
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (world.tiles[y][x].type === type) {
        const d = Math.abs(x - sx) + Math.abs(y - sy);
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
    }
  }
  return best;
}

function trySearch(sage: Sage, world: World): Item | null {
  const tileType = world.tiles[sage.y]?.[sage.x]?.type;
  if (!tileType) return null;
  const aura = LOCATION_AURAS[tileType];
  if (!aura || aura.resources.length === 0) return null;
  const curiosityBonus = sage.personality.curiosity * 0.1;
  for (const res of aura.resources) {
    if (Math.random() < res.rarity + curiosityBonus) {
      return { ...res.item };
    }
  }
  return null;
}

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
    case 'ritual':
      sage.needs.purpose = clamp(sage.needs.purpose - 60, 0, 100);
      sage.needs.energy = clamp(sage.needs.energy - 10, 0, 100);
      sage.state = 'meditating';
      sage.stateTimer = 24;
      return { narrationKey: 'ritual' };
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
        nearbySage.relationship = clamp(nearbySage.relationship + 5, 0, 100);
        return { narrationKey: 'gift', item };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'talk': {
      if (nearbySage) {
        sage.needs.social = clamp(sage.needs.social - 20, 0, 100);
        if (!nearbySage.userControlled) nearbySage.needs.social = clamp(nearbySage.needs.social - 20, 0, 100);
        sage.dialogue = getRandomDialogue();
        sage.dialogueTimer = 16;
        nearbySage.relationship = clamp(nearbySage.relationship + 2, 0, 100);
        return { narrationKey: 'talk' };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'listen': {
      if (nearbySage) {
        sage.needs.social = clamp(sage.needs.social - 15, 0, 100);
        nearbySage.relationship = clamp(nearbySage.relationship + 3, 0, 100);
        return { narrationKey: 'listen' };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'ask': {
      if (nearbySage) {
        sage.needs.social = clamp(sage.needs.social - 10, 0, 100);
        nearbySage.relationship = clamp(nearbySage.relationship + 1, 0, 100);
        return { narrationKey: 'ask' };
      }
      return { narrationKey: 'search_empty' };
    }
    case 'sit': {
      if (nearbySage) {
        sage.needs.social = clamp(sage.needs.social - 25, 0, 100);
        sage.needs.purpose = clamp(sage.needs.purpose - 15, 0, 100);
        nearbySage.relationship = clamp(nearbySage.relationship + 4, 0, 100);
        sage.state = 'resting';
        sage.stateTimer = 12;
        return { narrationKey: 'sit' };
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

  if (needs.energy < 25) return { state: 'resting', targetX: sage.x, targetY: sage.y };
  if (needs.hunger > 70) {
    const hasFood = sage.inventory.some(i => i.type === 'fruit' || i.type === 'meal');
    if (hasFood) { performAction(sage, 'eat', world); return { state: 'observing', targetX: sage.x, targetY: sage.y }; }
    const target = Math.random() < 0.5
      ? findNearestOfType(world, sage.x, sage.y, 'hut')
      : findNearestOfType(world, sage.x, sage.y, 'forest');
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }
  if (needs.purpose + calmBias > 65) {
    const targets = ['temple', 'shrine', 'clearing'];
    const target = findNearestOfType(world, sage.x, sage.y, targets[Math.floor(Math.random() * targets.length)]);
    return { state: 'meditating', targetX: target.x, targetY: target.y };
  }
  if (needs.social + curiosityBias > 60) {
    const others = world.sages.filter(s => s.name !== sage.name);
    const target = others[Math.floor(Math.random() * others.length)];
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }
  if (Math.random() < personality.curiosity * 0.4) {
    const types = ['forest', 'grove', 'ruins', 'mountain', 'flower', 'cave', 'garden', 'shrine'];
    const target = findNearestOfType(world, sage.x, sage.y, types[Math.floor(Math.random() * types.length)]);
    return { state: 'walking', targetX: target.x, targetY: target.y };
  }
  const wander = pickRandomWalkable(world);
  if (Math.random() < (1 - personality.movementTendency) * 0.4) return { state: 'observing', targetX: sage.x, targetY: sage.y };
  return { state: 'walking', targetX: wander.x, targetY: wander.y };
}

function tryAutonomousAction(sage: Sage, world: World): void {
  if (sage.state !== 'observing' && sage.state !== 'resting') return;
  if (Math.random() > 0.08) return;
  const tileType = world.tiles[sage.y]?.[sage.x]?.type;
  if (!tileType) return;

  if (['forest', 'grove', 'flower', 'garden', 'tall_grass'].includes(tileType)) {
    if (Math.random() < sage.personality.curiosity * 0.5) performAction(sage, 'search', world);
  } else if (['temple', 'shrine'].includes(tileType)) {
    if (Math.random() < sage.personality.calm * 0.5) performAction(sage, 'pray', world);
  } else if (tileType === 'clearing') {
    if (Math.random() < sage.personality.calm * 0.5) performAction(sage, 'meditate', world);
  } else if (['lake', 'river'].includes(tileType)) {
    performAction(sage, 'drink', world);
  } else if (['hut', 'village'].includes(tileType)) {
    if (sage.needs.hunger > 40) performAction(sage, 'eat', world);
  } else if (tileType === 'cave') {
    if (Math.random() < sage.personality.spiritualDepth * 0.4) performAction(sage, 'meditate', world);
  }
}

export function isWalkable(world: World, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  return WALKABLE.includes(world.tiles[y][x].type);
}

// Weather & time update
export function updateWorldCycle(world: World): void {
  // Time of day
  const phase = (world.tick % DAY_CYCLE_TICKS) / DAY_CYCLE_TICKS;
  if (phase < 0.2) world.timeOfDay = 'morning';
  else if (phase < 0.55) world.timeOfDay = 'day';
  else if (phase < 0.75) world.timeOfDay = 'evening';
  else world.timeOfDay = 'night';

  world.dayPhase = phase;

  // Weather
  world.weatherTimer--;
  if (world.weatherTimer <= 0) {
    const weathers: Weather[] = ['clear', 'clear', 'clear', 'rain', 'mist', 'wind'];
    world.weather = weathers[Math.floor(Math.random() * weathers.length)];
    world.weatherTimer = WEATHER_CHANGE_MIN + Math.floor(Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN));
  }
}

export function tickSage(sage: Sage, world: World): void {
  if (sage.userControlled) {
    sage.needs.energy = clamp(sage.needs.energy - 0.08, 0, 100);
    sage.needs.hunger = clamp(sage.needs.hunger + 0.06, 0, 100);
    sage.needs.social = clamp(sage.needs.social + 0.04, 0, 100);
    sage.needs.purpose = clamp(sage.needs.purpose + 0.05, 0, 100);

    if (sage.y >= 0 && sage.y < MAP_HEIGHT && sage.x >= 0 && sage.x < MAP_WIDTH) {
      const t = world.tiles[sage.y][sage.x].type;
      if (t === 'hut' || t === 'village') sage.needs.hunger = clamp(sage.needs.hunger - 0.4, 0, 100);
      if (t === 'clearing' || t === 'temple' || t === 'shrine') sage.needs.purpose = clamp(sage.needs.purpose - 0.2, 0, 100);
    }
    if (sage.dialogueTimer > 0) { sage.dialogueTimer--; if (sage.dialogueTimer <= 0) { sage.dialogue = null; sage.conversationPartner = null; } }
    sage.mood = deriveMood(sage.needs);
    return;
  }

  sage.needs.energy = clamp(sage.needs.energy - 0.12, 0, 100);
  sage.needs.hunger = clamp(sage.needs.hunger + 0.1, 0, 100);
  sage.needs.social = clamp(sage.needs.social + 0.06, 0, 100);
  sage.needs.purpose = clamp(sage.needs.purpose + 0.08, 0, 100);

  if (sage.state === 'resting') sage.needs.energy = clamp(sage.needs.energy + 0.7, 0, 100);
  else if (sage.state === 'meditating') { sage.needs.purpose = clamp(sage.needs.purpose - 0.8, 0, 100); sage.needs.energy = clamp(sage.needs.energy + 0.15, 0, 100); }
  else if (sage.state === 'conversing') sage.needs.social = clamp(sage.needs.social - 0.6, 0, 100);

  if (sage.y >= 0 && sage.y < MAP_HEIGHT && sage.x >= 0 && sage.x < MAP_WIDTH) {
    const t = world.tiles[sage.y][sage.x].type;
    if (t === 'hut' || t === 'village') sage.needs.hunger = clamp(sage.needs.hunger - 0.4, 0, 100);
  }

  if (sage.dialogueTimer > 0) { sage.dialogueTimer--; if (sage.dialogueTimer <= 0) { sage.dialogue = null; sage.conversationPartner = null; } }

  sage.stateTimer--;

  // Movement
  if (sage.state === 'walking') {
    const dx = sage.targetX - sage.x;
    const dy = sage.targetY - sage.y;
    if (Math.abs(dx) + Math.abs(dy) <= 1) sage.stateTimer = 0;
    else {
      let nx = sage.x, ny = sage.y;
      if (Math.abs(dx) > Math.abs(dy)) nx += dx > 0 ? 1 : -1;
      else ny += dy > 0 ? 1 : -1;
      nx = clamp(nx, 0, MAP_WIDTH - 1);
      ny = clamp(ny, 0, MAP_HEIGHT - 1);
      if (WALKABLE.includes(world.tiles[ny][nx].type)) { sage.x = nx; sage.y = ny; }
      else sage.stateTimer = 0;
    }
  }

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
