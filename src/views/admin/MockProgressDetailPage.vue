<template>
  <div class="pg-container absolute inset-0 flex flex-col overflow-hidden">
    <div class="cm-settings">
    <!-- ページタイトル（青背景） -->
    <div class="cm-header">
      <h1 class="cm-title">進捗管理</h1>
      <div class="cm-header-actions" v-if="isAdmin">
        <button
          class="cm-admin-btn"
          @click="$router.push({ name: 'ProgressViewSettings' })"
        >
          <i class="fa-solid fa-list-check"></i> 一覧管理
        </button>
        <button
          class="cm-admin-btn"
          :class="{ active: pgAdminMode === 'field' }"
          :disabled="pgAdminMode === 'layout'"
          @click="togglePgAdminMode('field')"
        >
          <i class="fa-solid fa-puzzle-piece"></i> フィールド管理
        </button>
        <button
          class="cm-admin-btn"
          :class="{ active: pgAdminMode === 'layout' }"
          :disabled="pgAdminMode === 'field'"
          @click="togglePgAdminMode('layout')"
        >
          <i class="fa-solid fa-grip"></i> レイアウト管理
        </button>
      </div>
    </div>

    <!-- ツールバー（共通コンポーネント） -->
    <TableFilterToolbar
      :columns="pgAllColumns"
      v-model:visible-columns="pgVisibleColumns"
      :total-count="totalCount"
      :views="pgViews"
      v-model:active-view-index="pgActiveViewIndex"
      :filter-columns="pgFilterColumns"
      :filter-conditions="pgFilterConditions"
      :filter-logic="pgFilterLogic"
      :filter-sorts="pgFilterSortSettings"
      :default-conditions="pgCurrentViewDefaults.filters"
      :default-sorts="pgCurrentViewDefaults.sorts"
      @filter-apply="onPgFilterApply"
      @filter-remove="onPgFilterRemove"
      @view-change="onPgViewChange"
    >
    </TableFilterToolbar>

    <!-- ページネーション -->
    <div class="cm-pagination-row" style="display: flex; justify-content: space-between; align-items: center;">
      <div class="cm-pagination">
        <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
        <span
          v-for="p in displayPages" :key="p"
          class="cm-page-num" :class="{ active: p === currentPage }"
          @click="currentPage = p"
        >{{ p }}</span>
        <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
        <span class="cm-page-info">{{ pageStartIndex }}~{{ pageEndIndex }} / 全{{ totalCount }}件</span>
        <span style="margin-left: 12px; font-size: 11px; color: #94a3b8; font-weight: 400;">※1時間に1回、最新の未仕訳画像データ等を更新しています。</span>
      </div>
      <!-- 全社一括未仕訳取込ボタン -->
      <button
        class="pg-bulk-import-btn"
        :class="{ 'pg-bulk-import-disabled': isBulkImporting }"
        :disabled="isBulkImporting"
        @click="showBulkImportModal"
      >
        <span class="pg-bulk-import-icon">
          <i :class="isBulkImporting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-down'"></i>
        </span>
        <span class="pg-bulk-import-label">全社一括取込</span>
      </button>
    </div>

    <!-- テーブル -->
    <div class="cm-table-wrap">
      <table class="cm-table" :style="{ tableLayout: 'fixed', width: '100%', minWidth: pgTableWidth + 'px' }">
        <colgroup>
          <col :style="{ width: pgColWidths['status'] + 'px' }">
          <col :style="{ width: pgColWidths['code'] + 'px' }">
          <col :style="{ width: pgColWidths['companyName'] + 'px' }">
          <col :style="{ width: pgColWidths['staffName'] + 'px' }">
          <col :style="{ width: pgColWidths['fiscalMonth'] + 'px' }">
          <col :style="{ width: pgColWidths['shareStatus'] + 'px' }">
          <col :style="{ width: pgColWidths['receivedDate'] + 'px' }">
          <col :style="{ width: pgColWidths['unexported'] + 'px' }">

          <col v-for="m in monthColumns" :key="'col-'+m.key" style="width: 36px;">
          <col :style="{ width: pgColWidths['currentYear'] + 'px' }">
          <col :style="{ width: pgColWidths['lastYear'] + 'px' }">
        </colgroup>
        <thead>
          <tr>
            <th class="sortable pg-th-status relative" @click="sortBy('status')">状態 <i :class="getSortIcon('status')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('status', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('code')">3コード <i :class="getSortIcon('code')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('code', $event)"></div>
            </th>
            <th class="sortable relative" @click="sortBy('companyName')">会社名/代表者名 <i :class="getSortIcon('companyName')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('companyName', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('staffName')">担当 <i :class="getSortIcon('staffName')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('staffName', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('fiscalMonth')">決算月 <i :class="getSortIcon('fiscalMonth')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('fiscalMonth', $event)"></div>
            </th>
            <th class="pg-th-narrow relative">共有設定
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('shareStatus', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow relative" @click="sortBy('receivedDate')">資料受取日 <i :class="getSortIcon('receivedDate')"></i>
              <div class="resize-handle" @mousedown.stop="onPgResizeStart('receivedDate', $event)"></div>
            </th>
            <th class="sortable pg-th-narrow pg-th-num relative" @click="sortBy('unexported')">未仕訳 <i :class="getSortIcon('unexported')"></i>
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('unexported', $event)"></div>
            </th>

            <th
              v-for="m in monthColumns" :key="'th-'+m.key"
              class="sortable pg-th-month"
              @click="sortBy('month_' + m.key)"
            >{{ m.label }} <i :class="getSortIcon('month_' + m.key)"></i></th>
            <th class="sortable pg-th-num relative" @click="sortBy('currentYearJournals')">今期<br>累計 <i :class="getSortIcon('currentYearJournals')"></i>
              <div class="resize-handle-light" @mousedown.stop="onPgResizeStart('currentYear', $event)"></div>
            </th>
            <th class="sortable pg-th-num" @click="sortBy('lastYearJournals')">前期<br>合計 <i :class="getSortIcon('lastYearJournals')"></i></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pagedRows" :key="row.clientId" class="pg-row" :class="{ 'pg-row-inactive': row.status === 'inactive', 'pg-row-suspension': row.status === 'suspension' }" @click="goToJournalList(row)" style="cursor: pointer;">
            <td class="pg-td-status">
              <span class="pg-status-badge" :class="{
                'pg-status-active': row.status === 'active',
                'pg-status-suspension': row.status === 'suspension',
                'pg-status-inactive': row.status === 'inactive'
              }">{{ getLabel(STATUS_OPTIONS, row.status) }}</span>
            </td>
            <td class="pg-td-code">{{ row.code }}</td>
            <td class="pg-td-client">{{ getClientDisplayName(row) }}</td>
            <td class="pg-td-narrow">{{ getStaffNameForClient(row.clientId) || '' }}</td>
            <td class="pg-td-fiscal">{{ row.fiscalMonth }}月</td>
            <td class="pg-td-narrow pg-td-share">
              <span v-if="getStatusFromCache(row.clientId) === 'active'" class="pg-share-badge pg-share-active">共有OK</span>
              <span v-else-if="getStatusFromCache(row.clientId) === 'pending'" class="pg-share-badge pg-share-pending">未承認</span>
              <span v-else-if="getStatusFromCache(row.clientId) === 'revoked'" class="pg-share-badge pg-share-revoked">解除済</span>
              <span v-else class="pg-share-badge pg-share-none">—</span>
            </td>
            <td class="pg-td-narrow">{{ row.receivedDate || '—' }}</td>
            <td class="pg-td-num" :class="{ 'pg-unexported-highlight': row.unexported > 0 }">{{ row.unexported > 0 ? row.unexported + '件' : '—' }}</td>

            <td
              v-for="m in monthColumns" :key="'td-'+m.key+'-'+row.id"
              class="pg-td-month"
              :class="{ 'pg-td-month-val': (row.monthlyJournals[m.key] || 0) > 0 }"
            >{{ (row.monthlyJournals[m.key] || 0) > 0 ? row.monthlyJournals[m.key] : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.currentYearJournals > 0 ? row.currentYearJournals.toLocaleString() : '—' }}</td>
            <td class="pg-td-num pg-td-total">{{ row.lastYearJournals > 0 ? row.lastYearJournals.toLocaleString() : '—' }}</td>
          </tr>
          <tr v-if="isLoading || pagedRows.length === 0">
            <td :colspan="11 + monthColumns.length" class="pg-empty">
              <template v-if="isLoading">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>読み込み中…
              </template>
              <template v-else>該当する顧問先がありません</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>

    <!-- フィールド管理モーダル（全社共通） -->
    <CustomFieldModal
      :visible="showPgFieldModal"
      :custom-defs="pgFieldLayout.customDefs.value"
      :section-keys="pgSectionKeys"
      :layout-fields="pgFieldLayout.fields.value"
      :field-rows="pgFieldLayout.fieldRows.value"
      :default-field-keys="pgFieldLayout.defaultFields.map(f => f.key)"
      :label-overrides="pgFieldLayout.labelOverrides.value"
      :hidden-fields="pgFieldLayout.hiddenFields.value"
      :deleted-fields="pgFieldLayout.deletedFields.value"
      :field-options="pgFieldLayout.fieldOptions.value"
      @update:visible="showPgFieldModal = $event"
      @save="handlePgFieldSave"
    />

    <!-- フィールド追加モーダル -->
    <AddFieldModal
      :visible="showPgAddFieldModal"
      :section-keys="pgSectionKeys"
      :default-section="pgAddFieldDefaultSection"
      @update:visible="showPgAddFieldModal = $event"
      @add="handlePgAddField"
    />
    <!-- 全社一括未仕訳取込モーダル -->
    <div
      v-if="bulkImportModal.show"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/30"
      @click.self="!isBulkImporting && (bulkImportModal.show = false)"
    >
      <div class="bg-white rounded-lg shadow-xl w-96 overflow-hidden" @click.stop>
        <!-- ヘッダー -->
        <div class="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
          <i class="fa-solid fa-download text-white text-[13px]"></i>
          <span class="text-white font-bold text-[13px]">全社一括未仕訳取込</span>
        </div>
        <!-- コンテンツ -->
        <div class="p-4">
          <!-- 確認 -->
          <template v-if="bulkImportModal.phase === 'confirm'">
            <p class="text-[12px] text-gray-700 mb-1">契約中かつDrive連携済みの全顧問先を対象に、新着ファイルを一括取込します。</p>
            <div class="mt-2 mb-3 bg-gray-50 rounded p-2 text-[11px]">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fa-solid fa-building text-[10px]"></i>
                <span>対象条件: <strong>ステータス=契約中</strong> + <strong>Driveフォルダ設定済み</strong></span>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="bulkImportModal.show = false" class="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-100 text-gray-600">キャンセル</button>
              <button @click="executeBulkImport" class="px-3 py-1.5 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold flex items-center gap-1">
                <i class="fa-solid fa-download text-[10px]"></i> 取込開始
              </button>
            </div>
          </template>
          <!-- 取込中 -->
          <template v-else-if="bulkImportModal.phase === 'loading'">
            <div class="flex flex-col items-center py-3">
              <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-[24px] mb-2"></i>
              <p class="text-[12px] text-gray-600 font-bold">全社一括取込中...</p>
              <p class="text-[10px] text-gray-400 mt-1">各顧問先のDriveフォルダを順次確認しています</p>
            </div>
          </template>
          <!-- 完了 -->
          <template v-else-if="bulkImportModal.phase === 'done'">
            <div class="flex flex-col items-center py-2">
              <i :class="bulkImportModal.icon" class="text-[28px] mb-2"></i>
              <p class="text-[13px] font-bold" :class="bulkImportModal.resultColor">{{ bulkImportModal.resultTitle }}</p>
              <p class="text-[11px] text-gray-500 mt-1">{{ bulkImportModal.resultDetail }}</p>
            </div>
            <!-- 詳細結果 -->
            <div v-if="bulkImportModal.details.length > 0" class="mt-2 max-h-40 overflow-y-auto border rounded text-[10px]">
              <div
                v-for="d in bulkImportModal.details" :key="d.clientId"
                class="flex items-center justify-between px-2 py-1 border-b last:border-b-0"
                :class="d.error ? 'bg-red-50' : d.added > 0 ? 'bg-emerald-50' : ''"
              >
                <span class="text-gray-700 truncate">{{ d.companyName }}</span>
                <span v-if="d.error" class="text-red-500 ml-2 whitespace-nowrap">⚠ {{ d.error }}</span>
                <span v-else-if="d.added > 0" class="text-emerald-600 ml-2 font-bold whitespace-nowrap">+{{ d.added }}件</span>
                <span v-else class="text-gray-400 ml-2 whitespace-nowrap">—</span>
              </div>
            </div>
            <div class="flex justify-center mt-3">
              <button @click="bulkImportModal.show = false; fetchProgressList()" class="w-full px-4 py-2 text-[12px] bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold">OK</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProgress } from '@/features/progress-management/composables/useProgress';
