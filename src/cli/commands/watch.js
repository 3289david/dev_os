import chalk from 'chalk';
import chokidar from 'chokidar';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Logger } from '../../utils/logger.js';

export function registerWatchCommand(program) {
  program
    .command('watch')
    .description('Watch files for changes and auto-fix issues')
    .option('--pattern <glob>', 'File glob pattern', '**/*.{js,ts,jsx,tsx,py,go,rs}')
    .option('--ignore <dirs>', 'Directories to ignore', 'node_modules,dist,.git')
    .action(async (opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();
      const ignored = opts.ignore.split(',').map(d => `**/${d}/**`);

      console.log(chalk.bold('👁  DevOS Watch Mode'));
      console.log(chalk.gray(`Watching: ${opts.pattern}`));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      const watcher = chokidar.watch(opts.pattern, {
        ignored,
        persistent: true,
        ignoreInitial: true,
        cwd: process.cwd()
      });

      let processing = false;

      watcher.on('change', async (path) => {
        if (processing) return;
        processing = true;

        console.log(chalk.cyan(`\n📝 Changed: ${path}`));

        try {
          const issues = await orchestrator.checkFile(path);
          
          if (issues.length > 0) {
            console.log(chalk.yellow(`Found ${issues.length} issue(s):`));
            issues.forEach(issue => {
              console.log(chalk.gray(`  • ${issue.message} (line ${issue.line})`));
            });

            console.log(chalk.yellow('Attempting auto-fix...'));
            const result = await orchestrator.autoFix(path, issues);
            
            if (result.fixed) {
              console.log(chalk.green(`✓ Fixed ${result.count} issue(s)`));
            }
          } else {
            console.log(chalk.green('✓ No issues'));
          }
        } catch (err) {
          console.log(chalk.red(`Error: ${err.message}`));
        }

        processing = false;
      });

      watcher.on('add', (path) => {
        console.log(chalk.gray(`+ New file: ${path}`));
      });

      watcher.on('unlink', (path) => {
        console.log(chalk.gray(`- Removed: ${path}`));
      });

      // Keep process alive
      process.on('SIGINT', () => {
        console.log(chalk.gray('\n\nWatch mode stopped.'));
        watcher.close();
        process.exit(0);
      });
    });
}
