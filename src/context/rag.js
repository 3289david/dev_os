import { readFileSync } from 'fs';
import { glob } from 'glob';

/**
 * RAGEngine — Retrieval-Augmented Generation for codebase search
 */
export class RAGEngine {
  constructor() {
    this.index = null;
    this.ignorePatterns = ['node_modules/**', 'dist/**', '.git/**', '*.lock', '*.map'];
  }

  async buildIndex(cwd) {
    const files = await glob('**/*.{js,ts,jsx,tsx,py,go,rs,java,rb,php,css,html,json,md,yaml,yml}', {
      cwd,
      ignore: this.ignorePatterns
    });

    this.index = [];

    for (const file of files) {
      try {
        const content = readFileSync(`${cwd}/${file}`, 'utf-8');
        const lines = content.split('\n');

        // Index functions, classes, and important code blocks
        lines.forEach((line, i) => {
          const trimmed = line.trim();
          
          // Index function/class definitions and important code
          if (this.isIndexable(trimmed)) {
            this.index.push({
              file,
              line: i + 1,
              content: trimmed,
              context: lines.slice(Math.max(0, i - 2), i + 5).join('\n'),
              tokens: this.tokenize(trimmed)
            });
          }
        });

      } catch (e) {
        // Skip unreadable files
      }
    }

    return this.index;
  }

  isIndexable(line) {
    const patterns = [
      /^(export\s+)?(async\s+)?function\s/,
      /^(export\s+)?(default\s+)?class\s/,
      /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
      /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/,
      /^\s*(public|private|protected|static)\s+\w+/,
      /^(export\s+)?interface\s/,
      /^(export\s+)?type\s+\w+/,
      /^(export\s+)?enum\s/,
      /^def\s+\w+/,
      /^class\s+\w+/,
      /^func\s+\w+/,
      /^fn\s+\w+/,
      /^app\.(get|post|put|delete|patch|use)/,
      /^router\.(get|post|put|delete|patch)/,
      /^import\s/,
      /^from\s/
    ];

    return patterns.some(p => p.test(line));
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  async search(query, options = {}) {
    const cwd = process.cwd();
    
    if (!this.index) {
      await this.buildIndex(cwd);
    }

    const queryTokens = this.tokenize(query);
    const results = [];

    for (const entry of this.index) {
      const score = this.calculateScore(queryTokens, entry.tokens, query, entry.content);
      
      if (score > 0.1) {
        results.push({
          file: entry.file,
          line: entry.line,
          snippet: entry.content,
          context: entry.context,
          score
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply type filter
    if (options.type) {
      return results
        .filter(r => this.matchesType(r.snippet, options.type))
        .slice(0, options.limit || 10);
    }

    return results.slice(0, options.limit || 10);
  }

  calculateScore(queryTokens, entryTokens, queryRaw, contentRaw) {
    let score = 0;

    // Token overlap
    const overlap = queryTokens.filter(t => entryTokens.includes(t)).length;
    score += overlap / Math.max(queryTokens.length, 1);

    // Exact substring match bonus
    if (contentRaw.toLowerCase().includes(queryRaw.toLowerCase())) {
      score += 0.5;
    }

    // Partial match bonus
    for (const qt of queryTokens) {
      if (contentRaw.toLowerCase().includes(qt)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  matchesType(snippet, type) {
    const typePatterns = {
      function: /function\s|=>\s*\{|def\s|func\s|fn\s/,
      class: /class\s/,
      variable: /const\s|let\s|var\s/,
      import: /^import\s|^from\s/,
      type: /interface\s|type\s.*=/,
      file: /.*/ // match all for file type
    };

    return typePatterns[type]?.test(snippet) ?? true;
  }
}
