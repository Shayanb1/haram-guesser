import 'dotenv/config';
import chalk from 'chalk';
import { ask, rl, header } from './src/ui.js';
import { runPvC } from './src/game.js';

async function showMenu() {
  header();
  console.log(chalk.bold('  Select a game mode:\n'));
  console.log(`  ${chalk.green.bold('[1]')} Player vs Computer`);
  console.log(`  ${chalk.gray('[2]')} Player vs Player (local)  ${chalk.gray('— coming soon')}`);
  console.log(`  ${chalk.red('[0]')} Quit\n`);

  const choice = (await ask('  Your choice: ')).trim();

  if (choice === '1') {
    await runPvC();
    await playAgain();
  } else if (choice === '2') {
    console.log(chalk.yellow('\n  Player vs Player is coming soon! Check back later.\n'));
    await playAgain();
  } else if (choice === '0') {
    console.log(chalk.gray('\n  Goodbye!\n'));
    rl.close();
    process.exit(0);
  } else {
    console.log(chalk.red('\n  Invalid choice. Try again.\n'));
    await showMenu();
  }
}

async function playAgain() {
  const again = (await ask('\n  Play again? (y/n): ')).trim().toLowerCase();
  if (again === 'y' || again === 'yes') {
    await showMenu();
  } else {
    console.log(chalk.gray('\n  Thanks for playing! Goodbye.\n'));
    rl.close();
    process.exit(0);
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(chalk.red('\n  Error: ANTHROPIC_API_KEY is not set.'));
  console.error(chalk.gray('  Copy .env.example to .env and add your API key.\n'));
  process.exit(1);
}

showMenu().catch(err => {
  console.error(chalk.red('\n  Fatal error:'), err.message);
  process.exit(1);
});
