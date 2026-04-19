import { Command } from 'commander';
import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import { registerInitCommand } from './commands/init.js';
import { registerRunCommand } from './commands/run.js';
import { registerDeployCommand } from './commands/deploy.js';
import { registerShellCommand } from './commands/shell.js';
import { registerEditCommand } from './commands/edit.js';
import { registerModelCommand } from './commands/model.js';
import { registerConfigCommand } from './commands/config.js';
import { registerExplainCommand } from './commands/explain.js';
import { registerFindCommand } from './commands/find.js';
import { registerTestCommand } from './commands/test.js';
import { registerRefactorCommand } from './commands/refactor.js';
import { registerGoalCommand } from './commands/goal.js';
import { registerAutoCommand } from './commands/auto.js';
import { registerWatchCommand } from './commands/watch.js';
import { registerMonitorCommand } from './commands/monitor.js';
import { registerStatusCommand } from './commands/status.js';
import { registerLogsCommand } from './commands/logs.js';
import { registerRollbackCommand } from './commands/rollback.js';
import { registerEnvCommand } from './commands/env.js';
import { registerSecurityCommand } from './commands/security.js';
import { registerCostCommand } from './commands/cost.js';
import { registerMigrateCommand } from './commands/migrate.js';
import { launchGUI } from './gui.js';

const BANNER = `
  ██████╗ ███████╗██╗   ██╗ ██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║██╔═══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║██║   ██║███████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║   ██║╚════██║
  ██████╔╝███████╗ ╚████╔╝ ╚██████╔╝███████║
  ╚═════╝ ╚══════╝  ╚═══╝   ╚═════╝ ╚══════╝
`;

export function createCLI() {
  const program = new Command();

  program
    .name('devos')
    .version('1.2.0')
    .description('DevOS — The AI-Powered Full-Stack Development OS')
    .option('--no-color', 'Disable colored output')
    .option('--verbose', 'Enable verbose logging')
    .option('--model <model>', 'Override AI model for this command')
    .hook('preAction', (thisCommand) => {
      if (thisCommand.opts().verbose) {
        process.env.DEVOS_VERBOSE = 'true';
      }
    });

  // Show banner for help
  program.addHelpText('before', gradient.vice(BANNER));
  program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('$')} devos init "React blog with auth"
  ${chalk.cyan('$')} devos run
  ${chalk.cyan('$')} devos goal "Build a Twitter clone and deploy it"
  ${chalk.cyan('$')} devos deploy --target=vercel
  ${chalk.cyan('$')} devos shell
  ${chalk.cyan('$')} devos edit app.js "Add login feature"
  ${chalk.cyan('$')} devos model use gpt-4
  ${chalk.cyan('$')} devos auto
  ${chalk.cyan('$')} devos explain

${chalk.gray('Docs: https://devos.dev | GitHub: https://github.com/devos-ai/devos')}
`);

  // Register all commands
  registerInitCommand(program);
  registerRunCommand(program);
  registerDeployCommand(program);
  registerShellCommand(program);
  registerEditCommand(program);
  registerModelCommand(program);
  registerConfigCommand(program);
  registerExplainCommand(program);
  registerFindCommand(program);
  registerTestCommand(program);
  registerRefactorCommand(program);
  registerGoalCommand(program);
  registerAutoCommand(program);
  registerWatchCommand(program);
  registerMonitorCommand(program);
  registerStatusCommand(program);
  registerLogsCommand(program);
  registerRollbackCommand(program);
  registerEnvCommand(program);
  registerSecurityCommand(program);
  registerCostCommand(program);
  registerMigrateCommand(program);

  // Default action: if a natural language string is passed, treat as goal
  // If no args at all, launch the interactive GUI dashboard
  program.argument('[query...]', 'Natural language command (treated as goal)')
    .action(async (query, opts) => {
      if (query && query.length > 0) {
        const fullQuery = query.join(' ');
        console.log(
          boxen(
            gradient.vice('DevOS') + chalk.gray(' — AI Development OS\n\n') +
            chalk.white(`Goal: "${fullQuery}"`),
            { padding: 1, borderColor: 'cyan', borderStyle: 'round' }
          )
        );
        const { GoalCommand } = await import('./commands/goal.js');
        await GoalCommand(fullQuery, program.opts());
      } else {
        // No command given → launch interactive GUI
        await launchGUI();
      }
    });

  return program;
}
