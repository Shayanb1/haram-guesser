import chalk from 'chalk';
import { createInterface } from 'readline/promises';

export const rl = createInterface({ input: process.stdin, output: process.stdout });

export async function ask(prompt) {
  return rl.question(prompt);
}

export function header() {
  console.log('\n' + chalk.green('═'.repeat(52)));
  console.log(chalk.green.bold('  HARAM OR NOT?  —  Word Guessing Game'));
  console.log(chalk.green('═'.repeat(52)) + '\n');
}

export function divider() {
  console.log(chalk.gray('─'.repeat(52)));
}

export function printTurnBanner(turn, turnNumber) {
  console.log('\n' + chalk.yellow('═'.repeat(52)));
  if (turn === 'player') {
    console.log(chalk.yellow.bold(`  TURN ${turnNumber} — YOUR TURN`));
  } else {
    console.log(chalk.cyan.bold(`  TURN ${turnNumber} — COMPUTER'S TURN`));
  }
  console.log(chalk.yellow('═'.repeat(52)));
}

export function printLog(playerHistory, computerHistory) {
  if (!playerHistory.length && !computerHistory.length) return;
  divider();
  console.log(chalk.bold('  QUESTION LOG'));
  divider();

  const allEvents = [
    ...playerHistory.map(h => ({ ...h, who: 'You' })),
    ...computerHistory.map(h => ({ ...h, who: 'Computer' })),
  ].sort((a, b) => a.turn - b.turn);

  for (const e of allEvents) {
    const who = e.who === 'You' ? chalk.yellow(e.who) : chalk.cyan(e.who);
    console.log(`  ${who} asked: ${chalk.white(e.question)}`);
    console.log(`  ${chalk.gray('Answer:')} ${chalk.bold(e.answer)}\n`);
  }
  divider();
}

export function printComputerGuess(guess, correct, computerWord) {
  console.log('\n' + chalk.cyan.bold(`  Computer guesses: "${guess}"`));
  if (correct) {
    console.log(chalk.red.bold('  Computer got it right!'));
  } else {
    console.log(chalk.green(`  Wrong guess — computer moves on.`));
  }
}

export function printWin(computerWord, playerWord) {
  console.log('\n' + chalk.green('★'.repeat(52)));
  console.log(chalk.green.bold('  YOU WIN! 🎉'));
  console.log(chalk.green('★'.repeat(52)));
  console.log(`  Computer's secret word was: ${chalk.bold.red(computerWord)}`);
  console.log(`  Your secret word was:       ${chalk.bold.yellow(playerWord)}`);
  console.log('');
}

export function printLose(computerWord, playerWord) {
  console.log('\n' + chalk.red('★'.repeat(52)));
  console.log(chalk.red.bold('  YOU LOSE! The computer guessed your word.'));
  console.log(chalk.red('★'.repeat(52)));
  console.log(`  Computer's secret word was: ${chalk.bold.red(computerWord)}`);
  console.log(`  Your secret word was:       ${chalk.bold.yellow(playerWord)}`);
  console.log('');
}

export function printWordList(wordsByCategory) {
  console.log(chalk.bold('\n  Available words:'));
  for (const [category, words] of Object.entries(wordsByCategory)) {
    console.log(`  ${chalk.gray(category + ':')} ${words.join(', ')}`);
  }
  console.log('');
}
