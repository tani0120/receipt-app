<template>
  <div
    class="cursor-pointer w-full border rounded overflow-hidden shadow-sm hover:shadow-md transition"
    :class="containerClasses"
  >
    <div
      class="text-white text-[9px] font-bold text-center py-0.5"
      :class="headerClasses"
    >
      {{ topLabel }}
    </div>
    <div
      class="text-[10px] font-bold text-center py-1.5"
      :class="bodyClasses"
    >
      {{ bottomLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  color: 'indigo' | 'pink' | 'orange';
  topLabel: string;
  bottomLabel: string;
}>();

const containerClasses = computed(() => {
  switch (props.color) {
    case 'indigo': return 'bg-indigo-50 border-indigo-200';
    case 'pink': return 'bg-pink-50 border-pink-200';
    case 'orange': return 'bg-orange-50 border-orange-200';
    default: return 'bg-gray-50 border-gray-200';
  }
});

const headerClasses = computed(() => {
  switch (props.color) {
    case 'indigo': return 'bg-indigo-400';
    case 'pink': return 'bg-pink-400';
    case 'orange': return 'bg-orange-400';
    default: return 'bg-gray-400';
  }
});

const bodyClasses = computed(() => {
  switch (props.color) {
    case 'indigo': return 'text-indigo-600';
    case 'pink': return 'text-pink-600';
    case 'orange': return 'text-orange-600';
    default: return 'text-gray-600';
  }
});
</script>
