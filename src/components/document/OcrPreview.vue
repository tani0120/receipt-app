<template>
  <div class="p-8">
    <div class="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 class="text-xl font-bold text-slate-800 mb-4">OCR結果確認</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">OCRテキスト</label>
          <div class="bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-wrap font-mono text-sm">
            {{ document?.displaySnapshot?.ocrText || 'OCR結果がありません' }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">推定金額</label>
            <div class="bg-slate-50 p-3 rounded border border-slate-200">
              {{ document?.displaySnapshot?.amountGuess ? `¥${document.displaySnapshot.amountGuess.toLocaleString()}` : '---' }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">推定取引先</label>
            <div class="bg-slate-50 p-3 rounded border border-slate-200">
              {{ document?.displaySnapshot?.merchantGuess || '---' }}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          次へ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocumentViewModel } from '@/types/documentViewModel'

defineProps<{
  document: DocumentViewModel | null
}>()

// status: 'ocr_done'
// displaySnapshotは表示のみ、UIロジックには使わない
</script>

