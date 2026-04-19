import chalk from 'chalk';
import ora from 'ora';
import { RAGEngine } from '../../context/rag.js';
import { Logger } from '../../utils/logger.js';

export function registerFindCommand(program) {
  program
    .command('find <query...>')
    .description('Semantic code search across the project')
    .option('--type <type>', 'Filter by type (function, class, variable, file)')
    .option('--limit <n>', 'Max results', '10')
    .action(async (query, opts) => {
      const logger = new Logger();
      const rag = new RAGEngine();
      const searchQuery = query.join(' ');
      const spinner = ora(`Searching for "${searchQuery}"...`).start();

      try {
        const results = await rag.search(searchQuery, {
          type: opts.type,
          limit: parseInt(opts.limit)
        });

        spinner.stop();

        if (results.length === 0) {
          console.log(chalk.yellow('No results found.'));
          return;
        }

        console.log(chalk.bold(`\n🔍 Results for "${searchQuery}":\n`));
        
        results.forEach((r, i) => {
          console.log(chalk.cyan(`${i + 1}. ${r.file}:${r.line}`));
          console.log(chalk.gray(`   ${r.snippet}`));
          console.log(chalk.gray(`   Score: ${(r.score * 100).toFixed(1)}%`));
          console.log('');
        });

      } catch (err) {
        spinner.fail('Search failed');
        logger.error(err.message);
      }
    });
}
