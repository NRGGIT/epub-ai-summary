import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  EpubStructure,
  Chapter,
  SummarizationConfig,
  ReadingMode,
  ReadingSession,
  BookListItem
} from '@/types';
import { apiService } from '@/services/api';

export const useAppStore = defineStore('app', () => {
  // State
  const currentBook = ref<EpubStructure | null>(null);
  const currentChapter = ref<Chapter | null>(null);
  const config = ref<SummarizationConfig | null>(null);
  const readingSession = ref<ReadingSession | null>(null);
  const booksList = ref<BookListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasBook = computed(() => !!currentBook.value);
  const hasChapter = computed(() => !!currentChapter.value);
  const isReading = computed(() => !!readingSession.value);
  const hasBooks = computed(() => booksList.value.length > 0);

  // Actions
  const setError = (message: string | null) => {
    error.value = message;
  };

  const clearError = () => {
    error.value = null;
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const uploadBook = async (file: File) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.uploadEpub(file);
      currentBook.value = response.structure;
      
      return response.bookId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload book';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadBook = async (bookId: string) => {
    try {
      setLoading(true);
      clearError();
      
      const structure = await apiService.getBookStructure(bookId);
      currentBook.value = structure;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load book';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBookStructure = async (structure: EpubStructure) => {
    try {
      setLoading(true);
      clearError();
      
      await apiService.updateBookStructure(structure.id, structure);
      currentBook.value = structure;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update book structure';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (bookId: string, chapterId: string) => {
    try {
      setLoading(true);
      clearError();
      
      const chapter = await apiService.getChapterContent(bookId, chapterId);
      currentChapter.value = chapter;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chapter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startReadingSession = (bookId: string, chapterId: string, mode: ReadingMode, options?: { ratio?: number; customPrompt?: string }) => {
    readingSession.value = {
      bookId,
      chapterId,
      mode,
      ratio: options?.ratio,
      customPrompt: options?.customPrompt
    };
  };

  const endReadingSession = () => {
    readingSession.value = null;
    currentChapter.value = null;
  };

  const loadConfig = async () => {
    try {
      const configData = await apiService.getConfig();
      config.value = configData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(message);
      throw err;
    }
  };

  const updateConfig = async (updates: Partial<SummarizationConfig>) => {
    try {
      setLoading(true);
      clearError();
      
      const updatedConfig = await apiService.updateConfig(updates);
      config.value = updatedConfig;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const summarizeContent = async (content: string, ratio: number, customPrompt?: string, language?: string) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await apiService.summarizeContent({
        content,
        ratio,
        customPrompt,
        language
      });
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to summarize content';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadAllBooks = async () => {
    try {
      setLoading(true);
      clearError();
      
      const books = await apiService.getAllBooks();
      booksList.value = books;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load books';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      setLoading(true);
      clearError();
      
      await apiService.deleteBook(bookId);
      
      // Remove from local list
      booksList.value = booksList.value.filter(book => book.id !== bookId);
      
      // Clear current book if it was deleted
      if (currentBook.value?.id === bookId) {
        currentBook.value = null;
        currentChapter.value = null;
        readingSession.value = null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete book';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    currentBook,
    currentChapter,
    config,
    readingSession,
    booksList,
    isLoading,
    error,
    
    // Computed
    hasBook,
    hasChapter,
    isReading,
    hasBooks,
    
    // Actions
    setError,
    clearError,
    setLoading,
    uploadBook,
    loadBook,
    updateBookStructure,
    loadChapter,
    startReadingSession,
    endReadingSession,
    loadConfig,
    updateConfig,
    summarizeContent,
    loadAllBooks,
    deleteBook
  };
});
