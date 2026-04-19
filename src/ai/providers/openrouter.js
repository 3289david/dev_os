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
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4-20250514',
      'google/gemini-2.5-pro',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mistral-large',
      'deepseek/deepseek-chat-v3',
      'qwen/qwen-2.5-coder-32b-instruct',
      'microsoft/phi-4'
    ];
  }

  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('OpenRouter API key not configured');

    const body = {
      model: options.model || 'openai/gpt-4o',
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
