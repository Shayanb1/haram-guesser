// ── Word list ────────────────────────────────────────────────
const WORDS_BY_CATEGORY = {
  'Food & Drink': ['pork', 'alcohol', 'drugs', 'blood', 'carrion', 'donkey meat'],
  'Financial':    ['riba', 'gambling', 'bribery', 'fraud', 'stealing'],
  'Speech':       ['lying', 'backbiting', 'slander', 'arrogance'],
  'Worship':      ['shirk', 'black magic', 'astrology', 'fortune telling'],
  'Entertainment':['pornography', 'animal fighting'],
  'Body':         ['tattoos', 'silk (for men)', 'gold (for men)'],
};
const ALL_WORDS = Object.values(WORDS_BY_CATEGORY).flat();

// ── State ────────────────────────────────────────────────────
const state = {
  computerWord: null,
  playerWord: null,
  log: [],            // {who, question, answer, type}
  computerQCount: 0,
  turnNumber: 0,
  gameOver: false,
};

// ── Claude API ───────────────────────────────────────────────
async function callClaude(messages, maxTokens = 80) {
  const key = localStorage.getItem('anthropicApiKey');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text.trim();
}

function formatHistory(log) {
  if (!log.length) return 'No questions yet.';
  return log.map((e, i) => `Q${i+1} (${e.who}): ${e.question}\nA${i+1}: ${e.answer}`).join('\n');
}

async function answerQuestion(secretWord, question) {
  const raw = await callClaude([{
    role: 'user',
    content: `The secret word is "${secretWord}". Answer this yes/no question about it: "${question}"\n\nReply with ONLY one word: Yes, No, or Sometimes. Nothing else.`,
  }], 10);
  if (/^yes/i.test(raw)) return 'Yes';
  if (/^sometimes/i.test(raw)) return 'Sometimes';
  return 'No';
}

async function generateComputerQuestion() {
  return callClaude([{
    role: 'user',
    content: `You are playing a word guessing game called "Haram or Not?". The secret word is something that is considered haram (forbidden in Islam).\n\nQuestion history:\n${formatHistory(state.log.filter(e => e.who === 'Computer'))}\n\nAsk ONE new strategic yes/no question to narrow down the word. Reply with ONLY the question — no preamble.`,
  }], 80);
}

async function makeComputerGuess() {
  const guess = await callClaude([{
    role: 'user',
    content: `You are playing a word guessing game. The secret word is from this list:\n${ALL_WORDS.join(', ')}\n\nQuestion/answer history:\n${formatHistory(state.log.filter(e => e.who === 'Computer'))}\n\nWhat is your best guess? Reply with ONLY the exact word or phrase from the list — nothing else.`,
  }], 30);
  return guess.toLowerCase().replace(/[".]/g, '').trim();
}

// ── UI helpers ───────────────────────────────────────────────
const screens = ['apikey', 'menu', 'setup', 'game', 'result'];

function showScreen(name) {
  screens.forEach(s => {
    document.getElementById(`screen-${s}`).classList.toggle('hidden', s !== name);
  });
}

function setLoading(active, text = 'Thinking...') {
  document.getElementById('loading').classList.toggle('hidden', !active);
  document.getElementById('loading-text').textContent = text;
}

function addLogEntry(entry) {
  state.log.push(entry);
  const container = document.getElementById('log-container');
  document.getElementById('log-empty').style.display = 'none';

  const div = document.createElement('div');
  div.className = `log-entry ${entry.who === 'You' ? 'player-entry' : 'computer-entry'}${entry.type === 'guess' ? ' guess-entry' + (entry.correct ? '' : ' wrong') : ''}`;

  const who = document.createElement('div');
  who.className = 'log-who';
  who.textContent = entry.who + (entry.type === 'guess' ? ' — GUESS' : '');

  const q = document.createElement('div');
  q.className = 'log-question';
  q.textContent = entry.question;

  div.appendChild(who);
  div.appendChild(q);

  if (entry.answer) {
    const a = document.createElement('div');
    a.className = 'log-answer';
    a.textContent = '→ ' + entry.answer;
    div.appendChild(a);
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function setInputDisabled(disabled) {
  document.getElementById('game-input-area').classList.toggle('disabled', disabled);
}

function updateTurnIndicator(whose) {
  const el = document.getElementById('turn-indicator');
  el.textContent = whose === 'player' ? 'Your Turn' : "Computer's Turn";
  el.classList.toggle('computer-turn', whose !== 'player');
}

// ── Game logic ───────────────────────────────────────────────
async function playerAsk(question) {
  if (!question.trim()) return;
  setInputDisabled(true);
  setLoading(true, 'Asking Claude...');

  try {
    const answer = await answerQuestion(state.computerWord, question);
    addLogEntry({ who: 'You', question, answer, type: 'question' });
    document.getElementById('question-input').value = '';
    await computerTurn();
  } catch (err) {
    alert('API error: ' + err.message);
  } finally {
    setLoading(false);
    setInputDisabled(false);
    updateTurnIndicator('player');
  }
}

async function playerGuess(word) {
  setInputDisabled(true);

  if (word === state.computerWord) {
    addLogEntry({ who: 'You', question: `Guess: "${word}"`, answer: 'Correct!', type: 'guess', correct: true });
    endGame('player');
    return;
  }

  addLogEntry({ who: 'You', question: `Guess: "${word}"`, answer: 'Wrong!', type: 'guess', correct: false });
  setLoading(true);

  try {
    await computerTurn();
  } catch (err) {
    alert('API error: ' + err.message);
  } finally {
    setLoading(false);
    setInputDisabled(false);
    updateTurnIndicator('player');
  }
}

async function computerTurn() {
  state.turnNumber++;
  state.computerQCount++;
  updateTurnIndicator('computer');

  setLoading(true, 'Computer is thinking...');
  const question = await generateComputerQuestion();

  setLoading(true, 'Getting answer...');
  const answer = await answerQuestion(state.playerWord, question);

  addLogEntry({ who: 'Computer', question, answer, type: 'question' });

  // Guess every 3 questions
  if (state.computerQCount % 3 === 0) {
    setLoading(true, 'Computer is guessing...');
    const guess = await makeComputerGuess();
    const correct = guess === state.playerWord || state.playerWord.includes(guess) || guess.includes(state.playerWord);
    addLogEntry({ who: 'Computer', question: `Guess: "${guess}"`, answer: correct ? 'Correct!' : 'Wrong!', type: 'guess', correct });

    if (correct) {
      endGame('computer');
    }
  }
}

function endGame(winner) {
  state.gameOver = true;
  setLoading(false);
  setInputDisabled(true);

  document.getElementById('reveal-computer').textContent = state.computerWord;
  document.getElementById('reveal-player').textContent = state.playerWord;
  document.getElementById('computer-word-display').textContent = state.computerWord;

  if (winner === 'player') {
    document.getElementById('result-icon').textContent = '🏆';
    document.getElementById('result-title').textContent = 'You Win!';
    document.getElementById('result-body').textContent = 'You guessed the computer\'s word correctly.';
  } else {
    document.getElementById('result-icon').textContent = '😔';
    document.getElementById('result-title').textContent = 'You Lose!';
    document.getElementById('result-body').textContent = 'The computer guessed your word.';
  }

  setTimeout(() => showScreen('result'), 800);
}

// ── Setup screen ─────────────────────────────────────────────
function buildWordGrid() {
  const grid = document.getElementById('word-grid');
  grid.innerHTML = '';

  for (const [category, words] of Object.entries(WORDS_BY_CATEGORY)) {
    const block = document.createElement('div');
    block.className = 'category-block';

    const label = document.createElement('div');
    label.className = 'category-label';
    label.textContent = category;
    block.appendChild(label);

    const chips = document.createElement('div');
    chips.className = 'word-chips';

    words.forEach(word => {
      const chip = document.createElement('button');
      chip.className = 'word-chip';
      chip.textContent = word;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        document.getElementById('selected-word-display').textContent = word;
        document.querySelector('.selected-hint').classList.remove('hidden');
        document.getElementById('setup-confirm').classList.remove('hidden');
      });
      chips.appendChild(chip);
    });

    block.appendChild(chips);
    grid.appendChild(block);
  }
}

function buildGuessSelect() {
  const sel = document.getElementById('guess-select');
  sel.innerHTML = '';
  ALL_WORDS.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    sel.appendChild(opt);
  });
}

