import axios from 'axios';
import type {
  EpubStructure,
  Chapter,
  SummarizationConfig,
  SummarizeRequest,
  SummarizeResponse,
  UploadResponse,
  BookListItem,
  ModelInfo
} from '@/types';

// Get backend URL from environment variable or default to relative path
const getBackendUrl = () => {
  // In production, VITE_API_BASE_URL is injected via docker-entrypoint.sh
  // In development, VITE_BACKEND_URL is used from the environment
  const backendUrl = window.ENV?.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '/api';
  console.log('Using backend URL:', backendUrl);
  return backendUrl;
};

const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
});

export const apiService = {
  // Upload EPUB file
  async uploadEpub(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('epub', file);
    
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get book structure
  async getBookStructure(bookId: string): Promise<EpubStructure> {
    const response = await api.get<EpubStructure>(`/books/${bookId}/structure`);
    return response.data;
  },

  // Get nested book structure (hierarchical TOC)
  async getNestedStructure(bookId: string): Promise<EpubStructure> {
    const response = await api.get<EpubStructure>(`/books/${bookId}/structure-nested`);
    return response.data;
  },

  // Update book structure
  async updateBookStructure(bookId: string, structure: EpubStructure): Promise<void> {
    await api.put(`/books/${bookId}/structure`, structure);
  },

  // Get chapter content
  async getChapterContent(bookId: string, chapterId: string): Promise<Chapter> {
    const response = await api.get<Chapter>(`/books/${bookId}/content/${chapterId}`);
    return response.data;
  },

  // Get chapter content combined with its subchapters
  async getFullChapterContent(bookId: string, chapterId: string): Promise<Chapter> {
    const response = await api.get<Chapter>(`/books/${bookId}/full-content/${chapterId}`);
    return response.data;
  },

  // Summarize content
  async summarizeContent(request: SummarizeRequest): Promise<SummarizeResponse> {
    const response = await api.post<SummarizeResponse>('/summarize', request);
    return response.data;
  },

  async getModels(): Promise<ModelInfo[]> {
    const response = await api.get<ModelInfo[]>('/models');
    return response.data;
  },

  // Get configuration
  async getConfig(): Promise<SummarizationConfig> {
    const response = await api.get<SummarizationConfig>('/config');
    return response.data;
  },

  // Update configuration
  async updateConfig(config: Partial<SummarizationConfig>): Promise<SummarizationConfig> {
    const response = await api.put<SummarizationConfig>('/config', config);
    return response.data;
  },

  // Get all books
  async getAllBooks(): Promise<BookListItem[]> {
    const response = await api.get<BookListItem[]>('/books');
    return response.data;
  },

  // Delete book
  async deleteBook(bookId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/books/${bookId}`);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred.');
  }
);
