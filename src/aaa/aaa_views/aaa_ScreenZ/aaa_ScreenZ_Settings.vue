<template>
  <div class="p-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
      <h2 class="text-xl font-bold text-gray-800 mb-4">システム設定 (Phase C Strict)</h2>
      <p class="text-gray-500 mb-8 max-w-md text-center">
        ユーザー権限、通知設定、セキュリティ設定等を管理します。
        現在、詳細設定画面は準備中です。
      </p>

      <div class="w-full max-w-lg space-y-4">
         <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
           <div>
             <span class="font-bold text-gray-700 block">システム通知</span>
             <span class="text-xs text-gray-400">メンテナンス情報などをメールで受信します</span>
           </div>
           <StatusBadge variant="active">ON</StatusBadge>
         </div>
         <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
           <div>
             <span class="font-bold text-gray-700 block">二要素認証 (2FA)</span>
             <span class="text-xs text-gray-400">管理者ログイン時に必須化します</span>
           </div>
           <StatusBadge variant="neutral">OFF</StatusBadge>
         </div>

         <div class="pt-6 flex justify-end">
           <StandardButton variant="primary">
             <i class="fa-solid fa-save mr-2"></i> 設定保存
           </StandardButton>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StandardButton from '@/aaa/aaa_components/aaa_UI_StandardButton.vue';
import StatusBadge from '@/aaa/aaa_components/aaa_UI_StatusBadge.vue';
</script>
