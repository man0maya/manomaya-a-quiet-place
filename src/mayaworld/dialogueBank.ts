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
