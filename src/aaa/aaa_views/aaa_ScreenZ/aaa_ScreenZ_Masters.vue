<template>
  <div class="p-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
      <h2 class="text-xl font-bold text-gray-800 mb-4">マスター管理 (Phase C Strict)</h2>
      <p class="text-gray-500 mb-8 max-w-md text-center">
        勘定科目、補助科目、税区分等のマスターデータを管理します。
        現在、外部連携API（弥生・MF・freee）との同期機能は開発中です。
      </p>

      <div class="flex gap-4">
        <StandardButton variant="primary">
          <i class="fa-solid fa-sync mr-2"></i> 同期実行
        </StandardButton>
        <StandardButton variant="secondary">
          <i class="fa-solid fa-file-import mr-2"></i> CSVインポート
        </StandardButton>
      </div>

      <div class="mt-12 w-full max-w-2xl border-t border-gray-100 pt-8">
        <h3 class="text-sm font-bold text-gray-700 mb-4">連携ステータス</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
            <span class="font-bold text-blue-800">弥生会計</span>
            <StatusBadge variant="active">Connected</StatusBadge>
          </div>
          <div class="p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-between">
            <span class="font-bold text-orange-800">マネーフォワード</span>
            <StatusBadge variant="warning">Syncing...</StatusBadge>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
            <span class="font-bold text-gray-600">freee</span>
            <StatusBadge variant="neutral">Inactive</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StandardButton from '@/aaa/aaa_components/aaa_UI_StandardButton.vue';
import StatusBadge from '@/aaa/aaa_components/aaa_UI_StatusBadge.vue';
</script>
