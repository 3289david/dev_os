import { BaseAgent } from './base.js';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Executor — Runs commands and manages processes
 */
export class Executor extends BaseAgent {
  constructor() {
    super('Executor');
    this.processes = new Map();
  }

  getSystemPrompt() {
    return `You are the Executor Agent. You run shell commands and manage processes.`;
  }

  async run(script, options = {}) {
    const cwd = options.cwd || process.cwd();
    const timeout = options.timeout || 30000;

    // Detect run command
    let command = script;
    if (!command) {
      command = this.detectRunCommand(cwd);
    }

    if (!command) {
      return {
        success: false,
        error: 'Could not detect run command. Specify a script or add a start script to package.json.'
      };
    }

    this.log(`Running: ${command}`);

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn('sh', ['-c', command], {
        cwd,
        env: { ...process.env, PORT: options.port || '3000' },
        stdio: 'pipe'
      });

      this.processes.set(proc.pid, proc);

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (process.env.DEVOS_VERBOSE) {
          process.stdout.write(text);
        }
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (process.env.DEVOS_VERBOSE) {
          process.stderr.write(text);
        }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        // If the process is still running after timeout, it's likely a server
        if (!stderr.toLowerCase().includes('error')) {
          resolve({
            success: true,
            url: `http://localhost:${options.port || 3000}`,
            stdout,
            stderr,
            pid: proc.pid
          });
        } else {
          resolve({
            success: false,
            error: stderr || stdout,
            context: { cwd, command, stdout, stderr }
          });
        }
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timer);
        this.processes.delete(proc.pid);
        
        if (!timedOut) {
          resolve({
            success: code === 0,
            error: code !== 0 ? (stderr || stdout) : null,
            stdout,
            stderr,
            exitCode: code,
            context: { cwd, command }
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: err.message,
          context: { cwd, command }
        });
      });
    });
  }

  async execCommand(command, options = {}) {
    const cwd = options.cwd || process.cwd();
    
    try {
      const stdout = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout: options.timeout || 60000,
        stdio: 'pipe'
      });

      return { success: true, stdout, stderr: '' };
    } catch (err) {
      return {
        success: false,
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: err.status
      };
    }
  }

  async runTests(coverage = false) {
    const cwd = process.cwd();
    const testCmd = this.detectTestCommand(cwd);
    
    if (!testCmd) {
      return { passed: false, total: 0, failed: 0, error: 'No test command found' };
    }

    const cmd = coverage ? `${testCmd} --coverage` : testCmd;
    const result = await this.execCommand(cmd);

    // Parse test results (basic parsing)
    const output = result.stdout + result.stderr;
    const passMatch = output.match(/(\d+)\s*(?:passing|passed)/i);
    const failMatch = output.match(/(\d+)\s*(?:failing|failed)/i);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;

    return {
      passed: result.success,
      total: passed + failed,
      failed,
      coverage: coverage ? this.parseCoverage(output) : null,
      output,
      failures: failed > 0 ? output : null
    };
  }

  detectRunCommand(cwd) {
    // Check package.json
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.dev) return 'npm run dev';
      if (pkg.scripts?.start) return 'npm start';
      if (pkg.main) return `node ${pkg.main}`;
    }

    // Check for common entry points
    if (existsSync(join(cwd, 'index.js'))) return 'node index.js';
    if (existsSync(join(cwd, 'app.js'))) return 'node app.js';
    if (existsSync(join(cwd, 'server.js'))) return 'node server.js';
    if (existsSync(join(cwd, 'main.py'))) return 'python main.py';
    if (existsSync(join(cwd, 'app.py'))) return 'python app.py';
    if (existsSync(join(cwd, 'manage.py'))) return 'python manage.py runserver';
    if (existsSync(join(cwd, 'Cargo.toml'))) return 'cargo run';
    if (existsSync(join(cwd, 'main.go'))) return 'go run main.go';

    return null;
  }

  detectTestCommand(cwd) {
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
        return 'npm test';
      }
    }

    if (existsSync(join(cwd, 'pytest.ini')) || existsSync(join(cwd, 'setup.cfg'))) return 'pytest';
    if (existsSync(join(cwd, 'Cargo.toml'))) return 'cargo test';

    return 'npm test';
  }

  parseCoverage(output) {
    const match = output.match(/(?:All files|Statements)\s*\|\s*([\d.]+)%/);
    return match ? parseFloat(match[1]) : null;
  }

  killProcess(pid) {
    const proc = this.processes.get(pid);
    if (proc) {
      proc.kill('SIGTERM');
      this.processes.delete(pid);
    }
  }

  killAll() {
    for (const [pid, proc] of this.processes) {
      proc.kill('SIGTERM');
    }
    this.processes.clear();
  }
}
