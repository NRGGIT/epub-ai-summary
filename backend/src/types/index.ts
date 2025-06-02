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
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  prompt: string;
  defaultRatio: number;
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
