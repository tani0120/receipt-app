<template>
  <div class="settings-root">
    <!-- タブバー -->
    <div class="settings-tabs">
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'settings' }"
        @click="switchTab('settings')"
      >
        <i class="fa-solid fa-gear"></i> 設定
      </button>
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'types' }"
        @click="switchTab('types')"
      >
        <i class="fa-solid fa-database"></i> 全型定義
      </button>
      <button
        class="settings-tab"
        :class="{ active: activeTab === 'prompts' }"
        @click="switchTab('prompts')"
      >
        <i class="fa-solid fa-wand-magic-sparkles"></i> プロンプト
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

    <!-- プロンプトタブ -->
    <div v-if="activeTab === 'prompts'" class="settings-content">
      <PromptDefinitionsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ScreenS_Settings from '@/views/ScreenS_Settings.vue';
import TypeDefinitionsPanel from '@/components/TypeDefinitionsPanel.vue';
import PromptDefinitionsPanel from '@/components/PromptDefinitionsPanel.vue';

const route = useRoute();
const router = useRouter();

type TabKey = 'settings' | 'types' | 'prompts';
const validTabs: TabKey[] = ['settings', 'types', 'prompts'];

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab as string | undefined;
  return validTabs.includes(q as TabKey) ? (q as TabKey) : 'settings';
});

const switchTab = (tab: TabKey) => {
  router.replace({ query: { ...route.query, tab } });
};
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
