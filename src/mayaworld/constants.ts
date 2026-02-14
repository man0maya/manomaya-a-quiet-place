import { PersonalityWeights, LocationAura, ActionDef, Item, Moment, PlayerStats } from './types';

export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
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
  { name: 'Bhrigu', temperament: 'fiery', description: 'grounded observer', color: '#E8A838', robeColor: '#C48A20', personality: { curiosity: 0.4, calm: 0.7, movementTendency: 0.4, spiritualDepth: 0.8 } },
  { name: 'Pulastya', temperament: 'social', description: 'wandering thinker', color: '#7EC8A0', robeColor: '#5AA878', personality: { curiosity: 0.7, calm: 0.3, movementTendency: 0.8, spiritualDepth: 0.5 } },
  { name: 'Pulaha', temperament: 'gentle', description: 'gentle listener', color: '#A0C4E8', robeColor: '#80A4C8', personality: { curiosity: 0.3, calm: 0.8, movementTendency: 0.3, spiritualDepth: 0.7 } },
  { name: 'Kratu', temperament: 'resolute', description: 'disciplined mover', color: '#C89078', robeColor: '#A87058', personality: { curiosity: 0.5, calm: 0.4, movementTendency: 0.9, spiritualDepth: 0.6 } },
  { name: 'Angiras', temperament: 'luminous', description: 'curious explorer', color: '#E8D070', robeColor: '#C8B050', personality: { curiosity: 0.9, calm: 0.3, movementTendency: 0.7, spiritualDepth: 0.5 } },
  { name: 'Marichi', temperament: 'radiant', description: 'keeper of silence', color: '#F0C060', robeColor: '#D0A040', personality: { curiosity: 0.3, calm: 0.9, movementTendency: 0.2, spiritualDepth: 0.95 } },
  { name: 'Atri', temperament: 'contemplative', description: 'empathic healer', color: '#B0A0D8', robeColor: '#9080B8', personality: { curiosity: 0.5, calm: 0.7, movementTendency: 0.4, spiritualDepth: 0.8 } },
  { name: 'Vashistha', temperament: 'wise', description: 'steady teacher', color: '#D8C8A0', robeColor: '#B8A880', personality: { curiosity: 0.4, calm: 0.8, movementTendency: 0.3, spiritualDepth: 0.9 } },
  { name: 'Daksha', temperament: 'industrious', description: 'structured organizer', color: '#A8B890', robeColor: '#889870', personality: { curiosity: 0.6, calm: 0.4, movementTendency: 0.6, spiritualDepth: 0.4 } },
];

export const TILE_COLORS: Record<string, string> = {
  water: '#284870',
  sand: '#E8D8A8',
  grass: '#48A040',
  tall_grass: '#388830',
  forest: '#1A5828',
  stone: '#787878',
  stone_path: '#989088',
  hut: '#8B6B4A',
  river: '#3878B0',
  clearing: '#78C060',
  mountain: '#606868',
  temple: '#B83030',
  flower: '#58A848',
  grove: '#0F4820',
  beach: '#E8D098',
  ruins: '#686060',
  lake: '#285898',
  bridge: '#8B6840',
  cave: '#383038',
  garden: '#60A850',
  village: '#A89070',
  shrine: '#C8A050',
};

export const TICKS_PER_SECOND = 5;
export const DAY_CYCLE_TICKS = 2400; // longer day cycle
export const NARRATION_INTERVAL_MIN = 24;
export const NARRATION_INTERVAL_MAX = 48;
export const INTERACT_DISTANCE = 2;
export const MOVE_COOLDOWN_MS = 160;
export const WEATHER_CHANGE_MIN = 600;
export const WEATHER_CHANGE_MAX = 1800;

// XP table
export const XP_TABLE: number[] = [
  0, 20, 50, 100, 180, 280, 400, 560, 750, 1000,
  1300, 1650, 2050, 2500, 3000, 3600, 4300, 5100, 6000, 7000
];

export const LEVEL_UNLOCKS: Record<number, string> = {
  2: 'Faster walk',
  3: 'Invite sages',
  5: 'Group meditation',
  7: 'Hidden zones revealed',
  10: 'Weather influence',
  12: 'Aura vision',
  15: 'World reshaping',
  20: 'Unity state',
};

