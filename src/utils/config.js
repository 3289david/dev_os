import Conf from 'conf';

/**
 * ConfigManager — Persistent configuration management
 */
export class ConfigManager {
  constructor() {
    this.store = new Conf({
      projectName: 'devos',
      schema: {
        activeModel: { type: 'string', default: '' },
        smartRouter: { type: 'boolean', default: false },
        OPENAI_API_KEY: { type: 'string', default: '' },
        ANTHROPIC_API_KEY: { type: 'string', default: '' },
        GOOGLE_API_KEY: { type: 'string', default: '' },
        GEMINI_API_KEY: { type: 'string', default: '' },
        OPENROUTER_API_KEY: { type: 'string', default: '' },
        workspace: { type: 'string', default: '' },
        providers: {
          type: 'object',
          default: {},
          properties: {
            openai: { type: 'object', default: {} },
            anthropic: { type: 'object', default: {} },
            google: { type: 'object', default: {} },
            ollama: { type: 'object', default: {} },
            openrouter: { type: 'object', default: {} }
          }
        }
      }
    });
  }

  get(key) {
    // Also check environment variables for API keys
    if (key.endsWith('_API_KEY') || key.endsWith('_KEY')) {
      const envValue = process.env[key];
      if (envValue) return envValue;
    }

    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  delete(key) {
    this.store.delete(key);
  }

  has(key) {
    return this.store.has(key) || !!process.env[key];
  }

  getAll() {
    return this.store.store;
  }

  reset() {
    this.store.clear();
  }

  get path() {
    return this.store.path;
  }
}
