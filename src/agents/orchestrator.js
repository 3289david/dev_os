import { PlannerAgent } from './planner.js';
import { CoderAgent } from './coder.js';
import { DebuggerAgent } from './debugger.js';
import { ReviewerAgent } from './reviewer.js';
import { Executor } from './executor.js';
import { DeployAgent } from './deployer.js';
import { MonitorAgent } from './monitor.js';
import { CodeAnalyzer } from '../code/analyzer.js';

/**
 * Orchestrator — Coordinates all agents to accomplish complex tasks
 */
export class Orchestrator {
  constructor() {
    this.planner = new PlannerAgent();
    this.coder = new CoderAgent();
    this.debugger = new DebuggerAgent();
    this.reviewer = new ReviewerAgent();
    this.executor = new Executor();
    this.deployer = new DeployAgent();
    this.monitor = new MonitorAgent();
    this.analyzer = new CodeAnalyzer();
  }

  async plan(requirement) {
    return this.planner.createPlan(requirement);
  }

  async execute(plan, options = {}) {
    const results = { files: [], errors: [], success: true };

    for (const task of plan.tasks) {
      try {
        const result = await this.executeTask(task, options);
        if (result.files) results.files.push(...result.files);
      } catch (err) {
        results.errors.push({ task: task.id, error: err.message });
        results.success = false;
      }
    }

    // Install dependencies if needed
    if (options.install && options.type === 'init') {
      try {
        this.executor.execCommand('npm install', { cwd: options.directory || process.cwd() });
      } catch (e) {
        // Non-critical
      }
    }

    return results;
  }

  async executeTask(task, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let result;

        switch (task.agent || task.type) {
          case 'coder':
          case 'create_file':
            result = await this.coder.generateFiles(task, options);
            return { success: true, files: result.files?.map(f => f.path) || [], ...result };

          case 'executor':
          case 'run_command':
            result = await this.executor.execCommand(task.details?.command || task.command);
            if (!result.success && options.autoFix) {
              const fix = await this.debugger.analyze(result.stderr, { task });
              if (!fix.fixed) throw new Error(result.stderr);
            }
            return { success: result.success, ...result };

          case 'install_deps':
            result = await this.executor.execCommand(
              task.details?.command || 'npm install',
              { cwd: options.directory || process.cwd() }
            );
            return { success: result.success, ...result };

          case 'debugger':
            result = await this.debugger.analyze(task.details?.error, task.details?.context);
            return { success: result.fixed, ...result };

          case 'reviewer':
            result = await this.reviewer.analyze(
              task.details?.target || options.directory || process.cwd()
            );
            return { success: true, ...result };

          case 'deployer':
          case 'deploy':
            result = await this.deployer.deploy(
              options.directory || process.cwd(),
              task.details || options
            );
            return { success: result.success, ...result };

          case 'test':
            result = await this.executor.runTests();
            return { success: result.passed, ...result };

          default:
            result = await this.coder.generateFiles(task, options);
            return { success: true, ...result };
        }

      } catch (err) {
        lastError = err;
        if (attempt < maxRetries && options.autoFix) {
          // Try to auto-fix
          await this.debugger.analyze(err.message, { task, attempt });
        }
      }
    }

    return {
      success: false,
      note: lastError?.message || 'Task failed after retries'
    };
  }

  async naturalLanguageToCommand(input) {
    const response = await this.executor.chat([
      {
        role: 'system',
        content: 'Convert natural language to a shell command. Output ONLY the command, nothing else.'
      },
      { role: 'user', content: input }
    ]);

    return response.trim();
  }

  async explainFile(file, deep = false) {
    const { readFileSync } = await import('fs');
    const content = readFileSync(file, 'utf-8');

    const response = await this.reviewer.chat([
      {
        role: 'user',
        content: `Explain this code${deep ? ' in detail with dependency analysis' : ''}:\n\n${content}`
      }
    ]);

    return response;
  }

  async explainProject(structure) {
    const response = await this.reviewer.chat([
      {
        role: 'user',
        content: `Explain this project structure:\n\n${JSON.stringify(structure, null, 2)}`
      }
    ]);

    return response;
  }

  async generateTests(file, cwd) {
    return this.coder.generateTests(file, cwd);
  }

  async fixTests(failures) {
    return this.debugger.fixTests(failures);
  }

  async checkFile(path) {
    return this.analyzer.checkFile(path);
  }

  async autoFix(path, issues) {
    const response = await this.debugger.chat([
      {
        role: 'user',
        content: `Fix these issues in ${path}:\n${issues.map(i => `- ${i.message} (line ${i.line})`).join('\n')}`
      }
    ]);

    return { fixed: true, count: issues.length };
  }

  async planMigration(target, context) {
    return this.planner.planMigration(target, context);
  }

  async executeMigration(plan) {
    let filesChanged = 0;

    for (const step of plan.steps) {
      const result = await this.coder.generateFiles({
        description: step.description,
        details: step
      });
      filesChanged += result.files?.length || 0;
    }

    return { filesChanged };
  }
}
