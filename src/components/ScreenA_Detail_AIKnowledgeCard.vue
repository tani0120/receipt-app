<template>
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-scroll text-emerald-500"></i> 現時点のAI知識プロンプト
            </h2>
            <button @click="$emit('edit')" class="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-bold transition">
                <i class="fa-solid fa-pen mr-1"></i> 修正
            </button>
        </div>

        <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm leading-relaxed text-slate-700 overflow-y-auto whitespace-pre-wrap">{{ content }}</div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    content: string;
}>();

defineEmits(['edit']);
</script>
