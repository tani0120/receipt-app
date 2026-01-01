<template>
  <span
    :class="[
      'font-bold rounded-full border flex items-center justify-center',
      sizeClasses,
      variantClasses
    ]"
  >
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'active' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xs px-2 py-0.5'; // Minimal padding
    case 'md':
    default: return 'text-sm px-3 py-1';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'active':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'warning':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'neutral':
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
});
</script>
