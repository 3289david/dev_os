import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * ContextMemory — Project history and decision tracking
 */
export class ContextMemory {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.memoryDir = join(this.cwd, '.devos', 'memory');
    this.ensureDir();
  }

  ensureDir() {
    if (!existsSync(this.memoryDir)) {
      mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  save(key, data) {
    const filePath = join(this.memoryDir, `${key}.json`);
    const entry = {
      timestamp: new Date().toISOString(),
      data
    };

    let history = [];
    if (existsSync(filePath)) {
      history = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
    
    history.push(entry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history = history.slice(-100);
    }

    writeFileSync(filePath, JSON.stringify(history, null, 2));
  }

  load(key) {
    const filePath = join(this.memoryDir, `${key}.json`);
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
    return [];
  }

  getLatest(key) {
    const history = this.load(key);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  search(query) {
    const results = [];
    const files = ['decisions', 'errors', 'fixes', 'plans', 'deployments'];

    for (const file of files) {
      const history = this.load(file);
      for (const entry of history) {
        const content = JSON.stringify(entry).toLowerCase();
        if (content.includes(query.toLowerCase())) {
          results.push({ type: file, ...entry });
        }
      }
    }

    return results;
  }

  clear() {
    const { rmSync } = require('fs');
    rmSync(this.memoryDir, { recursive: true, force: true });
    this.ensureDir();
  }
}