import { useClients } from '@/features/client-management/composables/useClients';
import { useColumnResize } from '@/composables/useColumnResize';
import { useShareStatus } from '@/composables/useShareStatus';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useFieldLayout } from '@/composables/useFieldLayout';
import type { CustomFieldDef } from '@/composables/useFieldLayout';
import { progressSections, progressFieldsFlat } from '@/constants/progressFieldDefs';
import TableFilterToolbar from '@/components/TableFilterToolbar.vue';
import CustomFieldModal from '@/components/CustomFieldModal.vue';
import AddFieldModal from '@/components/AddFieldModal.vue';
import type { FilterCondition, FilterColumnDef, SortSetting, FilterResult } from '@/components/list-view/types';
import type { ViewDefWithDefaults } from '@/utils/urlFilterSync';
import {
  STATUS_OPTIONS, TYPE_OPTIONS, getLabel, getClientDisplayName,
} from '@/constants/clientOptions';
import { PROGRESS_ALL_COLUMNS, PROGRESS_FILTER_COLUMN_DEFS } from '@/constants/progressFieldDefs';
import { useRepositories } from '@/composables/useRepositories';

const { repos } = useRepositories();

const { isAdmin } = useCurrentUser();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全社共通フィールド管理・レイアウト管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 管理モード（排他制御: null=通常, 'field'=フィールド管理, 'layout'=レイアウト管理） */
const pgAdminMode = ref<'field' | 'layout' | null>(null);

