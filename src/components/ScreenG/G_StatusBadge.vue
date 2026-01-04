<template>
    <span v-if="!isDownloaded" class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">未ダウンロード</span>
    <span v-else class="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded">ダウンロード済み</span>
</template>

<script setup lang="ts">
defineProps<{
    isDownloaded: boolean
}>()
</script>
