import chalk from 'chalk';
import Table from 'cli-table3';
import { CostTracker } from '../../utils/cost.js';

export function registerCostCommand(program) {
  program
    .command('cost')
    .description('Track API usage and server costs')
    .option('--reset', 'Reset cost tracking')
    .option('--period <period>', 'Time period (today, week, month, all)', 'month')
    .action(async (opts) => {
      const tracker = new CostTracker();

      if (opts.reset) {
        tracker.reset();
        console.log(chalk.green('✓ Cost tracking reset'));
        return;
      }

      const data = tracker.getSummary(opts.period);

      console.log(chalk.bold('\n💰 DevOS Cost Tracker\n'));

      const table = new Table({
        head: [chalk.cyan('Provider'), chalk.cyan('Requests'), chalk.cyan('Tokens'), chalk.cyan('Est. Cost')],
        style: { head: [], border: [] }
      });

      data.providers.forEach(p => {
        table.push([p.name, p.requests.toString(), p.tokens.toString(), `$${p.cost.toFixed(4)}`]);
      });

      table.push([
        chalk.bold('Total'),
        chalk.bold(data.totalRequests.toString()),
        chalk.bold(data.totalTokens.toString()),
        chalk.bold(`$${data.totalCost.toFixed(4)}`)
      ]);

      console.log(table.toString());
      console.log(chalk.gray(`\nPeriod: ${opts.period}`));
    });
}
