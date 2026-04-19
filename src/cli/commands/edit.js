import chalk from 'chalk';
import ora from 'ora';
import { CoderAgent } from '../../agents/coder.js';
import { Logger } from '../../utils/logger.js';

export function registerEditCommand(program) {
  program
    .command('edit <file> [instruction...]')
    .description('AI-powered code editing with natural language instructions')
    .option('--ast', 'Use AST-based modification (more precise)')
    .option('--diff', 'Show diff before applying')
    .action(async (file, instruction, opts) => {
      const logger = new Logger();
      const coder = new CoderAgent();
      const inst = instruction.join(' ');

      if (!inst) {
        console.log(chalk.yellow('Please provide editing instructions.'));
        console.log(chalk.gray('Example: devos edit app.js "Add login feature"'));
        return;
      }

      const spinner = ora(`Editing ${file}...`).start();

      try {
        const result = await coder.editFile(file, inst, {
          useAST: opts.ast,
          showDiff: opts.diff
        });

        if (opts.diff && result.diff) {
          spinner.stop();
          console.log(chalk.bold('\nDiff:'));
          console.log(result.diff);
        }

        spinner.succeed(`${file} updated successfully`);
        
        if (result.changes) {
          console.log(chalk.gray(`\nChanges: ${result.changes.length} modification(s)`));
          result.changes.forEach(c => {
            console.log(chalk.gray(`  • ${c}`));
          });
        }

      } catch (err) {
        spinner.fail(`Failed to edit ${file}`);
        logger.error(err.message);
      }
    });
}
