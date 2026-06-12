import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

function formatHistory(history) {
  if (!history.length) return 'No questions asked yet.';
  return history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n');
}

export async function answerQuestion(secretWord, question) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 10,
    messages: [{
      role: 'user',
      content: `The secret word is "${secretWord}". Answer this yes/no question about it strictly: "${question}"\n\nReply with ONLY one word: Yes, No, or Sometimes. Nothing else.`,
    }],
  });
  const raw = msg.content[0].text.trim();
  // Normalize to one of the three valid answers
  if (/^yes/i.test(raw)) return 'Yes';
  if (/^sometimes/i.test(raw)) return 'Sometimes';
  return 'No';
}

export async function generateComputerQuestion(playerWord, history) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `You are playing a word-guessing game called "Haram or Not?". You need to guess the player's secret word by asking strategic yes/no questions.\n\nQuestion history so far:\n${formatHistory(history)}\n\nAsk ONE new, strategic yes/no question to narrow down the word. Reply with ONLY the question — no preamble, no explanation.`,
    }],
  });
  return msg.content[0].text.trim();
}

export async function answerComputerQuestion(playerWord, question) {
  return answerQuestion(playerWord, question);
}

export async function makeComputerGuess(wordList, history) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 30,
    messages: [{
      role: 'user',
      content: `You are playing a word-guessing game. The secret word is from this list:\n${wordList.join(', ')}\n\nQuestion/answer history:\n${formatHistory(history)}\n\nBased on the answers, what is your single best guess? Reply with ONLY the exact word or phrase from the list above — nothing else.`,
    }],
  });
  return msg.content[0].text.trim().toLowerCase();
}
