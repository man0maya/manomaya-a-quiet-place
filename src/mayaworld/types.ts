export type TileType = 'water' | 'sand' | 'grass' | 'tall_grass' | 'forest' | 'stone' | 'stone_path'
  | 'hut' | 'river' | 'clearing' | 'mountain' | 'temple' | 'flower' | 'grove' | 'beach'
  | 'ruins' | 'lake' | 'bridge' | 'cave' | 'garden' | 'village' | 'shrine';

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

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  karma: number;
  wisdom: number;
  insight: number;
  bond: number;
}

export interface PersonalityWeights {
  curiosity: number;
  calm: number;
  movementTendency: number;
  spiritualDepth: number;
}

export type SageState = 'walking' | 'resting' | 'meditating' | 'observing' | 'conversing' | 'acting';
export type Mood = 'serene' | 'restless' | 'content' | 'weary' | 'contemplative';
export type SimMode = 'observe' | 'authority';
export type SageAction = 'eat' | 'rest' | 'drink' | 'meditate' | 'pray' | 'gift' | 'talk' | 'search' | 'explore' | 'craft_offering' | 'ritual' | 'listen' | 'ask' | 'sit';

export type Weather = 'clear' | 'rain' | 'mist' | 'wind';
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export interface Item {
  id: string;
  name: string;
  type: 'fruit' | 'offering' | 'artifact' | 'flower' | 'herb' | 'water' | 'meal' | 'scroll' | 'stone' | 'crystal' | 'leaf';
  description: string;
}

export interface ResourceDef {
  item: Item;
  rarity: number;
}

export interface LocationAura {
  mysticalValue: number;
  resources: ResourceDef[];
}

export interface DroppedItem {
  x: number;
  y: number;
  item: Item;
}

export interface Moment {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xpReward: number;
  karmaReward: number;
  wisdomReward: number;
  bondReward: number;
  checkFn: string; // key to check function
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
  relationship: number; // bond with player 0-100
}

export interface World {
  tiles: Tile[][];
  width: number;
  height: number;
  sages: Sage[];
  tick: number;
  dayPhase: number;
  droppedItems: DroppedItem[];
  weather: Weather;
  weatherTimer: number;
  timeOfDay: TimeOfDay;
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
  needsSage?: boolean;
  description: string;
  karmaEffect?: number;
}
