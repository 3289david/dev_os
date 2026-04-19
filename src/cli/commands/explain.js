import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { CodeAnalyzer } from '../../code/analyzer.js';
import { Logger } from '../../utils/logger.js';

export function registerExplainCommand(program) {
  program
    .command('explain [file]')
    .description('AI explains the project structure or a specific file')
    .option('--deep', 'Deep analysis with dependency graph')
    .action(async (file, opts) => {
      const logger = new Logger();
      const orchestrator = new Orchestrator();
      const analyzer = new CodeAnalyzer();
      const spinner = ora('Analyzing...').start();

      try {
        if (file) {
          spinner.text = `Analyzing ${file}...`;
          const explanation = await orchestrator.explainFile(file, opts.deep);
          spinner.stop();
          console.log(chalk.bold(`\n📄 ${file}\n`));
          console.log(explanation);
        } else {
          spinner.text = 'Analyzing project structure...';
          const structure = await analyzer.analyzeProject(process.cwd());
          const explanation = await orchestrator.explainProject(structure);
          spinner.stop();
          console.log(chalk.bold('\n📁 Project Overview\n'));
          console.log(explanation);
        }
      } catch (err) {
        spinner.fail('Analysis failed');
        logger.error(err.message);
      }
    });
}
