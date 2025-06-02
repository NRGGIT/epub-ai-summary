import axios from 'axios';
import type {
  EpubStructure,
  Chapter,
  SummarizationConfig,
  SummarizeRequest,
  SummarizeResponse,
  UploadResponse,
  BookListItem
} from '@/types';

// Get backend URL from environment variable or default to relative path
const getBackendUrl = () => {
  // In production, VITE_BACKEND_URL should be set as environment variable
  // Format: https://your-backend-domain.com/api (include /api path)
  // In development, it defaults to relative path for proxy
  return import.meta.env.VITE_BACKEND_URL || '/api';
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

  // Update book structure
  async updateBookStructure(bookId: string, structure: EpubStructure): Promise<void> {
    await api.put(`/books/${bookId}/structure`, structure);
  },

  // Get chapter content
  async getChapterContent(bookId: string, chapterId: string): Promise<Chapter> {
    const response = await api.get<Chapter>(`/books/${bookId}/content/${chapterId}`);
    return response.data;
  },

  // Summarize content
  async summarizeContent(request: SummarizeRequest): Promise<SummarizeResponse> {
    const response = await api.post<SummarizeResponse>('/summarize', request);
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
