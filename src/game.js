import chalk from 'chalk';
import { allWords, wordsByCategory, randomWord } from './wordList.js';
import {
  answerQuestion,
  generateComputerQuestion,
  answerComputerQuestion,
  makeComputerGuess,
} from './claudeApi.js';
import {
  ask,
  rl,
  header,
  divider,
  printTurnBanner,
  printLog,
  printComputerGuess,
  printWin,
  printLose,
  printWordList,
} from './ui.js';

export async function runPvC() {
  header();

  // Pick words
  const computerWord = randomWord();

  printWordList(wordsByCategory);
  console.log(chalk.bold('  Choose your secret word from the list above.'));
  console.log(chalk.gray('  (The computer will try to guess it.)\n'));

  let playerWord = '';
  while (true) {
    playerWord = (await ask('  Your secret word: ')).trim().toLowerCase();
    if (allWords.includes(playerWord)) break;
    console.log(chalk.red('  Word not in list. Try again.'));
  }

  console.log(chalk.green('\n  Both words chosen. Let\'s play!\n'));
  console.log(chalk.gray('  On your turn: type a yes/no question, or type  guess: <word>  to guess.\n'));

  const playerHistory = []; // player asked → answered about computerWord
  const computerHistory = []; // computer asked → answered about playerWord
  let turnNumber = 0;
  let computerQuestionCount = 0;

  while (true) {
    turnNumber++;

    // ── PLAYER TURN ────────────────────────────────────────────
    printTurnBanner('player', turnNumber);
    printLog(playerHistory, computerHistory);
    console.log(chalk.gray(`  Computer's word: ${chalk.bold('???')}`));
    console.log('');

    const input = (await ask('  Your move: ')).trim();

    if (input.toLowerCase().startsWith('guess:')) {
      const guessed = input.slice(6).trim().toLowerCase();
      if (guessed === computerWord) {
        printWin(computerWord, playerWord);
        rl.close();
        return;
      } else {
        console.log(chalk.red(`\n  Wrong! "${guessed}" is not the word. Keep asking.\n`));
        continue; // player used their turn on a wrong guess, computer still goes
      }
    } else {
      // It's a question
      console.log(chalk.gray('\n  Asking Claude...'));
      const answer = await answerQuestion(computerWord, input);
      playerHistory.push({ question: input, answer, turn: turnNumber });
      console.log(`  ${chalk.bold('Answer:')} ${chalk.green.bold(answer)}\n`);
    }

    // ── COMPUTER TURN ──────────────────────────────────────────
    printTurnBanner('computer', turnNumber);
    console.log(chalk.gray('  Computer is thinking...\n'));

    const computerQuestion = await generateComputerQuestion(playerWord, computerHistory);
    const computerAnswer = await answerComputerQuestion(playerWord, computerQuestion);
    computerQuestionCount++;
    computerHistory.push({ question: computerQuestion, answer: computerAnswer, turn: turnNumber });

    console.log(`  ${chalk.cyan.bold('Computer asks:')} ${computerQuestion}`);
    console.log(`  ${chalk.bold('Answer:')} ${chalk.yellow.bold(computerAnswer)}\n`);

    // Computer guesses every 3 questions
    if (computerQuestionCount % 3 === 0) {
      console.log(chalk.cyan('  Computer is making a guess...\n'));
      const guess = await makeComputerGuess(allWords, computerHistory);
      const correct = guess === playerWord || playerWord.includes(guess) || guess.includes(playerWord);

      printComputerGuess(guess, correct, computerWord);

      if (correct) {
        printLose(computerWord, playerWord);
        rl.close();
        return;
      }
    }
  }
}
