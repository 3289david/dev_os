import chalk from 'chalk';
import ora from 'ora';
import { ReviewerAgent } from '../../agents/reviewer.js';
import { Logger } from '../../utils/logger.js';

export function registerRefactorCommand(program) {
  program
    .command('refactor [file]')
    .description('AI-powered code refactoring and optimization')
    .option('--perf', 'Focus on performance optimization')
    .option('--clean', 'Focus on code cleanup and deduplication')
    .option('--dry-run', 'Show suggested changes without applying')
    .action(async (file, opts) => {
      const logger = new Logger();
      const reviewer = new ReviewerAgent();

      console.log(chalk.bold('♻️  DevOS Refactor'));
      console.log('');

      const spinner = ora('Analyzing code quality...').start();

      try {
        const target = file || process.cwd();
        const analysis = await reviewer.analyze(target, {
          performance: opts.perf,
          cleanup: opts.clean
        });

        spinner.stop();

        console.log(chalk.bold('Suggestions:\n'));
        analysis.suggestions.forEach((s, i) => {
          const icon = s.type === 'performance' ? '⚡' : 
                       s.type === 'cleanup' ? '🧹' : 
                       s.type === 'security' ? '🔒' : '📝';
          console.log(chalk.cyan(`${i + 1}. ${icon} ${s.title}`));
          console.log(chalk.gray(`   ${s.description}`));
          console.log(chalk.gray(`   File: ${s.file}:${s.line}`));
          console.log('');
        });

        if (opts.dryRun) {
          console.log(chalk.gray('Dry run — no changes applied'));
          return;
        }

        if (analysis.suggestions.length > 0) {
          const applySpinner = ora('Applying refactoring...').start();
          const result = await reviewer.applyRefactoring(analysis);
          applySpinner.succeed(`Applied ${result.applied} refactoring(s)`);
        } else {
          console.log(chalk.green('✓ Code looks clean!'));
        }

      } catch (err) {
        spinner.fail('Refactoring failed');
        logger.error(err.message);
      }
    });
}
