import { BaseProvider } from './base.js';

/**
 * Ollama Provider — Local AI models
 */
export class OllamaProvider extends BaseProvider {
  constructor(config) {
    super('ollama', config);
    this.baseUrl = config?.get('providers.ollama.url') || 
                   process.env.OLLAMA_URL || 
                   'http://localhost:11434';
  }

  isConfigured() {
    return this.config?.get('providers.ollama.enabled') || false;
  }

  supportsModel(model) {
    const ollamaModels = ['llama', 'codellama', 'mistral', 'mixtral', 'phi', 'qwen', 
                          'deepseek', 'starcoder', 'wizardcoder', 'codestral', 'gemma'];
    return ollamaModels.some(m => model.toLowerCase().includes(m));
  }

  getModels() {
    return [
      'llama3.3', 'codellama', 'mistral', 'mixtral', 'phi3', 
      'qwen2.5-coder', 'deepseek-coder-v2', 'starcoder2', 'gemma2', 'codestral'
    ];
  }

  async chat(messages, options = {}) {
    const model = options.model || 'llama3.3';

    const body = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens || 4096
      }
    };

    const response = await this.makeRequest(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return {
      content: response.message?.content || '',
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0,
        total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      },
      model
    };
  }
}
