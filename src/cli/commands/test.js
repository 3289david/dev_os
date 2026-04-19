import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Executor } from '../../agents/executor.js';
import { Logger } from '../../utils/logger.js';

export function registerTestCommand(program) {
  program
    .command('test [file]')
    .description('Auto-generate and run tests')
    .option('--generate', 'Generate tests only (don\'t run)')
    .option('--fix', 'Auto-fix failing tests')
    .option('--coverage', 'Run with coverage')
    .action(async (file, opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();
      const executor = new Executor();

      console.log(chalk.bold('🧪 DevOS Test'));
      console.log('');

      const spinner = ora('Analyzing code for test generation...').start();

      try {
        // Generate tests
        spinner.text = 'Generating tests...';
        const tests = await orchestrator.generateTests(file, process.cwd());
        spinner.succeed(`Generated ${tests.count} test(s)`);

        if (opts.generate) return;

        // Run tests
        console.log('');
        const runSpinner = ora('Running tests...').start();
        const result = await executor.runTests(opts.coverage);

        if (result.passed) {
          runSpinner.succeed(`All tests passed! (${result.total} tests)`);
          if (result.coverage) {
            console.log(chalk.gray(`\nCoverage: ${result.coverage}%`));
          }
        } else {
          runSpinner.fail(`${result.failed} of ${result.total} tests failed`);

          if (opts.fix) {
            console.log(chalk.yellow('\n🔧 Auto-fixing failing tests...'));
            const fixResult = await orchestrator.fixTests(result.failures);
            if (fixResult.fixed) {
              console.log(chalk.green('✓ Tests fixed and passing'));
            } else {
              console.log(chalk.red('✗ Could not auto-fix all tests'));
            }
          }
        }

      } catch (err) {
        spinner.fail('Test operation failed');
        logger.error(err.message);
      }
    });
}
