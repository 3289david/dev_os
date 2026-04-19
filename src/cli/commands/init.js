import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Logger } from '../../utils/logger.js';

export function registerInitCommand(program) {
  program
    .command('init [description...]')
    .description('Initialize a new project from natural language description')
    .option('-t, --template <template>', 'Use a template (react, vue, node, express, next, fastapi)')
    .option('--no-install', 'Skip dependency installation')
    .option('--dir <directory>', 'Target directory', '.')
    .action(async (description, opts) => {
      const desc = description ? description.join(' ') : null;
      
      if (!desc && !opts.template) {
        console.log(chalk.yellow('Please provide a project description or template.'));
        console.log(chalk.gray('Example: devos init "React blog with Tailwind CSS"'));
        console.log(chalk.gray('Example: devos init --template react'));
        return;
      }

      const spinner = ora('Analyzing requirements...').start();
      const logger = new Logger();

      try {
        const orchestrator = new Orchestrator();
        
        spinner.text = 'Planning project structure...';
        const plan = await orchestrator.plan(desc || `Create a ${opts.template} project`);
        
        spinner.text = 'Generating code...';
        const result = await orchestrator.execute(plan, {
          type: 'init',
          directory: opts.dir,
          install: opts.install !== false,
          template: opts.template
        });

        spinner.succeed('Project initialized successfully!');
        
        console.log('');
        console.log(chalk.bold('📁 Project Structure:'));
        if (result.files) {
          result.files.forEach(f => {
            console.log(chalk.gray(`   ${f}`));
          });
        }
        
        console.log('');
        console.log(chalk.bold('🚀 Next Steps:'));
        console.log(chalk.cyan(`   cd ${opts.dir === '.' ? '.' : opts.dir}`));
        console.log(chalk.cyan('   devos run'));
        
      } catch (err) {
        spinner.fail('Failed to initialize project');
        logger.error(err.message);
        if (process.env.DEVOS_VERBOSE) {
          console.error(err);
        }
      }
    });
}
