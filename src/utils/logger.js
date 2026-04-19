import chalk from 'chalk';

/**
 * Logger — Structured logging utility
 */
export class Logger {
  constructor(options = {}) {
    this.verbose = process.env.DEVOS_VERBOSE === 'true' || options.verbose;
    this.prefix = options.prefix || 'DevOS';
  }

  info(message) {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  success(message) {
    console.log(chalk.green(`✓ ${message}`));
  }

  warn(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  error(message) {
    console.error(chalk.red(`✗ ${message}`));
  }

  debug(message) {
    if (this.verbose) {
      console.log(chalk.gray(`[debug] ${message}`));
    }
  }

  step(number, total, message) {
    console.log(chalk.cyan(`[${number}/${total}] ${message}`));
  }

  divider() {
    console.log(chalk.gray('─'.repeat(60)));
  }

  json(data) {
    console.log(JSON.stringify(data, null, 2));
  }
}
