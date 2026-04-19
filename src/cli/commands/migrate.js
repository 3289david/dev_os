import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Logger } from '../../utils/logger.js';

export function registerMigrateCommand(program) {
  program
    .command('migrate <target>')
    .description('Code migration (e.g., JS→TS, React→Vue, framework upgrades)')
    .option('--dry-run', 'Show what would change')
    .option('--file <file>', 'Migrate specific file only')
    .action(async (target, opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();

      console.log(chalk.bold('🔄 DevOS Migrate\n'));

      const spinner = ora(`Planning migration to ${target}...`).start();

      try {
        const plan = await orchestrator.planMigration(target, {
          cwd: process.cwd(),
          file: opts.file
        });

        spinner.stop();

        console.log(chalk.bold('Migration Plan:\n'));
        plan.steps.forEach((s, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${s.description}`));
          console.log(chalk.gray(`     Files: ${s.files.join(', ')}`));
        });
        console.log('');

        if (opts.dryRun) {
          console.log(chalk.gray('Dry run — no changes applied'));
          return;
        }

        const execSpinner = ora('Applying migration...').start();
        const result = await orchestrator.executeMigration(plan);
        execSpinner.succeed(`Migration complete: ${result.filesChanged} files changed`);

      } catch (err) {
        spinner.fail('Migration failed');
        logger.error(err.message);
      }
    });
}
