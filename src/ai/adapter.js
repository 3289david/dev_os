import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GoogleProvider } from './providers/google.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenRouterProvider } from './providers/openrouter.js';

/**
 * AIAdapter — Unified interface for all AI providers
 */
export class AIAdapter {
  constructor(config) {
    this.config = config;
    this.providers = {};
    this.initProviders();
  }

  initProviders() {
    const providerMap = {
      openai: OpenAIProvider,
      anthropic: AnthropicProvider,
      google: GoogleProvider,
      ollama: OllamaProvider,
      openrouter: OpenRouterProvider
    };

    for (const [name, Provider] of Object.entries(providerMap)) {
      this.providers[name] = new Provider(this.config);
    }
  }

  getActiveProvider() {
    const activeModel = this.config.get('activeModel');
    
    if (activeModel) {
      // Find provider for the model
      for (const [name, provider] of Object.entries(this.providers)) {
        if (provider.supportsModel(activeModel)) {
          return { provider, model: activeModel };
        }
      }
    }

    // Smart routing
    if (this.config.get('smartRouter')) {
      return this.smartRoute();
    }

    // Default: try providers in order
    const order = ['openai', 'anthropic', 'google', 'openrouter', 'ollama'];
    for (const name of order) {
      if (this.providers[name]?.isConfigured()) {
        return { provider: this.providers[name], model: this.providers[name].defaultModel };
      }
    }

    throw new Error(
      'No AI provider configured. Run:\n' +
      '  devos config set OPENAI_API_KEY=your-key\n' +
      '  devos model use gpt-4\n' +
      'Or use Ollama for local models:\n' +
      '  devos model add ollama'
    );
  }

  smartRoute() {
    // Prefer local models for simple tasks, cloud for complex ones
    const configured = Object.entries(this.providers)
      .filter(([_, p]) => p.isConfigured())
      .map(([name, p]) => ({ name, provider: p }));

    if (configured.length === 0) {
      throw new Error('No AI provider configured.');
    }

    // Default to first configured provider
    const chosen = configured[0];
    return { provider: chosen.provider, model: chosen.provider.defaultModel };
  }

  async chat(messages, options = {}) {
    const { provider, model } = this.getActiveProvider();
    const modelOverride = options.model || model;

    const response = await provider.chat(messages, {
      ...options,
      model: modelOverride
    });

    // Track usage for cost estimation
    this.trackUsage(provider.name, response);

    return response.content || response;
  }

  trackUsage(providerName, response) {
    try {
      const { CostTracker } = require('../utils/cost.js');
      const tracker = new CostTracker();
      tracker.record({
        provider: providerName,
        tokens: response.usage?.total_tokens || 0,
        model: response.model
      });
    } catch (e) {
      // Non-critical
    }
  }

  listModels() {
    const models = [];
    const activeModel = this.config.get('activeModel');

    for (const [name, provider] of Object.entries(this.providers)) {
      for (const model of provider.getModels()) {
        models.push({
          provider: name,
          model: model,
          configured: provider.isConfigured(),
          active: model === activeModel
        });
      }
    }

    return models;
  }
}
