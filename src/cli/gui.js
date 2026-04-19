import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { ConfigManager } from '../utils/config.js';
import { AIAdapter } from '../ai/adapter.js';
import { CostTracker } from '../utils/cost.js';

const LOGO = gradient.vice(`
  ██████╗ ███████╗██╗   ██╗ ██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║██╔═══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║██║   ██║███████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║   ██║╚════██║
  ██████╔╝███████╗ ╚████╔╝ ╚██████╔╝███████║
  ╚═════╝ ╚══════╝  ╚═══╝   ╚═════╝ ╚══════╝
`);

const SEPARATOR = chalk.gray('─'.repeat(56));

/**
 * Terminal GUI Dashboard for DevOS
 */
export async function launchGUI() {
  const config = new ConfigManager();
  let running = true;

  while (running) {
    console.clear();
    console.log(LOGO);
    console.log(boxen(
      chalk.bold.white('AI-Powered Full-Stack Development OS') + '\n' +
      chalk.gray('v1.2.0 — Natural Language → Code → Deploy'),
      { padding: { left: 2, right: 2, top: 0, bottom: 0 }, borderColor: 'cyan', borderStyle: 'round', textAlignment: 'center' }
    ));
    console.log('');

    // Status bar
    const activeModel = config.get('activeModel') || 'auto (smart router)';
    const workspace = config.get('workspace') || process.cwd();
    const smartRouter = config.get('smartRouter') ? chalk.green('ON') : chalk.gray('OFF');

    console.log(chalk.bold.cyan(' ⚡ Status'));
    console.log(SEPARATOR);
    console.log(`  ${chalk.gray('Model:')}     ${chalk.white(activeModel)}`);
    console.log(`  ${chalk.gray('Workspace:')} ${chalk.white(workspace)}`);
    console.log(`  ${chalk.gray('Router:')}    ${smartRouter}`);
    console.log(`  ${chalk.gray('Providers:')} ${getProviderStatus(config)}`);
    console.log('');

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: chalk.bold.cyan('What would you like to do?'),
      pageSize: 15,
      choices: [
        new inquirer.Separator(chalk.gray('── Build ──')),
        { name: `${chalk.green('⚡')} Init Project         ${chalk.gray('— Generate a project from description')}`, value: 'init' },
        { name: `${chalk.green('✏️')}  Edit Code            ${chalk.gray('— Modify files with AI')}`, value: 'edit' },
        { name: `${chalk.green('🎯')} Goal Mode            ${chalk.gray('— Describe a goal, AI builds it')}`, value: 'goal' },
        { name: `${chalk.green('🤖')} Auto Pilot           ${chalk.gray('— Fully autonomous development')}`, value: 'auto' },
        new inquirer.Separator(chalk.gray('── Run & Debug ──')),
        { name: `${chalk.blue('▶️')}  Run Project          ${chalk.gray('— Start your project')}`, value: 'run' },
        { name: `${chalk.blue('🧪')} Run Tests            ${chalk.gray('— Execute & fix tests')}`, value: 'test' },
        { name: `${chalk.blue('🔍')} Explain Code         ${chalk.gray('— AI explains your codebase')}`, value: 'explain' },
        { name: `${chalk.blue('🔎')} Find in Code         ${chalk.gray('— Semantic search your project')}`, value: 'find' },
        new inquirer.Separator(chalk.gray('── Deploy & Ops ──')),
        { name: `${chalk.magenta('🚀')} Deploy               ${chalk.gray('— Deploy to Vercel, AWS, etc.')}`, value: 'deploy' },
        { name: `${chalk.magenta('📊')} Monitor              ${chalk.gray('— Watch health & performance')}`, value: 'monitor' },
        { name: `${chalk.magenta('🔒')} Security Scan        ${chalk.gray('— Audit for vulnerabilities')}`, value: 'security' },
        new inquirer.Separator(chalk.gray('── Settings ──')),
        { name: `${chalk.yellow('🧠')} Model Settings       ${chalk.gray('— Switch AI model/provider')}`, value: 'model' },
        { name: `${chalk.yellow('📁')} Set Workspace        ${chalk.gray('— Set AI workspace folder')}`, value: 'workspace' },
        { name: `${chalk.yellow('⚙️')}  Configuration        ${chalk.gray('— API keys, preferences')}`, value: 'config' },
        { name: `${chalk.yellow('💰')} Cost Tracker         ${chalk.gray('— View API usage & costs')}`, value: 'cost' },
        new inquirer.Separator(chalk.gray('── Other ──')),
        { name: `${chalk.cyan('💬')} Interactive Shell    ${chalk.gray('— Chat with AI in terminal')}`, value: 'shell' },
        { name: `${chalk.red('✖')}  Exit                 `, value: 'exit' }
      ]
    }]);

    if (action === 'exit') {
      console.log(gradient.vice('\n  Goodbye! Happy coding. 🚀\n'));
      running = false;
      break;
    }

    if (action === 'workspace') {
      await handleWorkspace(config);
      continue;
    }

    if (action === 'model') {
      await handleModelSettings(config);
      continue;
    }

    if (action === 'cost') {
      await handleCostView();
      continue;
    }

    if (action === 'config') {
      await handleConfigMenu(config);
      continue;
    }

    // For all other actions, delegate to the CLI command
    await delegateCommand(action, config);
  }
}

