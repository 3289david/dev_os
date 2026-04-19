import { BaseProvider } from './base.js';

/**
 * OpenAI Provider — GPT models
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super('openai', config);
    this.baseUrl = 'https://api.openai.com/v1';
  }

  isConfigured() {
    return !!this.getApiKey();
  }

  getApiKey() {
    return this.config.get('OPENAI_API_KEY') || 
           this.config.get('providers.openai.apiKey') ||
           process.env.OPENAI_API_KEY;
  }

  supportsModel(model) {
    return model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');
  }

  getModels() {
    return [
      'gpt-5.4-pro', 'gpt-5.4', 'gpt-5-turbo', 'gpt-5',
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
      'o4-mini', 'o3', 'o3-mini', 'o1', 'o1-mini'
    ];
  }

  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const body = {
      model: options.model || 'gpt-5.4-pro',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096
    };

    if (options.responseFormat) {
      body.response_format = options.responseFormat;
    }

    const response = await this.makeRequest(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
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
