<template>
  <div class="h-full flex flex-col bg-slate-100 overflow-hidden text-[#333] font-sans border-2 border-slate-300 relative">
      <div class="absolute top-0 right-0 bg-slate-400 text-white text-[10px] px-2 py-0.5 z-50 font-bold">12/26 21:33 (Legacy)</div>
      <div class="p-6 flex items-center justify-center h-full text-slate-400">
          <div class="text-center">
              <i class="fa-solid fa-clock-rotate-left text-4xl mb-2"></i>
              <h3 class="font-bold">Layout Variation C</h3>
          </div>
      </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const setTx = () => {};
defineExpose({ setTx });
</script>