/** 管理モード切替（排他制御） */
const togglePgAdminMode = (mode: 'field' | 'layout') => {
  if (pgAdminMode.value === mode) {
    pgAdminMode.value = null;
    if (mode === 'field') {
      showPgFieldModal.value = false;
    }
  } else {
    if (mode === 'field') {
      pgAdminMode.value = mode;
      showPgFieldModal.value = true;
    } else {
      router.push({ name: 'ProgressLayout' });
      pgAdminMode.value = null;
    }
  }
};

/** フィールドレイアウト管理（全社共通） */
const pgFieldLayout = useFieldLayout('progress', progressSections, progressFieldsFlat);
pgFieldLayout.loadLayout();

// カスタムフィールド復元
for (const def of pgFieldLayout.customDefs.value) {
  pgFieldLayout.addDynamicField({
    key: def.key, label: def.label, section: def.section,
    component: def.component, widthPercent: def.widthPercent, order: def.order,
  });
}

const showPgFieldModal = ref(false);
const showPgAddFieldModal = ref(false);
const pgAddFieldDefaultSection = ref('');
const pgSectionKeys = progressSections.map(s => s.key);

/** フィールド追加ハンドラ */
const handlePgAddField = (payload: { label: string; component: import('@/types/fieldLayout').FieldComponent; section: string }) => {
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const def: CustomFieldDef = {
    key, label: payload.label, section: payload.section,
    component: payload.component, widthPercent: 20,
    order: 100 + pgFieldLayout.customDefs.value.length,
  };
  pgFieldLayout.customDefs.value = [...pgFieldLayout.customDefs.value, def];
  pgFieldLayout.addDynamicField({
    key: def.key, label: def.label, section: def.section,
    component: def.component, widthPercent: def.widthPercent, order: def.order,
  });
};

