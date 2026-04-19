import { BaseAgent } from './base.js';

/**
 * PlannerAgent — Breaks down requirements into structured task plans
 */
export class PlannerAgent extends BaseAgent {
  constructor() {
    super('Planner');
  }

  getSystemPrompt() {
    return `You are the Planner Agent in DevOS, an AI development system.

Your role is to analyze user requirements and create detailed, actionable task plans.

When given a requirement, you must output a JSON plan with this structure:
{
  "name": "project name",
  "description": "brief description",
  "tasks": [
    {
      "id": 1,
      "type": "create_file|edit_file|run_command|install_deps|configure|test|deploy",
      "description": "what this task does",
      "agent": "coder|executor|debugger|reviewer|deployer",
      "details": { ... task-specific details ... },
      "dependencies": [list of task ids this depends on]
    }
  ],
  "summary": "what the user will get when done"
}

Rules:
- Be specific and actionable
- Order tasks by dependency
- Include all necessary setup (dependencies, config files, etc.)
- Consider error handling and edge cases
- Include testing tasks when appropriate
- Always output valid JSON`;
  }

  async createPlan(requirement) {
    const response = await this.chat([
      { role: 'user', content: `Create a detailed task plan for: ${requirement}` }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      this.log(`Plan parsing failed: ${e.message}`);
    }

    return {
      name: 'project',
      description: requirement,
      tasks: [
        {
          id: 1,
          type: 'create_file',
          description: requirement,
          agent: 'coder',
          details: { requirement },
          dependencies: []
        }
      ],
      summary: `Complete: ${requirement}`
    };
  }

  async planMigration(target, context) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Plan a code migration to ${target}. Current project context: ${JSON.stringify(context)}. Output a JSON migration plan with steps array.`
      }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      this.log(`Migration plan parsing failed: ${e.message}`);
    }

    return {
      target,
      steps: [{ description: `Migrate to ${target}`, files: ['*'] }]
    };
  }
}
