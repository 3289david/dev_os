import { BaseAgent } from './base.js';
import http from 'http';
import https from 'https';

/**
 * MonitorAgent — Health monitoring and self-healing
 */
export class MonitorAgent extends BaseAgent {
  constructor() {
    super('Monitor');
  }

  getSystemPrompt() {
    return `You are the Monitor Agent. You check health and diagnose production issues.`;
  }

  async healthCheck(target) {
    // URL-based health check
    if (target.startsWith('http')) {
      return this.httpHealthCheck(target);
    }

    // Process-based health check
    return this.processHealthCheck(target);
  }

  async httpHealthCheck(url) {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const timeout = 10000;

      const req = client.get(url, { timeout }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ status: 'healthy', statusCode: res.statusCode });
        } else {
          resolve({ status: 'unhealthy', statusCode: res.statusCode, error: `HTTP ${res.statusCode}` });
        }
      });

      req.on('error', (err) => {
        resolve({ status: 'unhealthy', error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'unhealthy', error: 'Timeout' });
      });
    });
  }

  async processHealthCheck(cwd) {
    try {
      const { execSync } = await import('child_process');
      // Check if any node process is running in cwd
      const output = execSync('pgrep -f "node|python|ruby|go" || true', { encoding: 'utf-8' });
      
      if (output.trim()) {
        return { status: 'healthy', pids: output.trim().split('\n') };
      } else {
        return { status: 'unhealthy', error: 'No application process found' };
      }
    } catch (err) {
      return { status: 'unhealthy', error: err.message };
    }
  }

  async recover(healthResult) {
    this.log(`Attempting recovery from: ${healthResult.error}`);

    try {
      const { Executor } = await import('./executor.js');
      const executor = new Executor();

      // Try restarting the application
      const result = await executor.run(null, { cwd: process.cwd(), timeout: 15000 });

      if (result.success) {
        return { success: true, action: 'restarted' };
      }

      // If restart fails, try debugging
      const { DebuggerAgent } = await import('./debugger.js');
      const debugger_ = new DebuggerAgent();
      const fix = await debugger_.analyze(result.error || healthResult.error);

      if (fix.fixed) {
        // Retry after fix
        const retryResult = await executor.run(null, { cwd: process.cwd(), timeout: 15000 });
        return { success: retryResult.success, action: 'fixed-and-restarted' };
      }

      return { success: false, action: 'manual-intervention-needed' };

    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
