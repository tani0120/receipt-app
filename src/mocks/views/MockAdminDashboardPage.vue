<template>
  <div class="admin-dashboard" style="font-family: 'Noto Sans JP', sans-serif">
    <div class="ad-container">

      <!-- ヘッダー -->
      <header class="ad-header">
        <div class="ad-header-icon">🎛</div>
        <div>
          <h1 class="ad-header-title">管理者ダッシュボード</h1>
          <p class="ad-header-sub">AI精度・コスト・処理時間・学習ルール・管理者設定</p>
        </div>
        <!-- 右: システムステータス -->
        <div class="ad-header-status">
          <span class="ad-status-dot" :class="{
            'ad-status-active': adminData.settings.systemStatus === 'ACTIVE',
            'ad-status-pause': adminData.settings.systemStatus === 'PAUSE',
            'ad-status-stop': adminData.settings.systemStatus === 'EMERGENCY_STOP'
          }"></span>
          <span class="ad-status-text">{{ adminData.settings.systemStatus }}</span>
        </div>
      </header>

      <!-- タブ -->
      <div class="ad-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="ad-tab"
          :class="{ 'ad-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="ad-content">

        <!-- AI精度タブ -->
        <div v-if="activeTab === 'accuracy'" class="ad-cards">
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-bullseye"></i> 証票分類AI精度</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">92.3%</span>
              <span class="ad-metric-label">正解率（直近30日）</span>
            </div>
            <div class="ad-metric-sub">
              <div>処理件数: <strong>847件</strong></div>
              <div>エラー率: <strong class="text-red">6.5%</strong></div>
            </div>
          </div>
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-calculator"></i> 科目確定AI精度</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">87.1%</span>
              <span class="ad-metric-label">正解率（直近30日）</span>
            </div>
            <div class="ad-metric-sub">
              <div>keyword: <strong>95.2%</strong></div>
              <div>alias: <strong>91.0%</strong></div>
              <div>ai(LLM): <strong>82.3%</strong></div>
            </div>
          </div>
          <div class="ad-card ad-card--wide">
            <h3 class="ad-card-title"><i class="fa-solid fa-chart-bar"></i> 低確信度仕訳（score &lt; 0.5）</h3>
            <div class="ad-placeholder">
              <i class="fa-solid fa-chart-simple"></i>
              <p>Supabase移行後にデータ集計が利用可能になります</p>
            </div>
          </div>
        </div>

        <!-- コストタブ -->
        <div v-if="activeTab === 'cost'" class="ad-cards">
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-coins"></i> 今月のAPI費用</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">¥12,450</span>
              <span class="ad-metric-label">Gemini API（2026年4月）</span>
            </div>
          </div>
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-microchip"></i> トークン消費</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">2.4M</span>
              <span class="ad-metric-label">合計トークン（今月）</span>
            </div>
            <div class="ad-metric-sub">
              <div>prompt: <strong>1.8M</strong></div>
              <div>completion: <strong>0.6M</strong></div>
            </div>
          </div>
          <div class="ad-card ad-card--wide">
            <h3 class="ad-card-title"><i class="fa-solid fa-chart-line"></i> 月次推移</h3>
            <div class="ad-placeholder">
              <i class="fa-solid fa-chart-area"></i>
              <p>Supabase移行後にグラフ表示が利用可能になります</p>
            </div>
          </div>
        </div>

        <!-- 処理時間タブ -->
        <div v-if="activeTab === 'performance'" class="ad-cards">
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-clock"></i> 証票分類AI</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">3.2秒</span>
              <span class="ad-metric-label">平均処理時間</span>
            </div>
          </div>
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-clock"></i> 科目確定AI</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">1.8秒</span>
              <span class="ad-metric-label">平均処理時間</span>
            </div>
          </div>
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-image"></i> 前処理</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">0.4秒</span>
              <span class="ad-metric-label">平均処理時間</span>
            </div>
            <div class="ad-metric-sub">
              <div>平均削減率: <strong>62%</strong></div>
            </div>
          </div>
        </div>

        <!-- ルールタブ -->
        <div v-if="activeTab === 'rules'" class="ad-cards">
          <div class="ad-card ad-card--wide">
            <h3 class="ad-card-title"><i class="fa-solid fa-graduation-cap"></i> 学習ルール状況</h3>
            <div class="ad-placeholder">
              <i class="fa-solid fa-database"></i>
              <p>学習ルールDB実装後にルール一覧・精度データが表示されます</p>
              <p class="ad-placeholder-sub">関連フィールド: rule_id</p>
            </div>
          </div>
        </div>

        <!-- 管理者設定タブ（旧 /old/admin 統合） -->
        <div v-if="activeTab === 'admin'" class="ad-admin-section">
          <!-- ScreenZ_Dashboardをそのまま埋め込み -->
          <ScreenZ_Dashboard
            @open-staff-modal="isStaffModalOpen = true"
          />
        </div>

      </div>

      <!-- フッター注記 -->
      <div class="ad-footer">
        <i class="fa-solid fa-circle-info"></i>
        AI精度・コスト・処理時間・ルールタブの数値はダミーデータです。Supabase移行後に実データに切り替わります。
      </div>
    </div>

    <!-- スタッフ登録モーダル -->
    <aaa_Z_StaffModal
      :visible="isStaffModalOpen"
      @close="isStaffModalOpen = false"
      @save="handleStaffSave"
      @delete="handleStaffDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ScreenZ_Dashboard from '@/views/ScreenZ/ScreenZ_Dashboard.vue';
