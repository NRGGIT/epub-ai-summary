import fs from 'fs-extra';
import path from 'path';
import { SummarizationConfig } from '../types';

export class ConfigService {
  private configPath: string;
  private defaultConfig: SummarizationConfig;

  constructor() {
    this.configPath = path.join(__dirname, '../../data/config.json');
    this.defaultConfig = {
      apiEndpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini',
      prompt: process.env.OPENAI_PROMPT || 'You are a helpful assistant that creates concise, accurate summaries of text content. Maintain the key information and main ideas while reducing the length according to the specified ratio. Keep the summary coherent and well-structured.',
      defaultRatio: process.env.DEFAULT_RATIO ? parseFloat(process.env.DEFAULT_RATIO) : 0.3
    };
  }

  async getConfig(): Promise<SummarizationConfig> {
    // Start with default config
    let config = { ...this.defaultConfig };
    
    // Override with environment variables if available
    if (process.env.OPENAI_API_ENDPOINT) {
      config.apiEndpoint = process.env.OPENAI_API_ENDPOINT;
    }
    if (process.env.OPENAI_API_KEY) {
      config.apiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.OPENAI_MODEL_NAME) {
      config.modelName = process.env.OPENAI_MODEL_NAME;
    }
    if (process.env.OPENAI_PROMPT) {
      config.prompt = process.env.OPENAI_PROMPT;
    }
    if (process.env.DEFAULT_RATIO) {
      const ratio = parseFloat(process.env.DEFAULT_RATIO);
      if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
        config.defaultRatio = ratio;
      }
    }
    
    // Try to load from config file if no env vars are set
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_ENDPOINT) {
      try {
        const fileConfig = await fs.readJSON(this.configPath);
        config = { ...config, ...fileConfig };
      } catch (error) {
        // If config doesn't exist, create it with current config
        await this.saveConfig(config);
      }
    }
    
    return config;
  }

  async saveConfig(config: SummarizationConfig): Promise<void> {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJSON(this.configPath, config, { spaces: 2 });
  }

  async updateConfig(updates: Partial<SummarizationConfig>): Promise<SummarizationConfig> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };
    await this.saveConfig(newConfig);
    return newConfig;
  }
}
