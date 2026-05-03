<template>
    <div class="space-y-6 animate-fade-in pb-12">
        <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
            <i class="fa-solid fa-gavel"></i> 共通処理ルール編集
        </h2>

        <!-- Flat Grid for all items -->
        <div class="grid grid-cols-2 gap-6 items-stretch">

            <!-- Items Loop -->
            <div
                v-for="rule in allRules"
                :key="rule.id"
                class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col h-full hover:shadow-md transition relative group"
            >
                 <!-- Header -->
                 <div class="flex items-start justify-between mb-4">
                     <div>
                        <h3 class="font-bold text-slate-700 text-base flex items-center gap-2">
                            {{ rule.name }}
                            <span v-if="rule.id === 'RULE_AI'" class="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">Core</span>
                        </h3>
                        <p v-if="rule.description" class="text-xs text-gray-400 mt-1 leading-snug">{{ rule.description }}</p>
                     </div>
                     <!-- Edit Button (Only trigger) -->
                     <button
                        @click.stop="$emit('select-rule', rule)"
                        class="bg-white border border-blue-600 text-blue-600 shadow-sm px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition whitespace-nowrap z-10"
                     >
                        登録・修正
                     </button>
                 </div>

                 <!-- History List (Footer driven) -->
                 <div class="mt-auto pt-4 border-t border-gray-100">
                     <ul class="space-y-1">
                         <li v-for="(h, i) in rule.history.slice(0, 3)" :key="i" class="flex items-center text-xs">
                             <span class="font-mono text-gray-500 w-24">{{ h.date }}</span>
                             <span class="font-bold w-12 text-center mr-2" :class="h.actor === 'AI' ? 'text-purple-600' : 'text-gray-600'">{{ h.actor }}</span>
                             <span class="text-gray-600">{{ h.action }}</span>
                         </li>
                     </ul>
                 </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAdminDashboard } from '@/composables/useAdminDashboard';

defineEmits(['select-rule']);
const { data } = useAdminDashboard();

// Flatten rules for uniform display
const allRules = computed(() => [
    data.value.rules.ai,
    data.value.rules.taxYayoi,
    data.value.rules.taxMF,
    data.value.rules.taxFreee,
    data.value.rules.formatYayoi,
    data.value.rules.formatMF,
    data.value.rules.formatFreee
]);
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
