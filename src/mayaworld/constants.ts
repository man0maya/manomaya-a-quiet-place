import { PersonalityWeights } from './types';

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

export interface SageDefinition {
  name: string;
  temperament: string;
  description: string;
  color: string;
  robeColor: string;
  personality: PersonalityWeights;
}

export const SAGE_DEFINITIONS: SageDefinition[] = [
  { name: 'Bhrigu', temperament: 'fiery', description: 'grounded observer', color: '#E8A838', robeColor: '#C48A20', personality: { curiosity: 0.4, calm: 0.7, movementTendency: 0.4 } },
  { name: 'Pulastya', temperament: 'social', description: 'wandering thinker', color: '#7EC8A0', robeColor: '#5AA878', personality: { curiosity: 0.7, calm: 0.3, movementTendency: 0.8 } },
  { name: 'Pulaha', temperament: 'gentle', description: 'gentle listener', color: '#A0C4E8', robeColor: '#80A4C8', personality: { curiosity: 0.3, calm: 0.8, movementTendency: 0.3 } },
  { name: 'Kratu', temperament: 'resolute', description: 'disciplined mover', color: '#C89078', robeColor: '#A87058', personality: { curiosity: 0.5, calm: 0.4, movementTendency: 0.9 } },
  { name: 'Angiras', temperament: 'luminous', description: 'curious explorer', color: '#E8D070', robeColor: '#C8B050', personality: { curiosity: 0.9, calm: 0.3, movementTendency: 0.7 } },
  { name: 'Marichi', temperament: 'radiant', description: 'quiet contemplator', color: '#F0C060', robeColor: '#D0A040', personality: { curiosity: 0.3, calm: 0.9, movementTendency: 0.2 } },
  { name: 'Atri', temperament: 'contemplative', description: 'empathic presence', color: '#B0A0D8', robeColor: '#9080B8', personality: { curiosity: 0.5, calm: 0.7, movementTendency: 0.4 } },
  { name: 'Vashistha', temperament: 'wise', description: 'steady guide', color: '#D8C8A0', robeColor: '#B8A880', personality: { curiosity: 0.4, calm: 0.8, movementTendency: 0.3 } },
  { name: 'Daksha', temperament: 'industrious', description: 'structured planner', color: '#A8B890', robeColor: '#889870', personality: { curiosity: 0.6, calm: 0.4, movementTendency: 0.6 } },
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
export const DAY_CYCLE_TICKS = 1200;
export const NARRATION_INTERVAL_MIN = 32; // ~8 seconds
export const NARRATION_INTERVAL_MAX = 60; // ~15 seconds
export const INTERACT_DISTANCE = 2;
