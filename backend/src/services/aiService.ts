import OpenAI from 'openai';
import { SummarizationConfig, SummarizeRequest, SummarizeResponse } from '../types';

export class AIService {
  private openai: OpenAI;
  private config: SummarizationConfig;

  constructor(config: SummarizationConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async summarizeContent(request: SummarizeRequest): Promise<SummarizeResponse> {
    const { content, images = [], ratio, customPrompt, language } = request;
    
    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const originalTokens = Math.ceil(content.length / 4);
    const targetTokens = Math.ceil(originalTokens * ratio);
    
    const prompt = customPrompt || this.config.prompt;
    let systemMessage = `${prompt}\n\nPlease summarize the following content to approximately ${targetTokens} tokens (current content is ${originalTokens} tokens, target ratio: ${ratio}).`;
    
    // Append language instruction if specified
    if (language) {
      systemMessage += ` Provide requested summary in ${language} language.`;
    }

    const messages: any[] = [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: content
        }
      ];

      // Add images if provided
      if (images.length > 0) {
        const imageContent = images.map(imageUrl => ({
          type: 'image_url',
          image_url: { url: imageUrl }
        }));
        
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Please also consider these images in your summary:' },
            ...imageContent
          ]
        });
      }
    let lastError: unknown;
    const retries = this.config.maxRetries ?? 0;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.config.modelName,
          messages,
          max_tokens: Math.max(targetTokens * 2, 100), // Allow some flexibility
          temperature: 0.7
        });

        const summary = response.choices[0]?.message?.content || '';
        const summaryTokens = Math.ceil(summary.length / 4);
        const actualRatio = summaryTokens / originalTokens;

        return {
          summary,
          originalTokens,
          summaryTokens,
          actualRatio
        };
      } catch (error) {
        lastError = error;
        console.warn(`Summarization attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error);
        if (attempt < retries) {
          const delayMs = 500 * (attempt + 1);
          await this.delay(delayMs);
        }
      }
    }
    console.error('AI summarization error:', lastError);
    throw new Error('Failed to generate summary');
  }

  updateConfig(config: SummarizationConfig): void {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint
    });
  }

  getConfig(): SummarizationConfig {
    return { ...this.config };
  }
}
