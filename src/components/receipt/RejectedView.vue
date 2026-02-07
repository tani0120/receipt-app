<template>
  <div class="p-8">
    <div class="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <h2 class="text-xl font-bold text-slate-800">差戻し</h2>
      </div>

      <div class="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <p class="text-red-800 text-sm mb-2">
          この仕訳は差し戻されました。
        </p>
        <p class="text-red-700 text-sm">
          内容を確認して再処理してください。
        </p>
      </div>

      <div class="mt-6 flex justify-end">
        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          再処理
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReceiptViewModel } from '@/types/receiptViewModel'

defineProps<{
  receipt: ReceiptViewModel | null
}>()

// status: 'rejected'
// 差戻し状態
</script>
