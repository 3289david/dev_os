/**
 * SmartRouter — Automatically selects the best model based on task complexity
 */
export class SmartRouter {
  constructor(providers) {
    this.providers = providers;
  }

  /**
   * Analyze task and select optimal model
   */
  route(task, availableProviders) {
    const complexity = this.assessComplexity(task);
    const configured = availableProviders.filter(p => p.isConfigured());

    if (configured.length === 0) {
      throw new Error('No AI providers configured');
    }

    // Simple tasks → fast/cheap models
    if (complexity === 'low') {
      return this.selectFastest(configured);
    }

    // Medium tasks → balanced models
    if (complexity === 'medium') {
      return this.selectBalanced(configured);
    }

    // Complex tasks → most capable models
    return this.selectBest(configured);
  }

  assessComplexity(task) {
    if (!task) return 'medium';

    const content = typeof task === 'string' ? task : JSON.stringify(task);
    const length = content.length;

    // Heuristics
    const complexKeywords = ['refactor', 'architecture', 'design', 'optimize', 'security', 'migrate', 'full'];
    const simpleKeywords = ['fix', 'typo', 'rename', 'format', 'lint', 'explain'];

    const isComplex = complexKeywords.some(k => content.toLowerCase().includes(k));
    const isSimple = simpleKeywords.some(k => content.toLowerCase().includes(k));

    if (isComplex || length > 2000) return 'high';
    if (isSimple && length < 500) return 'low';
    return 'medium';
  }

  selectFastest(providers) {
    const priority = ['ollama', 'google', 'openai', 'anthropic', 'openrouter'];
    const fastModels = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-haiku-20241022',
      google: 'gemini-3.1-flash',
      ollama: 'llama3.3',
      openrouter: 'google/gemini-3.1-flash'
    };

    for (const name of priority) {
      const provider = providers.find(p => p.name === name);
      if (provider) {
        return { provider, model: fastModels[name] };
      }
    }

    return { provider: providers[0], model: providers[0].defaultModel };
  }

  selectBalanced(providers) {
    const priority = ['openai', 'anthropic', 'google', 'openrouter', 'ollama'];
    const balancedModels = {
      openai: 'gpt-5.4-pro',
      anthropic: 'claude-4.7-sonnet-20260401',
      google: 'gemini-3.1-pro',
      ollama: 'qwen2.5-coder',
      openrouter: 'anthropic/claude-4.7-sonnet-20260401'
    };

    for (const name of priority) {
      const provider = providers.find(p => p.name === name);
      if (provider) {
        return { provider, model: balancedModels[name] };
      }
    }

    return { provider: providers[0], model: providers[0].defaultModel };
  }

  selectBest(providers) {
    const priority = ['anthropic', 'openai', 'google', 'openrouter', 'ollama'];
    const bestModels = {
      openai: 'gpt-5.4-pro',
      anthropic: 'claude-4.7-opus-20260401',
      google: 'gemini-3.1-pro',
      ollama: 'qwen2.5-coder',
      openrouter: 'anthropic/claude-4.7-opus-20260401'
    };

    for (const name of priority) {
      const provider = providers.find(p => p.name === name);
      if (provider) {
        return { provider, model: bestModels[name] };
      }
    }

    return { provider: providers[0], model: providers[0].defaultModel };
  }
}
