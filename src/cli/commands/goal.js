import chalk from 'chalk';
import ora from 'ora';
import { Orchestrator } from '../../agents/orchestrator.js';
import { Logger } from '../../utils/logger.js';

export async function GoalCommand(goalDescription, opts) {
  const logger = new Logger();
  const orchestrator = new Orchestrator();

  console.log(chalk.bold('\n🎯 DevOS Goal Mode — Full Autopilot\n'));
  console.log(chalk.gray('DevOS will plan, code, test, debug, and deploy automatically.\n'));

  const spinner = ora('Planning...').start();

  try {
    // Phase 1: Planning
    spinner.text = '📋 Phase 1: Planning...';
    const plan = await orchestrator.plan(goalDescription);
    spinner.succeed('Plan created');

    console.log(chalk.bold('\nTask Plan:'));
    plan.tasks.forEach((t, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${t.description}`));
    });
    console.log('');

    // Phase 2: Execute each task
    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i];
      const taskSpinner = ora(`[${i + 1}/${plan.tasks.length}] ${task.description}`).start();

      try {
        const result = await orchestrator.executeTask(task, {
          autoFix: true,
          maxRetries: 3
        });

        if (result.success) {
          taskSpinner.succeed(`[${i + 1}/${plan.tasks.length}] ${task.description}`);
        } else {
          taskSpinner.warn(`[${i + 1}/${plan.tasks.length}] ${task.description} (partial)`);
          console.log(chalk.yellow(`   Note: ${result.note}`));
        }
      } catch (err) {
        taskSpinner.fail(`[${i + 1}/${plan.tasks.length}] ${task.description}`);
        console.log(chalk.red(`   Error: ${err.message}`));
        
        // Try to continue with remaining tasks
        console.log(chalk.yellow('   Continuing with remaining tasks...'));
      }
    }

    console.log('');
    console.log(chalk.green.bold('✅ Goal completed!'));
    
    if (plan.summary) {
      console.log(chalk.gray(`\n${plan.summary}`));
    }

  } catch (err) {
    spinner.fail('Goal execution failed');
    logger.error(err.message);
    if (process.env.DEVOS_VERBOSE) {
      console.error(err);
    }
  }
}

export function registerGoalCommand(program) {
  program
    .command('goal <description...>')
    .description('Full autopilot — describe what you want, DevOS does everything')
    .option('--no-deploy', 'Skip deployment step')
    .option('--no-test', 'Skip testing step')
    .action(async (description, opts) => {
      const desc = description.join(' ');
      await GoalCommand(desc, opts);
    });
}
