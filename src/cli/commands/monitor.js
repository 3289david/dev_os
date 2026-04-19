import chalk from 'chalk';
import ora from 'ora';
import { MonitorAgent } from '../../agents/monitor.js';
import { Logger } from '../../utils/logger.js';

export function registerMonitorCommand(program) {
  program
    .command('monitor')
    .description('Self-healing server monitor — auto-restart and fix production bugs')
    .option('--interval <seconds>', 'Health check interval', '30')
    .option('--url <url>', 'Health check URL')
    .option('--auto-fix', 'Enable auto-fix for production errors')
    .action(async (opts) => {
      const logger = new Logger();
      const monitor = new MonitorAgent();
      const interval = parseInt(opts.interval) * 1000;

      console.log(chalk.bold('🏥 DevOS Monitor — Self-Healing Mode'));
      console.log(chalk.gray(`Health check every ${opts.interval}s`));
      if (opts.autoFix) {
        console.log(chalk.yellow('⚡ Auto-fix enabled'));
      }
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      let running = true;
      let checks = 0;
      let failures = 0;

      const check = async () => {
        checks++;
        try {
          const health = await monitor.healthCheck(opts.url || process.cwd());

          if (health.status === 'healthy') {
            process.stdout.write(chalk.green('.'));
          } else {
            process.stdout.write(chalk.red('✗'));
            failures++;
            console.log(chalk.red(`\n\n🚨 Health check failed: ${health.error}`));

            if (opts.autoFix) {
              console.log(chalk.yellow('🔧 Attempting auto-recovery...'));
              const recovery = await monitor.recover(health);
              if (recovery.success) {
                console.log(chalk.green('✓ Service recovered'));
              } else {
                console.log(chalk.red('✗ Recovery failed — manual intervention needed'));
              }
            }
            console.log('');
          }
        } catch (err) {
          process.stdout.write(chalk.red('?'));
          failures++;
        }
      };

      const timer = setInterval(check, interval);
      await check(); // Initial check

      process.on('SIGINT', () => {
        clearInterval(timer);
        console.log(chalk.gray(`\n\nMonitor stopped. Checks: ${checks}, Failures: ${failures}`));
        process.exit(0);
      });
    });
}
