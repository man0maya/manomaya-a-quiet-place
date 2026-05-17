// src/mayaworld/tileContexts.ts
// Sacred tile contexts — name, symbol, aura, and action display map

export interface TileContext {
  name: string;
  symbol: string;
  aura: string;
  accentColor: string;
}

export const TILE_CONTEXTS: Record<string, TileContext> = {
  river:       { name: 'Sacred River',    symbol: '🌊', aura: 'The river does not hurry, yet it arrives.',               accentColor: 'rgba(58,98,130,0.85)' },
  lake:        { name: 'Still Lake',      symbol: '💧', aura: 'Even the deepest lake reflects the sky above.',            accentColor: 'rgba(40,78,120,0.85)' },
  water:       { name: 'Open Water',      symbol: '💧', aura: 'Water finds its level, always.',                           accentColor: 'rgba(40,78,120,0.85)' },
  temple:      { name: 'Ancient Temple',  symbol: '🛕', aura: 'The stone remembers every prayer ever offered here.',      accentColor: 'rgba(154,126,90,0.85)' },
  shrine:      { name: 'Forest Shrine',   symbol: '✦',  aura: 'Even the smallest lamp holds something sacred.',           accentColor: 'rgba(168,136,64,0.85)' },
  forest:      { name: 'Old Forest',      symbol: '🌲', aura: 'The trees have been here longer than memory.',             accentColor: 'rgba(48,78,42,0.85)' },
  grove:       { name: 'Sacred Grove',    symbol: '🌿', aura: 'Light moves differently in this place.',                   accentColor: 'rgba(40,62,34,0.85)' },
  clearing:    { name: 'Open Clearing',   symbol: '◯',  aura: 'Sky above, earth below, stillness between.',               accentColor: 'rgba(106,142,82,0.85)' },
  mountain:    { name: 'Mountain Path',   symbol: '⛰',  aura: 'The mountain does not strive to be tall.',                 accentColor: 'rgba(106,102,96,0.85)' },
  ruins:       { name: 'Ancient Ruins',   symbol: '🗿', aura: 'What remains when everything else falls away?',            accentColor: 'rgba(112,96,80,0.85)' },
  cave:        { name: 'Dark Cave',       symbol: '◉',  aura: 'Even darkness has its own quality of stillness.',          accentColor: 'rgba(48,40,48,0.90)' },
  garden:      { name: 'Garden',          symbol: '🌸', aura: 'Someone tended this place with great patience.',           accentColor: 'rgba(88,134,72,0.85)' },
  flower:      { name: 'Flower Meadow',   symbol: '❀',  aura: 'Beauty does not ask for permission to exist.',             accentColor: 'rgba(96,122,72,0.85)' },
  grass:       { name: 'Open Grassland',  symbol: '⊹',  aura: 'The grass bends. The grass endures.',                      accentColor: 'rgba(90,122,66,0.85)' },
  tall_grass:  { name: 'Tall Grass',      symbol: '⊹',  aura: 'Hidden paths run through what seems like wilderness.',     accentColor: 'rgba(74,106,56,0.85)' },
  sand:        { name: 'Sandy Ground',    symbol: '∴',  aura: 'The desert teaches the art of subtraction.',               accentColor: 'rgba(200,184,136,0.85)' },
  beach:       { name: 'River Bank',      symbol: '∿',  aura: 'Where land and water hold their long conversation.',       accentColor: 'rgba(200,184,130,0.85)' },
  village:     { name: 'Village',         symbol: '⌂',  aura: 'Lives carried quietly, one day at a time.',                accentColor: 'rgba(144,120,96,0.85)' },
  hut:         { name: "Hermit's Hut",    symbol: '△',  aura: 'Simplicity chosen freely is not poverty.',                 accentColor: 'rgba(122,94,58,0.85)' },
  stone:       { name: 'Stone Ground',    symbol: '◇',  aura: 'The stone holds every footstep in memory.',               accentColor: 'rgba(114,112,104,0.85)' },
  stone_path:  { name: 'Ancient Path',    symbol: '—',  aura: 'Someone walked this way before you.',                      accentColor: 'rgba(138,132,120,0.85)' },
  bridge:      { name: 'Old Bridge',      symbol: '≈',  aura: 'Every crossing is a small act of courage.',                accentColor: 'rgba(122,96,56,0.85)' },
};

export function getTileContext(tileType: string): TileContext {
  return TILE_CONTEXTS[tileType] ?? {
    name: tileType.replace(/_/g, ' '),
    symbol: '·',
    aura: 'The world holds many unnamed places.',
    accentColor: 'rgba(60,60,60,0.85)',
  };
}

