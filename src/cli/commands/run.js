import chalk from 'chalk';
import ora from 'ora';
import { Executor } from '../../agents/executor.js';
import { DebuggerAgent } from '../../agents/debugger.js';
import { Logger } from '../../utils/logger.js';

export function registerRunCommand(program) {
  program
    .command('run [script]')
    .description('Run project with auto-debugging (detects errors & fixes automatically)')
    .option('--max-retries <n>', 'Max auto-fix attempts', '5')
    .option('--no-fix', 'Disable auto-fix')
    .option('--port <port>', 'Override port')
    .action(async (script, opts) => {
      const logger = new Logger();
      const executor = new Executor();
      const debuggerAgent = new DebuggerAgent();
      const maxRetries = parseInt(opts.maxRetries) || 5;
      let retries = 0;

      console.log(chalk.bold('🏃 DevOS Run — Auto-Debug Mode'));
      console.log('');

      async function runWithAutoFix() {
        const spinner = ora('Starting application...').start();

        try {
          const result = await executor.run(script, {
            port: opts.port,
            cwd: process.cwd()
          });

          if (result.success) {
            spinner.succeed('Application running successfully!');
            if (result.url) {
              console.log(chalk.green(`\n🌐 ${result.url}`));
            }
            return;
          }

          // Error detected
          spinner.fail('Error detected');
          console.log(chalk.red(`\n${result.error}`));

          if (opts.fix === false || retries >= maxRetries) {
            if (retries >= maxRetries) {
              console.log(chalk.yellow(`\n⚠ Max retries (${maxRetries}) reached.`));
            }
            return;
          }

          retries++;
          console.log(chalk.yellow(`\n🔧 Auto-fix attempt ${retries}/${maxRetries}...`));

          const fix = await debuggerAgent.analyze(result.error, result.context);
          
          if (fix.fixed) {
            console.log(chalk.green(`✅ Applied fix: ${fix.description}`));
            console.log('');
            await runWithAutoFix(); // Retry
          } else {
            console.log(chalk.red('❌ Could not auto-fix. Manual intervention needed.'));
            console.log(chalk.gray(`Suggestion: ${fix.suggestion}`));
          }

        } catch (err) {
          spinner.fail('Execution failed');
          logger.error(err.message);
        }
      }

      await runWithAutoFix();
    });
}
