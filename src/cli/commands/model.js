import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigManager } from '../../utils/config.js';
import { AIAdapter } from '../../ai/adapter.js';

export function registerModelCommand(program) {
  const model = program
    .command('model')
    .description('Manage AI models and providers');

  model
    .command('list')
    .description('List available models')
    .action(async () => {
      const config = new ConfigManager();
      const adapter = new AIAdapter(config);
      const models = adapter.listModels();

      const table = new Table({
        head: [
          chalk.cyan('Provider'),
          chalk.cyan('Model'),
          chalk.cyan('Status'),
          chalk.cyan('Active')
        ],
        style: { head: [], border: [] }
      });

      models.forEach(m => {
        table.push([
          m.provider,
          m.model,
          m.configured ? chalk.green('✓ configured') : chalk.gray('not configured'),
          m.active ? chalk.green('★') : ''
        ]);
      });

      console.log(table.toString());
    });

  model
    .command('add <provider>')
    .description('Add an AI provider (openai, anthropic, google, ollama, openrouter)')
    .action(async (provider) => {
      const config = new ConfigManager();
      const validProviders = ['openai', 'anthropic', 'google', 'ollama', 'openrouter'];
      
      if (!validProviders.includes(provider.toLowerCase())) {
        console.log(chalk.red(`Unknown provider: ${provider}`));
        console.log(chalk.gray(`Available: ${validProviders.join(', ')}`));
        return;
      }

      config.set(`providers.${provider.toLowerCase()}.enabled`, true);
      console.log(chalk.green(`✓ Added provider: ${provider}`));
      console.log(chalk.gray(`Set API key: devos config set ${provider.toUpperCase()}_API_KEY=your-key`));
    });

  model
    .command('use <model>')
    .description('Set the active AI model')
    .action(async (modelName) => {
      const config = new ConfigManager();
      config.set('activeModel', modelName);
      console.log(chalk.green(`✓ Active model set to: ${modelName}`));
    });

  model
    .command('auto')
    .description('Enable smart model routing (auto-selects best model per task)')
    .action(async () => {
      const config = new ConfigManager();
      config.set('smartRouter', true);
      console.log(chalk.green('✓ Smart Router enabled'));
      console.log(chalk.gray('DevOS will automatically choose the best model for each task.'));
    });

  model
    .command('remove <provider>')
    .description('Remove an AI provider')
    .action(async (provider) => {
      const config = new ConfigManager();
      config.delete(`providers.${provider.toLowerCase()}`);
      console.log(chalk.green(`✓ Removed provider: ${provider}`));
    });
}
