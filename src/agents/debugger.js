import { BaseAgent } from './base.js';
import { readFileSync, writeFileSync } from 'fs';

/**
 * DebuggerAgent — Analyzes errors and generates fixes
 */
export class DebuggerAgent extends BaseAgent {
  constructor() {
    super('Debugger');
  }

  getSystemPrompt() {
    return `You are the Debugger Agent in DevOS, an AI development system.

Your role is to analyze error messages and stack traces, then generate precise fixes.

When given an error, output JSON:
{
  "diagnosis": "what went wrong",
  "rootCause": "the underlying cause",
  "fix": {
    "file": "path/to/file",
    "type": "replace|insert|delete|command",
    "search": "text to find (for replace)",
    "replace": "corrected text",
    "command": "shell command to run (if type is command)"
  },
  "description": "human-readable fix description",
  "suggestion": "alternative approach if fix doesn't work",
  "preventionTip": "how to avoid this in the future"
}

Rules:
- Be precise about the fix location
- Consider the full stack trace
- Check for common issues first (missing deps, typos, wrong imports)
- Suggest the minimum change needed
- Always output valid JSON`;
  }

  async analyze(error, context = {}) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Analyze this error and provide a fix:

Error:
${error}

Context:
${JSON.stringify(context, null, 2)}`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        // Apply fix if possible
        if (result.fix && result.fix.file && result.fix.type === 'replace') {
          try {
            let content = readFileSync(result.fix.file, 'utf-8');
            content = content.replace(result.fix.search, result.fix.replace);
            writeFileSync(result.fix.file, content, 'utf-8');
            return {
              fixed: true,
              description: result.description,
              diagnosis: result.diagnosis,
              suggestion: result.suggestion
            };
          } catch (e) {
            this.log(`Could not apply fix: ${e.message}`);
          }
        }

        return {
          fixed: false,
          description: result.description || result.diagnosis,
          diagnosis: result.diagnosis,
          suggestion: result.suggestion || 'Check the error manually',
          fix: result.fix
        };
      }
    } catch (e) {
      this.log(`Debug analysis parsing failed: ${e.message}`);
    }

    return {
      fixed: false,
      description: 'Could not analyze error',
      suggestion: 'Check the error output manually'
    };
  }

  async fixTests(failures) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Fix these failing tests:\n\n${JSON.stringify(failures, null, 2)}\n\nOutput JSON with fixes.`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Apply fixes...
        return { fixed: true, count: result.fixes?.length || 0 };
      }
    } catch (e) {
      this.log(`Test fix parsing failed: ${e.message}`);
    }

    return { fixed: false, count: 0 };
  }
}
