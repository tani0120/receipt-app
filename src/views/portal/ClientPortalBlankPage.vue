<template>
  <div class="cpb-page">
    <!-- ポータル共通ヘッダー（最上部固定） -->
    <PortalHeader :clientName="displayName" />

    <!-- サイドバー + メイン -->
    <div class="cpb-layout">
      <!-- 左サイドバー -->
      <aside class="cpb-sidebar">
        <nav class="cpb-nav">
          <button
            v-for="item in sidebarItems"
            :key="item.key"
            class="cpb-menu-btn"
            :class="{ 'cpb-menu-btn--active': activeNav === item.key }"
            @click="activeNav = item.key"
          >
            <div class="cpb-menu-icon" :style="{ background: item.color }">
              <i :class="item.icon"></i>
            </div>
            <span class="cpb-menu-label">{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- メインコンテンツ -->
      <main class="cpb-main">
        <div v-if="isLoading" class="cpb-loading">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <div v-else-if="client" class="cpb-center">
          <span class="cpb-code">{{ client.threeCode }}</span>
          <span class="cpb-name">{{ displayName }}</span>
        </div>
        <div v-else class="cpb-center cpb-error">
          顧問先が見つかりません
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PortalHeader from '@/components/PortalHeader.vue';
import { getClientDisplayName } from '@/constants/clientOptions';

const route = useRoute();
const clientId = computed(() => route.params.clientId as string);

const client = ref<Record<string, unknown> | null>(null);
const isLoading = ref(true);
const activeNav = ref('documents');

const displayName = computed(() => {
  if (!client.value) return '';
  return getClientDisplayName(client.value as Parameters<typeof getClientDisplayName>[0]);
});

/** サイドバー項目（ホームページと同じカード型） */
const sidebarItems = [
  { key: 'documents', label: '資料共有', icon: 'fa-solid fa-folder-open', color: 'linear-gradient(135deg, #14b8a6, #0d9488)' },
  { key: 'requests', label: 'ご依頼内容まとめ', icon: 'fa-solid fa-clipboard-list', color: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { key: 'schedule', label: 'スケジュール', icon: 'fa-solid fa-calendar-days', color: 'linear-gradient(135deg, #f97316, #ea580c)' },
  { key: 'checklist', label: 'チェックリスト', icon: 'fa-solid fa-list-check', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { key: 'pl', label: '損益計算', icon: 'fa-solid fa-chart-line', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
];

onMounted(async () => {
  try {
    const res = await fetch(`/api/clients/${clientId.value}`);
    if (res.ok) {
      const data = await res.json();
      client.value = data.client ?? data;
    }
  } catch (e) {
    console.error('[ClientPortalBlank] 取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* ===== ページ全体 ===== */
.cpb-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4f8;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  overflow: hidden;
}

/* ===== サイドバー + メイン ===== */
.cpb-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ===== 左サイドバー ===== */
.cpb-sidebar {
  width: 240px;
  min-width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.cpb-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  gap: 8px;
}

/* ===== カード型メニューボタン ===== */
.cpb-menu-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  font-family: inherit;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cpb-menu-btn:hover {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  box-shadow:
    0 4px 12px rgba(59, 130, 246, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.cpb-menu-btn:active {
  transform: scale(0.97);
}

.cpb-menu-btn--active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  box-shadow:
    0 4px 12px rgba(59, 130, 246, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.04);
}

/* グラデーションアイコン */
.cpb-menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cpb-menu-label {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

/* ===== メインコンテンツ ===== */
.cpb-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow-y: auto;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.cpb-loading {
  font-size: 24px;
  color: #94a3b8;
}

.cpb-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.cpb-code {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.cpb-name {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.cpb-error {
  font-size: 16px;
  color: #94a3b8;
}
</style>