export function createDefaultStats(): PlayerStats {
  return { level: 1, xp: 0, xpToNext: XP_TABLE[1], karma: 0, wisdom: 0, insight: 0, bond: 0 };
}

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
  crystal: { id: 'crystal', name: 'Mountain Crystal', type: 'crystal', description: 'A clear crystal from the peak' },
  purified_water: { id: 'purified_water', name: 'Purified Water', type: 'water', description: 'Water blessed by the current' },
  cooked_meal: { id: 'cooked_meal', name: 'Cooked Meal', type: 'meal', description: 'A warm meal prepared with care' },
  offering: { id: 'offering', name: 'Crafted Offering', type: 'offering', description: 'A sacred offering assembled from gathered materials' },
  wisdom_stone: { id: 'wisdom_stone', name: 'Wisdom Stone', type: 'stone', description: 'A stone that holds ancient knowledge' },
  memory_leaf: { id: 'memory_leaf', name: 'Memory Leaf', type: 'leaf', description: 'A leaf that remembers what was' },
  insight_crystal: { id: 'insight_crystal', name: 'Insight Crystal', type: 'crystal', description: 'A crystal that reveals inner truth' },
  sacred_water: { id: 'sacred_water', name: 'Sacred Water', type: 'water', description: 'Water from the sacred spring' },
};

export const LOCATION_AURAS: Partial<Record<string, LocationAura>> = {
  forest: { mysticalValue: 30, resources: [{ item: ITEMS.fruit, rarity: 0.3 }, { item: ITEMS.herb, rarity: 0.15 }, { item: ITEMS.memory_leaf, rarity: 0.05 }] },
  tall_grass: { mysticalValue: 15, resources: [{ item: ITEMS.herb, rarity: 0.2 }] },
  grove: { mysticalValue: 70, resources: [{ item: ITEMS.sacred_flower, rarity: 0.2 }, { item: ITEMS.nectar, rarity: 0.1 }] },
  temple: { mysticalValue: 90, resources: [{ item: ITEMS.prayer_bead, rarity: 0.3 }, { item: ITEMS.mantra_scroll, rarity: 0.08 }] },
  shrine: { mysticalValue: 85, resources: [{ item: ITEMS.prayer_bead, rarity: 0.25 }, { item: ITEMS.wisdom_stone, rarity: 0.1 }] },
  ruins: { mysticalValue: 60, resources: [{ item: ITEMS.artifact, rarity: 0.1 }, { item: ITEMS.insight_crystal, rarity: 0.05 }] },
  cave: { mysticalValue: 55, resources: [{ item: ITEMS.crystal, rarity: 0.2 }, { item: ITEMS.insight_crystal, rarity: 0.08 }] },
  mountain: { mysticalValue: 50, resources: [{ item: ITEMS.crystal, rarity: 0.15 }, { item: ITEMS.wisdom_stone, rarity: 0.06 }] },
  flower: { mysticalValue: 40, resources: [{ item: ITEMS.petal, rarity: 0.4 }, { item: ITEMS.nectar, rarity: 0.15 }] },
  garden: { mysticalValue: 45, resources: [{ item: ITEMS.herb, rarity: 0.35 }, { item: ITEMS.sacred_flower, rarity: 0.08 }] },
  lake: { mysticalValue: 45, resources: [{ item: ITEMS.purified_water, rarity: 0.35 }, { item: ITEMS.sacred_water, rarity: 0.05 }] },
  river: { mysticalValue: 35, resources: [{ item: ITEMS.purified_water, rarity: 0.3 }] },
  hut: { mysticalValue: 20, resources: [{ item: ITEMS.cooked_meal, rarity: 0.4 }] },
  village: { mysticalValue: 25, resources: [{ item: ITEMS.cooked_meal, rarity: 0.3 }] },
  clearing: { mysticalValue: 55, resources: [{ item: ITEMS.memory_leaf, rarity: 0.08 }] },
};

const ALL_WALK_TILES: any[] = ['grass', 'tall_grass', 'sand', 'clearing', 'stone', 'stone_path', 'hut', 'beach', 'flower', 'grove', 'mountain', 'ruins', 'temple', 'bridge', 'cave', 'garden', 'village', 'shrine'];

