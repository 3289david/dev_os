import { BaseAgent } from './base.js';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

/**
 * ReviewerAgent — Code quality review and refactoring
 */
export class ReviewerAgent extends BaseAgent {
  constructor() {
    super('Reviewer');
  }

  getSystemPrompt() {
    return `You are the Reviewer Agent in DevOS, an AI development system.

Your role is to review code quality, find improvements, and suggest refactorings.

When reviewing code, output JSON:
{
  "score": 0-100,
  "suggestions": [
    {
      "type": "performance|cleanup|security|readability|bug",
      "title": "short title",
      "description": "detailed description",
      "file": "path/to/file",
      "line": 0,
      "severity": "critical|high|medium|low",
      "fix": {
        "search": "current code",
        "replace": "improved code"
      }
    }
  ],
  "summary": "overall assessment"
}

Rules:
- Focus on impactful improvements
- Don't nitpick style (unless it affects readability significantly)
- Prioritize security issues
- Check for performance bottlenecks
- Look for code duplication
- Always output valid JSON`;
  }

  async analyze(target, options = {}) {
    let codeContent = '';
    
    try {
      const stats = await import('fs').then(fs => fs.promises.stat(target));
      
      if (stats.isDirectory()) {
        const files = await glob('**/*.{js,ts,jsx,tsx,py,go,rs}', {
          cwd: target,
          ignore: ['node_modules/**', 'dist/**', '.git/**']
        });
        
        for (const file of files.slice(0, 20)) { // Limit to 20 files
          const content = readFileSync(`${target}/${file}`, 'utf-8');
          codeContent += `\n--- ${file} ---\n${content}\n`;
        }
      } else {
        codeContent = readFileSync(target, 'utf-8');
      }
    } catch (e) {
      codeContent = `Unable to read: ${e.message}`;
    }

    const focusPrompt = options.performance ? ' Focus on performance optimization.' :
                        options.cleanup ? ' Focus on code cleanup and deduplication.' :
                        ' General review.';

    const response = await this.chat([
      {
        role: 'user',
        content: `Review this code.${focusPrompt}\n\n${codeContent}`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      this.log(`Review parsing failed: ${e.message}`);
    }

    return { score: 0, suggestions: [], summary: 'Unable to analyze' };
  }

  async applyRefactoring(analysis) {
    let applied = 0;

    for (const suggestion of analysis.suggestions) {
      if (suggestion.fix && suggestion.file) {
        try {
          let content = readFileSync(suggestion.file, 'utf-8');
          if (content.includes(suggestion.fix.search)) {
            content = content.replace(suggestion.fix.search, suggestion.fix.replace);
            writeFileSync(suggestion.file, content, 'utf-8');
            applied++;
          }
        } catch (e) {
          this.log(`Could not apply refactoring: ${e.message}`);
        }
      }
    }

    return { applied };
  }
}
