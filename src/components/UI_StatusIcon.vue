<template>
  <i v-if="status === 'done'" class="fa-solid fa-circle-check text-green-500 text-lg"></i>
  <span v-else-if="status === 'none'" class="text-gray-300">-</span>
</template>

<script setup lang="ts">
defineProps<{
  status: 'done' | 'none' | 'processing' | 'error' | 'pending' | 'ready'; // Broad typing but mainly for done/none
}>();
</script>
