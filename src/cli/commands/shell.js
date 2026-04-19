import chalk from 'chalk';
import inquirer from 'inquirer';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Executor } from '../../agents/executor.js';
import { Logger } from '../../utils/logger.js';

export function registerShellCommand(program) {
  program
    .command('shell')
    .description('Interactive AI-powered shell — natural language to commands')
    .option('--no-confirm', 'Execute commands without confirmation')
    .action(async (opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();
      const executor = new Executor();

      console.log(chalk.bold('🧠 DevOS AI Shell'));
      console.log(chalk.gray('Type natural language commands. Type "exit" to quit.\n'));

      const repl = async () => {
        while (true) {
          const { input } = await inquirer.prompt([{
            type: 'input',
            name: 'input',
            message: chalk.cyan('devos>'),
            prefix: ''
          }]);

          if (!input || input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log(chalk.gray('Goodbye! 👋'));
            break;
          }

          try {
            // Convert natural language to shell command
            const command = await orchestrator.naturalLanguageToCommand(input);
            
            console.log(chalk.gray(`→ ${command}`));

            if (opts.confirm !== false) {
              const { confirmed } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirmed',
                message: 'Execute this command?',
                default: true
              }]);

              if (!confirmed) continue;
            }

            const result = await executor.execCommand(command);
            if (result.stdout) console.log(result.stdout);
            if (result.stderr) console.log(chalk.yellow(result.stderr));
            
          } catch (err) {
            console.log(chalk.red(`Error: ${err.message}`));
          }
        }
      };

      await repl();
    });
}
