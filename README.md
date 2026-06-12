# Haram or Not? 🎮

A two-player terminal word-guessing game. One player picks a secret word from a curated list of haram things; the other asks yes/no questions powered by the Claude API to figure out what it is.

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Shayanb1/haram-guesser.git
cd haram-guesser
npm install
```

### 2. Configure API key

```bash
cp .env.example .env
```

Open `.env` and replace `your_api_key_here` with your [Anthropic API key](https://console.anthropic.com/).

### 3. Run the game

```bash
node index.js
```

## How to play

**Player vs Computer** is fully playable. At the start:
- The computer secretly picks a random haram word.
- You pick your own secret word from the same list.

On **your turn**, type either:
- A yes/no question: `Is it something you eat?`
- A guess: `guess: pork`

On the **computer's turn**, Claude generates a strategic question about your word, gets an automatic answer, and attempts a guess every 3 questions.

First side to correctly guess the other's word wins.

## Word list

| Category | Words |
|---|---|
| Food & Drink | pork, alcohol, drugs, blood, carrion, donkey meat |
| Financial | riba, gambling, bribery, fraud, stealing |
| Speech | lying, backbiting, slander, arrogance |
| Worship | shirk, black magic, astrology, fortune telling |
| Entertainment | pornography, animal fighting |
| Body | tattoos, silk (for men), gold (for men) |

## Requirements

- Node.js 18+
- An Anthropic API key
