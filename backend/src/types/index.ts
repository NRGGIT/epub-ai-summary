export interface EpubStructure {
  id: string;
  title: string;
  author?: string;
  chapters: Chapter[];
  images: ImageAsset[];
  metadata: EpubMetadata;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  href: string;
  /**
   * ID of the chapter in the EPUB manifest. Used internally when
   * extracting content. Optional for backward compatibility.
   */
  manifestId?: string;
  children?: Chapter[];
}

export interface ImageAsset {
  id: string;
  href: string;
  mediaType: string;
  localPath: string;
}

export interface EpubMetadata {
  title: string;
  creator?: string;
  language?: string;
  identifier?: string;
  publisher?: string;
  date?: string;
  description?: string;
}

export interface SummarizationConfig {
  /** Base URL of the Constructor KM API */
  baseUrl: string;
  /** Knowledge model identifier */
  knowledgeModelId: string;
  /** API key used for authentication */
  apiKey: string;
  /** Selected language model name */
  modelName: string;
  /** Default system prompt for summarisation */
  prompt: string;
  /** Default summary ratio */
  defaultRatio: number;
}

export interface ModelInfo {
  name: string;
  alias: string;
  hostedBy: string;
}

export interface SummarizeRequest {
  content: string;
  images?: string[];
  ratio: number;
  customPrompt?: string;
  language?: string;
}

export interface SummarizeResponse {
  summary: string;
  originalTokens: number;
  summaryTokens: number;
  actualRatio: number;
}

export interface BookListItem {
  id: string;
  title: string;
  author?: string;
  metadata: EpubMetadata;
  chapterCount: number;
  uploadDate: Date;
}
