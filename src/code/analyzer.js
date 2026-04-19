import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join, extname, relative } from 'path';

/**
 * CodeAnalyzer — Static analysis of code and project structure
 */
export class CodeAnalyzer {
  constructor() {
    this.ignorePatterns = ['node_modules/**', 'dist/**', 'build/**', '.git/**', '*.lock'];
  }

  async analyzeProject(cwd) {
    const files = await glob('**/*', {
      cwd,
      ignore: this.ignorePatterns,
      nodir: true
    });

    const structure = {
      totalFiles: files.length,
      languages: {},
      frameworks: [],
      hasTests: false,
      hasDocker: false,
      hasCICD: false,
      entryPoints: [],
      dependencies: {},
      fileTree: this.buildTree(files)
    };

    // Analyze language distribution
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      if (ext) {
        structure.languages[ext] = (structure.languages[ext] || 0) + 1;
      }
    }

    // Detect frameworks
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      structure.dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      structure.frameworks = this.detectFrameworks(structure.dependencies);
    }

    // Detect features
    structure.hasTests = files.some(f => 
      f.includes('test') || f.includes('spec') || f.includes('__tests__'));
    structure.hasDocker = files.some(f => 
      f.includes('Dockerfile') || f.includes('docker-compose'));
    structure.hasCICD = files.some(f => 
      f.includes('.github/workflows') || f.includes('.gitlab-ci') || f.includes('Jenkinsfile'));
    
    // Find entry points
    const entryFiles = ['index.js', 'index.ts', 'app.js', 'app.ts', 'main.js', 
                        'main.ts', 'server.js', 'server.ts', 'main.py', 'app.py', 'main.go'];
    structure.entryPoints = files.filter(f => entryFiles.some(e => f.endsWith(e)));

    return structure;
  }

  detectFrameworks(deps = {}) {
    const frameworks = [];
    const map = {
      'react': 'React',
      'next': 'Next.js',
      'vue': 'Vue',
      'nuxt': 'Nuxt',
      'svelte': 'Svelte',
      'angular': 'Angular',
      'express': 'Express',
      'fastify': 'Fastify',
      'koa': 'Koa',
      'nest': 'NestJS',
      'tailwindcss': 'Tailwind CSS',
      'prisma': 'Prisma',
      'mongoose': 'Mongoose',
      'typeorm': 'TypeORM',
      'jest': 'Jest',
      'vitest': 'Vitest',
      'typescript': 'TypeScript'
    };

    for (const [key, name] of Object.entries(map)) {
      if (Object.keys(deps).some(d => d.includes(key))) {
        frameworks.push(name);
      }
    }

    return frameworks;
  }

  buildTree(files) {
    const tree = {};
    
    for (const file of files) {
      const parts = file.split('/');
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = null; // leaf
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    }

    return tree;
  }

  async checkFile(filePath) {
    const issues = [];
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const ext = extname(filePath).toLowerCase();

      // Basic checks
      lines.forEach((line, i) => {
        // Trailing whitespace
        if (line !== line.trimEnd() && line.trim().length > 0) {
          issues.push({
            line: i + 1,
            message: 'Trailing whitespace',
            severity: 'low'
          });
        }

        // Very long lines
        if (line.length > 200) {
          issues.push({
            line: i + 1,
            message: `Line too long (${line.length} chars)`,
            severity: 'low'
          });
        }

        // console.log in production code
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext) && line.includes('console.log')) {
          issues.push({
            line: i + 1,
            message: 'console.log found (consider removing for production)',
            severity: 'low'
          });
        }

        // TODO/FIXME
        if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
          issues.push({
            line: i + 1,
            message: `Found ${line.includes('TODO') ? 'TODO' : line.includes('FIXME') ? 'FIXME' : 'HACK'}`,
            severity: 'info'
          });
        }
      });

    } catch (e) {
      issues.push({ line: 0, message: `Cannot read file: ${e.message}`, severity: 'error' });
    }

    return issues;
  }
}
