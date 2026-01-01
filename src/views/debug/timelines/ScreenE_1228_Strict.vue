<template>
  <div class="h-full flex flex-col bg-white overflow-hidden text-[#333] font-sans border-2 border-indigo-600 relative">
      <!-- 12/28 Badge -->
      <div class="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 z-50 font-bold">12/28 02:36 Strict</div>

      <!-- Header (Compact) -->
      <div class="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 shadow-sm shrink-0 z-20">
          <div class="flex items-center gap-4">
              <div class="bg-indigo-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-xs shadow-md">CL</div>
              <div class="flex flex-col">
                  <span class="font-bold text-xs text-slate-800">合同会社ベータ企画</span>
              </div>
          </div>
          <!-- Status Badge -->
          <div class="px-4 py-1 rounded-full font-bold text-[10px] border flex items-center gap-1"
               :class="statusClass">
               <i class="fa-solid" :class="statusIcon"></i> {{ statusText }}
          </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
          <!-- Left: Editor -->
          <div class="w-[60%] flex flex-col bg-slate-50 border-r border-slate-200 relative z-10">
              <div class="flex-1 overflow-y-auto p-4 space-y-4">

                  <!-- Box 1: Alarms (Conditional) -->
                  <div v-if="tx.hasDuplicate || tx.isExcluded" class="bg-white border border-l-4 border-gray-200 border-l-yellow-500 rounded p-3 shadow-sm flex items-start gap-3">
                      <div class="bg-yellow-100 text-yellow-600 w-6 h-6 rounded flex items-center justify-center shrink-0"><i class="fa-solid fa-bell"></i></div>
                      <div>
                          <h4 class="font-bold text-xs text-slate-700">Attention Required</h4>
                          <p class="text-[10px] text-gray-500 mt-0.5">
                              <span v-if="tx.hasDuplicate">類似仕訳が存在します (2024/10/24 21,450円)</span>
                              <span v-if="tx.isExcluded">除外対象としてマークされています</span>
                          </p>
                      </div>
                  </div>

                  <!-- Box 2: AI Proposal (Indigo Box - 12/28 Feature) -->
                  <div v-if="tx.ai_reason" class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 relative shadow-inner">
                      <div class="flex justify-between items-center mb-2">
                          <span class="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                              <i class="fa-solid fa-robot"></i> AI Analysis (12/28 Logic)
                          </span>
                          <span class="text-[9px] bg-indigo-200 text-indigo-700 px-1.5 rounded">Confidence: 94%</span>
                      </div>
                      <p class="text-xs text-indigo-900 leading-relaxed font-medium">
                          {{ tx.ai_reason }}
                      </p>
                  </div>

                  <!-- Box 3: Journal Entry Form -->
                  <div class="bg-white rounded-lg shadow border border-slate-300 overflow-hidden">
                      <div class="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center px-4">
                          <h3 class="font-bold text-xs text-slate-600">Journal Entry</h3>
                          <span class="text-[10px] text-gray-400">ID: {{ tx.id }}</span>
                      </div>
                      <div class="p-4">
                          <!-- Date/Summary -->
                          <div class="grid grid-cols-12 gap-3 mb-4">
                              <div class="col-span-4">
                                  <label class="block text-[9px] text-gray-400 uppercase font-bold mb-1">Date</label>
                                  <div class="font-mono font-bold text-sm text-slate-700 border-b border-gray-300 pb-1">2024/11/12</div>
                              </div>
                              <div class="col-span-8">
                                  <label class="block text-[9px] text-gray-400 uppercase font-bold mb-1">Summary</label>
                                  <div class="font-bold text-sm text-slate-700 border-b border-gray-300 pb-1">{{ tx.vendor }}</div>
                              </div>
                          </div>

                          <!-- Debit/Credit Layout (12/28) -->
                          <div class="flex gap-4 items-start">
                              <div class="flex-1 bg-blue-50 rounded p-2 border border-blue-100">
                                  <div class="text-[9px] text-blue-800 font-bold mb-1">借方 (Debit)</div>
                                  <div class="bg-white border border-blue-200 rounded p-2 text-sm font-bold text-slate-700 shadow-sm">
                                      {{ tx.ai_proposal?.d || '---' }}
                                  </div>
                              </div>
                              <div class="text-gray-300 pt-6"><i class="fa-solid fa-arrow-right"></i></div>
                              <div class="flex-1 bg-green-50 rounded p-2 border border-green-100">
                                  <div class="text-[9px] text-green-800 font-bold mb-1">貸方 (Credit)</div>
                                  <div class="bg-white border border-green-200 rounded p-2 text-sm font-bold text-slate-700 shadow-sm">
                                      {{ tx.ai_proposal?.c || '---' }}
                                  </div>
                              </div>
                          </div>
                          <div class="mt-3 text-right">
                              <span class="text-xs text-gray-400 mr-2">Total:</span>
                              <span class="text-lg font-mono font-bold text-slate-800">¥ {{ tx.amount ? tx.amount.toLocaleString() : 0 }}</span>
                          </div>
                      </div>
                  </div>

              </div>

              <!-- Footer Actions -->
              <div class="bg-white border-t border-gray-200 p-3 flex gap-3 shadow-lg z-30">
                 <template v-if="mode === 'work'">
                    <button class="flex-1 bg-yellow-500 text-white py-2 rounded font-bold text-xs">Unknown</button>
                    <button class="flex-[2] bg-blue-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2"><i class="fa-solid fa-paper-plane"></i> Confirm</button>
                 </template>
                 <template v-else-if="mode === 'approve'">
                    <button class="flex-1 bg-orange-500 text-white py-2 rounded font-bold text-xs"><i class="fa-solid fa-reply"></i> Remand</button>
                    <button class="flex-[2] bg-emerald-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-2"><i class="fa-solid fa-check"></i> Approve to CSV</button>
                 </template>
                 <template v-else>
                     <div class="w-full text-center text-xs font-bold text-gray-400 py-2">Read-only / Other Mode</div>
                 </template>
              </div>
          </div>

          <!-- Right: Image Viewer (Placeholder) -->
          <div class="w-[40%] bg-slate-800 relative">
               <div class="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                   {{ tx.imageTitle || 'No Image' }}
               </div>
               <div class="w-full h-full flex items-center justify-center text-slate-600">
                   <i class="fa-regular fa-image text-4xl"></i>
               </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  injectedData?: any;
  injectedMode?: string;
}>();

// Internal state that can be overwritten
const internalTx = ref<any>(null);
const internalMode = ref<string>('work');

const tx = computed(() => internalTx.value || props.injectedData || {});
const mode = computed(() => internalMode.value || props.injectedMode || 'work');

const statusClass = computed(() => {
    if (mode.value === 'approve') return 'bg-pink-50 text-pink-600 border-pink-200';
    if (mode.value === 'remand') return 'bg-orange-50 text-orange-600 border-orange-200';
    return 'bg-blue-50 text-blue-600 border-blue-200';
});
const statusIcon = computed(() => {
    if (mode.value === 'approve') return 'fa-gavel';
    if (mode.value === 'remand') return 'fa-reply';
    return 'fa-pen';
});
const statusText = computed(() => {
    if (mode.value === 'approve') return 'Final Approval';
    if (mode.value === 'remand') return 'Remanded';
    return '1st Entry (Work)';
});

// Expose for direct injection if needed
const setTx = (data: any, m: string) => {
    internalTx.value = data;
    internalMode.value = m;
};
defineExpose({ setTx });
</script>
