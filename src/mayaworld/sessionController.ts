import { World, SimMode, Sage, SageAction, Item } from './types';
import { generateWorld } from './worldGenerator';
import { tickSage, isWalkable, performAction } from './agentEngine';
import { TICKS_PER_SECOND, MAP_WIDTH, MAP_HEIGHT, MOVE_COOLDOWN_MS, ACTION_DEFS, LOCATION_AURAS } from './constants';

export interface Session {
  world: World;
  boundSageName: string;
  intervalId: number | null;
  running: boolean;
  mode: SimMode;
  keysDown: Set<string>;
  lastMoveTime: number;
  showInventory: boolean;
}

export function createSession(boundSageName: string): Session {
  const world = generateWorld();
  return {
    world, boundSageName, intervalId: null, running: false,
    mode: 'observe', keysDown: new Set(), lastMoveTime: 0, showInventory: false,
  };
}

export function setMode(session: Session, mode: SimMode) {
  session.mode = mode;
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (bound) {
    bound.userControlled = mode === 'authority';
    if (mode === 'authority') {
      bound.state = 'walking';
    }
  }
}

function handleAuthorityMovement(session: Session) {
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound || session.mode !== 'authority') return;

  const now = performance.now();
  if (now - session.lastMoveTime < MOVE_COOLDOWN_MS) return;

  let dx = 0, dy = 0;
  if (session.keysDown.has('ArrowUp') || session.keysDown.has('w') || session.keysDown.has('W')) dy = -1;
  else if (session.keysDown.has('ArrowDown') || session.keysDown.has('s') || session.keysDown.has('S')) dy = 1;
  else if (session.keysDown.has('ArrowLeft') || session.keysDown.has('a') || session.keysDown.has('A')) dx = -1;
  else if (session.keysDown.has('ArrowRight') || session.keysDown.has('d') || session.keysDown.has('D')) dx = 1;

  if (dx === 0 && dy === 0) {
    if (bound.state === 'walking') bound.state = 'observing';
    return;
  }

  bound.state = 'walking';
  const nx = bound.x + dx;
  const ny = bound.y + dy;
  if (isWalkable(session.world, nx, ny)) {
    bound.x = nx;
    bound.y = ny;
    session.lastMoveTime = now;

    // Pick up dropped items
    const itemIdx = session.world.droppedItems.findIndex(d => d.x === nx && d.y === ny);
    if (itemIdx >= 0) {
      bound.inventory.push(session.world.droppedItems[itemIdx].item);
      session.world.droppedItems.splice(itemIdx, 1);
    }
  }
}

export function startSession(
  session: Session,
  onTick: (world: World) => void
) {
  session.running = true;

  session.intervalId = window.setInterval(() => {
    if (!session.running) return;

    const world = session.world;
    world.tick++;
    world.dayPhase = (world.tick % 1200) / 1200;

    handleAuthorityMovement(session);

    for (const sage of world.sages) {
      tickSage(sage, world);
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

export function getNearestSage(session: Session): Sage | null {
  if (session.mode !== 'authority') return null;
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return null;

  let nearest: Sage | null = null;
  let nearestDist = Infinity;
  for (const sage of session.world.sages) {
    if (sage.name === session.boundSageName) continue;
    const d = Math.abs(sage.x - bound.x) + Math.abs(sage.y - bound.y);
    if (d <= 3 && d < nearestDist) {
      nearestDist = d;
      nearest = sage;
    }
  }
  return nearest;
}

export function getAvailableActions(session: Session): { action: SageAction; label: string; description: string }[] {
  if (session.mode !== 'authority') return [];
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return [];

  const tileType = session.world.tiles[bound.y]?.[bound.x]?.type;
  if (!tileType) return [];

  const nearSage = getNearestSage(session);
  const actions: { action: SageAction; label: string; description: string }[] = [];

  for (const def of ACTION_DEFS) {
    if (!def.tileTypes.includes(tileType)) continue;
    if (def.needsSage && !nearSage) continue;

    // Check prerequisites
    if (def.id === 'eat') {
      if (!bound.inventory.some(i => i.type === 'fruit' || i.type === 'meal')) continue;
    }
    if (def.id === 'gift') {
      if (bound.inventory.length === 0) continue;
    }
    if (def.id === 'craft_offering') {
      if (bound.inventory.length < 2) continue;
    }

    actions.push({ action: def.id, label: def.label, description: def.description });
  }

  return actions;
}

export function executeAction(session: Session, action: SageAction): { narrationKey: string; item?: Item } {
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return { narrationKey: 'search_empty' };

  const nearSage = getNearestSage(session) || undefined;
  return performAction(bound, action, session.world, nearSage);
}