function startGame(playerWord) {
  // Reset state
  state.computerWord = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
  state.playerWord = playerWord;
  state.log = [];
  state.computerQCount = 0;
  state.turnNumber = 0;
  state.gameOver = false;

  // Reset UI
  document.getElementById('log-container').querySelectorAll('.log-entry').forEach(e => e.remove());
  document.getElementById('log-empty').style.display = '';
  document.getElementById('computer-word-display').textContent = '???';
  document.getElementById('player-word-display').textContent = playerWord;
  document.getElementById('question-input').value = '';
  buildGuessSelect();
  updateTurnIndicator('player');
  setInputDisabled(false);

  showScreen('game');
}

// ── Event wiring ─────────────────────────────────────────────
document.getElementById('apikey-submit').addEventListener('click', () => {
  const key = document.getElementById('apikey-input').value.trim();
  if (!key.startsWith('sk-ant-')) {
    alert('That doesn\'t look like a valid Anthropic API key.');
    return;
  }
  localStorage.setItem('anthropicApiKey', key);
  showScreen('menu');
});

document.getElementById('apikey-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('apikey-submit').click();
});

document.getElementById('menu-pvc').addEventListener('click', () => {
  buildWordGrid();
  document.querySelector('.selected-hint').classList.add('hidden');
  document.getElementById('setup-confirm').classList.add('hidden');
  showScreen('setup');
});

document.getElementById('menu-change-key').addEventListener('click', () => {
  document.getElementById('apikey-input').value = '';
  showScreen('apikey');
});

document.getElementById('setup-confirm').addEventListener('click', () => {
  const selected = document.querySelector('.word-chip.selected');
  if (!selected) return;
  startGame(selected.textContent);
});

document.getElementById('ask-btn').addEventListener('click', () => {
  playerAsk(document.getElementById('question-input').value.trim());
});

document.getElementById('question-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('ask-btn').click();
});

document.getElementById('guess-btn').addEventListener('click', () => {
  const word = document.getElementById('guess-select').value;
  playerGuess(word);
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  buildWordGrid();
  document.querySelector('.selected-hint').classList.add('hidden');
  document.getElementById('setup-confirm').classList.add('hidden');
  showScreen('setup');
});

// ── Boot ─────────────────────────────────────────────────────
(function init() {
  const key = localStorage.getItem('anthropicApiKey');
  showScreen(key ? 'menu' : 'apikey');
})();
