import { World, SimMode, Sage } from './types';
import { generateWorld } from './worldGenerator';
import { tickSage, isWalkable } from './agentEngine';
import { TICKS_PER_SECOND, MAP_WIDTH, MAP_HEIGHT } from './constants';

export interface Session {
  world: World;
  boundSageName: string;
  intervalId: number | null;
  running: boolean;
  mode: SimMode;
  keysDown: Set<string>;
}

export function createSession(boundSageName: string): Session {
  const world = generateWorld();
  return { world, boundSageName, intervalId: null, running: false, mode: 'observe', keysDown: new Set() };
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

  let dx = 0, dy = 0;
  if (session.keysDown.has('ArrowUp') || session.keysDown.has('w') || session.keysDown.has('W')) dy = -1;
  if (session.keysDown.has('ArrowDown') || session.keysDown.has('s') || session.keysDown.has('S')) dy = 1;
  if (session.keysDown.has('ArrowLeft') || session.keysDown.has('a') || session.keysDown.has('A')) dx = -1;
  if (session.keysDown.has('ArrowRight') || session.keysDown.has('d') || session.keysDown.has('D')) dx = 1;

  if (dx === 0 && dy === 0) {
    bound.state = 'observing';
    return;
  }

  bound.state = 'walking';
  const nx = bound.x + dx;
  const ny = bound.y + dy;
  if (isWalkable(session.world, nx, ny)) {
    bound.x = nx;
    bound.y = ny;
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

    // Handle authority movement
    handleAuthorityMovement(session);

    // Tick all sages
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

export function handleTapMove(session: Session, worldX: number, worldY: number) {
  if (session.mode !== 'authority') return;
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return;

  // Set target for tap-to-move — we'll move one step per tick toward it
  const tx = Math.floor(worldX);
  const ty = Math.floor(worldY);
  if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
    bound.targetX = tx;
    bound.targetY = ty;
    bound.state = 'walking';
    // Override: let the normal walking logic handle it by un-flagging userControlled momentarily
    // Actually, for tap-to-move we use a different approach: store target and move toward it
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
