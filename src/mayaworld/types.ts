export type TileType = 'water' | 'sand' | 'grass' | 'forest' | 'stone' | 'hut' | 'river' | 'clearing'
  | 'mountain' | 'temple' | 'flower' | 'grove' | 'beach' | 'ruins' | 'lake';

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
  curiosity: number;
  calm: number;
  movementTendency: number;
}

export type SageState = 'walking' | 'resting' | 'meditating' | 'observing' | 'conversing' | 'acting';
export type Mood = 'serene' | 'restless' | 'content' | 'weary' | 'contemplative';
export type SimMode = 'observe' | 'authority';
export type SageAction = 'eat' | 'rest' | 'drink' | 'meditate' | 'pray' | 'gift' | 'talk' | 'search' | 'explore' | 'craft_offering';

export interface Item {
  id: string;
  name: string;
  type: 'fruit' | 'offering' | 'artifact' | 'flower' | 'herb' | 'water' | 'meal' | 'scroll';
  description: string;
}

export interface ResourceDef {
  item: Item;
  rarity: number; // 0-1, chance per search
}

export interface LocationAura {
  mysticalValue: number; // 0-100
  resources: ResourceDef[];
}

export interface DroppedItem {
  x: number;
  y: number;
  item: Item;
}

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
  inventory: Item[];
  currentAction: SageAction | null;
}

export interface World {
  tiles: Tile[][];
  width: number;
  height: number;
  sages: Sage[];
  tick: number;
  dayPhase: number;
  droppedItems: DroppedItem[];
}

export interface InteractionOption {
  label: string;
  responseKey: string;
}

export interface NarrationEvent {
  text: string;
  timer: number;
}

export interface ActionDef {
  id: SageAction;
  label: string;
  tileTypes: TileType[];
  needsSage?: boolean; // requires nearby sage
  description: string;
}
