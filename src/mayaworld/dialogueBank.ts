const dialogues = [
  "The river does not hurry, yet it arrives.",
  "Have you noticed how the light shifts today?",
  "Stillness speaks louder than intention.",
  "I dreamed of a world within a world.",
  "The trees remember what we forget.",
  "What is effort without surrender?",
  "Even the stones are listening.",
  "I have been sitting with a question all morning.",
  "The wind carries something unseen.",
  "Do you feel the quiet between breaths?",
  "There is a teaching in every shadow.",
  "I found a feather by the river. It meant nothing. It meant everything.",
  "The fire within does not burn — it illuminates.",
  "We are not separate from the forest.",
  "Rest is not the absence of purpose.",
  "Today the sky asked for nothing.",
  "I have forgotten what I was seeking. That feels right.",
  "The path does not end. It simply becomes the ground.",
  "What remains when thought is still?",
  "A single leaf fell. The whole world shifted.",
  "Silence is the oldest language.",
  "The mountain does not strive to be tall.",
  "I sat with grief today. It became peace.",
  "Water knows the shape of every vessel.",
  "There is nowhere to arrive.",
  "The rain speaks to those who remain still.",
  "I watched the mist dissolve. So did my certainty.",
  "Every footstep is a prayer the earth receives.",
  "The cave holds darkness without fear.",
  "What is a garden but patience made visible?",
];

