import chalk from 'chalk';
import { DeployAgent } from '../../agents/deployer.js';
import { Logger } from '../../utils/logger.js';

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Check deployment and project status')
    .action(async () => {
      const logger = new Logger();
      const deployer = new DeployAgent();

      try {
        const status = await deployer.getStatus(process.cwd());

        console.log(chalk.bold('\n📊 DevOS Status\n'));
        console.log(`  Project:    ${status.name || 'Unknown'}`);
        console.log(`  Status:     ${status.running ? chalk.green('● Running') : chalk.red('● Stopped')}`);
        console.log(`  Platform:   ${status.platform || 'Not deployed'}`);
        console.log(`  URL:        ${status.url || 'N/A'}`);
        console.log(`  Last Deploy: ${status.lastDeploy || 'Never'}`);
        console.log(`  Version:    ${status.version || 'N/A'}`);
        console.log(`  Uptime:     ${status.uptime || 'N/A'}`);
        console.log('');

      } catch (err) {
        console.log(chalk.gray('No deployment info found. Run `devos deploy` first.'));
      }
    });
}
