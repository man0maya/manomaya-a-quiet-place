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

export type SageState = 'walking' | 'resting' | 'meditating' | 'observing' | 'conversing';
export type Mood = 'serene' | 'restless' | 'content' | 'weary' | 'contemplative';

export interface Sage {
  name: string;
  temperament: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  needs: Needs;
  state: SageState;
  mood: Mood;
  color: string;
  dialogue: string | null;
  dialogueTimer: number;
  stateTimer: number;
  conversationPartner: string | null;
}

export interface World {
  tiles: Tile[][];
  width: number;
  height: number;
  sages: Sage[];
  tick: number;
  dayPhase: number; // 0-1, 0=dawn, 0.5=dusk, 1=dawn again
}

export interface CoConsciousPrompt {
  options: { label: string; action: () => void }[];
  timer: number;
}
