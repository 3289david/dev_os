import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigManager } from '../../utils/config.js';

export function registerConfigCommand(program) {
  const config = program
    .command('config')
    .description('Manage DevOS configuration');

  config
    .command('set <key_value>')
    .description('Set a config value (KEY=VALUE)')
    .action(async (keyValue) => {
      const cm = new ConfigManager();
      const [key, ...valueParts] = keyValue.split('=');
      const value = valueParts.join('=');

      if (!key || !value) {
        console.log(chalk.red('Usage: devos config set KEY=VALUE'));
        return;
      }

      // Mask sensitive values in output
      const isSensitive = key.toLowerCase().includes('key') || 
                          key.toLowerCase().includes('secret') || 
                          key.toLowerCase().includes('token');
      
      cm.set(key, value);
      console.log(chalk.green(`✓ ${key} = ${isSensitive ? '****' + value.slice(-4) : value}`));
    });

  config
    .command('get <key>')
    .description('Get a config value')
    .action(async (key) => {
      const cm = new ConfigManager();
      const value = cm.get(key);
      
      if (value === undefined) {
        console.log(chalk.gray(`${key} is not set`));
      } else {
        const isSensitive = key.toLowerCase().includes('key') || 
                            key.toLowerCase().includes('secret') || 
                            key.toLowerCase().includes('token');
        console.log(`${key} = ${isSensitive ? '****' + String(value).slice(-4) : value}`);
      }
    });

  config
    .command('list')
    .description('List all configuration')
    .action(async () => {
      const cm = new ConfigManager();
      const all = cm.getAll();
      
      const table = new Table({
        head: [chalk.cyan('Key'), chalk.cyan('Value')],
        style: { head: [], border: [] }
      });

      Object.entries(all).forEach(([key, value]) => {
        const isSensitive = key.toLowerCase().includes('key') || 
                            key.toLowerCase().includes('secret') || 
                            key.toLowerCase().includes('token');
        const displayValue = isSensitive ? '****' + String(value).slice(-4) : 
                            typeof value === 'object' ? JSON.stringify(value) : String(value);
        table.push([key, displayValue]);
      });

      console.log(table.toString());
    });

  config
    .command('reset')
    .description('Reset all configuration to defaults')
    .action(async () => {
      const cm = new ConfigManager();
      cm.reset();
      console.log(chalk.green('✓ Configuration reset to defaults'));
    });
}
