<template>
  <div class="h-screen flex flex-col bg-slate-100">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 h-14 flex items-center px-4 shrink-0">
      <h1 class="text-lg font-semibold text-slate-800">証票詳細</h1>
      <div class="ml-auto flex items-center gap-2" v-if="document">
        <span class="px-3 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700">
          {{ document.status }}
        </span>
      </div>
    </header>

    <!-- Main Content (uiMode駆動) -->
    <div class="flex-1 overflow-auto relative">
      <LoadingView v-if="uiMode === 'loading'" />
      <OcrPreview v-else-if="uiMode === 'ocr_preview'" :document="document" />
      <EditorView v-else-if="uiMode === 'editable'" :document="document" />
      <ReadonlyView v-else-if="uiMode === 'readonly'" :document="document" />
      <RejectedView v-else-if="uiMode === 'rejected'" :document="document" />
      <FallbackView v-else :status="document?.status" />

      <!-- 開発用テストパネル -->
      <div class="fixed top-20 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 z-50">
        <h3 class="font-bold mb-2 text-sm">UI Test</h3>
        <button @click="setTestStatus('uploaded')" class="block w-full mb-2 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">LOADING</button>
        <button @click="setTestStatus('ocr_done')" class="block w-full mb-2 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">OCR_PREVIEW</button>
        <button @click="setTestStatus('suggested')" class="block w-full mb-2 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">EDITABLE</button>
        <button @click="setTestStatus('confirmed')" class="block w-full mb-2 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">READONLY</button>
        <button @click="setTestStatus('rejected')" class="block w-full mb-2 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">REJECTED</button>
        <button @click="setTestStatus('unknown')" class="block w-full px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">FALLBACK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { DocumentViewModel } from '@/types/documentViewModel'
import type { DocumentStatus } from '@/shared/documentStatus'
import LoadingView from '@/components/document/LoadingView.vue'
import OcrPreview from '@/components/document/OcrPreview.vue'
import EditorView from '@/components/document/EditorView.vue'
import ReadonlyView from '@/components/document/ReadonlyView.vue'
import RejectedView from '@/components/document/RejectedView.vue'
import FallbackView from '@/components/document/FallbackView.vue'

type DocumentUiMode =
  | 'loading'
  | 'ocr_preview'
  | 'editable'
  | 'readonly'
  | 'rejected'
  | 'fallback'

const route = useRoute()
const document = ref<DocumentViewModel | null>(null)

// ✅ status → uiMode 集約（1箇所のみ）
const uiMode = computed<DocumentUiMode>(() => {
  if (!document.value) return 'loading'

  switch (document.value.status) {
    case 'uploaded':
    case 'preprocessed':
      return 'loading'

    case 'ocr_done':
      return 'ocr_preview'

    case 'suggested':
      return 'editable'

    case 'reviewing':
    case 'confirmed':
      return 'readonly'

    case 'rejected':
      return 'rejected'

    default:
      return 'fallback'
  }
})

// 開発用: テストステータス切り替え
function setTestStatus(status: string) {
  // 開発用テストのため、不正ステータスも含めてDocumentStatus型にキャスト
  // fallbackのテスト用途で意図的に型境界を超える
  document.value = {
    id: 'test-001',
    clientId: 'client-001',
    driveFileId: 'drive-file-001',
    status: status as DocumentStatus,
    displaySnapshot: {
      ocrText: 'テストOCRテキスト\n株式会社サンプル\n¥1,234',
      amountGuess: 1234,
      merchantGuess: '株式会社サンプル'
    }
  }
}

onMounted(async () => {
  // TODO (2026-04): API呼び出し（route.params.idからドキュメント取得）。Supabase移行後に実装
  // document.value = await fetchDocument(route.params.id as string)
  void route // 将来のAPI呼び出し用に保持
})
</script>
