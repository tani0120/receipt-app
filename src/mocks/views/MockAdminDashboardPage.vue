<template>
  <div class="admin-dashboard" style="font-family: 'Noto Sans JP', sans-serif">
    <div class="ad-container">

      <!-- ヘッダー -->
      <header class="ad-header">
        <div class="ad-header-icon">🎛</div>
        <div>
          <h1 class="ad-header-title">管理者ダッシュボード</h1>
          <p class="ad-header-sub">全社指標・スタッフ別指標・顧問先別指標・AIコスト</p>
        </div>
        <div class="ad-header-note">
          <i class="fa-solid fa-clock"></i>
          <span>アイドル検出（5分無操作→タイマー停止）で放置時間を除外。処理開始〜終了の時間で計測。一部ページは滞在時間で計測。<br>2つ以上のタブを操作していても、操作中のタブだけがアクティブ時間として記録されるので、二重計上されません。</span>
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

        <!-- 全社指標タブ -->
        <div v-if="activeTab === 'company'">
          <div class="ad-cards">
            <!-- コスト & 品質 -->
            <div class="ad-card">
              <h3 class="ad-card-title"><i class="fa-solid fa-building"></i> コスト & 品質（登録・仕訳状況）</h3>
              <div class="ad-table-wrap">
                <table class="ad-dark-table">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th class="text-right">実績値 (今月)</th>
                      <th class="text-right">前年末</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-bold">登録顧問先数</td>
                      <td class="text-right ad-val-primary">{{ adminData.kpiCostQuality.registeredClients }} <span class="ad-unit">件</span></td>
                      <td class="text-right">{{ adminData.kpiCostQuality.prevYearEnd?.registeredClients ?? 0 }} <span class="ad-unit">件</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">稼働中</td>
                      <td class="text-right">{{ adminData.kpiCostQuality.activeClients }} <span class="ad-unit">件</span></td>
                      <td class="text-right">{{ adminData.kpiCostQuality.prevYearEnd?.activeClients ?? 0 }} <span class="ad-unit">件</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">休眠・契約停止</td>
                      <td class="text-right">{{ adminData.kpiCostQuality.stoppedClients }} <span class="ad-unit">件</span></td>
                      <td class="text-right">{{ adminData.kpiCostQuality.prevYearEnd?.stoppedClients ?? 0 }} <span class="ad-unit">件</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">担当者数</td>
                      <td class="text-right ad-val-primary">{{ adminData.kpiCostQuality.staffCount }} <span class="ad-unit">名</span></td>
                      <td class="text-right">{{ adminData.kpiCostQuality.prevYearEnd?.staffCount ?? 0 }} <span class="ad-unit">名</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- 処理効率 -->
            <div class="ad-card">
              <h3 class="ad-card-title"><i class="fa-solid fa-gauge-high"></i> 処理効率</h3>
              <div class="ad-table-wrap">
                <table class="ad-dark-table">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th class="text-right">実績値 (今月)</th>
                      <th class="text-right">1年移動平均</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>月仕訳数／処理時間</td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.thisMonth?.toLocaleString() ?? 0 }}件 / {{ formatActiveTime(activityTotalMs) }}</td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.monthlyAvg?.toLocaleString() ?? 0 }}件 / —</td>
                    </tr>
                    <tr>
                      <td>1h処理仕訳数</td>
                      <td class="text-right">{{ computedVelocityPerHour }} <span class="ad-unit">件/h</span></td>
                      <td class="text-right">— <span class="ad-unit">件/h</span></td>
                    </tr>
                    <tr>
                      <td>100仕訳処理時間</td>
                      <td class="text-right">{{ computedTimePer100 }} <span class="ad-unit">秒</span></td>
                      <td class="text-right">— <span class="ad-unit">秒</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- 生産性 -->
            <div class="ad-card ad-card--wide">
              <h3 class="ad-card-title"><i class="fa-solid fa-chart-line"></i> 生産性（仕訳数 & API費用）</h3>
              <div class="ad-table-wrap">
                <table class="ad-dark-table">
                  <thead>
                    <tr>
                      <th>期間</th>
                      <th class="text-right">仕訳数</th>
                      <th class="text-right">API費用</th>
                      <th class="text-right">処理時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>今月</td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.thisMonth?.toLocaleString() }} <span class="ad-unit">件</span></td>
                      <td class="text-right">¥{{ adminData.kpiProductivity.apiCost?.thisMonthForecast?.toLocaleString() }}</td>
                      <td class="text-right">{{ formatActiveTime(activityTotalMs) }}</td>
                    </tr>
                    <tr>
                      <td>月平均 <span class="ad-unit">1年移動平均</span></td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.monthlyAvg?.toLocaleString() }} <span class="ad-unit">件</span></td>
                      <td class="text-right">¥{{ adminData.kpiProductivity.apiCost?.monthlyAvg?.toLocaleString() }}</td>
                      <td class="text-right">—</td>
                    </tr>
                    <tr>
                      <td>昨年同月</td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.lastYearSameMonth?.toLocaleString() }} <span class="ad-unit">件</span></td>
                      <td class="text-right">¥{{ adminData.kpiProductivity.apiCost?.lastYearSameMonth?.toLocaleString() }}</td>
                      <td class="text-right">—</td>
                    </tr>
                    <tr>
                      <td>今年 <span class="ad-unit">暦年合計</span></td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.thisYear?.toLocaleString() }} <span class="ad-unit">件</span></td>
                      <td class="text-right">¥{{ adminData.kpiProductivity.apiCost?.thisYear?.toLocaleString() }}</td>
                      <td class="text-right">—</td>
                    </tr>
                    <tr>
                      <td>昨年 <span class="ad-unit">暦年合計</span></td>
                      <td class="text-right">{{ adminData.kpiProductivity.journals?.lastYear?.toLocaleString() }} <span class="ad-unit">件</span></td>
                      <td class="text-right">¥{{ adminData.kpiProductivity.apiCost?.lastYear?.toLocaleString() }}</td>
                      <td class="text-right">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- スタッフ別指標タブ -->
        <div v-if="activeTab === 'staff'">
          <div class="ad-card ad-card--wide" style="margin-bottom: 0">
            <h3 class="ad-card-title"><i class="fa-solid fa-users"></i> 担当者個別分析 <span class="ad-count-badge">{{ sortedStaff.length }}名</span></h3>
            <div class="ad-segment-bar">
              <button :class="['ad-segment-btn', { active: staffStatusFilter === 'all' }]" @click="staffStatusFilter = 'all'">全員 ({{ staffStatusCounts.all }})</button>
              <button :class="['ad-segment-btn', { active: staffStatusFilter === 'active' }]" @click="staffStatusFilter = 'active'">有効 ({{ staffStatusCounts.active }})</button>
              <button v-if="staffStatusCounts.inactive" :class="['ad-segment-btn ad-segment-btn--danger', { active: staffStatusFilter === 'inactive' }]" @click="staffStatusFilter = 'inactive'">停止中 ({{ staffStatusCounts.inactive }})</button>
            </div>
            <div class="ad-table-wrap" v-if="adminData.staffAnalysis">
              <table class="ad-dark-table">
                <thead>
                  <tr>
                    <th class="ad-sortable" @click="toggleSort('staff', 'status')">ステータス <span class="ad-sort-icon">{{ sortIcon('staff', 'status') }}</span></th>
                    <th class="ad-sortable" @click="toggleSort('staff', 'name')">担当者名 <span class="ad-sort-icon">{{ sortIcon('staff', 'name') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'thisMonthJournals')">今月仕訳数 <span class="ad-sort-icon">{{ sortIcon('staff', 'thisMonthJournals') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'monthlyAvgJournals')">月平均仕訳数 <span class="ad-sort-icon">{{ sortIcon('staff', 'monthlyAvgJournals') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'annualApiCost')">年間API利用料 <span class="ad-sort-icon">{{ sortIcon('staff', 'annualApiCost') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'velocityThisMonth')">月仕訳数／処理時間 (今月) <span class="ad-sort-icon">{{ sortIcon('staff', 'velocityThisMonth') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'velocityAvg')">月仕訳数／処理時間 (平均) <span class="ad-sort-icon">{{ sortIcon('staff', 'velocityAvg') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('staff', 'velocityPerHourAvg')">1h処理仕訳数 (平均) <span class="ad-sort-icon">{{ sortIcon('staff', 'velocityPerHourAvg') }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(staff, index) in sortedStaff" :key="index" :class="{ 'ad-row-inactive': staff.status !== 'active' }">
                    <td><span :class="statusClass(staff.status)">{{ staffStatusLabel(staff.status) }}</span></td>
                    <td>{{ staff.name }}</td>
                    <td class="text-right">{{ staff.performance.thisMonthJournals }}</td>
                    <td class="text-right">{{ staff.performance.monthlyAvgJournals }}</td>
                    <td class="text-right">¥{{ (staff.performance.annualApiCost / 1000).toFixed(0) }}千円</td>
                    <td class="text-right font-mono">{{ staff.performance.velocityThisMonth }}</td>
                    <td class="text-right font-mono">{{ staff.performance.velocityAvg }}</td>
                    <td class="text-right">{{ staff.performance.velocityPerHourAvg }} <span class="ad-unit">件/h</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 顧問先別指標タブ -->
        <div v-if="activeTab === 'client'">
          <div class="ad-card ad-card--wide" style="margin-bottom: 0">
            <h3 class="ad-card-title"><i class="fa-solid fa-briefcase"></i> 顧問先別コスト・効率分析 <span class="ad-count-badge">{{ sortedClients.length }}社</span></h3>
            <div class="ad-segment-bar">
              <button :class="['ad-segment-btn', { active: clientStatusFilter === 'all' }]" @click="clientStatusFilter = 'all'">全社 ({{ clientStatusCounts.all }})</button>
              <button :class="['ad-segment-btn', { active: clientStatusFilter === 'active' }]" @click="clientStatusFilter = 'active'">稼働中 ({{ clientStatusCounts.active }})</button>
              <button v-if="clientStatusCounts.suspension" :class="['ad-segment-btn ad-segment-btn--warn', { active: clientStatusFilter === 'suspension' }]" @click="clientStatusFilter = 'suspension'">休眠中 ({{ clientStatusCounts.suspension }})</button>
              <button v-if="clientStatusCounts.inactive" :class="['ad-segment-btn ad-segment-btn--danger', { active: clientStatusFilter === 'inactive' }]" @click="clientStatusFilter = 'inactive'">契約終了 ({{ clientStatusCounts.inactive }})</button>
            </div>
            <div class="ad-table-wrap" v-if="adminData.clientAnalysis">
              <table class="ad-dark-table">
                <thead>
                  <tr>
                    <th class="ad-sortable" @click="toggleSort('client', 'status')">ステータス <span class="ad-sort-icon">{{ sortIcon('client', 'status') }}</span></th>
                    <th class="ad-sortable" @click="toggleSort('client', 'code')">コード <span class="ad-sort-icon">{{ sortIcon('client', 'code') }}</span></th>
                    <th class="ad-sortable" @click="toggleSort('client', 'name')">会社名 <span class="ad-sort-icon">{{ sortIcon('client', 'name') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'journalsThisMonth')">今月仕訳数 <span class="ad-sort-icon">{{ sortIcon('client', 'journalsThisMonth') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'journalsThisYear')">年度仕訳数 <span class="ad-sort-icon">{{ sortIcon('client', 'journalsThisYear') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'journalsLastYear')">昨年度仕訳数 <span class="ad-sort-icon">{{ sortIcon('client', 'journalsLastYear') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'apiCostThisYear')">年度API費用 <span class="ad-sort-icon">{{ sortIcon('client', 'apiCostThisYear') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'velocityThisMonth')">月仕訳数／時間 (今月) <span class="ad-sort-icon">{{ sortIcon('client', 'velocityThisMonth') }}</span></th>
                    <th class="ad-sortable text-right" @click="toggleSort('client', 'velocityAvg')">月仕訳数／時間 (平均) <span class="ad-sort-icon">{{ sortIcon('client', 'velocityAvg') }}</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="client in sortedClients" :key="client.code" :class="{ 'ad-row-inactive': client.status !== 'active' }">
                    <td><span :class="statusClass(client.status)">{{ clientStatusLabel(client.status) }}</span></td>
                    <td class="font-mono">{{ client.code }}</td>
                    <td>{{ client.name }}</td>
                    <td class="text-right">{{ client.performance.journalsThisMonth }}</td>
                    <td class="text-right">{{ client.performance.journalsThisYear }}</td>
                    <td class="text-right">{{ client.performance.journalsLastYear }}</td>
                    <td class="text-right">¥{{ (client.performance.apiCostThisYear)?.toLocaleString() }}</td>
                    <td class="text-right font-mono">{{ client.performance.velocityThisMonth }}</td>
                    <td class="text-right font-mono">{{ client.performance.velocityAvg }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- AIコストタブ -->
        <div v-if="activeTab === 'cost'" class="ad-cards">
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-coins"></i> 今月のAPI費用</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">¥{{ adminData.kpiProductivity.apiCost?.thisMonthForecast?.toLocaleString() }}</span>
              <span class="ad-metric-label">Gemini API（{{ new Date().getFullYear() }}年{{ new Date().getMonth() + 1 }}月） / {{ adminData.kpiProductivity.apiCost?.totalCalls ?? 0 }}回呼出</span>
            </div>
          </div>
          <div class="ad-card">
            <h3 class="ad-card-title"><i class="fa-solid fa-microchip"></i> トークン消費</h3>
            <div class="ad-metric">
              <span class="ad-metric-value">{{ formatTokenCount(adminData.kpiProductivity.apiCost?.totalTokens ?? 0) }}</span>
              <span class="ad-metric-label">合計トークン（今月）</span>
            </div>
            <div class="ad-metric-sub">
              <div>prompt: <strong>{{ formatTokenCount(adminData.kpiProductivity.apiCost?.promptTokens ?? 0) }}</strong></div>
              <div>completion: <strong>{{ formatTokenCount(adminData.kpiProductivity.apiCost?.completionTokens ?? 0) }}</strong></div>
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

      </div>

      <!-- フッター注記 -->
      <div class="ad-footer">
        <i class="fa-solid fa-circle-info"></i>
        スタッフ別指標・AIコストタブの数値はダミーデータです。Supabase移行後に実データに切り替わります。
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
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import aaa_Z_StaffModal from '@/views/ScreenZ/Z_StaffModal.vue';
import { aaa_useAdminDashboard } from '@/composables/useAdminDashboard';

const route = useRoute();
const router = useRouter();
const { data: adminData } = aaa_useAdminDashboard();

// 活動ログ集計: 今月の合計処理時間（ミリ秒）
const activityTotalMs = ref(0);

async function fetchActivityTotal() {
  try {
    const res = await fetch('/api/activity-log/summary');
    if (!res.ok) return;
    const body = await res.json() as {
      byStaff: { totalActiveMs: number }[];
    };
    // 全スタッフの合計
    activityTotalMs.value = (body.byStaff ?? []).reduce((sum: number, s: { totalActiveMs: number }) => sum + s.totalActiveMs, 0);
  } catch {
    // 取得失敗時は0のまま
  }
}
fetchActivityTotal();

/** ミリ秒を「h:mm:ss」形式にフォーマット */
function formatActiveTime(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 1h処理仕訳数（今月仕訳数 ÷ 処理時間h） */
const computedVelocityPerHour = computed(() => {
  const journals = adminData.value.kpiProductivity.journals?.thisMonth ?? 0;
  const hours = activityTotalMs.value / 3600000;
  if (hours <= 0 || journals <= 0) return '0';
  return (journals / hours).toFixed(1);
});

/** 100仕訳処理時間（処理時間秒 ÷ 仕訳数 × 100） */
const computedTimePer100 = computed(() => {
  const journals = adminData.value.kpiProductivity.journals?.thisMonth ?? 0;
  const totalSec = activityTotalMs.value / 1000;
  if (totalSec <= 0 || journals <= 0) return '0';
  return Math.round((totalSec / journals) * 100);
});

/** トークン数を「0」「123K」「1.5M」形式にフォーマット */
function formatTokenCount(n: number): string {
  if (n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** スタッフのステータスラベル（スタッフマスターと統一） */
function staffStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '有効',
    inactive: '停止中',
  };
  return map[status] ?? status;
}

/** 顧問先のステータスラベル（顧問先マスターと統一） */
function clientStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '稼働中',
    suspension: '休眠中',
    inactive: '契約終了',
  };
  return map[status] ?? status;
}

/** ステータスのCSSクラス（共通） */
function statusClass(status: string): string {
  const map: Record<string, string> = {
    active: 'ad-status ad-status--active',
    inactive: 'ad-status ad-status--inactive',
    suspension: 'ad-status ad-status--suspension',
  };
  return map[status] ?? 'ad-status';
}

type TabKey = 'company' | 'staff' | 'client' | 'cost';
const validTabs: TabKey[] = ['company', 'staff', 'client', 'cost'];

// URLクエリからタブを復元
function getTabFromQuery(): TabKey {
  const q = route.query.tab as string | undefined;
  return validTabs.includes(q as TabKey) ? (q as TabKey) : 'company';
}

const activeTab = ref<TabKey>(getTabFromQuery());

// タブ変更時にURLを同期
watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

// URLの直接変更を検知
watch(() => route.query.tab, (newTab) => {
  if (validTabs.includes(newTab as TabKey)) {
    activeTab.value = newTab as TabKey;
  }
});

const tabs = [
  { key: 'company' as const, label: '全社指標', icon: 'fa-solid fa-building' },
  { key: 'staff' as const, label: 'スタッフ別指標', icon: 'fa-solid fa-users' },
  { key: 'client' as const, label: '顧問先別指標', icon: 'fa-solid fa-briefcase' },
  { key: 'cost' as const, label: 'AIコスト', icon: 'fa-solid fa-coins' },
];

// ======== ソート機能 ========
type SortDir = 'asc' | 'desc' | null;
const sortState = ref<{ table: string; key: string; dir: SortDir }>({ table: '', key: '', dir: null });

function toggleSort(table: string, key: string) {
  if (sortState.value.table === table && sortState.value.key === key) {
    // 同じ列: asc → desc → null
    sortState.value.dir = sortState.value.dir === 'asc' ? 'desc' : sortState.value.dir === 'desc' ? null : 'asc';
  } else {
    sortState.value = { table, key, dir: 'asc' };
  }
}

function sortIcon(table: string, key: string): string {
  if (sortState.value.table !== table || sortState.value.key !== key || !sortState.value.dir) return '⇅';
  return sortState.value.dir === 'asc' ? '↑' : '↓';
}

/** ソート対象オブジェクトの共通型（name/code直下 + performance配下） */
interface SortableItem {
  name?: string;
  code?: string;
  status?: string;
  performance: Record<string, unknown>;
  [key: string]: unknown;
}

function getNestedVal(obj: SortableItem, key: string): unknown {
  // スタッフ: name直下 or performance.xxx
  if (key === 'name' || key === 'code' || key === 'status') return obj[key];
  if (obj.performance && key in obj.performance) return obj.performance[key];
  return obj[key];
}

function sortList<T extends SortableItem>(list: T[], table: string): T[] {
  if (sortState.value.table !== table || !sortState.value.dir) return list;
  const key = sortState.value.key;
  const dir = sortState.value.dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = getNestedVal(a, key);
    const vb = getNestedVal(b, key);
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir;
    return (((va as number) ?? 0) - ((vb as number) ?? 0)) * dir;
  });
}

const sortedStaff = computed(() => {
  const all = adminData.value.staffAnalysis ?? [];
  const filtered = staffStatusFilter.value === 'all'
    ? all
    : all.filter(s => s.status === staffStatusFilter.value);
  return sortList(filtered, 'staff');
});
const sortedClients = computed(() => {
  const all = adminData.value.clientAnalysis ?? [];
  const filtered = clientStatusFilter.value === 'all'
    ? all
    : all.filter(c => c.status === clientStatusFilter.value);
  return sortList(filtered, 'client');
});

/** ステータスフィルタ状態 */
const staffStatusFilter = ref<string>('all');
const clientStatusFilter = ref<string>('all');

/** スタッフのステータス別件数 */
const staffStatusCounts = computed(() => {
  const all = adminData.value.staffAnalysis ?? [];
  return {
    all: all.length,
    active: all.filter(s => s.status === 'active').length,
    inactive: all.filter(s => s.status === 'inactive').length,
    suspension: all.filter(s => s.status === 'suspension').length,
  };
});

/** 顧問先のステータス別件数 */
const clientStatusCounts = computed(() => {
  const all = adminData.value.clientAnalysis ?? [];
  return {
    all: all.length,
    active: all.filter(c => c.status === 'active').length,
    inactive: all.filter(c => c.status === 'inactive').length,
    suspension: all.filter(c => c.status === 'suspension').length,
  };
});

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
.ad-header-note {
  flex: 1;
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 700;
  line-height: 1.6;
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.ad-header-note i {
  color: #7c3aed;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
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

/* ダークテーマテーブル */
.ad-table-wrap {
  overflow-x: auto;
  margin: 0 -20px -20px;
  padding: 0 20px 20px;
}
.ad-dark-table {
  width: 100%;
  text-align: left;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 16px;
}
.ad-dark-table thead tr {
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
.ad-dark-table th {
  padding: 12px 18px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.ad-dark-table td {
  padding: 16px 18px;
  color: #e2e8f0;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  white-space: nowrap;
  font-size: 18px;
}
.ad-dark-table tbody tr {
  transition: background 0.15s;
}
.ad-dark-table tbody tr:hover {
  background: rgba(148, 163, 184, 0.06);
}
.ad-dark-table .font-bold {
  color: #f1f5f9;
}
.ad-val-primary {
  color: #e2e8f0 !important;
  font-weight: 800;
  font-size: 22px;
}

/* ソートヘッダー */
.ad-sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}
.ad-sortable:hover {
  color: #e2e8f0;
}
.ad-sort-icon {
  font-size: 12px;
  opacity: 0.5;
  margin-left: 4px;
}
.ad-unit {
  font-size: 11px;
  font-weight: 400;
  color: #64748b;
}
/* ステータスバッジ */
.ad-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.ad-status--active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
.ad-status--inactive {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}
.ad-status--suspension {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* 件数バッジ */
.ad-count-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  margin-left: 8px;
  vertical-align: middle;
}

/* セグメントバー */
.ad-segment-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.ad-segment-btn {
  padding: 4px 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.ad-segment-btn:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}
.ad-segment-btn.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #818cf8;
}
.ad-segment-btn--warn.active {
  background: rgba(234, 179, 8, 0.15);
  border-color: #eab308;
  color: #eab308;
}
.ad-segment-btn--danger.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
}

/* 非稼働行 */
.ad-row-inactive {
  opacity: 0.55;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
