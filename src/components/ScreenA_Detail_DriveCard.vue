<template>
  <a :href="href" class="block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition group">
    <div class="flex items-start justify-between mb-2">
      <i :class="['fa-solid fa-folder-open text-3xl group-hover:scale-110 transition-transform', iconColorClass]"></i>
      <i class="fa-solid fa-arrow-up-right-from-square text-slate-300 group-hover:text-blue-500"></i>
    </div>
    <div class="font-bold text-slate-700 text-sm mb-1">{{ title }}</div>
    <div class="text-[10px] text-slate-400 font-mono truncate">{{ path }}</div>
  </a>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  path: string;
  href?: string;
  iconColorClass: string;
}>();
</script>
