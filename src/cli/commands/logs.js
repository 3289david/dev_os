import chalk from 'chalk';
import { DeployAgent } from '../../agents/deployer.js';
import { Logger } from '../../utils/logger.js';

export function registerLogsCommand(program) {
  program
    .command('logs')
    .description('View deployment and application logs')
    .option('-n, --lines <n>', 'Number of lines', '50')
    .option('-f, --follow', 'Follow log output')
    .option('--level <level>', 'Filter by level (error, warn, info, debug)')
    .action(async (opts) => {
      const logger = new Logger();
      const deployer = new DeployAgent();

      try {
        console.log(chalk.bold('📋 DevOS Logs\n'));

        const logs = await deployer.getLogs(process.cwd(), {
          lines: parseInt(opts.lines),
          level: opts.level
        });

        logs.forEach(log => {
          const color = log.level === 'error' ? chalk.red :
                       log.level === 'warn' ? chalk.yellow :
                       log.level === 'debug' ? chalk.gray : chalk.white;
          console.log(color(`[${log.timestamp}] [${log.level}] ${log.message}`));
        });

        if (opts.follow) {
          console.log(chalk.gray('\nFollowing logs... (Ctrl+C to stop)'));
          await deployer.followLogs(process.cwd(), (log) => {
            const color = log.level === 'error' ? chalk.red :
                         log.level === 'warn' ? chalk.yellow : chalk.white;
            console.log(color(`[${log.timestamp}] [${log.level}] ${log.message}`));
          });
        }

      } catch (err) {
        console.log(chalk.gray('No logs available. Run `devos deploy` or `devos run` first.'));
      }
    });
}
