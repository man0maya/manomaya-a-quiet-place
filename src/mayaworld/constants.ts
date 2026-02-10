export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 24;

export const ACCESS_CODES: Record<string, string> = {
  '1111': 'Bhrigu',
  '2222': 'Pulastya',
  '3333': 'Pulaha',
  '4444': 'Kratu',
  '5555': 'Angiras',
  '6666': 'Marichi',
  '7777': 'Atri',
  '8888': 'Vashistha',
  '9999': 'Daksha',
};

export const SAGE_DEFINITIONS = [
  { name: 'Bhrigu', temperament: 'fiery', color: '#E8A838' },
  { name: 'Pulastya', temperament: 'social', color: '#7EC8A0' },
  { name: 'Pulaha', temperament: 'gentle', color: '#A0C4E8' },
  { name: 'Kratu', temperament: 'resolute', color: '#C89078' },
  { name: 'Angiras', temperament: 'luminous', color: '#E8D070' },
  { name: 'Marichi', temperament: 'radiant', color: '#F0C060' },
  { name: 'Atri', temperament: 'contemplative', color: '#B0A0D8' },
  { name: 'Vashistha', temperament: 'wise', color: '#D8C8A0' },
  { name: 'Daksha', temperament: 'industrious', color: '#A8B890' },
];

export const TILE_COLORS: Record<string, string> = {
  water: '#4A90B8',
  sand: '#E8D8A8',
  grass: '#6AB060',
  forest: '#2D7040',
  stone: '#98908A',
  hut: '#8B6B4A',
  river: '#5898C0',
  clearing: '#C8D8A0',
};

export const TICKS_PER_SECOND = 4;
export const CO_CONSCIOUS_INTERVAL = 120; // ticks (~30s)
export const CO_CONSCIOUS_TIMEOUT = 60; // ticks (~15s)
export const DAY_CYCLE_TICKS = 1200; // ~5 minutes
