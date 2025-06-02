<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        EPUB Reader with AI Summarization
      </h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Upload your EPUB books and read them with intelligent AI-powered summaries. 
        Choose between full text or customizable AI summaries for each chapter.
      </p>
    </div>

    <!-- Upload Section -->
    <div class="card mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload EPUB Book</h2>
      
      <div
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
        :class="{ 'border-primary-400 bg-primary-50': isDragging }"
      >
        <div class="space-y-4">
          <div class="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          
          <div>
            <p class="text-lg text-gray-600">
              Drag and drop your EPUB file here, or
              <button
                @click="triggerFileInput"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                browse to upload
              </button>
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Supports .epub files up to 50MB
            </p>
          </div>
        </div>
        
        <input
          ref="fileInput"
          type="file"
          accept=".epub"
          @change="handleFileSelect"
          class="hidden"
        />
      </div>
    </div>

    <!-- Books Library Section -->
    <div v-if="hasBooks || hasBook" class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Your Books</h2>
        <button
          @click="refreshBooks"
          :disabled="isLoading"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>
      
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading books...</p>
      </div>
      
      <div v-else-if="booksList.length === 0" class="text-center py-8">
        <p class="text-gray-600">No books uploaded yet. Upload your first EPUB file above!</p>
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="book in booksList"
          :key="book.id"
          class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div class="flex-shrink-0 w-16 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>
          
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900">{{ book.title }}</h3>
            <p v-if="book.author" class="text-gray-600">by {{ book.author }}</p>
            <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{{ book.chapterCount }} chapters</span>
              <span>{{ formatDate(book.uploadDate) }}</span>
              <span v-if="book.metadata.language" class="capitalize">{{ book.metadata.language }}</span>
            </div>
            
            <div class="flex items-center space-x-3 mt-4">
              <router-link
                :to="`/book/${book.id}`"
                class="btn btn-primary"
              >
                Read Book
              </router-link>
              
              <button
                @click="confirmDelete(book)"
                class="btn btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="bookToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Delete Book</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete "{{ bookToDelete.title }}"? This action cannot be undone.
        </p>
        <div class="flex space-x-3">
          <button
            @click="cancelDelete"
            class="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="executeDelete"
            :disabled="isLoading"
            class="flex-1 btn bg-red-600 text-white hover:bg-red-700"
          >
            <span v-if="isLoading">Deleting...</span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div v-if="!hasBook" class="grid md:grid-cols-2 gap-6 mt-8">
      <div class="card">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Full Text Reading</h3>
        </div>
        <p class="text-gray-600">
          Read the complete original text of each chapter with clean formatting and easy navigation.
        </p>
      </div>
      
      <div class="card">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">AI Summaries</h3>
        </div>
        <p class="text-gray-600">
          Get intelligent summaries with customizable length ratios and prompts powered by advanced AI.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import type { BookListItem } from '@/types';

const router = useRouter();
const store = useAppStore();
const { currentBook, hasBook, booksList, hasBooks, isLoading } = storeToRefs(store);
const { uploadBook, loadAllBooks, deleteBook } = store;

const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const bookToDelete = ref<BookListItem | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await processFile(file);
  }
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.name.endsWith('.epub')) {
      await processFile(file);
    } else {
      store.setError('Please upload a valid EPUB file');
    }
  }
};

const processFile = async (file: File) => {
  try {
    const bookId = await uploadBook(file);
    router.push(`/book/${bookId}`);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Drag and drop event handlers
const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

// Books management
const refreshBooks = async () => {
  try {
    await loadAllBooks();
  } catch (error) {
    console.error('Failed to refresh books:', error);
  }
};

const confirmDelete = (book: BookListItem) => {
  bookToDelete.value = book;
};

const cancelDelete = () => {
  bookToDelete.value = null;
};

const executeDelete = async () => {
  if (!bookToDelete.value) return;
  
  try {
    await deleteBook(bookToDelete.value.id);
    bookToDelete.value = null;
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Load books on component mount
onMounted(() => {
  refreshBooks();
});
</script>
