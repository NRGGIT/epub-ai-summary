<template>
  <div class="space-y-1">
    <div class="flex items-center">
      <button
        v-if="chapter.children && chapter.children.length"
        @click="expanded = !expanded"
        class="mr-1 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <span v-if="expanded">&#9660;</span>
        <span v-else>&#9654;</span>
      </button>
      <button
        @click="selectThis"
        class="flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors"
        :class="{
          'bg-primary-100 text-primary-900': isSelected,
          'text-gray-700 hover:bg-gray-100': !isSelected
        }"
      >
        <div class="font-medium truncate">{{ chapter.title }}</div>
      </button>
    </div>
    <div v-if="expanded" class="ml-4">
      <TocItem
        v-for="child in chapter.children"
        :key="child.id"
        :chapter="child"
        :selectedId="selectedId"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Chapter } from '@/types';

defineOptions({ name: 'TocItem' });

interface Props {
  chapter: Chapter;
  selectedId?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', chapter: Chapter): void;
}>();

const expanded = ref(false);
const isSelected = computed(() => props.selectedId === props.chapter.id);

function selectThis() {
  emit('select', props.chapter);
}
</script>
