<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- Book Header -->
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-lg font-semibold text-gray-900 truncate">
          {{ currentBook?.title || 'Loading...' }}
        </h1>
        <p v-if="currentBook?.author" class="text-sm text-gray-600 truncate">
          by {{ currentBook.author }}
        </p>
      </div>

      <!-- Table of Contents -->
      <div class="flex-1 overflow-y-auto p-4">
        <h2 class="text-sm font-medium text-gray-900 mb-3">Table of Contents</h2>
        <div class="space-y-1">
          <button
            v-for="chapter in currentBook?.chapters || []"
            :key="chapter.id"
            @click="selectChapter(chapter)"
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
            :class="{
              'bg-primary-100 text-primary-900': selectedChapter?.id === chapter.id,
              'text-gray-700 hover:bg-gray-100': selectedChapter?.id !== chapter.id
            }"
          >
            <div class="font-medium truncate">{{ chapter.title }}</div>
            <div class="text-xs text-gray-500 mt-1">
              {{ Math.ceil(chapter.content.length / 4) }} tokens
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Reading Mode Selection -->
      <div v-if="selectedChapter" class="bg-white border-b border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">
            {{ selectedChapter.title }}
          </h2>
          
          <div class="flex items-center space-x-4">
            <!-- Mode Toggle -->
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="setReadingMode('full')"
                class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                :class="{
                  'bg-white text-gray-900 shadow-sm': readingMode === 'full',
                  'text-gray-600 hover:text-gray-900': readingMode !== 'full'
                }"
              >
                Full Text
              </button>
              <button
                @click="setReadingMode('summary')"
                class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                :class="{
                  'bg-white text-gray-900 shadow-sm': readingMode === 'summary',
                  'text-gray-600 hover:text-gray-900': readingMode !== 'summary'
                }"
              >
                AI Summary
              </button>
            </div>

            <!-- Summary Controls -->
            <div v-if="readingMode === 'summary'" class="flex items-center space-x-3">
              <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-600">Ratio:</label>
                <input
                  v-model.number="summaryRatio"
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.1"
                  class="w-20"
                />
                <span class="text-sm text-gray-600 w-8">{{ summaryRatio }}</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-600">Language:</label>
                <select
                  v-model="summaryLanguage"
                  class="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="English">English</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>
              
              <button
                @click="generateSummary"
                :disabled="isGeneratingSummary"
                class="btn btn-primary text-sm"
              >
                <span v-if="isGeneratingSummary">Generating...</span>
                <span v-else>Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="store.error" class="bg-red-50 border-l-4 border-red-400 p-4 m-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              {{ store.error }}
            </p>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button @click="store.clearError()" class="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="!selectedChapter" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Chapter</h3>
            <p class="text-gray-600">Choose a chapter from the table of contents to start reading.</p>
          </div>
        </div>

        <div v-else class="max-w-4xl mx-auto p-8">
          <!-- Full Text Mode -->
          <div v-if="readingMode === 'full'" class="prose prose-lg max-w-none">
            <div class="whitespace-pre-wrap leading-relaxed text-gray-800">
              {{ selectedChapter.content }}
            </div>
          </div>

          <!-- Summary Mode -->
          <div v-else-if="readingMode === 'summary'">
            <div v-if="!currentSummary && !isGeneratingSummary" class="text-center py-12">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Generate AI Summary</h3>
              <p class="text-gray-600 mb-4">Click "Generate" to create an AI summary of this chapter.</p>
            </div>

            <div v-if="isGeneratingSummary" class="text-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p class="text-gray-600">Generating AI summary...</p>
            </div>

            <div v-if="currentSummary" class="space-y-6">
              <!-- Summary Stats -->
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div class="text-2xl font-bold text-blue-600">{{ currentSummary.originalTokens }}</div>
                    <div class="text-sm text-blue-800">Original Tokens</div>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-blue-600">{{ currentSummary.summaryTokens }}</div>
                    <div class="text-sm text-blue-800">Summary Tokens</div>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-blue-600">{{ Math.round(currentSummary.actualRatio * 100) }}%</div>
                    <div class="text-sm text-blue-800">Compression</div>
                  </div>
                </div>
              </div>

              <!-- Summary Content -->
              <div class="prose prose-lg max-w-none">
                <div 
                  class="leading-relaxed text-gray-800"
                  v-html="renderedSummary"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import { marked } from 'marked';
import type { Chapter, SummarizeResponse, ReadingMode } from '@/types';

const route = useRoute();
const store = useAppStore();
const { currentBook } = storeToRefs(store);
const { loadBook, summarizeContent } = store;

const selectedChapter = ref<Chapter | null>(null);
const readingMode = ref<ReadingMode>('full');
const summaryRatio = ref(0.3);
const summaryLanguage = ref('English');
const currentSummary = ref<SummarizeResponse | null>(null);
const isGeneratingSummary = ref(false);

const bookId = route.params.bookId as string;

onMounted(async () => {
  if (bookId) {
    await loadBook(bookId);
  }
});

const selectChapter = async (chapter: Chapter) => {
  try {
    selectedChapter.value = chapter;
    currentSummary.value = null;
    
    // Load chapter content if not already loaded
    if (!chapter.content || chapter.content.trim() === '') {
      await store.loadChapter(bookId, chapter.id);
      // Update the chapter with loaded content
      if (store.currentChapter) {
        chapter.content = store.currentChapter.content;
      }
    }
  } catch (error) {
    console.error('Failed to load chapter:', error);
    // Show error in UI
  }
};

const setReadingMode = (mode: ReadingMode) => {
  readingMode.value = mode;
  // Don't auto-generate summary, let user adjust settings first
};

const generateSummary = async () => {
  if (!selectedChapter.value) return;
  
  try {
    isGeneratingSummary.value = true;
    const response = await summarizeContent(
      selectedChapter.value.content,
      summaryRatio.value,
      undefined, // customPrompt
      summaryLanguage.value
    );
    currentSummary.value = response;
  } catch (error) {
    console.error('Failed to generate summary:', error);
  } finally {
    isGeneratingSummary.value = false;
  }
};

// Computed property for rendered markdown summary
const renderedSummary = computed(() => {
  if (!currentSummary.value?.summary) return '';
  return marked(currentSummary.value.summary);
});

// Watch for ratio and language changes and regenerate summary
watch([summaryRatio, summaryLanguage], () => {
  if (readingMode.value === 'summary' && currentSummary.value) {
    currentSummary.value = null;
  }
});
</script>
