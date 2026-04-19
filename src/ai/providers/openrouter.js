import { BaseProvider } from './base.js';

/**
 * OpenRouter Provider — Access to 25+ models through one API
 */
export class OpenRouterProvider extends BaseProvider {
  constructor(config) {
    super('openrouter', config);
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  isConfigured() {
    return !!this.getApiKey();
  }

  getApiKey() {
    return this.config.get('OPENROUTER_API_KEY') || 
           this.config.get('providers.openrouter.apiKey') ||
           process.env.OPENROUTER_API_KEY;
  }

  supportsModel(model) {
    // OpenRouter supports many models via path format
    return model.includes('/') || this.getModels().includes(model);
  }

  getModels() {
    return [
      'openai/gpt-5.4-pro',
      'openai/gpt-5-turbo',
      'anthropic/claude-4.7-sonnet-20260401',
      'anthropic/claude-4.6-opus-20260201',
      'google/gemini-3.1-pro',
      'google/gemini-3.1-flash',
      'meta-llama/llama-4-70b-instruct',
      'meta-llama/llama-4-scout',
      'mistralai/mistral-large-2',
      'deepseek/deepseek-v4',
      'qwen/qwen-3-coder-32b',
      'microsoft/phi-5'
    ];
  }

  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('OpenRouter API key not configured');

    const body = {
      model: options.model || 'openai/gpt-5.4-pro',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096
    };

    const response = await this.makeRequest(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://devos.dev',
        'X-Title': 'DevOS'
      },
      body: JSON.stringify(body)
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model
    };
  }
}
