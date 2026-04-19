import { BaseAgent } from './base.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * CoderAgent — Generates and modifies code
 */
export class CoderAgent extends BaseAgent {
  constructor() {
    super('Coder');
  }

  getSystemPrompt() {
    return `You are the Coder Agent in DevOS, an AI development system.

Your role is to write high-quality, production-ready code.

When asked to create files, output JSON:
{
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "full file content here"
    }
  ],
  "changes": ["description of what was created/changed"]
}

When asked to edit a file, output JSON:
{
  "edits": [
    {
      "type": "replace|insert|delete",
      "search": "text to find (for replace)",
      "replace": "new text (for replace/insert)",
      "line": 0
    }
  ],
  "changes": ["description of changes"]
}

Rules:
- Write clean, well-structured code
- Follow best practices for the language/framework
- Include necessary imports
- Handle errors appropriately
- Use modern syntax
- Do NOT include explanations in code comments beyond what's necessary
- Always output valid JSON`;
  }

  async generateFiles(task, context = {}) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Generate code for: ${task.description}\n\nContext: ${JSON.stringify(context)}`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Write files to disk
        if (result.files) {
          const cwd = context.directory || process.cwd();
          for (const file of result.files) {
            const fullPath = join(cwd, file.path);
            const dir = dirname(fullPath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            writeFileSync(fullPath, file.content, 'utf-8');
            this.log(`Created: ${file.path}`);
          }
        }

        return result;
      }
    } catch (e) {
      this.log(`Code generation parsing failed: ${e.message}`);
    }

    return { files: [], changes: ['Failed to generate code'] };
  }

  async editFile(filePath, instruction, options = {}) {
    let currentContent = '';
    try {
      currentContent = readFileSync(filePath, 'utf-8');
    } catch (e) {
      // File doesn't exist, will create
    }

    const response = await this.chat([
      {
        role: 'user',
        content: `Edit this file based on the instruction.

File: ${filePath}
Current content:
\`\`\`
${currentContent}
\`\`\`

Instruction: ${instruction}

Output the complete new file content wrapped in a JSON response.`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        if (result.content) {
          const dir = dirname(filePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(filePath, result.content, 'utf-8');
        } else if (result.files && result.files[0]) {
          writeFileSync(filePath, result.files[0].content, 'utf-8');
        }

        return {
          success: true,
          changes: result.changes || ['File updated'],
          diff: result.diff
        };
      }
    } catch (e) {
      this.log(`Edit parsing failed: ${e.message}`);
    }

    return { success: false, changes: [], error: 'Failed to parse AI response' };
  }

  async generateTests(file, cwd) {
    const context = file ? readFileSync(join(cwd, file), 'utf-8') : 'project-wide';
    
    const response = await this.chat([
      {
        role: 'user',
        content: `Generate comprehensive tests for this code:\n\n${context}\n\nOutput JSON with files array containing test files.`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.files) {
          for (const file of result.files) {
            const fullPath = join(cwd, file.path);
            const dir = dirname(fullPath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            writeFileSync(fullPath, file.content, 'utf-8');
          }
          return { count: result.files.length, files: result.files.map(f => f.path) };
        }
      }
    } catch (e) {
      this.log(`Test generation failed: ${e.message}`);
    }

    return { count: 0, files: [] };
  }
}
