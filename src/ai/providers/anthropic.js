import { BaseProvider } from './base.js';

/**
 * Anthropic Provider — Claude models
 */
export class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super('anthropic', config);
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  isConfigured() {
    return !!this.getApiKey();
  }

  getApiKey() {
    return this.config.get('ANTHROPIC_API_KEY') || 
           this.config.get('providers.anthropic.apiKey') ||
           process.env.ANTHROPIC_API_KEY;
  }

  supportsModel(model) {
    return model.startsWith('claude');
  }

  getModels() {
    return [
      'claude-4.7-sonnet-20260401', 'claude-4.7-opus-20260401',
      'claude-4.6-opus-20260201', 'claude-4.6-sonnet-20260201',
      'claude-sonnet-4-20250514', 'claude-opus-4-20250514',
      'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'
    ];
  }

  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Anthropic API key not configured');

    // Extract system message
    let system = '';
    const chatMessages = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (system ? '\n' : '') + msg.content;
      } else {
        chatMessages.push(msg);
      }
    }

    const body = {
      model: options.model || 'claude-4.7-sonnet-20260401',
      messages: chatMessages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7
    };

    if (system) {
      body.system = system;
    }

    const response = await this.makeRequest(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    return {
      content: response.content[0].text,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model
    };
  }
}
