import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * CostTracker — Track API usage and estimate costs
 */
export class CostTracker {
  constructor() {
    this.dataDir = join(process.env.HOME || process.env.USERPROFILE || '.', '.devos');
    this.dataFile = join(this.dataDir, 'cost-data.json');
    this.ensureDir();
  }

  ensureDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Cost per 1K tokens (approximate)
  static PRICING = {
    'gpt-5.4-pro': { input: 0.005, output: 0.02 },
    'gpt-5.4': { input: 0.004, output: 0.016 },
    'gpt-5-turbo': { input: 0.003, output: 0.012 },
    'gpt-5': { input: 0.005, output: 0.02 },
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'o4-mini': { input: 0.0011, output: 0.0044 },
    'o3': { input: 0.01, output: 0.04 },
    'o1': { input: 0.015, output: 0.06 },
    'claude-4.7-sonnet-20260401': { input: 0.004, output: 0.02 },
    'claude-4.7-opus-20260401': { input: 0.02, output: 0.10 },
    'claude-4.6-opus-20260201': { input: 0.018, output: 0.09 },
    'claude-4.6-sonnet-20260201': { input: 0.0035, output: 0.018 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
    'gemini-3.1-pro': { input: 0.002, output: 0.012 },
    'gemini-3.1-flash': { input: 0.0002, output: 0.0008 },
    'gemini-2.5-pro': { input: 0.00125, output: 0.01 },
    'gemini-2.5-flash': { input: 0.00015, output: 0.0006 },
    'ollama': { input: 0, output: 0 } // Free (local)
  };

  record(usage) {
    const data = this.loadData();
    
    data.push({
      timestamp: new Date().toISOString(),
      provider: usage.provider,
      model: usage.model || 'unknown',
      tokens: usage.tokens || 0,
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0
    });

    this.saveData(data);
  }

  getSummary(period = 'month') {
    const data = this.loadData();
    const filtered = this.filterByPeriod(data, period);

    const providerMap = {};
    
    for (const entry of filtered) {
      if (!providerMap[entry.provider]) {
        providerMap[entry.provider] = { 
          name: entry.provider, 
          requests: 0, 
          tokens: 0, 
          cost: 0 
        };
      }
      
      const p = providerMap[entry.provider];
      p.requests++;
      p.tokens += entry.tokens;
      
      // Calculate cost
      const pricing = CostTracker.PRICING[entry.model] || { input: 0.001, output: 0.002 };
      const inputCost = (entry.promptTokens || entry.tokens * 0.4) / 1000 * pricing.input;
      const outputCost = (entry.completionTokens || entry.tokens * 0.6) / 1000 * pricing.output;
      p.cost += inputCost + outputCost;
    }

    const providers = Object.values(providerMap);
    
    return {
      providers,
      totalRequests: providers.reduce((s, p) => s + p.requests, 0),
      totalTokens: providers.reduce((s, p) => s + p.tokens, 0),
      totalCost: providers.reduce((s, p) => s + p.cost, 0)
    };
  }

  filterByPeriod(data, period) {
    const now = new Date();
    let cutoff;

    switch (period) {
      case 'today':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        return data;
      default:
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return data.filter(d => new Date(d.timestamp) >= cutoff);
  }

  loadData() {
    try {
      if (existsSync(this.dataFile)) {
        return JSON.parse(readFileSync(this.dataFile, 'utf-8'));
      }
    } catch (e) {
      // Corrupt file, start fresh
    }
    return [];
  }

  saveData(data) {
    writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }

  reset() {
    this.saveData([]);
  }
}
