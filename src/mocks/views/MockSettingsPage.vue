<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 共通ナビバー -->
    <MockNavBar />
    <!-- 設定コンテンツ -->
    <div class="flex-1 overflow-auto p-4">
      <ScreenS_Settings />
    </div>
  </div>
</template>

<script setup lang="ts">
import MockNavBar from '@/mocks/components/MockNavBar.vue';
import ScreenS_Settings from '@/views/ScreenS_Settings.vue';
</script>
