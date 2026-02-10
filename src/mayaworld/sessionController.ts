import { World, CoConsciousPrompt, Sage } from './types';
import { generateWorld } from './worldGenerator';
import { tickSage } from './agentEngine';
import { TICKS_PER_SECOND, CO_CONSCIOUS_INTERVAL, MAP_WIDTH, MAP_HEIGHT } from './constants';

const WALKABLE = ['grass', 'sand', 'clearing', 'stone', 'hut'];

export interface Session {
  world: World;
  boundSageName: string;
  intervalId: number | null;
  running: boolean;
}

export function createSession(boundSageName: string): Session {
  const world = generateWorld();
  return { world, boundSageName, intervalId: null, running: false };
}

export function startSession(
  session: Session,
  onTick: (world: World) => void,
  onPrompt: (prompt: CoConsciousPrompt) => void
) {
  session.running = true;
  let ticksSincePrompt = Math.floor(Math.random() * 60); // stagger first prompt

  session.intervalId = window.setInterval(() => {
    if (!session.running) return;

    const world = session.world;
    world.tick++;
    world.dayPhase = (world.tick % 1200) / 1200;

    // Tick all sages
    for (const sage of world.sages) {
      tickSage(sage, world);
    }

    // Co-conscious prompts
    ticksSincePrompt++;
    if (ticksSincePrompt >= CO_CONSCIOUS_INTERVAL) {
      ticksSincePrompt = 0;
      const bound = world.sages.find(s => s.name === session.boundSageName);
      if (bound) {
        const prompt = generatePrompt(bound, world);
        if (prompt) onPrompt(prompt);
      }
    }

    onTick(world);
  }, 1000 / TICKS_PER_SECOND);
}

export function stopSession(session: Session) {
  session.running = false;
  if (session.intervalId !== null) {
    clearInterval(session.intervalId);
    session.intervalId = null;
  }
}

function findNearbyOfType(world: World, sx: number, sy: number, type: string, radius: number = 8): { x: number; y: number } | null {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = sx + dx, ny = sy + dy;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && world.tiles[ny][nx].type === type) {
        return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function pickRandomWalkable(world: World): { x: number; y: number } {
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * MAP_WIDTH);
    const y = Math.floor(Math.random() * MAP_HEIGHT);
    if (WALKABLE.includes(world.tiles[y][x].type)) return { x, y };
  }
  return { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
}

function generatePrompt(sage: Sage, world: World): CoConsciousPrompt | null {
  const options: CoConsciousPrompt['options'] = [];

  const river = findNearbyOfType(world, sage.x, sage.y, 'river');
  if (river) {
    options.push({
      label: 'Sit by the river',
      action: () => { sage.state = 'observing'; sage.targetX = river.x; sage.targetY = river.y; sage.stateTimer = 30; }
    });
  }

  const forest = findNearbyOfType(world, sage.x, sage.y, 'forest');
  if (forest) {
    options.push({
      label: 'Walk toward the forest',
      action: () => { sage.state = 'walking'; sage.targetX = forest.x; sage.targetY = forest.y; sage.stateTimer = 30; }
    });
  }

  const clearing = findNearbyOfType(world, sage.x, sage.y, 'clearing');
  if (clearing) {
    options.push({
      label: 'Meditate in the clearing',
      action: () => { sage.state = 'meditating'; sage.targetX = clearing.x; sage.targetY = clearing.y; sage.stateTimer = 40; }
    });
  }

  const others = world.sages.filter(s => s.name !== sage.name);
  const nearby = others.find(s => Math.abs(s.x - sage.x) + Math.abs(s.y - sage.y) < 10);
  if (nearby) {
    options.push({
      label: `Visit ${nearby.name}`,
      action: () => { sage.state = 'walking'; sage.targetX = nearby.x; sage.targetY = nearby.y; sage.stateTimer = 30; }
    });
  }

  options.push({
    label: 'Rest beneath a tree',
    action: () => { sage.state = 'resting'; sage.stateTimer = 30; }
  });

  // Wander option
  const wander = pickRandomWalkable(world);
  options.push({
    label: 'Continue along the path',
    action: () => { sage.state = 'walking'; sage.targetX = wander.x; sage.targetY = wander.y; sage.stateTimer = 25; }
  });

  // Pick 3 random from available
  const shuffled = options.sort(() => Math.random() - 0.5).slice(0, 3);
  if (shuffled.length < 2) return null;

  return { options: shuffled, timer: 60 };
}
