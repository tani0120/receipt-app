<template>
    <h2 class="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
        <span class="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{{ stepNumber }}</span>
        {{ title }}
    </h2>
</template>

<script setup lang="ts">
defineProps<{
    stepNumber: string | number
    title: string
}>()
</script>