import aaa_Z_StaffModal from '@/views/ScreenZ/Z_StaffModal.vue';
import { aaa_useAdminDashboard } from '@/composables/useAdminDashboard';

const { data: adminData } = aaa_useAdminDashboard();

const activeTab = ref<'accuracy' | 'cost' | 'performance' | 'rules' | 'admin'>('admin');

const tabs = [
  { key: 'admin' as const, label: '管理者設定', icon: 'fa-solid fa-screwdriver-wrench' },
  { key: 'accuracy' as const, label: 'AI精度', icon: 'fa-solid fa-bullseye' },
  { key: 'cost' as const, label: 'コスト', icon: 'fa-solid fa-coins' },
  { key: 'performance' as const, label: '処理時間', icon: 'fa-solid fa-clock' },
  { key: 'rules' as const, label: 'ルール', icon: 'fa-solid fa-graduation-cap' },
];

// スタッフモーダル
const isStaffModalOpen = ref(false);
const handleStaffSave = (staffData: Record<string, unknown> & { name: string; email: string }) => {
  alert(`担当者登録: ${staffData.name} (${staffData.email})`);
  isStaffModalOpen.value = false;
};
const handleStaffDelete = () => {
  alert('担当者を削除しました');
  isStaffModalOpen.value = false;
};
</script>

<style scoped>
.admin-dashboard {
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #e2e8f0;
}

.ad-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* ヘッダー */
.ad-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}
.ad-header-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  border-radius: 14px;
  flex-shrink: 0;
}
.ad-header-title {
  font-size: 20px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 4px;
}
.ad-header-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}
.ad-header-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
}
.ad-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ad-status-active { background: #22c55e; }
.ad-status-pause { background: #f59e0b; }
.ad-status-stop { background: #ef4444; animation: pulse 1.5s infinite; }
.ad-status-text {
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
  color: #94a3b8;
}

/* タブ */
.ad-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 4px;
}
.ad-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.ad-tab:hover {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
}
.ad-tab--active {
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: white;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

/* カード */
.ad-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ad-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(8px);
}
.ad-card--wide {
  grid-column: 1 / -1;
}
.ad-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ad-card-title i {
  color: #7c3aed;
}

/* メトリクス */
.ad-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ad-metric-value {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.ad-metric-label {
  font-size: 11px;
  color: #64748b;
}
.ad-metric-sub {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #94a3b8;
}
.ad-metric-sub strong {
  color: #e2e8f0;
}
.text-red {
  color: #f87171 !important;
}

/* プレースホルダー */
.ad-placeholder {
  text-align: center;
  padding: 32px 20px;
  color: #64748b;
}
.ad-placeholder i {
  font-size: 40px;
  margin-bottom: 12px;
  display: block;
  color: #475569;
}
.ad-placeholder p {
  margin: 0 0 4px;
  font-size: 13px;
}
.ad-placeholder-sub {
  font-size: 11px;
  color: #475569;
}

/* 管理者設定タブ（ScreenZ_Dashboard埋め込み） */
.ad-admin-section {
  background: #f8fafc;
  border-radius: 14px;
  padding: 24px;
  color: #1e293b;
}
.ad-admin-section :deep(.space-y-10) {
  max-width: 100%;
}

/* フッター */
.ad-footer {
  margin-top: 24px;
  padding: 12px 16px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 10px;
  font-size: 11px;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
