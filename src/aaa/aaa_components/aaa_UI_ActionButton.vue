<template>
  <button
    @click="$emit('click')"
    :class="[
      'w-32 px-4 py-2 rounded text-xs font-bold shadow-sm transition flex items-center justify-center gap-2',
      variantClasses[variant] || 'bg-gray-500 text-white',
      { 'animate-pulse': shouldPulse }
    ]"
    :disabled="disabled"
  >
    <i v-if="icon" :class="icon"></i>
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant: 'work' | 'approve' | 'remand' | 'rescue' | 'archive' | 'processing' | 'complete';
  label?: string;
  icon?: string;
  disabled?: boolean;
}>();

defineEmits(['click']);

const variantClasses: Record<string, string> = {
  work: 'bg-indigo-600 text-white hover:bg-indigo-700',
  approve: 'bg-pink-500 text-white hover:bg-pink-600',
  remand: 'bg-orange-500 text-white hover:bg-orange-600',
  rescue: 'bg-red-600 text-white hover:bg-red-700',
  archive: 'bg-blue-600 text-white hover:bg-blue-700',
  processing: 'bg-gray-300 text-white cursor-not-allowed',
  complete: 'bg-gray-300 text-white cursor-not-allowed shadow-none'
};

const shouldPulse = computed(() => {
  return ['work', 'approve', 'remand', 'rescue'].includes(props.variant);
});
</script>
