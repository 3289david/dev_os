import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.js';

export function registerEnvCommand(program) {
  const env = program
    .command('env')
    .description('Manage environment variables');

  env
    .command('set <key_value>')
    .description('Set an environment variable (KEY=VALUE)')
    .action(async (keyValue) => {
      const [key, ...valueParts] = keyValue.split('=');
      const value = valueParts.join('=');

      if (!key || !value) {
        console.log(chalk.red('Usage: devos env set KEY=VALUE'));
        return;
      }

      const envPath = join(process.cwd(), '.env');
      let content = '';

      if (existsSync(envPath)) {
        content = readFileSync(envPath, 'utf-8');
      }

      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += (content && !content.endsWith('\n') ? '\n' : '') + `${key}=${value}\n`;
      }

      writeFileSync(envPath, content);
      
      const isSensitive = key.toLowerCase().includes('key') || 
                          key.toLowerCase().includes('secret') || 
                          key.toLowerCase().includes('token') ||
                          key.toLowerCase().includes('password');
      console.log(chalk.green(`✓ ${key}=${isSensitive ? '****' + value.slice(-4) : value}`));
    });

  env
    .command('get <key>')
    .description('Get an environment variable')
    .action(async (key) => {
      const envPath = join(process.cwd(), '.env');
      
      if (!existsSync(envPath)) {
        console.log(chalk.gray('No .env file found'));
        return;
      }

      const content = readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      
      if (match) {
        const isSensitive = key.toLowerCase().includes('key') || 
                            key.toLowerCase().includes('secret') || 
                            key.toLowerCase().includes('token');
        console.log(`${key}=${isSensitive ? '****' + match[1].slice(-4) : match[1]}`);
      } else {
        console.log(chalk.gray(`${key} is not set`));
      }
    });

  env
    .command('list')
    .description('List all environment variables')
    .action(async () => {
      const envPath = join(process.cwd(), '.env');
      
      if (!existsSync(envPath)) {
        console.log(chalk.gray('No .env file found'));
        return;
      }

      const content = readFileSync(envPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      
      console.log(chalk.bold('\n🔒 Environment Variables:\n'));
      lines.forEach(line => {
        const [key, ...vals] = line.split('=');
        const value = vals.join('=');
        const isSensitive = key.toLowerCase().includes('key') || 
                            key.toLowerCase().includes('secret') || 
                            key.toLowerCase().includes('token');
        console.log(`  ${key}=${isSensitive ? '****' + value.slice(-4) : value}`);
      });
    });

  env
    .command('delete <key>')
    .description('Remove an environment variable')
    .action(async (key) => {
      const envPath = join(process.cwd(), '.env');
      
      if (!existsSync(envPath)) {
        console.log(chalk.gray('No .env file found'));
        return;
      }

      let content = readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${key}=.*\n?`, 'm');
      content = content.replace(regex, '');
      writeFileSync(envPath, content);
      console.log(chalk.green(`✓ Removed ${key}`));
    });
}
