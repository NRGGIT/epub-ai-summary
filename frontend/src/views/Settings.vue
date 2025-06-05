<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p class="text-gray-600">Configure your AI summarization settings and preferences.</p>
    </div>

    <!-- Configuration Form -->
    <div class="card">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">AI Configuration</h2>
      
      <form @submit.prevent="saveSettings" class="space-y-6">
        <!-- Base URL -->
        <div>
          <label class="label">Base URL</label>
          <input
            v-model="formData.baseUrl"
            type="url"
            class="input"
            placeholder="https://training.constructor.app/api/platform-kmapi"
            required
          />
          <p class="text-sm text-gray-500 mt-1">
            Base URL of the Constructor KM API
          </p>
        </div>

        <!-- Knowledge Model ID -->
        <div>
          <label class="label">Knowledge Model ID</label>
          <input
            v-model="formData.knowledgeModelId"
            type="text"
            class="input"
            placeholder="xxxxxxxx"
            required
          />
        </div>

        <!-- API Key -->
        <div>
          <label class="label">API Key</label>
          <input
            v-model="formData.apiKey"
            type="password"
            class="input"
            placeholder="Your API key"
            required
          />
          <p class="text-sm text-gray-500 mt-1">
            Your API key for authentication
          </p>
        </div>

        <!-- Model Name -->
        <div>
          <label class="label">Model Name</label>

          <input
            v-model="formData.modelName"
            type="text"
            class="input"
            :list="models.length > 0 ? 'model-list' : undefined"
            required
          />
          <datalist v-if="models.length > 0" id="model-list">
            <option
              v-for="m in models"
              :key="m.alias"
              :value="m.alias"
              :label="`${m.name} (${m.hostedBy})`"
            />
          </datalist>

        </div>

        <!-- Default Ratio -->
        <div>
          <label class="label">Default Summary Ratio</label>
          <div class="flex items-center space-x-4">
            <input
              v-model.number="formData.defaultRatio"
              type="range"
              min="0.1"
              max="0.8"
              step="0.1"
              class="flex-1"
            />
            <span class="text-sm text-gray-600 w-12">{{ formData.defaultRatio }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            Default compression ratio for AI summaries ({{ Math.round(formData.defaultRatio * 100) }}% of original length)
          </p>
        </div>

        <!-- Summarization Prompt -->
        <div>
          <label class="label">Summarization Prompt</label>
          <textarea
            v-model="formData.prompt"
            rows="6"
            class="textarea"
            placeholder="Enter your custom summarization prompt..."
            required
          />
          <p class="text-sm text-gray-500 mt-1">
            The system prompt used for AI summarization. This controls how the AI summarizes content.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="resetToDefaults"
            class="btn btn-secondary"
          >
            Reset to Defaults
          </button>
          
          <div class="flex items-center space-x-3">
            <button
              type="button"
              @click="testConnection"
              :disabled="isTesting"
              class="btn btn-secondary"
            >
              <span v-if="isTesting">Testing...</span>
              <span v-else>Test Connection</span>
            </button>
            
            <button
              type="submit"
              :disabled="isSaving"
              class="btn btn-primary"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Test Results -->
    <div v-if="testResult" class="mt-6">
      <div
        class="rounded-lg p-4"
        :class="{
          'bg-green-50 border border-green-200': testResult.success,
          'bg-red-50 border border-red-200': !testResult.success
        }"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              v-if="testResult.success"
              class="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p
              class="text-sm font-medium"
              :class="{
                'text-green-800': testResult.success,
                'text-red-800': !testResult.success
              }"
            >
              {{ testResult.message }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Configuration Display -->
    <div v-if="config" class="mt-8 card">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Current Configuration</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Base URL:</span>
          <span class="text-gray-600 ml-2">{{ config.baseUrl }}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Knowledge Model:</span>
          <span class="text-gray-600 ml-2">{{ config.knowledgeModelId }}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Model:</span>
          <span class="text-gray-600 ml-2">{{ config.modelName }}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Default Ratio:</span>
          <span class="text-gray-600 ml-2">{{ Math.round(config.defaultRatio * 100) }}%</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">API Key:</span>
          <span class="text-gray-600 ml-2">{{ config.apiKey ? '••••••••' : 'Not set' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import type { SummarizationConfig, ModelInfo } from '@/types';
import { apiService } from '@/services/api';

const store = useAppStore();
const { config } = storeToRefs(store);
const { loadConfig, updateConfig } = store;

const isSaving = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);
const models = ref<ModelInfo[]>([]);

const formData = reactive<SummarizationConfig>({
  baseUrl: '',
  knowledgeModelId: '',
  apiKey: '',
  modelName: '',
  prompt: '',
  defaultRatio: 0.3
});

const defaultConfig: SummarizationConfig = {
  baseUrl: 'https://training.constructor.app/api/platform-kmapi',
  knowledgeModelId: '',
  apiKey: '',
  modelName: 'gpt-4.1-nano',
  prompt: 'You are a helpful assistant that creates concise, accurate summaries of text content. Maintain the key information and main ideas while reducing the length according to the specified ratio. Keep the summary coherent and well-structured.',
  defaultRatio: 0.3
};

onMounted(async () => {
  await loadConfig();
  if (config.value) {
    Object.assign(formData, config.value);
  }
  try {
    models.value = await apiService.getModels();
  } catch (err) {
    console.error('Failed to load models', err);
  }
});

const saveSettings = async () => {
  try {
    isSaving.value = true;
    testResult.value = null;
    
    await updateConfig(formData);
    
    testResult.value = {
      success: true,
      message: 'Settings saved successfully!'
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save settings'
    };
  } finally {
    isSaving.value = false;
  }
};

const testConnection = async () => {
  try {
    isTesting.value = true;
    testResult.value = null;
    
    // Test with a simple summarization request
    const testContent = "This is a test message to verify the AI connection is working properly.";
    
    await store.summarizeContent(testContent, 0.5);
    
    testResult.value = {
      success: true,
      message: 'Connection test successful! AI endpoint is working correctly.'
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    };
  } finally {
    isTesting.value = false;
  }
};

const resetToDefaults = () => {
  Object.assign(formData, defaultConfig);
  testResult.value = null;
};
</script>
