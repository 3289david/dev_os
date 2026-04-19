import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Executor } from '../../agents/executor.js';
import { DebuggerAgent } from '../../agents/debugger.js';
import { Logger } from '../../utils/logger.js';

export function registerAutoCommand(program) {
  program
    .command('auto')
    .description('Auto-loop: code → run → detect errors → fix → repeat')
    .option('--max-iterations <n>', 'Max iterations', '10')
    .action(async (opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();
      const executor = new Executor();
      const debuggerAgent = new DebuggerAgent();
      const maxIter = parseInt(opts.maxIterations) || 10;

      console.log(chalk.bold('🔄 DevOS Auto Loop'));
      console.log(chalk.gray(`Max iterations: ${maxIter}\n`));

      let iteration = 0;
      let healthy = false;

      while (iteration < maxIter && !healthy) {
        iteration++;
        console.log(chalk.bold(`\n--- Iteration ${iteration}/${maxIter} ---\n`));

        const spinner = ora('Running project...').start();

        try {
          const result = await executor.run(null, { cwd: process.cwd(), timeout: 30000 });

          if (result.success) {
            spinner.succeed('Application running without errors!');
            healthy = true;
            break;
          }

          spinner.fail('Error detected');
          console.log(chalk.red(result.error));

          const fixSpinner = ora('AI analyzing and fixing...').start();
          const fix = await debuggerAgent.analyze(result.error, result.context);

          if (fix.fixed) {
            fixSpinner.succeed(`Fix applied: ${fix.description}`);
          } else {
            fixSpinner.warn('Partial fix applied');
            console.log(chalk.yellow(`Suggestion: ${fix.suggestion}`));
          }

        } catch (err) {
          spinner.fail(`Iteration ${iteration} failed`);
          logger.error(err.message);
        }
      }

      console.log('');
      if (healthy) {
        console.log(chalk.green.bold('✅ Project is running cleanly!'));
      } else {
        console.log(chalk.yellow(`⚠ Reached max iterations (${maxIter}). Manual review may be needed.`));
      }
    });
}