function getProviderStatus(config) {
  const providers = [
    { name: 'OpenAI', key: 'OPENAI_API_KEY', color: 'green' },
    { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', color: 'yellow' },
    { name: 'Google', key: 'GOOGLE_API_KEY', color: 'blue' },
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', color: 'magenta' }
  ];

  const parts = providers.map(p => {
    const configured = config.get(p.key);
    return configured ? chalk[p.color](p.name) : chalk.gray(p.name);
  });

  return parts.join(chalk.gray(' │ '));
}

async function handleWorkspace(config) {
  console.log('');
  const current = config.get('workspace') || process.cwd();
  console.log(chalk.gray(`  Current workspace: ${current}`));
  console.log('');

  const { folder } = await inquirer.prompt([{
    type: 'input',
    name: 'folder',
    message: 'Enter workspace folder path (where AI creates files):',
    default: current
  }]);

  if (folder) {
    const { resolve } = await import('path');
    const resolved = resolve(folder);
    config.set('workspace', resolved);
    console.log(chalk.green(`\n  ✓ Workspace set to: ${resolved}\n`));
  }

  await pause();
}

async function handleModelSettings(config) {
  console.log('');
  const adapter = new AIAdapter(config);
  const models = adapter.listModels();
  const activeModel = config.get('activeModel') || '';

  const choices = [];
  let lastProvider = '';

  for (const m of models) {
    if (m.provider !== lastProvider) {
      choices.push(new inquirer.Separator(chalk.gray(`── ${m.provider.toUpperCase()} ──`)));
      lastProvider = m.provider;
    }
    const active = m.model === activeModel ? chalk.green(' ★ active') : '';
    const status = m.configured ? '' : chalk.red(' (no API key)');
    choices.push({
      name: `  ${m.model}${active}${status}`,
      value: m.model
    });
  }

  choices.push(new inquirer.Separator(''));
  choices.push({ name: chalk.gray('  ← Back'), value: 'back' });

  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: chalk.bold.cyan('Select a model:'),
    pageSize: 20,
    choices
  }]);

  if (model !== 'back') {
    config.set('activeModel', model);
    console.log(chalk.green(`\n  ✓ Active model set to: ${model}\n`));
    await pause();
  }
}

