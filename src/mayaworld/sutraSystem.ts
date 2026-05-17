// src/mayaworld/sutraSystem.ts
// The 9 Sutras — permanent world-reading abilities, one per sage.
// Unlocked when relationship with that sage reaches SUTRA_BOND_THRESHOLD.

export const SUTRA_BOND_THRESHOLD = 80;

export interface SutraDefinition {
  id: string;           // e.g. 'bhrigu_sutra'
  sageName: string;
  sanskritName: string;
  translation: string;
  glyph: string;
  lore: string;         // the teaching paragraph shown on unlock
  effect: string;       // one-line description
  color: string;        // sage's color, used in UI
}

export const SUTRAS: SutraDefinition[] = [
  {
    id: 'bhrigu_sutra',
    sageName: 'Bhrigu',
    sanskritName: 'Karma Drishti',
    translation: 'The Sight of Accumulated Action',
    glyph: '⟐',
    lore: 'Every surface holds the memory of what was done upon it. Look with the eye that Bhrigu opened, and the world reveals its ledger — not as judgment, but as simple truth. Amber ground has known virtue. Dark ground carries its debt.',
    effect: 'High-karma tiles glow amber. Low-karma places darken. The world becomes a living ledger.',
    color: '#E8A838',
  },
  {
    id: 'pulastya_sutra',
    sageName: 'Pulastya',
    sanskritName: 'Sanga Sutra',
    translation: 'The Thread of Connection',
    glyph: '∿',
    lore: 'Pulastya walked between worlds and saw that every being is already in conversation with every other. Nothing is truly alone. This sutra makes the invisible threads of relation shimmer into sight between the nine who walk this land.',
    effect: 'Threads of light connect nearby sages. Where they gather close, the threads glow brightest.',
    color: '#7EC8A0',
  },
  {
    id: 'pulaha_sutra',
    sageName: 'Pulaha',
    sanskritName: 'Sukha Nadi',
    translation: 'The Current of Hidden Joy',
    glyph: '✦',
    lore: 'Pulaha listened to the ground the way others listen to words. The earth speaks constantly of what it holds — water, root, mineral, seed. This sutra lets you hear what the ground is quietly saying beneath your feet.',
    effect: 'Hidden resource nodes shimmer on river, grove, lake, garden, and flower tiles.',
    color: '#A0C4E8',
  },
  {
    id: 'kratu_sutra',
    sageName: 'Kratu',
    sanskritName: 'Marga Darshana',
    translation: 'The Vision of the Path',
    glyph: '⇢',
    lore: 'Kratu never moved without purpose. He saw that between every sacred place there is already a path — trodden by intention, not by feet. This sutra reveals those routes: the lines of power connecting temples and shrines across the world.',
    effect: 'A golden dashed path connects all temples and shrines visible in the world.',
    color: '#C89078',
  },
  {
    id: 'angiras_sutra',
    sageName: 'Angiras',
    sanskritName: 'Jyotir Darshana',
    translation: 'The Seeing of Light Before Light',
    glyph: '✧',
    lore: 'Angiras studied the stars not as distant fires but as letters in a language older than speech. With this sutra, the sky becomes more generous — dawn announces itself early, dusk lingers, and at night the stars pulse with extra life.',
    effect: 'Stars brighten and pulse at night. Pre-dawn and post-dusk have a visible horizon glow.',
    color: '#E8D070',
  },
  {
    id: 'marichi_sutra',
    sageName: 'Marichi',
    sanskritName: 'Mana Sutra',
    translation: 'The Thread of Mind',
    glyph: '◉',
    lore: 'Marichi was so still that the thoughts of others would drift through him like smoke through an open door. He learned to receive without grasping. This sutra makes the running thoughts of every sage faintly visible, even in silence.',
    effect: 'The inner thoughts of all sages drift above them as faint text, even when they are silent.',
    color: '#F0C060',
  },
  {
    id: 'atri_sutra',
    sageName: 'Atri',
    sanskritName: 'Arogya Drishti',
    translation: 'The Sight of Inner Weather',
    glyph: '◈',
    lore: 'Atri healed not by knowing what was broken but by seeing what was whole. He looked at people the way a gardener looks at soil — not for flaw, but for condition. This sutra reveals the inner weather of every sage as a soft aura of color.',
    effect: 'Each sage is surrounded by an aura: gold for content, purple for meditative, blue for seeking, green for joyful.',
    color: '#B0A0D8',
  },
  {
    id: 'vashistha_sutra',
    sageName: 'Vashistha',
    sanskritName: 'Smriti Darshana',
    translation: 'The Vision of What Was',
    glyph: '◌',
    lore: 'Vashistha taught that the ground remembers every foot that pressed it. Memory is not in the mind alone — it is held in stone and soil as surely as in thought. This sutra reveals the trace of your passage as a living golden memory.',
    effect: 'Your footsteps leave a fading golden trail. The oldest marks are barely visible; recent steps glow clearly.',
    color: '#D8C8A0',
  },
  {
    id: 'daksha_sutra',
    sageName: 'Daksha',
    sanskritName: 'Shakti Mapa',
    translation: 'The Map of Living Power',
    glyph: '△',
    lore: 'Daksha organized the world not by naming it but by feeling where the energy was concentrated. He said that power does not hide — it waits to be noticed. This sutra reveals the hum of the world\'s power nodes for those willing to look.',
    effect: 'Temples, shrines, and sacred groves pulse with visible golden energy.',
    color: '#A8B890',
  },
];

export function getSutraForSage(sageName: string): SutraDefinition | undefined {
  return SUTRAS.find(s => s.sageName === sageName);
}

export function isSutraUnlocked(
  unlockedSutras: Set<string>,
  sageName: string,
): boolean {
  return unlockedSutras.has(getSutraForSage(sageName)?.id ?? '');
}
