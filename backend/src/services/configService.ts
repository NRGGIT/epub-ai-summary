import fs from 'fs-extra';
import path from 'path';
import { SummarizationConfig } from '../types';

export class ConfigService {
  private configPath: string;
  private defaultConfig: SummarizationConfig;

  constructor() {
    this.configPath = path.join(__dirname, '../../data/config.json');
    this.defaultConfig = {
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      modelName: 'gpt-4o-mini',
      prompt: 'You are a helpful assistant that creates concise, accurate summaries of text content. Maintain the key information and main ideas while reducing the length according to the specified ratio. Keep the summary coherent and well-structured.',
      defaultRatio: 0.3,
      maxRetries: 3
    };
  }

  async getConfig(): Promise<SummarizationConfig> {
    // Start with default config
    let config = { ...this.defaultConfig };
    
    // Always try to load from config file first (this allows API updates to persist)
    try {
      const fileConfig = await fs.readJSON(this.configPath);
      config = { ...config, ...fileConfig };
    } catch (error) {
      // If config doesn't exist, create it with current config
      await this.saveConfig(config);
    }
    
    // Override with environment variables if available (env vars have highest priority)
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
    if (process.env.OPENAI_MAX_RETRIES) {
      const retries = parseInt(process.env.OPENAI_MAX_RETRIES, 10);
      if (!isNaN(retries) && retries >= 0) {
        config.maxRetries = retries;
      }
    }

    return config;
  }

  async saveConfig(config: SummarizationConfig): Promise<void> {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJSON(this.configPath, config, { spaces: 2 });
  }

  async updateConfig(updates: Partial<SummarizationConfig>): Promise<SummarizationConfig> {
    // Get current config from file (without env var overrides)
    let fileConfig = { ...this.defaultConfig };
    try {
      const existingFileConfig = await fs.readJSON(this.configPath);
      fileConfig = { ...fileConfig, ...existingFileConfig };
    } catch (error) {
      // File doesn't exist, will be created
    }
    
    // Apply updates to file config
    const newFileConfig = { ...fileConfig, ...updates };
    await this.saveConfig(newFileConfig);
    
    // Return the final config (with env var overrides applied)
    return await this.getConfig();
  }
}
