/**
 * BaseProvider — Foundation for AI provider implementations
 */
export class BaseProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  isConfigured() {
    return false;
  }

  supportsModel(_model) {
    return false;
  }

  getModels() {
    return [];
  }

  get defaultModel() {
    return this.getModels()[0];
  }

  async chat(_messages, _options) {
    throw new Error(`${this.name} provider not implemented`);
  }

  async makeRequest(url, options) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}