// Per-action display metadata for UI rendering
export interface ActionDisplay {
  symbol: string;
  shortLabel: string;
  karmaText: string;
  karmaPositive: boolean;
  description: string;
}

export const ACTION_DISPLAY: Record<string, ActionDisplay> = {
  drink:          { symbol: '💧', shortLabel: 'Drink',        karmaText: '+1', karmaPositive: true,  description: 'Draw water and drink deeply.' },
  bathe:          { symbol: '🌊', shortLabel: 'Bathe',        karmaText: '+2', karmaPositive: true,  description: 'Cleanse yourself in the current.' },
  meditate:       { symbol: '🧘', shortLabel: 'Meditate',     karmaText: '+3', karmaPositive: true,  description: 'Sit in stillness until the mind quiets.' },
  pray:           { symbol: '🙏', shortLabel: 'Pray',         karmaText: '+5', karmaPositive: true,  description: 'Offer your heart to what is larger.' },
  ritual:         { symbol: '🔥', shortLabel: 'Ritual',       karmaText: '+10',karmaPositive: true,  description: 'Perform a sacred rite with full intention.' },
  craft_offering: { symbol: '⚗',  shortLabel: 'Offering',     karmaText: '+5', karmaPositive: true,  description: 'Combine what you carry into something sacred.' },
  search:         { symbol: '⟡',  shortLabel: 'Gather',       karmaText: '+1', karmaPositive: true,  description: 'Collect what the land offers freely.' },
  rest:           { symbol: '◌',  shortLabel: 'Rest',         karmaText: '·',  karmaPositive: false, description: 'Lay down your burden for a moment.' },
  plant:          { symbol: '🌱', shortLabel: 'Plant',        karmaText: '+3', karmaPositive: true,  description: 'Return something to the earth.' },
  observe_sky:    { symbol: '✦',  shortLabel: 'Watch Sky',    karmaText: '+2', karmaPositive: true,  description: 'Lift your eyes and simply observe.' },
  read_ruins:     { symbol: '📜', shortLabel: 'Read',         karmaText: '+2', karmaPositive: true,  description: 'Trace the ancient markings with your fingers.' },
  explore:        { symbol: '◈',  shortLabel: 'Explore',      karmaText: '+1', karmaPositive: true,  description: 'Move through this place with curiosity.' },
  eat:            { symbol: '🍃', shortLabel: 'Eat',          karmaText: '·',  karmaPositive: false, description: 'Nourish the body that carries you.' },
  // Sage interactions
  sit:            { symbol: '🪷', shortLabel: 'Sit Beside',   karmaText: '+4', karmaPositive: true,  description: 'Sit beside the sage without speaking.' },
  listen:         { symbol: '◎',  shortLabel: 'Listen',       karmaText: '+3', karmaPositive: true,  description: 'Open yourself fully to what is said.' },
  ask:            { symbol: '?',  shortLabel: 'Ask',          karmaText: '+1', karmaPositive: true,  description: 'Voice what you do not yet understand.' },
  silent:         { symbol: '∅',  shortLabel: 'Be Silent',    karmaText: '+2', karmaPositive: true,  description: 'Offer the gift of wordless presence.' },
  gift:           { symbol: '▽',  shortLabel: 'Gift',         karmaText: '+3', karmaPositive: true,  description: 'Give from what you carry.' },
  serve:          { symbol: '⟳',  shortLabel: 'Serve',        karmaText: '+8', karmaPositive: true,  description: 'Put your hands to work for the sage.' },
  walk:           { symbol: '⇢',  shortLabel: 'Walk With',    karmaText: '+2', karmaPositive: true,  description: 'Walk alongside in quiet companionship.' },
  talk:           { symbol: '◉',  shortLabel: 'Speak',        karmaText: '+1', karmaPositive: true,  description: 'Open a conversation.' },
};

// Sage bond thresholds for label display
export function getBondLabel(relationship: number): string {
  if (relationship >= 80) return 'deep';
  if (relationship >= 50) return 'warm';
  if (relationship >= 20) return 'known';
  if (relationship >= 0)  return 'new';
  return 'distant';
}

export function getBondColor(relationship: number): string {
  if (relationship >= 50) return 'hsl(var(--primary))';
  if (relationship >= 20) return 'rgba(212,175,106,0.65)';
  if (relationship >= 0)  return 'rgba(255,255,255,0.35)';
  return 'rgba(220,80,80,0.65)';
}
