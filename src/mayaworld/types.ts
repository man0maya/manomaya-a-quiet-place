export type TileType = 'water' | 'sand' | 'grass' | 'forest' | 'stone' | 'hut' | 'river' | 'clearing';

export interface Tile {
  type: TileType;
  x: number;
  y: number;
}

export interface Needs {
  energy: number;
  hunger: number;
  social: number;
  purpose: number;
}

export interface PersonalityWeights {
  curiosity: number;   // 0-1, affects exploration tendency
  calm: number;        // 0-1, affects meditation/rest preference
  movementTendency: number; // 0-1, affects how often they walk
}

export type SageState = 'walking' | 'resting' | 'meditating' | 'observing' | 'conversing';
export type Mood = 'serene' | 'restless' | 'content' | 'weary' | 'contemplative';
export type SimMode = 'observe' | 'authority';

export interface Sage {
  name: string;
  temperament: string;
  description: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  needs: Needs;
  personality: PersonalityWeights;
  state: SageState;
  mood: Mood;
  color: string;
  dialogue: string | null;
  dialogueTimer: number;
  stateTimer: number;
  conversationPartner: string | null;
  userControlled: boolean;
}

export interface World {
  tiles: Tile[][];
  width: number;
  height: number;
  sages: Sage[];
  tick: number;
  dayPhase: number;
}

export interface InteractionOption {
  label: string;
  responseKey: string;
}

export interface NarrationEvent {
  text: string;
  timer: number;
}
