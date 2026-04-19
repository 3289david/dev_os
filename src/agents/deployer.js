import { BaseAgent } from './base.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

/**
 * DeployAgent — Handles project deployment to various platforms
 */
export class DeployAgent extends BaseAgent {
  constructor() {
    super('Deployer');
    this.deployHistoryFile = '.devos/deploy-history.json';
  }

  getSystemPrompt() {
    return `You are the Deploy Agent. You analyze projects and deploy them to the best platform.`;
  }

  async analyze(cwd) {
    const analysis = {
      type: 'unknown',
      framework: null,
      hasDockerfile: existsSync(join(cwd, 'Dockerfile')),
      hasBuildScript: false,
      recommendedPlatform: 'docker'
    };

    // Check package.json
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      analysis.hasBuildScript = !!pkg.scripts?.build;

      // Detect framework
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.next) {
        analysis.framework = 'Next.js';
        analysis.type = 'fullstack';
        analysis.recommendedPlatform = 'vercel';
      } else if (deps.react || deps['react-dom']) {
        analysis.framework = 'React';
        analysis.type = 'frontend';
        analysis.recommendedPlatform = 'vercel';
      } else if (deps.vue) {
        analysis.framework = 'Vue';
        analysis.type = 'frontend';
        analysis.recommendedPlatform = 'vercel';
      } else if (deps.express || deps.fastify || deps.koa) {
        analysis.framework = deps.express ? 'Express' : deps.fastify ? 'Fastify' : 'Koa';
        analysis.type = 'backend';
        analysis.recommendedPlatform = 'railway';
      } else if (deps.nuxt) {
        analysis.framework = 'Nuxt';
        analysis.type = 'fullstack';
        analysis.recommendedPlatform = 'vercel';
      }
    }

    // Python project
    if (existsSync(join(cwd, 'requirements.txt')) || existsSync(join(cwd, 'pyproject.toml'))) {
      if (existsSync(join(cwd, 'manage.py'))) {
        analysis.framework = 'Django';
        analysis.type = 'fullstack';
        analysis.recommendedPlatform = 'railway';
      } else {
        analysis.framework = 'Python';
        analysis.type = 'backend';
        analysis.recommendedPlatform = 'railway';
      }
    }

    // Docker override
    if (analysis.hasDockerfile) {
      analysis.recommendedPlatform = 'docker';
    }

    return analysis;
  }

  async build(cwd, analysis) {
    this.log('Building project...');

    if (analysis.hasBuildScript) {
      try {
        execSync('npm run build', { cwd, stdio: 'pipe' });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.stderr?.toString() || err.message };
      }
    }

    return { success: true, note: 'No build step needed' };
  }

  async deploy(cwd, options) {
    const { target, env, analysis } = options;
    this.log(`Deploying to ${target}...`);

    // Generate deployment config if needed
    await this.generateDeployConfig(cwd, target, analysis);

    let result;
    
    switch (target) {
      case 'vercel':
        result = await this.deployVercel(cwd);
        break;
      case 'railway':
        result = await this.deployRailway(cwd);
        break;
      case 'docker':
        result = await this.deployDocker(cwd, analysis);
        break;
      case 'flyio':
        result = await this.deployFlyio(cwd);
        break;
      case 'local':
        result = await this.deployLocal(cwd, analysis);
        break;
      default:
        result = await this.deployDocker(cwd, analysis);
    }

    // Save deploy history
    this.saveDeployHistory(cwd, { ...result, target, env, timestamp: new Date().toISOString() });

    return result;
  }

  async generateDeployConfig(cwd, target, analysis) {
    if (target === 'docker' && !existsSync(join(cwd, 'Dockerfile'))) {
      const dockerfile = this.generateDockerfile(analysis);
      writeFileSync(join(cwd, 'Dockerfile'), dockerfile);
      this.log('Generated Dockerfile');
    }

    if (target === 'vercel' && !existsSync(join(cwd, 'vercel.json'))) {
      const config = JSON.stringify({
        version: 2,
        builds: [{ src: './**', use: '@vercel/static' }]
      }, null, 2);
      writeFileSync(join(cwd, 'vercel.json'), config);
      this.log('Generated vercel.json');
    }
  }

  generateDockerfile(analysis) {
    if (analysis.framework === 'Django' || analysis.type === 'python') {
      return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`;
    }

    return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
${analysis.hasBuildScript ? 'RUN npm run build' : ''}
EXPOSE 3000
CMD ["npm", "start"]`;
  }

  async deployVercel(cwd) {
    try {
      const output = execSync('npx vercel --prod --yes', { cwd, encoding: 'utf-8', stdio: 'pipe' });
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      return { success: true, url: urlMatch ? urlMatch[0] : output.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deployRailway(cwd) {
    try {
      const output = execSync('railway up', { cwd, encoding: 'utf-8', stdio: 'pipe' });
      return { success: true, url: output.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deployDocker(cwd, analysis) {
    const name = analysis?.name || 'devos-app';
    try {
      execSync(`docker build -t ${name} .`, { cwd, stdio: 'pipe' });
      execSync(`docker run -d -p 3000:3000 --name ${name} ${name}`, { cwd, stdio: 'pipe' });
      return { success: true, url: 'http://localhost:3000' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deployFlyio(cwd) {
    try {
      const output = execSync('fly deploy', { cwd, encoding: 'utf-8', stdio: 'pipe' });
      return { success: true, url: output.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deployLocal(cwd, analysis) {
    const { Executor } = await import('./executor.js');
    const executor = new Executor();
    const result = await executor.run(null, { cwd, port: 3000, timeout: 10000 });
    
    return {
      success: result.success,
      url: 'http://localhost:3000',
      note: 'Running on local machine'
    };
  }

  async getStatus(cwd) {
    const history = this.loadDeployHistory(cwd);
    const latest = history[history.length - 1];
    
    if (!latest) {
      return { name: 'Unknown', running: false };
    }

    const pkgPath = join(cwd, 'package.json');
    const name = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf-8')).name : 'Unknown';

    return {
      name,
      running: true,
      platform: latest.target,
      url: latest.url,
      lastDeploy: latest.timestamp,
      version: latest.version || '1.0.0'
    };
  }

  async getLogs(cwd, options) {
    // Return local logs
    const logPath = join(cwd, '.devos', 'logs.json');
    if (existsSync(logPath)) {
      const logs = JSON.parse(readFileSync(logPath, 'utf-8'));
      return logs.slice(-options.lines);
    }
    return [];
  }

  async followLogs(cwd, callback) {
    // Placeholder for real-time log following
    this.log('Log following not yet implemented for this platform');
  }

  async listVersions(cwd) {
    const history = this.loadDeployHistory(cwd);
    return history.map((h, i) => ({
      version: h.version || `v1.0.${i}`,
      date: h.timestamp,
      current: i === history.length - 1
    }));
  }

  async rollback(cwd, version) {
    const history = this.loadDeployHistory(cwd);
    const target = history.find(h => h.version === version);
    
    if (!target) {
      throw new Error(`Version ${version} not found`);
    }

    // Re-deploy the target version
    return this.deploy(cwd, target);
  }

  saveDeployHistory(cwd, entry) {
    const dir = join(cwd, '.devos');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const historyPath = join(dir, 'deploy-history.json');
    let history = [];
    
    if (existsSync(historyPath)) {
      history = JSON.parse(readFileSync(historyPath, 'utf-8'));
    }

    history.push(entry);
    writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  loadDeployHistory(cwd) {
    const historyPath = join(cwd, '.devos', 'deploy-history.json');
    if (existsSync(historyPath)) {
      return JSON.parse(readFileSync(historyPath, 'utf-8'));
    }
    return [];
  }
}
