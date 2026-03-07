<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-center max-w-md">
      <svg class="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <h3 class="text-lg font-semibold text-slate-800 mb-2">処理中...</h3>
      <p class="text-slate-600" v-if="status">
        現在のステータス: <code class="bg-slate-100 px-2 py-1 rounded text-sm">{{ status }}</code>
      </p>
      <p class="text-slate-500 text-sm mt-4">
        この状態は認識されていません。しばらくお待ちください。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  status?: string
}>()

// unknown status のフォールバック
// 絶対に白画面にしない
</script>
