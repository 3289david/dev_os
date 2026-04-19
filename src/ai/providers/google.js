import { BaseProvider } from './base.js';

/**
 * Google Provider — Gemini models
 */
export class GoogleProvider extends BaseProvider {
  constructor(config) {
    super('google', config);
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  isConfigured() {
    return !!this.getApiKey();
  }

  getApiKey() {
    return this.config.get('GOOGLE_API_KEY') || 
           this.config.get('GEMINI_API_KEY') ||
           this.config.get('providers.google.apiKey') ||
           process.env.GOOGLE_API_KEY ||
           process.env.GEMINI_API_KEY;
  }

  supportsModel(model) {
    return model.startsWith('gemini');
  }

  getModels() {
    return [
      'gemini-3.1-pro', 'gemini-3.1-flash', 'gemini-3.0-pro',
      'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'
    ];
  }

  async chat(messages, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Google API key not configured');

    const model = options.model || 'gemini-3.1-pro';
    
    // Convert messages to Gemini format
    let systemInstruction = '';
    const contents = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += (systemInstruction ? '\n' : '') + msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const body = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens || 4096
      }
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await this.makeRequest(
      `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      content: text,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      },
      model
    };
  }
}
