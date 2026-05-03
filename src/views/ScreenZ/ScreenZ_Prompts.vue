<template>
    <div class="animate-fade-in relative pb-12">
        <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2 mb-6">
            <i class="fa-solid fa-terminal"></i> プロンプト編集
        </h2>

        <div class="grid grid-cols-2 gap-8">

            <!-- AI Prompts Column -->
            <section class="flex flex-col gap-4">
                <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                     <h3 class="font-bold text-slate-700 flex items-center gap-2"><i class="fa-solid fa-robot text-purple-500"></i> AIプロンプト</h3>
                     <button @click="$emit('create-prompt', 'AI')" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded font-bold hover:bg-purple-700 transition shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i> 新規登録
                     </button>
                </div>

                <div v-for="prompt in data.prompts.ai" :key="prompt.id"
                    @click="$emit('select-prompt', prompt)"
                    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:border-purple-400 hover:shadow-md transition group"
                >
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[10px] font-mono bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded mr-2">{{ prompt.id }}</span>
                            <span class="font-bold text-slate-700 text-sm group-hover:text-purple-600 transition">{{ prompt.name }}</span>
                        </div>
                        <i class="fa-solid fa-angle-right text-gray-300 group-hover:text-purple-500"></i>
                    </div>
                    <div class="bg-gray-50 rounded p-2 text-[10px] font-mono text-gray-500 whitespace-pre-wrap border border-gray-100 max-h-16 overflow-hidden relative">
                        {{ prompt.value }}
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 pointer-events-none"></div>
                    </div>
                </div>
            </section>

            <!-- GAS Prompts Column -->
            <section class="flex flex-col gap-4">
                <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                     <h3 class="font-bold text-slate-700 flex items-center gap-2"><i class="fa-brands fa-google text-green-500"></i> GASプロンプト</h3>
                     <button @click="$emit('create-prompt', 'GAS')" class="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700 transition shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i> 新規登録
                     </button>
                </div>

                <div v-for="prompt in data.prompts.gas" :key="prompt.id"
                    @click="$emit('select-prompt', prompt)"
                    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:border-green-400 hover:shadow-md transition group"
                >
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[10px] font-mono bg-green-100 text-green-600 px-1.5 py-0.5 rounded mr-2">{{ prompt.id }}</span>
                            <span class="font-bold text-slate-700 text-sm group-hover:text-green-600 transition">{{ prompt.name }}</span>
                        </div>
                         <i class="fa-solid fa-angle-right text-gray-300 group-hover:text-green-500"></i>
                    </div>
                    <div class="bg-gray-50 rounded p-2 text-[10px] font-mono text-gray-500 whitespace-pre-wrap border border-gray-100 max-h-16 overflow-hidden relative">
                        {{ prompt.value }}
                         <div class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 pointer-events-none"></div>
                    </div>
                </div>
            </section>

        </div>
    </div>
</template>

<script setup lang="ts">
import { useAdminDashboard } from '@/composables/useAdminDashboard';

defineEmits(['select-prompt', 'create-prompt']);
const { data } = useAdminDashboard();
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
