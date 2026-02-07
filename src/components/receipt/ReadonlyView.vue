<template>
  <div class="p-8">
    <div class="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 class="text-xl font-bold text-slate-800">承認済み</h2>
      </div>

      <div class="bg-green-50 border border-green-200 rounded p-4 mb-6">
        <p class="text-green-800 text-sm">
          この仕訳は承認済みです。編集はできません。
        </p>
      </div>

      <div class="space-y-4">
        <p class="text-slate-600">仕訳詳細（読み取り専用）</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReceiptViewModel } from '@/types/receiptViewModel'

defineProps<{
  receipt: ReceiptViewModel | null
}>()

// status: 'reviewing', 'confirmed'
// 読み取り専用
</script>
