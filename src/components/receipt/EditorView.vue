<template>
  <div class="p-8">
    <div class="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 class="text-xl font-bold text-slate-800 mb-4">仕訳編集</h2>

      <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <p class="text-blue-800 text-sm">
          この仕訳を編集・確認してください。
        </p>
      </div>

      <div class="space-y-4">
        <p class="text-slate-600">仕訳編集フォーム（実装予定）</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300">
          キャンセル
        </button>
        <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          確定
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

// status: 'suggested'
// 編集可能状態
</script>
