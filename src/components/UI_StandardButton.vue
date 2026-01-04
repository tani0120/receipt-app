<template>
  <button
    :class="[
      'font-bold transition shadow-sm flex items-center justify-center gap-2',
      sizeClasses,
      variantClasses,
      { 'opacity-50 cursor-not-allowed': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot name="icon"></slot>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xs px-3 py-1.5';
    case 'lg': return 'text-base px-8 py-4';
    case 'md':
    default: return 'text-sm px-6 py-3';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    case 'danger':
      return 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200';
    case 'outline':
      return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
    case 'primary':
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700';
  }
});
</script>
