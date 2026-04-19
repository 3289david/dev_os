/**
 * BaseAgent — Foundation for all DevOS agents
 */
export class BaseAgent {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.history = [];
  }

  async getAI() {
    if (!this._ai) {
      const { AIAdapter } = await import('../ai/adapter.js');
      const { ConfigManager } = await import('../utils/config.js');
      this._ai = new AIAdapter(new ConfigManager());
    }
    return this._ai;
  }

  async chat(messages, options = {}) {
    const ai = await this.getAI();
    const systemPrompt = this.getSystemPrompt();
    
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...this.history.slice(-10), // Keep last 10 messages for context
      ...messages
    ];

    const response = await ai.chat(allMessages, {
      ...this.options,
      ...options
    });

    // Track history
    messages.forEach(m => this.history.push(m));
    this.history.push({ role: 'assistant', content: response });

    return response;
  }

  getSystemPrompt() {
    return `You are ${this.name}, an AI agent in the DevOS system. You help developers by automating tasks.`;
  }

  log(message) {
    if (process.env.DEVOS_VERBOSE) {
      console.log(`[${this.name}] ${message}`);
    }
  }
}
