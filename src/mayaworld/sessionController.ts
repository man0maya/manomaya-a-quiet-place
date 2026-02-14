import { World, SimMode, Sage, SageAction, Item, PlayerStats, Moment } from './types';
import { generateWorld } from './worldGenerator';
import { tickSage, isWalkable, performAction, updateWorldCycle } from './agentEngine';
import { TICKS_PER_SECOND, MAP_WIDTH, MAP_HEIGHT, MOVE_COOLDOWN_MS, ACTION_DEFS, LOCATION_AURAS, createDefaultStats, XP_TABLE, MOMENTS } from './constants';

export interface Session {
  world: World;
  boundSageName: string;
  intervalId: number | null;
  running: boolean;
  mode: SimMode;
  keysDown: Set<string>;
  lastMoveTime: number;
  showInventory: boolean;
  stats: PlayerStats;
  moments: Moment[];
  completedMomentIds: Set<string>;
  lastAction: SageAction | null;
  lastActionTile: string | null;
  lastGiftTarget: string | null;
}

export function createSession(boundSageName: string): Session {
  const world = generateWorld();
  return {
    world, boundSageName, intervalId: null, running: false,
    mode: 'observe', keysDown: new Set(), lastMoveTime: 0, showInventory: false,
    stats: createDefaultStats(),
    moments: MOMENTS.map(m => ({ ...m })),
    completedMomentIds: new Set(),
    lastAction: null, lastActionTile: null, lastGiftTarget: null,
  };
}

export function setMode(session: Session, mode: SimMode) {
  session.mode = mode;
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (bound) {
    bound.userControlled = mode === 'authority';
    if (mode === 'authority') bound.state = 'walking';
  }
}

export function addXP(session: Session, amount: number): boolean {
  session.stats.xp += amount;
  if (session.stats.level < 20 && session.stats.xp >= session.stats.xpToNext) {
    session.stats.level++;
    session.stats.xpToNext = XP_TABLE[session.stats.level] || 9999;
    return true; // leveled up
  }
  return false;
}

export function addKarma(session: Session, amount: number) {
  session.stats.karma += amount;
}

// Check moments
export function checkMoments(session: Session): Moment | null {
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return null;
  const tileType = session.world.tiles[bound.y]?.[bound.x]?.type;

  for (const moment of session.moments) {
    if (moment.completed || session.completedMomentIds.has(moment.id)) continue;

    let pass = false;
    switch (moment.checkFn) {
      case 'walk_pulaha': {
        const pulaha = session.world.sages.find(s => s.name === 'Pulaha');
        if (pulaha && Math.abs(bound.x - pulaha.x) + Math.abs(bound.y - pulaha.y) <= 3) {
          const pTile = session.world.tiles[pulaha.y]?.[pulaha.x]?.type;
          if (pTile === 'river' || tileType === 'river') pass = true;
        }
        break;
      }
      case 'meditate_shrine':
        if (session.lastAction === 'meditate' && (tileType === 'shrine' || session.lastActionTile === 'shrine')) pass = true;
        break;
      case 'sit_marichi': {
        const marichi = session.world.sages.find(s => s.name === 'Marichi');
        if (marichi && Math.abs(bound.x - marichi.x) + Math.abs(bound.y - marichi.y) <= 2 && tileType === 'cave' && session.lastAction === 'sit') pass = true;
        break;
      }
      case 'help_daksha':
        if (session.lastAction === 'gift' && session.lastGiftTarget === 'Daksha') pass = true;
        break;
      case 'join_atri': {
        const atri = session.world.sages.find(s => s.name === 'Atri');
        if (atri && Math.abs(bound.x - atri.x) + Math.abs(bound.y - atri.y) <= 3 && session.lastAction === 'ritual') pass = true;
        break;
      }
      case 'follow_angiras': {
        const angiras = session.world.sages.find(s => s.name === 'Angiras');
        if (angiras && Math.abs(bound.x - angiras.x) + Math.abs(bound.y - angiras.y) <= 3 && tileType === 'grove') pass = true;
        break;
      }
      case 'collect_5':
        if (bound.inventory.length >= 5) pass = true;
        break;
      case 'first_offering':
        if (session.lastAction === 'craft_offering') pass = true;
        break;
    }

    if (pass) {
      moment.completed = true;
      session.completedMomentIds.add(moment.id);
      session.stats.wisdom += moment.wisdomReward;
      session.stats.bond += moment.bondReward;
      addKarma(session, moment.karmaReward);
      addXP(session, moment.xpReward);
      return moment;
    }
  }
  return null;
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
    updateWorldCycle(world);
    handleAuthorityMovement(session);
    for (const sage of world.sages) tickSage(sage, world);
    onTick(world);
  }, 1000 / TICKS_PER_SECOND);
}

export function stopSession(session: Session) {
  session.running = false;
  if (session.intervalId !== null) { clearInterval(session.intervalId); session.intervalId = null; }
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
    if (d <= 3 && d < nearestDist) { nearestDist = d; nearest = sage; }
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
    if (!def.tileTypes.includes(tileType as any)) continue;
    if (def.needsSage && !nearSage) continue;
    if (def.id === 'eat' && !bound.inventory.some(i => i.type === 'fruit' || i.type === 'meal')) continue;
    if (def.id === 'gift' && bound.inventory.length === 0) continue;
    if (def.id === 'craft_offering' && bound.inventory.length < 2) continue;
    if (def.id === 'ritual' && bound.inventory.length === 0) continue; // need at least 1 item
    actions.push({ action: def.id, label: def.label, description: def.description });
  }
  return actions;
}

export function executeAction(session: Session, action: SageAction): { narrationKey: string; item?: Item; karmaChange: number } {
  const bound = session.world.sages.find(s => s.name === session.boundSageName);
  if (!bound) return { narrationKey: 'search_empty', karmaChange: 0 };
  const nearSage = getNearestSage(session) || undefined;
  const result = performAction(bound, action, session.world, nearSage);

  // Track for moments
  session.lastAction = action;
  session.lastActionTile = session.world.tiles[bound.y]?.[bound.x]?.type || null;
  if (action === 'gift' && nearSage) session.lastGiftTarget = nearSage.name;

  // Karma
  const def = ACTION_DEFS.find(d => d.id === action);
  const karmaChange = def?.karmaEffect || 0;
  addKarma(session, karmaChange);
  addXP(session, Math.max(1, Math.floor(karmaChange / 2)));

  return { ...result, karmaChange };
}