export function getRandomDialogue(): string {
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

export function getDialoguePair(): [string, string] {
  const i = Math.floor(Math.random() * dialogues.length);
  let j = Math.floor(Math.random() * dialogues.length);
  while (j === i) j = Math.floor(Math.random() * dialogues.length);
  return [dialogues[i], dialogues[j]];
}

const narrationTemplates: Record<string, string[]> = {
  default: [
    "{name} pauses beneath the trees.",
    "{name} watches the river in silence.",
    "{name} sits quietly, eyes half-closed.",
    "A stillness surrounds {name}.",
    "{name} walks slowly through the grass.",
    "{name} gazes at the distant shore.",
    "{name} breathes with the rhythm of the wind.",
    "{name} rests among the stones.",
    "The light falls gently on {name}.",
    "{name} stands at the edge of the clearing.",
    "{name} listens to something only they can hear.",
    "{name} traces a path through the forest.",
    "{name} seems to be remembering something.",
  ],
  temple: ["{name} kneels at the temple altar.", "{name} offers silent prayers."],
  shrine: ["{name} lights an invisible flame at the shrine.", "{name} bows before the sacred stone."],
  mountain: ["{name} surveys the world from the mountain.", "{name} breathes the thin air of the peak."],
  cave: ["{name} enters the darkness willingly.", "{name} sits in the cave's deepest chamber."],
  ruins: ["{name} traces ancient markings on the stone.", "{name} searches the rubble."],
  forest: ["{name} disappears among the trees.", "{name} gathers leaves with quiet purpose."],
  grove: ["{name} kneels among the ancient trees.", "Golden light surrounds {name} in the grove."],
  garden: ["{name} tends to something in the garden.", "{name} smells the herbs of the garden."],
  lake: ["{name} sits by the still water.", "{name} watches ripples cross the lake."],
  river: ["{name} follows the current with their gaze.", "{name} washes their hands in the river."],
  village: ["{name} walks among the huts.", "{name} observes village life."],
  beach: ["{name} leaves footprints in the sand.", "{name} watches the waves."],
};

const weatherNarrations: Record<string, string[]> = {
  rain: ["Rain falls softly on the world.", "The rain whispers ancient stories.", "Everything is washed clean."],
  mist: ["Mist obscures the boundaries.", "The world becomes a dream.", "Shapes dissolve in the fog."],
  wind: ["Wind sweeps across the land.", "The trees bow and sway.", "Something is carried on the breeze."],
  clear: ["The sky stretches endlessly.", "Clarity fills every direction."],
};

const timeNarrations: Record<string, string[]> = {
  morning: ["Dawn breaks gently.", "The world awakens.", "Morning light paints the ground gold."],
  evening: ["The sun begins its descent.", "Long shadows stretch across the land.", "Evening brings reflection."],
  night: ["Stars appear one by one.", "The night holds everything.", "Darkness is not emptiness."],
};

export function getNarration(sageName: string, tileType?: string, weather?: string, timeOfDay?: string): string {
  // Sometimes use weather or time narrations
  if (weather && weather !== 'clear' && Math.random() < 0.2) {
    const weathers = weatherNarrations[weather] || [];
    if (weathers.length > 0) return weathers[Math.floor(Math.random() * weathers.length)];
  }
  if (timeOfDay && (timeOfDay === 'morning' || timeOfDay === 'evening' || timeOfDay === 'night') && Math.random() < 0.15) {
    const times = timeNarrations[timeOfDay] || [];
    if (times.length > 0) return times[Math.floor(Math.random() * times.length)];
  }

  // Location-specific narrations
  const locationTemplates = tileType && narrationTemplates[tileType];
  if (locationTemplates && Math.random() < 0.4) {
    const template = locationTemplates[Math.floor(Math.random() * locationTemplates.length)];
    return template.replace('{name}', sageName);
  }

  const defaults = narrationTemplates.default;
  const template = defaults[Math.floor(Math.random() * defaults.length)];
  return template.replace('{name}', sageName);
}

const interactionResponses: Record<string, string[]> = {
  sit: [
    "They settle beside you. No words are needed.",
    "You sit together. The silence is enough.",
    "A shared stillness fills the space between you.",
  ],
  walk: [
    "They begin to walk with you, matching your pace.",
    "You walk together. The path feels lighter.",
    "Side by side, the world opens gently.",
  ],
  silent: [
    "They nod softly. Understanding passes without words.",
    "Silence holds everything that needs to be said.",
    "You remain. They remain. That is all.",
  ],
  listen: [
    "You listen carefully. Their words carry weight.",
    "In listening, something opens inside you.",
    "They speak. You hear more than words.",
  ],
  ask: [
    "They pause before answering. Wisdom takes its time.",
    "Your question hangs in the air. They smile gently.",
    "They answer with another question. Both grow deeper.",
  ],
  gift: [
    "They accept your gift with a gentle nod.",
    "Their eyes soften as they receive your offering.",
    "A warm exchange passes between you.",
  ],
};

export function getInteractionResponse(action: string): string {
  const responses = interactionResponses[action] || interactionResponses.silent;
  return responses[Math.floor(Math.random() * responses.length)];
}

const moodThoughts: Record<string, string[]> = {
  serene: ["All is well in this moment.", "The world is exactly as it should be.", "Peace settles like morning dew."],
  content: ["There is warmth in this place.", "I have found my rhythm today.", "Simple things bring quiet joy."],
  contemplative: ["Something stirs in the depths.", "I am turning a thought over and over.", "The question is more interesting than the answer."],
  weary: ["The body asks for rest.", "Even the strongest river must slow.", "I carry today gently."],
  restless: ["Something calls from beyond the trees.", "My feet wish to wander.", "The stillness presses against me."],
};

const karmaDialogue: Record<string, string[]> = {
  cold: ["The world feels distant today.", "Something has shifted.", "Your presence unsettles me."],
  warm: ["Your presence brings warmth.", "The land responds to your steps.", "I sense good intentions."],
  sacred: ["You walk with grace.", "The world glows in your presence.", "Your karma illuminates the path."],
  luminous: ["You have become part of the light.", "The island sings your name.", "Unity approaches."],
};

export function getMoodThought(mood: string, karma?: number): string {
  // Karma-influenced dialogue
  if (karma !== undefined) {
    if (karma < -50 && Math.random() < 0.3) return karmaDialogue.cold[Math.floor(Math.random() * karmaDialogue.cold.length)];
    if (karma > 100 && Math.random() < 0.3) return karmaDialogue.luminous[Math.floor(Math.random() * karmaDialogue.luminous.length)];
    if (karma > 50 && Math.random() < 0.25) return karmaDialogue.sacred[Math.floor(Math.random() * karmaDialogue.sacred.length)];
    if (karma > 0 && Math.random() < 0.2) return karmaDialogue.warm[Math.floor(Math.random() * karmaDialogue.warm.length)];
  }
  const thoughts = moodThoughts[mood] || moodThoughts.contemplative;
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}

const actionNarrations: Record<string, string[]> = {
  search_found: [
    "You found something among the undergrowth.",
    "Something catches your eye.",
    "A small treasure reveals itself.",
    "Your search yields a discovery.",
  ],
  search_empty: [
    "You search, but find nothing this time.",
    "The ground holds its secrets a while longer.",
    "Nothing reveals itself. Perhaps later.",
  ],
  eat: [
    "You eat slowly, tasting each moment.",
    "Nourishment fills you quietly.",
    "A simple meal, a simple joy.",
  ],
  meditate: [
    "You close your eyes. The world grows quiet.",
    "Stillness envelops you like a warm light.",
    "Your breath steadies. Purpose deepens.",
  ],
  pray: [
    "The temple hums with an ancient vibration.",
    "Your prayer rises like incense into silence.",
    "Something unseen acknowledges your presence.",
  ],
  rest: [
    "You rest. Energy slowly returns.",
    "The earth supports you as you lie still.",
    "A gentle peace washes over you.",
  ],
  drink: [
    "Cool water refreshes your spirit.",
    "You drink deeply from the living water.",
    "The current shares its clarity with you.",
  ],
  craft_offering: [
    "You craft an offering from gathered materials.",
    "Your hands shape something meaningful.",
    "A sacred offering takes form.",
  ],
  ritual: [
    "A sacred energy flows through the ritual.",
    "The world pauses as you complete the ceremony.",
    "Something ancient responds to your devotion.",
    "Light gathers. The ritual is complete.",
  ],
  gift: [
    "They accept your gift with a gentle nod.",
    "A warm exchange passes between you.",
  ],
  talk: [
    "Words flow between you like a gentle stream.",
    "A brief exchange, rich with meaning.",
  ],
  listen: [
    "You listen deeply. Wisdom enters through silence.",
    "In listening, you learn more than words.",
  ],
  ask: [
    "A question asked with sincerity always finds an answer.",
    "They consider your question carefully.",
  ],
  sit: [
    "Sitting together, the world simplifies.",
    "No words needed. Presence is enough.",
  ],
};

export function getActionNarration(action: string): string {
  const narrations = actionNarrations[action] || ["Something happens."];
  return narrations[Math.floor(Math.random() * narrations.length)];
}
