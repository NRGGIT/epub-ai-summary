import axios, { AxiosInstance } from 'axios';
import { ModelInfo, SummarizationConfig, SummarizeRequest, SummarizeResponse } from '../types';

export class AIService {
  private http: AxiosInstance;
  private config: SummarizationConfig;

  constructor(config: SummarizationConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-KM-AccessKey': `Bearer ${config.apiKey}`,
        Authorisation: `Bearer ${config.apiKey}`
      }
    });
  }

  updateConfig(config: SummarizationConfig): void {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-KM-AccessKey': `Bearer ${config.apiKey}`,
        Authorisation: `Bearer ${config.apiKey}`
      }
    });
  }

  getConfig(): SummarizationConfig {
    return { ...this.config };
  }

  private buildMessages(content: string, images: string[], ratio: number, customPrompt?: string, language?: string) {
    const originalTokens = Math.ceil(content.length / 4);
    const targetTokens = Math.ceil(originalTokens * ratio);

    const prompt = customPrompt || this.config.prompt;
    let systemMessage = `${prompt}\n\nPlease summarize the following content to approximately ${targetTokens} tokens (current content is ${originalTokens} tokens, target ratio: ${ratio}).`;
    if (language) {
      systemMessage += ` Provide requested summary in ${language} language.`;
    }

    const messages: any[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content }
    ];

    if (images.length > 0) {
      const imageContent = images.map((url) => ({ type: 'image_url', image_url: { url } }));
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: 'Please also consider these images in your summary:' }, ...imageContent]
      });
    }

    return { messages, targetTokens, originalTokens };
  }

  async summarizeContent(request: SummarizeRequest): Promise<SummarizeResponse> {
    const { content, images = [], ratio, customPrompt, language } = request;
    const { messages, targetTokens, originalTokens } = this.buildMessages(content, images, ratio, customPrompt, language);

    const url = `/v1/knowledge-models/${this.config.knowledgeModelId}/chat/completions/direct_llm`;
    const response = await this.http.post(url, {
      model: this.config.modelName,
      messages,
      max_tokens: Math.max(targetTokens * 2, 100),
      temperature: 0.7
    });

    const summary = response.data.choices[0]?.message?.content || '';
    const summaryTokens = Math.ceil(summary.length / 4);
    const actualRatio = summaryTokens / originalTokens;

    return {
      summary,
      originalTokens,
      summaryTokens,
      actualRatio
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    const url = `/v1/language_models`;
    const response = await this.http.get(url);
    return (response.data.results || []).map((m: any) => ({
      name: m.name,
      alias: m.alias,
      hostedBy: m.hosted_by?.name || ''
    }));
  }
}