export const ACTION_DEFS: ActionDef[] = [
  { id: 'search', label: 'Search', tileTypes: ['forest', 'tall_grass', 'grove', 'ruins', 'mountain', 'flower', 'beach', 'cave', 'garden', 'shrine'], description: 'Look for items nearby', karmaEffect: 1 },
  { id: 'eat', label: 'Eat', tileTypes: ALL_WALK_TILES, description: 'Consume a fruit or meal', karmaEffect: 0 },
  { id: 'meditate', label: 'Meditate', tileTypes: ['clearing', 'grove', 'temple', 'mountain', 'shrine', 'cave', 'garden'], description: 'Sit in stillness', karmaEffect: 3 },
  { id: 'pray', label: 'Pray', tileTypes: ['temple', 'shrine', 'grove', 'clearing'], description: 'Offer a prayer', karmaEffect: 5 },
  { id: 'rest', label: 'Rest', tileTypes: ['hut', 'clearing', 'grass', 'sand', 'beach', 'grove', 'village', 'garden'], description: 'Restore your energy', karmaEffect: 0 },
  { id: 'drink', label: 'Drink', tileTypes: ['lake', 'river'], description: 'Drink from the water', karmaEffect: 1 },
  { id: 'ritual', label: 'Ritual', tileTypes: ['temple', 'shrine', 'clearing', 'grove'], description: 'Perform a sacred ritual', karmaEffect: 10 },
  { id: 'craft_offering', label: 'Craft Offering', tileTypes: ['temple', 'clearing', 'hut', 'shrine', 'village'], description: 'Combine items into an offering', karmaEffect: 5 },
  { id: 'listen', label: 'Listen', tileTypes: ALL_WALK_TILES, needsSage: true, description: 'Listen carefully to a sage', karmaEffect: 3 },
  { id: 'ask', label: 'Ask', tileTypes: ALL_WALK_TILES, needsSage: true, description: 'Ask a sage a question', karmaEffect: 1 },
  { id: 'sit', label: 'Sit Together', tileTypes: ALL_WALK_TILES, needsSage: true, description: 'Sit in silence with a sage', karmaEffect: 4 },
  { id: 'gift', label: 'Gift', tileTypes: ALL_WALK_TILES, needsSage: true, description: 'Give an item to a sage', karmaEffect: 5 },
  { id: 'talk', label: 'Talk', tileTypes: ALL_WALK_TILES, needsSage: true, description: 'Speak with a sage', karmaEffect: 2 },
];

// Moments (quests)
export const MOMENTS: Moment[] = [
  { id: 'walk_pulaha', title: 'Walk Pulaha to the River', description: 'Guide Pulaha to a river tile', completed: false, xpReward: 15, karmaReward: 5, wisdomReward: 2, bondReward: 3, checkFn: 'walk_pulaha' },
  { id: 'meditate_shrine', title: 'Meditate at a Shrine', description: 'Meditate at any shrine tile', completed: false, xpReward: 20, karmaReward: 8, wisdomReward: 5, bondReward: 0, checkFn: 'meditate_shrine' },
  { id: 'sit_marichi', title: 'Sit with Marichi in the Cave', description: 'Sit near Marichi on a cave tile', completed: false, xpReward: 25, karmaReward: 10, wisdomReward: 5, bondReward: 5, checkFn: 'sit_marichi' },
  { id: 'help_daksha', title: 'Help Daksha Organize Herbs', description: 'Gift an herb to Daksha', completed: false, xpReward: 20, karmaReward: 8, wisdomReward: 3, bondReward: 5, checkFn: 'help_daksha' },
  { id: 'join_atri', title: "Join Atri's Healing Circle", description: 'Perform a ritual near Atri', completed: false, xpReward: 30, karmaReward: 12, wisdomReward: 8, bondReward: 5, checkFn: 'join_atri' },
  { id: 'follow_angiras', title: 'Follow Angiras to a Hidden Valley', description: 'Be on a grove tile near Angiras', completed: false, xpReward: 25, karmaReward: 5, wisdomReward: 5, bondReward: 3, checkFn: 'follow_angiras' },
  { id: 'collect_5', title: 'Gather Five Items', description: 'Collect 5 items in your inventory', completed: false, xpReward: 15, karmaReward: 3, wisdomReward: 2, bondReward: 0, checkFn: 'collect_5' },
  { id: 'first_offering', title: 'Create Your First Offering', description: 'Craft an offering at a temple', completed: false, xpReward: 20, karmaReward: 10, wisdomReward: 5, bondReward: 0, checkFn: 'first_offering' },
];

// Karma thresholds
export const KARMA_THRESHOLDS = {
  cold: -50,
  neutral: 0,
  warm: 50,
  sacred: 100,
  luminous: 150,
};
