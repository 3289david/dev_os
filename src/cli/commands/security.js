import chalk from 'chalk';
import ora from 'ora';
import { SecurityAnalyzer } from '../../utils/security.js';
import { Logger } from '../../utils/logger.js';

export function registerSecurityCommand(program) {
  program
    .command('security')
    .description('Security vulnerability scan and API key detection')
    .option('--fix', 'Auto-fix detected issues')
    .option('--deep', 'Deep scan including dependencies')
    .action(async (opts) => {
      const logger = new Logger();
      const security = new SecurityAnalyzer();

      console.log(chalk.bold('🔒 DevOS Security Scan\n'));

      const spinner = ora('Scanning for vulnerabilities...').start();

      try {
        const results = await security.scan(process.cwd(), {
          deep: opts.deep
        });

        spinner.stop();

        if (results.issues.length === 0) {
          console.log(chalk.green('✓ No security issues found!\n'));
          return;
        }

        console.log(chalk.yellow(`Found ${results.issues.length} issue(s):\n`));

        results.issues.forEach((issue, i) => {
          const severity = issue.severity === 'critical' ? chalk.red.bold :
                          issue.severity === 'high' ? chalk.red :
                          issue.severity === 'medium' ? chalk.yellow : chalk.gray;
          console.log(severity(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`));
          console.log(chalk.gray(`   File: ${issue.file}:${issue.line}`));
          console.log(chalk.gray(`   ${issue.description}`));
          console.log('');
        });

        if (opts.fix) {
          const fixSpinner = ora('Applying security fixes...').start();
          const fixResult = await security.fix(results.issues);
          fixSpinner.succeed(`Fixed ${fixResult.fixed} of ${results.issues.length} issues`);
        }

      } catch (err) {
        spinner.fail('Security scan failed');
        logger.error(err.message);
      }
    });
}