/** フィールド管理保存ハンドラ */
const handlePgFieldSave = (payload: {
  customDefs: CustomFieldDef[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
  deletedFields: string[];
  fieldOptions: Record<string, import('@/types/fieldLayout').FieldOption[]>;
}) => {
  const oldKeys = new Set(pgFieldLayout.customDefs.value.map(d => d.key));
  const newKeys = new Set(payload.customDefs.map(d => d.key));
  for (const key of oldKeys) {
    if (!newKeys.has(key)) pgFieldLayout.removeDynamicField(key);
  }
  for (const def of payload.customDefs) {
    const existing = pgFieldLayout.fields.value.find(f => f.key === def.key);
    if (existing) {
      existing.label = def.label; existing.section = def.section; existing.component = def.component;
    } else {
      pgFieldLayout.addDynamicField({
        key: def.key, label: def.label, section: def.section,
        component: def.component, widthPercent: def.widthPercent, order: def.order,
      });
    }
  }
  pgFieldLayout.customDefs.value = payload.customDefs;
  for (const key of Object.keys(pgFieldLayout.labelOverrides.value)) pgFieldLayout.removeLabelOverride(key);
  for (const [key, newLabel] of Object.entries(payload.labelOverrides)) pgFieldLayout.updateLabelOverride(key, newLabel);
  for (const key of [...pgFieldLayout.hiddenFields.value]) pgFieldLayout.toggleFieldVisibility(key, true);
  for (const key of payload.hiddenFields) pgFieldLayout.toggleFieldVisibility(key, false);
  const currentDeleted = new Set(pgFieldLayout.deletedFields.value);
  const newDeleted = new Set(payload.deletedFields);
  for (const key of payload.deletedFields) { if (!currentDeleted.has(key)) pgFieldLayout.softDeleteField(key); }
  for (const key of [...pgFieldLayout.deletedFields.value]) { if (!newDeleted.has(key)) pgFieldLayout.restoreDeletedField(key); }
  for (const [key, opts] of Object.entries(payload.fieldOptions)) {
    if (opts.length > 0) pgFieldLayout.updateFieldOptions(key, opts);
  }
  pgAdminMode.value = null;
};

/** CustomFieldModalが閉じられた時の管理モード解除 */
watch(showPgFieldModal, (v) => {
  if (!v && pgAdminMode.value === 'field') pgAdminMode.value = null;
});

const pgDefaultWidths: Record<string, number> = {
  status: 60, code: 60, companyName: 180, fiscalMonth: 60,
  staffName: 78, shareStatus: 78, receivedDate: 78, unexported: 78,
  jobStatus: 78,
  currentYear: 70, lastYear: 70,
};
const { columnWidths: pgColWidths, onResizeStart: onPgResizeStart } = useColumnResize('progress', pgDefaultWidths);

/** テーブル合計幅（列幅の総和 → table widthに動的設定） */
const pgTableWidth = computed(() => {
  const fixedW = Object.values(pgColWidths.value).reduce((sum, w) => sum + (w || 0), 0);
  const monthW = 36 * 12; // 月列は固定36px × 12
  return fixedW + monthW;
});

const { loadAll: loadShareStatus, getStatusFromCache } = useShareStatus();
onMounted(() => { loadShareStatus(); });

const router = useRouter();

const { progressRows, monthColumns, staffList: allStaff } = useProgress();
const { getStaffNameForClient } = useClients();

// 進捗管理ページ表示時にuseDocumentsの最新データを取得
import { useDocuments } from '@/composables/useDocuments';
const { refresh: refreshDocs } = useDocuments();
onMounted(async () => { await refreshDocs(); });



// ============================================================
// TableFilterToolbar用 — ビュー/フィルタ/ソート定義
// ============================================================

/** 進捗管理の全列定義 — 共有定数を使用 */
const pgAllColumns = [...PROGRESS_ALL_COLUMNS];
const pgVisibleColumns = ref<string[]>(pgAllColumns.map(c => c.key));

/** 進捗管理のビュー定義 */
const pgViews: ViewDefWithDefaults[] = [
  {
    name: 'デフォルト',
    key: 'default',
    columns: null,
    defaultFilters: [
      { field: 'clientStatus', operator: 'eq', value: 'active' },
    ],
    defaultSorts: [
      { key: 'unexported', order: 'desc' },
      { key: 'code', order: 'asc' },
    ],
  },
  {
    name: '（すべて）',
    key: 'all',
    columns: null,
    defaultFilters: [],
    defaultSorts: [{ key: 'threeCode', order: 'asc' }],
  },
];

const pgActiveViewIndex = ref(0);

/** フィルタ列定義 — 共有定数のラベルを使用し、動的選択肢を注入 */
const pgFilterColumns = computed<FilterColumnDef[]>(() =>
  PROGRESS_FILTER_COLUMN_DEFS.map(def => {
    const base: FilterColumnDef = { key: def.key, label: def.label, filterType: def.filterType };
    if ('optionsKey' in def) {
      if (def.optionsKey === 'STATUS_OPTIONS') base.filterOptions = STATUS_OPTIONS as unknown as FilterColumnDef['filterOptions'];
      else if (def.optionsKey === 'TYPE_OPTIONS') base.filterOptions = TYPE_OPTIONS as unknown as FilterColumnDef['filterOptions'];
      else if (def.optionsKey === 'dynamic_staff') base.filterOptions = allStaff.value.map(s => ({ value: s.uuid, label: s.name }));
      else if (def.optionsKey === 'dynamic_month') base.filterOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}月` }));
    }
    return base;
  })
);

/** フィルタ条件state */
const initialView = pgViews[0]!;
const pgFilterConditions = ref<FilterCondition[]>([...initialView.defaultFilters]);
const pgFilterLogic = ref<'and' | 'or'>('and');
const pgFilterSortSettings = ref<SortSetting[]>([...initialView.defaultSorts]);

/** 現在のビューのデフォルト値 */
const pgCurrentViewDefaults = computed(() => {
  const view = pgViews[pgActiveViewIndex.value] ?? pgViews[0]!;
  return { filters: view.defaultFilters, sorts: view.defaultSorts };
});

/** フィルタ適用 */
const onPgFilterApply = (result: FilterResult) => {
  pgFilterConditions.value = result.conditions;
  pgFilterLogic.value = result.logic;
  pgFilterSortSettings.value = result.sorts;
  sortKey.value = result.sorts[0]?.key ?? 'threeCode';
  sortOrder.value = result.sorts[0]?.order ?? 'asc';
};

/** フィルタ条件個別削除 */
const onPgFilterRemove = (index: number) => {
  pgFilterConditions.value.splice(index, 1);
};

/** ビュー切替 */
const onPgViewChange = (idx: number) => {
  const view = pgViews[idx] ?? pgViews[0]!;
  pgFilterConditions.value = [...view.defaultFilters];
  pgFilterSortSettings.value = [...view.defaultSorts];
  sortKey.value = view.defaultSorts[0]?.key ?? 'threeCode';
  sortOrder.value = view.defaultSorts[0]?.order ?? 'asc';
};

// --- ソート ---
// ソート: デフォルトは多段ソート（ステータス→未出力降順→受取日昇順→3コード昇順）
const sortKey = ref<string | null>(initialView.defaultSorts[0]?.key ?? 'threeCode');
const sortOrder = ref<'asc' | 'desc'>(initialView.defaultSorts[0]?.order ?? 'asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'unexported' || key === 'currentYearJournals' || key === 'lastYearJournals' || key.startsWith('month_') ? 'desc' : 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort pg-sort-icon';
  return sortOrder.value === 'asc'
    ? 'fa-solid fa-sort-up pg-sort-icon active'
    : 'fa-solid fa-sort-down pg-sort-icon active';
};

// --- フィルタ+ソート+ページネーション → API呼び出し ---
const filteredRows = ref<import('@/features/progress-management/types').ProgressRow[]>([]);
const totalCount = ref(0);
const totalPages = ref(1);
const PAGE_SIZE = 50;
const currentPage = ref(1);
const displayPages = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages;
});
const pageStartIndex = computed(() => totalCount.value === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1);
const pageEndIndex = computed(() => Math.min(currentPage.value * PAGE_SIZE, totalCount.value));
const pagedRows = computed(() => filteredRows.value);
const isLoading = ref(true);

/** サーバーからフィルタ済み・ソート済み・ページ済みリストを取得 */
async function fetchProgressList() {
  isLoading.value = true;
  try {
    const data = await repos.admin.getProgressList({
      filters: pgFilterConditions.value,
      logic: pgFilterLogic.value,
      sorts: pgFilterSortSettings.value,
      page: currentPage.value,
      pageSize: PAGE_SIZE,
    }) as { rows: typeof filteredRows.value; totalCount: number; totalPages: number };
    filteredRows.value = data.rows;
    totalCount.value = data.totalCount;
    totalPages.value = data.totalPages;
  } catch (err) {
    console.error('[MockProgressDetailPage] 進捗一覧取得失敗:', err);
    filteredRows.value = [];
    totalCount.value = 0;
    totalPages.value = 1;
  } finally {
    isLoading.value = false;
  }
}

// フィルタ・ソート・ページ変更時に自動再取得（バッチ化で二重発火防止）
let fetchPending = false;
watch(
  [pgFilterConditions, pgFilterLogic, sortKey, sortOrder, currentPage],
  () => {
    if (fetchPending) return;
    fetchPending = true;
    nextTick(() => {
      fetchPending = false;
      fetchProgressList();
    });
  },
  { immediate: true, deep: true }
);
// フィルタ変更時にページを1に戻す
watch([pgFilterConditions, pgFilterLogic], () => { currentPage.value = 1; }, { deep: true });

// KeepAliveからの復帰時にデータを再取得
onActivated(() => { fetchProgressList(); });

// ────── 全社一括未仕訳取込 ──────
const isBulkImporting = ref(false);

interface BulkImportDetail {
  clientId: string;
  companyName: string;
  added: number;
  error: string | null;
}

const bulkImportModal = ref<{
  show: boolean;
  phase: 'confirm' | 'loading' | 'done';
  icon: string;
  resultTitle: string;
  resultDetail: string;
  resultColor: string;
  details: BulkImportDetail[];
}>({
  show: false,
  phase: 'confirm',
  icon: '',
  resultTitle: '',
  resultDetail: '',
  resultColor: '',
  details: [],
});

function showBulkImportModal() {
  if (isBulkImporting.value) return;
  bulkImportModal.value = {
    show: true,
    phase: 'confirm',
    icon: '',
    resultTitle: '',
    resultDetail: '',
    resultColor: '',
    details: [],
  };
}

async function executeBulkImport() {
  isBulkImporting.value = true;
  bulkImportModal.value.phase = 'loading';

  try {
    const data = await repos.drive.pollAll();

    bulkImportModal.value.details = data.details || [];

    if (data.targetCount === 0) {
      bulkImportModal.value.icon = 'fa-solid fa-circle-info text-blue-500';
      bulkImportModal.value.resultTitle = '対象顧問先なし';
      bulkImportModal.value.resultDetail = '契約中かつDrive連携済みの顧問先がありません';
      bulkImportModal.value.resultColor = 'text-gray-600';
    } else if (data.totalAdded > 0) {
      bulkImportModal.value.icon = 'fa-solid fa-circle-check text-emerald-500';
      bulkImportModal.value.resultTitle = `${data.targetCount}社完了・${data.totalAdded}件取込`;
      bulkImportModal.value.resultDetail = data.totalErrors > 0 ? `${data.totalErrors}社でエラーが発生` : '全社正常完了';
      bulkImportModal.value.resultColor = 'text-emerald-700';
    } else if (data.totalErrors > 0) {
      bulkImportModal.value.icon = 'fa-solid fa-triangle-exclamation text-amber-500';
      bulkImportModal.value.resultTitle = `${data.totalErrors}社でエラー`;
      bulkImportModal.value.resultDetail = '詳細を確認してください';
      bulkImportModal.value.resultColor = 'text-amber-700';
    } else {
      bulkImportModal.value.icon = 'fa-solid fa-circle-info text-blue-500';
      bulkImportModal.value.resultTitle = `${data.targetCount}社確認完了`;
      bulkImportModal.value.resultDetail = '未取込のファイルはありません';
      bulkImportModal.value.resultColor = 'text-gray-600';
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    bulkImportModal.value.icon = 'fa-solid fa-circle-xmark text-red-500';
    bulkImportModal.value.resultTitle = 'エラー';
    bulkImportModal.value.resultDetail = msg;
    bulkImportModal.value.resultColor = 'text-red-700';
  } finally {
    isBulkImporting.value = false;
    bulkImportModal.value.phase = 'done';
  }
}



// --- 行クリック: 仕訳一覧へ遷移 ---
function goToJournalList(row: { clientId: string }) {
  router.push(`/journal-list/${row.clientId}`);
}
</script>

<style>
@import '@/styles/master-list.css';
@import '@/styles/progress-detail.css';

/* 全社一括取込ボタン */
.pg-bulk-import-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin-right: 8px;
}

.pg-bulk-import-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pg-bulk-import-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45);
}

.pg-bulk-import-btn:hover::before {
  opacity: 1;
}

.pg-bulk-import-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
}

.pg-bulk-import-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 9px;
  transition: transform 0.3s ease;
}

.pg-bulk-import-btn:hover .pg-bulk-import-icon {
  transform: translateY(1px);
  animation: bulkBounce 0.6s ease infinite alternate;
}

@keyframes bulkBounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(2px); }
}

.pg-bulk-import-label {
  position: relative;
  z-index: 1;
}

.pg-bulk-import-disabled {
  background: #d1d5db !important;
  box-shadow: none !important;
  cursor: wait !important;
  transform: none !important;
}

.pg-bulk-import-disabled .pg-bulk-import-icon {
  animation: none !important;
}
</style>
