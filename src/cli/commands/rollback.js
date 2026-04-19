import chalk from 'chalk';
import ora from 'ora';
import { DeployAgent } from '../../agents/deployer.js';
import { Logger } from '../../utils/logger.js';

export function registerRollbackCommand(program) {
  program
    .command('rollback [version]')
    .description('Roll back to a previous deployment version')
    .option('--list', 'List available versions')
    .action(async (version, opts) => {
      const logger = new Logger();
      const deployer = new DeployAgent();

      try {
        if (opts.list) {
          const versions = await deployer.listVersions(process.cwd());
          console.log(chalk.bold('\n📦 Available Versions:\n'));
          versions.forEach((v, i) => {
            const current = v.current ? chalk.green(' ← current') : '';
            console.log(`  ${i + 1}. ${v.version} (${v.date})${current}`);
          });
          return;
        }

        if (!version) {
          console.log(chalk.yellow('Specify a version or use --list to see available versions.'));
          return;
        }

        const spinner = ora(`Rolling back to ${version}...`).start();
        const result = await deployer.rollback(process.cwd(), version);
        
        spinner.succeed(`Rolled back to ${version}`);
        if (result.url) {
          console.log(chalk.green(`\n🌐 ${result.url}`));
        }

      } catch (err) {
        console.log(chalk.red(`Rollback failed: ${err.message}`));
      }
    });
}
