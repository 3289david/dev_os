import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * GitHelper — Git automation utilities
 */
export class GitHelper {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  isGitRepo() {
    return existsSync(join(this.cwd, '.git'));
  }

  exec(command) {
    return execSync(`git ${command}`, {
      cwd: this.cwd,
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
  }

  init() {
    if (!this.isGitRepo()) {
      this.exec('init');
      return true;
    }
    return false;
  }

  status() {
    try {
      return this.exec('status --porcelain');
    } catch {
      return '';
    }
  }

  diff() {
    try {
      return this.exec('diff');
    } catch {
      return '';
    }
  }

  stagedDiff() {
    try {
      return this.exec('diff --cached');
    } catch {
      return '';
    }
  }

  add(files = '.') {
    this.exec(`add ${files}`);
  }

  commit(message) {
    // Sanitize commit message
    const safe = message.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    this.exec(`commit -m "${safe}"`);
  }

  log(count = 10) {
    try {
      return this.exec(`log --oneline -${count}`);
    } catch {
      return '';
    }
  }

  branch() {
    try {
      return this.exec('branch --show-current');
    } catch {
      return 'main';
    }
  }

  async generateCommitMessage(aiAdapter) {
    const diff = this.diff() || this.stagedDiff();
    
    if (!diff) {
      return 'Update files';
    }

    try {
      const response = await aiAdapter.chat([
        {
          role: 'system',
          content: 'Generate a concise, conventional commit message (type: description) for this diff. Output only the commit message, nothing else.'
        },
        { role: 'user', content: diff.substring(0, 3000) }
      ]);

      return response.trim();
    } catch {
      return 'Update files';
    }
  }
}