async function handleCostView() {
  console.log('');
  try {
    const tracker = new CostTracker();
    const summary = tracker.getSummary('month');

    console.log(chalk.bold.cyan('  📊 Cost Summary (This Month)\n'));

    if (summary.providers.length === 0) {
      console.log(chalk.gray('  No usage data yet.\n'));
    } else {
      for (const p of summary.providers) {
        console.log(`  ${chalk.white(p.name.padEnd(12))} ${chalk.gray('requests:')} ${chalk.white(p.requests)}  ${chalk.gray('tokens:')} ${chalk.white(p.tokens.toLocaleString())}  ${chalk.gray('cost:')} ${chalk.green('$' + p.cost.toFixed(4))}`);
      }
      console.log(SEPARATOR);
      console.log(`  ${chalk.bold('Total')}        ${chalk.gray('requests:')} ${chalk.white(summary.totalRequests)}  ${chalk.gray('tokens:')} ${chalk.white(summary.totalTokens.toLocaleString())}  ${chalk.gray('cost:')} ${chalk.green.bold('$' + summary.totalCost.toFixed(4))}`);
    }
    console.log('');
  } catch (e) {
    console.log(chalk.gray('  Cost tracking not available.\n'));
  }

  await pause();
}

async function handleConfigMenu(config) {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: chalk.bold.cyan('Configuration:'),
    choices: [
      { name: '  Set API Key', value: 'setkey' },
      { name: '  Toggle Smart Router', value: 'router' },
      { name: '  View All Config', value: 'view' },
      { name: chalk.gray('  ← Back'), value: 'back' }
    ]
  }]);

  if (action === 'back') return;

  if (action === 'setkey') {
    const { provider } = await inquirer.prompt([{
      type: 'list',
      name: 'provider',
      message: 'Select provider:',
      choices: [
        { name: 'OpenAI', value: 'OPENAI_API_KEY' },
        { name: 'Anthropic', value: 'ANTHROPIC_API_KEY' },
        { name: 'Google / Gemini', value: 'GOOGLE_API_KEY' },
        { name: 'OpenRouter', value: 'OPENROUTER_API_KEY' }
      ]
    }]);

    const { key } = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: `Enter ${provider}:`,
      mask: '*'
    }]);

    if (key) {
      config.set(provider, key);
      console.log(chalk.green(`\n  ✓ ${provider} saved\n`));
    }
  }

  if (action === 'router') {
    const current = config.get('smartRouter');
    config.set('smartRouter', !current);
    console.log(chalk.green(`\n  ✓ Smart Router: ${!current ? 'ON' : 'OFF'}\n`));
  }

  if (action === 'view') {
    const all = config.getAll();
    console.log('');
    for (const [k, v] of Object.entries(all)) {
      const isSensitive = k.toLowerCase().includes('key');
      const display = isSensitive && v ? '****' + String(v).slice(-4) : 
                      typeof v === 'object' ? JSON.stringify(v) : String(v);
      console.log(`  ${chalk.gray(k.padEnd(22))} ${chalk.white(display)}`);
    }
    console.log('');
  }

  await pause();
}

async function delegateCommand(action, config) {
  const workspace = config.get('workspace') || '';

  // For init, goal, edit, shell — get user input first
  if (['init', 'goal', 'edit', 'shell'].includes(action)) {
    let prompt = '';
    if (action !== 'shell') {
      const { input } = await inquirer.prompt([{
        type: 'input',
        name: 'input',
        message: action === 'init' ? 'Describe your project:' :
                 action === 'goal' ? 'What should I build?' :
                 'What should I edit?'
      }]);
      prompt = input;
    }

    if (!prompt && action !== 'shell') {
      console.log(chalk.yellow('\n  No input provided.\n'));
      await pause();
      return;
    }

    const args = prompt ? `"${prompt}"` : '';
    const wsFlag = workspace ? ` --dir "${workspace}"` : '';
    const cmd = `devos ${action} ${args}${wsFlag}`;

    console.log(chalk.gray(`\n  Running: ${cmd}\n`));

    // Execute via dynamic import
    const { execSync } = await import('child_process');
    try {
      execSync(cmd, { stdio: 'inherit', cwd: workspace || process.cwd() });
    } catch (e) {
      // Command handles its own errors
    }
  } else {
    const { execSync } = await import('child_process');
    const cmd = `devos ${action}`;
    console.log(chalk.gray(`\n  Running: ${cmd}\n`));
    try {
      execSync(cmd, { stdio: 'inherit', cwd: workspace || process.cwd() });
    } catch (e) {
      // Command handles its own errors
    }
  }

  console.log('');
  await pause();
}

async function pause() {
  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: chalk.gray('Press Enter to continue...')
  }]);
}
