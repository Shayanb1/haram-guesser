export const wordsByCategory = {
  'Food & Drink': ['pork', 'alcohol', 'drugs', 'blood', 'carrion', 'donkey meat'],
  'Financial': ['riba', 'gambling', 'bribery', 'fraud', 'stealing'],
  'Speech': ['lying', 'backbiting', 'slander', 'arrogance'],
  'Worship': ['shirk', 'black magic', 'astrology', 'fortune telling'],
  'Entertainment': ['pornography', 'animal fighting'],
  'Body': ['tattoos', 'silk (for men)', 'gold (for men)'],
};

export const allWords = Object.values(wordsByCategory).flat();

export function randomWord() {
  return allWords[Math.floor(Math.random() * allWords.length)];
}
