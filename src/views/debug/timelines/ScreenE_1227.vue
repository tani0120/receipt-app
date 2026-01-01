<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden text-[#333] font-sans border-2 border-gray-400 relative">
      <div class="absolute top-0 right-0 bg-gray-400 text-white text-[10px] px-2 py-0.5 z-50 font-bold">12/27 01:40 (Older)</div>

      <div class="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 opacity-70">
          <span class="font-bold text-xs">Previous Version UI</span>
          <span class="text-[10px]">{{ mode }}</span>
      </div>

      <div class="p-6 flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
              <i class="fa-solid fa-box-archive text-4xl mb-2"></i>
              <h3 class="font-bold">Layout Variation B</h3>
              <p class="text-xs">Different Box Arrangement</p>
              <div class="mt-4 border p-2 text-[10px] text-left">
                  Data: {{ tx.amount }}<br>
                  Reason: {{ tx.ai_reason }}
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
const props = defineProps<{ injectedData?: any; injectedMode?: string; }>();
const internalTx = ref<any>(null);
const internalMode = ref<string>('work');
const tx = computed(() => internalTx.value || props.injectedData || {});
const mode = computed(() => internalMode.value || props.injectedMode || 'work');
const setTx = (data: any, m: string) => { internalTx.value = data; internalMode.value = m; };
defineExpose({ setTx });
</script>
