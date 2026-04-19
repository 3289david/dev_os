import chalk from 'chalk';
import ora from 'ora';
import { DeployAgent } from '../../agents/deployer.js';
import { Logger } from '../../utils/logger.js';

export function registerDeployCommand(program) {
  program
    .command('deploy')
    .description('Deploy project to cloud or local hosting')
    .option('-t, --target <platform>', 'Target platform (vercel, railway, docker, flyio, local, auto)', 'auto')
    .option('--env <env>', 'Environment (production, staging, dev)', 'production')
    .option('--no-build', 'Skip build step')
    .option('--dry-run', 'Show what would be deployed without deploying')
    .action(async (opts) => {
      const logger = new Logger();
      const deployer = new DeployAgent();
      
      console.log(chalk.bold('🚀 DevOS Deploy'));
      console.log('');

      const spinner = ora('Analyzing project for deployment...').start();

      try {
        // Step 1: Analyze project
        const analysis = await deployer.analyze(process.cwd());
        
        if (opts.target === 'auto') {
          spinner.text = `Detected: ${analysis.type} — Recommending ${analysis.recommendedPlatform}`;
          opts.target = analysis.recommendedPlatform;
        }

        spinner.text = `Preparing deployment to ${opts.target}...`;

        if (opts.dryRun) {
          spinner.info('Dry run — showing deployment plan');
          console.log('');
          console.log(chalk.bold('Deployment Plan:'));
          console.log(chalk.gray(`  Platform: ${opts.target}`));
          console.log(chalk.gray(`  Environment: ${opts.env}`));
          console.log(chalk.gray(`  Build: ${opts.build !== false ? 'yes' : 'skip'}`));
          console.log(chalk.gray(`  Type: ${analysis.type}`));
          console.log(chalk.gray(`  Framework: ${analysis.framework || 'none'}`));
          return;
        }

        // Step 2: Build
        if (opts.build !== false) {
          spinner.text = 'Building project...';
          await deployer.build(process.cwd(), analysis);
        }

        // Step 3: Deploy
        spinner.text = `Deploying to ${opts.target}...`;
        const result = await deployer.deploy(process.cwd(), {
          target: opts.target,
          env: opts.env,
          analysis
        });

        spinner.succeed('Deployed successfully!');
        console.log('');
        
        if (result.url) {
          console.log(chalk.green.bold(`🌐 Live URL: ${result.url}`));
        }
        if (result.adminUrl) {
          console.log(chalk.gray(`📊 Dashboard: ${result.adminUrl}`));
        }
        
        console.log('');
        console.log(chalk.gray('Commands:'));
        console.log(chalk.gray('  devos status    — Check deployment status'));
        console.log(chalk.gray('  devos logs      — View deployment logs'));
        console.log(chalk.gray('  devos rollback  — Roll back to previous version'));

      } catch (err) {
        spinner.fail('Deployment failed');
        logger.error(err.message);
        if (process.env.DEVOS_VERBOSE) {
          console.error(err);
        }
      }
    });
}
