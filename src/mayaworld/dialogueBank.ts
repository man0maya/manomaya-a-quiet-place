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
  "The stars do not compete for brightness.",
  "I am learning to be unhurried.",
  "What blooms in darkness needs no witness.",
  "Each step is both beginning and end.",
  "The bird sings not for applause.",
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

// Narration templates for Observe mode
const narrationTemplates = [
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
  "The world moves around {name}, unhurried.",
  "{name} seems to be remembering something.",
  "{name} finds a quiet place by the water.",
];

export function getNarration(sageName: string): string {
  const template = narrationTemplates[Math.floor(Math.random() * narrationTemplates.length)];
  return template.replace('{name}', sageName);
}

// Interaction responses for Authority mode
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
};

export function getInteractionResponse(action: string): string {
  const responses = interactionResponses[action] || interactionResponses.silent;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Mood-based thoughts for interaction panel
const moodThoughts: Record<string, string[]> = {
  serene: ["All is well in this moment.", "The world is exactly as it should be.", "Peace settles like morning dew."],
  content: ["There is warmth in this place.", "I have found my rhythm today.", "Simple things bring quiet joy."],
  contemplative: ["Something stirs in the depths.", "I am turning a thought over and over.", "The question is more interesting than the answer."],
  weary: ["The body asks for rest.", "Even the strongest river must slow.", "I carry today gently."],
  restless: ["Something calls from beyond the trees.", "My feet wish to wander.", "The stillness presses against me."],
};

export function getMoodThought(mood: string): string {
  const thoughts = moodThoughts[mood] || moodThoughts.contemplative;
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}
