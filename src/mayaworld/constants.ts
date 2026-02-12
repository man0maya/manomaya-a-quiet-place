import { PersonalityWeights, LocationAura, ActionDef, Item } from './types';

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 16;

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
  water: '#3868A0',
  sand: '#E8D8A8',
  grass: '#58A848',
  forest: '#206030',
  stone: '#888880',
  hut: '#8B6B4A',
  river: '#4888B8',
  clearing: '#90C870',
  mountain: '#707878',
  temple: '#C04040',
  flower: '#68B058',
  grove: '#185828',
  beach: '#E8D098',
  ruins: '#787070',
  lake: '#3060A0',
};

export const TICKS_PER_SECOND = 4;
export const DAY_CYCLE_TICKS = 1200;
export const NARRATION_INTERVAL_MIN = 32;
export const NARRATION_INTERVAL_MAX = 60;
export const INTERACT_DISTANCE = 2;
export const MOVE_COOLDOWN_MS = 180; // grid-snap movement cooldown

// Items database
export const ITEMS: Record<string, Item> = {
  fruit: { id: 'fruit', name: 'Forest Fruit', type: 'fruit', description: 'A ripe fruit from the canopy' },
  herb: { id: 'herb', name: 'Wild Herb', type: 'herb', description: 'A fragrant herb from the forest floor' },
  sacred_flower: { id: 'sacred_flower', name: 'Sacred Flower', type: 'flower', description: 'A luminous blossom from a sacred grove' },
  petal: { id: 'petal', name: 'Petal', type: 'flower', description: 'A soft petal carried by the wind' },
  nectar: { id: 'nectar', name: 'Nectar', type: 'fruit', description: 'Sweet nectar gathered from blossoms' },
  prayer_bead: { id: 'prayer_bead', name: 'Prayer Bead', type: 'artifact', description: 'A polished bead from the temple' },
  mantra_scroll: { id: 'mantra_scroll', name: 'Mantra Scroll', type: 'scroll', description: 'An ancient mantra inscribed on bark' },
  artifact: { id: 'artifact', name: 'Ancient Artifact', type: 'artifact', description: 'A relic from forgotten times' },
  crystal: { id: 'crystal', name: 'Mountain Crystal', type: 'artifact', description: 'A clear crystal from the peak' },
  purified_water: { id: 'purified_water', name: 'Purified Water', type: 'water', description: 'Water blessed by the current' },
  cooked_meal: { id: 'cooked_meal', name: 'Cooked Meal', type: 'meal', description: 'A warm meal prepared with care' },
  offering: { id: 'offering', name: 'Crafted Offering', type: 'offering', description: 'A sacred offering assembled from gathered materials' },
};

export const LOCATION_AURAS: Partial<Record<string, LocationAura>> = {
  forest: { mysticalValue: 30, resources: [{ item: ITEMS.fruit, rarity: 0.35 }, { item: ITEMS.herb, rarity: 0.15 }] },
  grove: { mysticalValue: 70, resources: [{ item: ITEMS.sacred_flower, rarity: 0.2 }, { item: ITEMS.nectar, rarity: 0.1 }] },
  temple: { mysticalValue: 90, resources: [{ item: ITEMS.prayer_bead, rarity: 0.3 }, { item: ITEMS.mantra_scroll, rarity: 0.08 }] },
  ruins: { mysticalValue: 60, resources: [{ item: ITEMS.artifact, rarity: 0.1 }] },
  mountain: { mysticalValue: 50, resources: [{ item: ITEMS.crystal, rarity: 0.15 }] },
  flower: { mysticalValue: 40, resources: [{ item: ITEMS.petal, rarity: 0.4 }, { item: ITEMS.nectar, rarity: 0.15 }] },
  lake: { mysticalValue: 45, resources: [{ item: ITEMS.purified_water, rarity: 0.35 }] },
  river: { mysticalValue: 35, resources: [{ item: ITEMS.purified_water, rarity: 0.3 }] },
  hut: { mysticalValue: 20, resources: [{ item: ITEMS.cooked_meal, rarity: 0.4 }] },
  clearing: { mysticalValue: 55, resources: [] },
};

export const ACTION_DEFS: ActionDef[] = [
  { id: 'search', label: 'Search', tileTypes: ['forest', 'grove', 'ruins', 'mountain', 'flower', 'beach'], description: 'Look for items nearby' },
  { id: 'eat', label: 'Eat', tileTypes: ['hut', 'grass', 'clearing', 'forest', 'grove', 'sand', 'beach', 'stone', 'flower', 'mountain', 'ruins', 'temple', 'lake', 'river'], description: 'Consume a fruit or meal' },
  { id: 'meditate', label: 'Meditate', tileTypes: ['clearing', 'grove', 'temple', 'mountain'], description: 'Sit in stillness' },
  { id: 'pray', label: 'Pray', tileTypes: ['temple', 'grove', 'clearing'], description: 'Offer a prayer' },
  { id: 'rest', label: 'Rest', tileTypes: ['hut', 'clearing', 'grass', 'sand', 'beach', 'grove'], description: 'Restore your energy' },
  { id: 'drink', label: 'Drink', tileTypes: ['lake', 'river'], description: 'Drink from the water' },
  { id: 'craft_offering', label: 'Craft Offering', tileTypes: ['temple', 'clearing', 'hut'], description: 'Combine items into an offering' },
  { id: 'gift', label: 'Gift', tileTypes: ['grass', 'clearing', 'sand', 'forest', 'grove', 'hut', 'stone', 'beach', 'flower', 'mountain', 'ruins', 'temple'], needsSage: true, description: 'Give an item to a sage' },
  { id: 'talk', label: 'Talk', tileTypes: ['grass', 'clearing', 'sand', 'forest', 'grove', 'hut', 'stone', 'beach', 'flower', 'mountain', 'ruins', 'temple'], needsSage: true, description: 'Speak with a sage' },
];
