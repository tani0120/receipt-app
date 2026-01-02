<template>
  <div
    class="border rounded-lg p-4 bg-white transition relative group hover:shadow-md"
    :class="{
        'border-purple-200 bg-purple-50': rule.status === 'draft',
        'border-gray-200': rule.status !== 'draft',
        'opacity-60': rule.status === 'inactive'
    }"
  >
    <!-- Header: Priority & Status -->
    <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded border"
                :class="{
                    'bg-red-100 text-red-700 border-red-200': rule.priority === 1,
                    'bg-gray-100 text-gray-700 border-gray-200': rule.priority > 1
                }"
            >
                優先度:{{ rule.priority }}
            </span>
            <span v-if="rule.generatedBy === 'human'" class="text-[10px] text-gray-400">
                <i class="fa-solid fa-user"></i>
            </span>
            <span v-if="rule.generatedBy === 'ai'" class="text-[10px] text-purple-400">
                <i class="fa-solid fa-robot"></i>
            </span>
        </div>

        <div class="flex items-center gap-1">
             <span v-if="rule.status === 'draft'" class="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                ドラフト
            </span>
            <span v-else-if="rule.status === 'active'" class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <i class="fa-solid fa-circle text-[6px]"></i> 有効
            </span>
            <span v-else class="text-[10px] font-bold text-gray-400">
                無効
            </span>
        </div>
    </div>

    <!-- Body: Data Flow -->
    <div class="space-y-2 mb-4">
        <!-- IF -->
        <div class="bg-gray-50 p-2 rounded border border-gray-100/50">
            <div class="text-[9px] text-gray-400 font-bold uppercase mb-1">条件</div>
            <div class="flex items-center gap-2 text-xs font-mono text-gray-700">
                <span v-if="rule.trigger.type === 'description'" class="bg-yellow-100 px-1 rounded text-[10px] text-yellow-800">摘要</span>
                <span v-if="rule.trigger.type === 'vendor'" class="bg-indigo-100 px-1 rounded text-[10px] text-indigo-800">取引先</span>
                <span class="font-bold truncate" :title="rule.trigger.keyword">"{{ rule.trigger.keyword }}"</span>
            </div>
            <div v-if="rule.trigger.amountRange" class="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                <i class="fa-solid fa-yen-sign"></i>
                <span v-if="rule.trigger.amountRange.min">{{ rule.trigger.amountRange.min.toLocaleString() }} ~</span>
            </div>
        </div>

        <!-- Arrow -->
        <div class="flex justify-center text-gray-300 text-[10px]">
            <i class="fa-solid fa-arrow-down"></i>
        </div>

        <!-- THEN -->
        <div class="bg-blue-50 p-2 rounded border border-blue-100/50">
            <div class="text-[9px] text-blue-400 font-bold uppercase mb-1">推論結果</div>
            <div class="text-sm font-bold text-blue-800 truncate">{{ rule.result.debitAccount }}</div>
            <div v-if="rule.result.targetTaxClass" class="text-[10px] text-blue-600/70 mt-0.5">
                {{ rule.result.targetTaxClass }}
            </div>
        </div>
    </div>

    <!-- Footer: Metrics & Actions -->
    <div class="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-100">
        <div class="flex gap-3">
            <div title="確信度">
                <i class="fa-solid fa-chart-line mr-1"></i>{{ (rule.confidence * 100).toFixed(0) }}%
            </div>
            <div title="適用回数">
                <i class="fa-solid fa-check-double mr-1"></i>{{ rule.hitCount }}
            </div>
        </div>

        <!-- Hover Actions -->
        <div class="flex gap-2">
            <button @click="$emit('edit', rule.id)" class="hover:text-blue-600 transition">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button @click="$emit('toggle', rule.id)" class="hover:text-emerald-600 transition" :title="rule.status === 'active' ? 'Deactivate' : 'Activate'">
                <i class="fa-solid fa-power-off"></i>
            </button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LearningRuleUi } from '@/aaa/aaa_types/aaa_LearningRuleUi';

defineProps<{
    rule: LearningRuleUi
}>();

defineEmits(['edit', 'toggle']);
</script>
