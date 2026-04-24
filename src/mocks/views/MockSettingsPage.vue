<template>
  <div class="settings-root">
    <!-- タブバー -->
    <div class="settings-tabs">
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <i class="fa-solid fa-gear"></i> 設定
      </button>
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'types' }"
        @click="activeTab = 'types'"
      >
        <i class="fa-solid fa-database"></i> 全型定義
      </button>
    </div>

    <!-- 設定タブ -->
    <div v-if="activeTab === 'settings'" class="settings-content">
      <ScreenS_Settings />
    </div>

    <!-- 全型定義タブ -->
    <div v-if="activeTab === 'types'" class="settings-content">
      <TypeDefinitionsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ScreenS_Settings from '@/views/ScreenS_Settings.vue';
import TypeDefinitionsPanel from '@/mocks/components/TypeDefinitionsPanel.vue';

const activeTab = ref<'settings' | 'types'>('settings');
</script>

<style scoped>
.settings-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

.settings-tabs {
  display: flex;
  gap: 0;
  background: white;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 16px;
}

.settings-tab {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.settings-tab:hover {
  color: #334155;
}

.settings-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.settings-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
