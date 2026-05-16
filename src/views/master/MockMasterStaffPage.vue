<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
    <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">スタッフ管理</h1>
        </div>

        <!-- ツールバー -->
        <div class="cm-toolbar">
          <div class="cm-toolbar-left">
            <select v-model="statusFilter" class="cm-filter-select">
              <option value="all">{{ FILTER_ALL_LABEL }}</option>
              <option v-for="o in STAFF_STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div class="cm-toolbar-right">
            <button class="cm-action-btn primary" @click="openAddPanel">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </div>
        </div>

        <!-- ページネーション + CSVボタン -->
        <div class="cm-pagination-row">
          <div class="cm-pagination">
            <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
            <span
              v-for="p in totalPages" :key="p"
              class="cm-page-num" :class="{ active: p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</span>
            <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
            <span class="cm-page-info">{{ staffPageStartIndex }}~{{ staffPageEndIndex }} / 全{{ staffTotalCount }}件</span>
          </div>
          <div class="cm-csv-actions">
            <div class="cm-io-dropdown" :class="{ open: importDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleImportDropdown">
                <i class="fa-solid fa-file-import"></i> インポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleStaffCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleStaffCsvImport(); importDropdownOpen = false">
                  <i class="fa-solid fa-file-excel"></i> Excel (.xlsx / .xls)
                </button>
              </div>
            </div>
            <div class="cm-io-dropdown" :class="{ open: exportDropdownOpen }" @click.stop>
              <button class="cm-admin-btn" @click="toggleExportDropdown">
                <i class="fa-solid fa-file-export"></i> エクスポート <i class="fa-solid fa-caret-down" style="font-size:10px;margin-left:2px"></i>
              </button>
              <div class="cm-io-dropdown-menu">
                <button class="cm-io-dropdown-item" @click="handleStaffCsvExport(); exportDropdownOpen = false">
                  <i class="fa-solid fa-file-csv"></i> CSV
                </button>
                <button class="cm-io-dropdown-item" @click="handleStaffExcelExport(); exportDropdownOpen = false">
                  <i class="fa-solid fa-file-excel"></i> Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table" :style="{ tableLayout: 'fixed', width: '100%', minWidth: staffTableWidth + 'px' }">
            <colgroup>
              <col :style="{ width: staffColWidths['status'] + 'px' }">
              <col :style="{ width: staffColWidths['uuid'] + 'px' }">
              <col :style="{ width: staffColWidths['role'] + 'px' }">
              <col :style="{ width: staffColWidths['name'] + 'px' }">
              <col :style="{ width: staffColWidths['nameRomaji'] + 'px' }">
              <col :style="{ width: staffColWidths['email'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="sortable relative" @click="sortBy('status')">
                  ステータス <i :class="getSortIcon('status')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('status', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('uuid')">
                  内部ID <i :class="getSortIcon('uuid')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('uuid', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('role')">
                  権限 <i :class="getSortIcon('role')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('role', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('name')">
                  名前 <i :class="getSortIcon('name')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('name', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('nameRomaji')">
                  ローマ字 <i :class="getSortIcon('nameRomaji')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('nameRomaji', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortBy('email')">
                  メールアドレス <i :class="getSortIcon('email')"></i>
                  <div class="resize-handle" @mousedown.stop="onStaffResizeStart('email', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedRows"
                :key="row.uuid"
                :class="{ 'row-inactive': row.status === 'inactive' }"
                @click="delayedOpenEditPanel(row)"
              >
                <!-- ステータス: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'status', $event)">
                  <select v-if="inlineEditId === row.uuid && inlineEditField === 'status'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option v-for="o in STAFF_STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <span v-else class="cm-status-badge" :class="'status-' + row.status">
                    {{ getLabel(STAFF_STATUS_OPTIONS, row.status) }}
                  </span>
                </td>
                <td class="cm-uuid">{{ row.uuid }}</td>
                <!-- 権限: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'role', $event)">
                  <select v-if="inlineEditId === row.uuid && inlineEditField === 'role'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option v-for="o in STAFF_PERMISSION_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <span v-else class="cm-role-badge" :class="'role-' + row.role">
                    {{ getLabel(STAFF_PERMISSION_OPTIONS, row.role) }}
                  </span>
                </td>
                <td class="cm-staff-name td-editable" @dblclick.stop="startInlineEdit(row, 'name', $event)">
                  <input v-if="inlineEditId === row.uuid && inlineEditField === 'name'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit" @keydown.enter="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.name }}</span>
                </td>
                <td class="cm-romaji td-editable" @dblclick.stop="startInlineEdit(row, 'nameRomaji', $event)">
                  <input v-if="inlineEditId === row.uuid && inlineEditField === 'nameRomaji'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit" @keydown.enter="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.nameRomaji || '—' }}</span>
                </td>
                <td class="cm-email td-editable" @dblclick.stop="startInlineEdit(row, 'email', $event)">
                  <input v-if="inlineEditId === row.uuid && inlineEditField === 'email'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit" @keydown.enter="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.email }}</span>
                </td>
              </tr>
              <tr v-if="pagedRows.length === 0">
                <td colspan="6" class="cm-empty">該当するスタッフがいません</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    <!-- スライドインパネル（追加/編集） -->
    <transition name="slide-panel">
      <div v-if="panelMode" class="cm-panel-overlay" @click.self="closePanel">
        <div class="cm-panel-container">
          <div class="cm-panel-header">
            <h2 class="cm-panel-title">{{ panelMode === 'add' ? 'スタッフを追加' : 'スタッフを編集' }}</h2>
            <div class="cm-panel-header-actions">
              <button v-if="panelMode === 'edit' && panelForm.status === 'active'" class="cm-panel-terminate-btn" @click="confirmDeactivate">
                ⛔ 停止
              </button>
              <button v-if="panelMode === 'edit' && panelForm.status === 'inactive'" class="cm-panel-restore-btn" @click="restoreStaff">
                <i class="fa-solid fa-rotate-left"></i> 有効に戻す
              </button>
              <button class="cm-panel-cancel" @click="closePanel">キャンセル</button>
              <button class="cm-panel-save" @click="saveStaff">
                <i class="fa-solid fa-save"></i> 保存
              </button>
            </div>
          </div>
          <div class="cm-panel-body">
            <!-- UUID（編集時のみ / 読み取り専用） -->
            <div v-if="panelMode === 'edit'" class="cm-section">
              <div class="cm-field">
                <label class="cm-label">担当者UUID</label>
                <input type="text" :value="editingUuid" class="cm-input cm-readonly" disabled>
              </div>
            </div>

            <!-- 基本情報セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">基本情報</h3>
              <div class="cm-field">
                <label class="cm-label">名前 <span class="cm-required">*</span></label>
                <input type="text" v-model="panelForm.name" class="cm-input" placeholder="山田 太郎">
              </div>
              <div class="cm-field">
                <label class="cm-label">ローマ字名 <span class="cm-hint">※メンション検索用</span></label>
                <input type="text" v-model="panelForm.nameRomaji" class="cm-input" placeholder="yamada taro">
              </div>
              <div class="cm-field">
                <label class="cm-label">メールアドレス <span class="cm-required">*</span> <span class="cm-hint">※ログインIDとして使用</span></label>
                <input type="email" v-model="panelForm.email" class="cm-input" placeholder="example@sugu-suru.com">
              </div>
              <div class="cm-field">
                <label class="cm-label">パスワード <span class="cm-required">*</span></label>
                <div class="cm-password-wrap">
                  <input :type="showPassword ? 'text' : 'password'" v-model="panelForm.password" class="cm-input cm-password-input" placeholder="パスワードを入力">
                  <button class="cm-password-toggle" @click="showPassword = !showPassword" type="button">
                    <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 権限セクション -->
            <div class="cm-section">
              <h3 class="cm-section-title">権限設定</h3>
              <div class="cm-field">
                <label class="cm-label">権限 <span class="cm-hint">※管理者のみ変更可能</span></label>
                <div class="cm-radio-group">
                  <label class="cm-radio"><input type="radio" v-model="panelForm.role" value="admin"><span>管理者</span></label>
                  <label class="cm-radio"><input type="radio" v-model="panelForm.role" value="general"><span>一般</span></label>
                </div>
              </div>

              <!-- 権限で何ができるかの説明 -->
              <div class="cm-permission-info">
                <div class="cm-permission-block">
                  <span class="cm-permission-role-label role-admin">管理者</span>
                  <span class="cm-permission-desc">全機能にアクセス可能（顧問先管理・スタッフ管理・マスタ管理・想定費用・設定管理）</span>
                </div>
                <div class="cm-permission-block">
                  <span class="cm-permission-role-label role-general">一般</span>
                  <span class="cm-permission-desc">上記の管理機能にはアクセス不可。仕訳一覧・アップロード・出力・学習のみ利用可能</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 確認モーダル -->
    <ConfirmModal
      :show="modal.confirmState.show"
      :title="modal.confirmState.title"
      :message="modal.confirmState.message"
      :confirm-label="modal.confirmState.confirmLabel"
      :cancel-label="modal.confirmState.cancelLabel"
      :variant="modal.confirmState.variant"
      @confirm="modal.onConfirm"
      @cancel="modal.onCancel"
    />
    <!-- 通知モーダル -->
    <NotifyModal
      :show="modal.notifyState.show"
      :title="modal.notifyState.title"
      :message="modal.notifyState.message"
      :variant="modal.notifyState.variant"
      @close="modal.onNotifyClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onActivated, reactive, computed, nextTick, watch } from 'vue';
import {
  useStaff,
  emptyStaffForm,
  generateStaffUuid,
} from '@/features/staff-management/composables/useStaff';
import type { Staff, StaffForm } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import { STAFF_STATUS_OPTIONS, STAFF_PERMISSION_OPTIONS, getLabel } from '@/constants/clientOptions';
import { FILTER_ALL_LABEL } from '@/constants/vendorOptions';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import { UI_MSG } from '@/constants/uiMessages';
import { STAFF_FIELD_LABELS } from '@/constants/fieldLabels';

// 列幅カスタマイズ
const staffDefaultWidths: Record<string, number> = {
  status: 80,
  uuid: 160,
  role: 80,
  name: 160,
  nameRomaji: 150,
  email: 250,
};
const { columnWidths: staffColWidths, onResizeStart: onStaffResizeStart } = useColumnResize('master-staff', staffDefaultWidths);

/** テーブル合計幅（列幅の総和 → table widthに動的設定） */
const staffTableWidth = computed(() => {
  return Object.values(staffColWidths.value).reduce((sum, w) => sum + (w || 0), 0);
});

// --- スタッフデータ（composableから取得） ---
const { staffList, addStaff, updateStaff } = useStaff();

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード（JSON永続化移行済み。composable経由でAPI呼び出し済み）
const { markDirty, markClean } = useUnsavedGuard(null, modal);

// --- ステータスフィルター ---
const statusFilter = ref<'all' | 'active' | 'inactive'>('active');

// --- ソート ---
const sortKey = ref<string>('uuid');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return 'fa-solid fa-sort cm-sort-icon';
  return sortOrder.value === 'asc' ? 'fa-solid fa-sort-up cm-sort-icon active' : 'fa-solid fa-sort-down cm-sort-icon active';
};

// --- サーバー側フィルタ+ソート+ページネーション（API化済み） ---
const filteredRows = ref<Staff[]>([]);
const PAGE_SIZE = 50;
const currentPage = ref(1);
const totalPages = ref(1);
const staffTotalCount = ref(0);
const pagedRows = computed(() => filteredRows.value);
const staffPageStartIndex = computed(() => staffTotalCount.value === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1);
const staffPageEndIndex = computed(() => Math.min(currentPage.value * PAGE_SIZE, staffTotalCount.value));
const isLoading = ref(false);

/** POST /api/staff/list でサーバー側でフィルタ+ソート+ページネーション */
const fetchStaffList = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/staff/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statusFilter: statusFilter.value,
        sortKey: sortKey.value,
        sortOrder: sortOrder.value,
        page: currentPage.value,
        pageSize: PAGE_SIZE,
      }),
    });
    const data = await res.json();
    filteredRows.value = data.rows;
    totalPages.value = data.totalPages;
    staffTotalCount.value = data.totalCount ?? data.rows.length;
  } catch (e) {
    console.error('[StaffPage] リスト取得失敗:', e);
  } finally {
    isLoading.value = false;
  }
};

// フィルタ・ソート・ページ変更時に自動でAPI再呼び出し（バッチ化で二重発火防止）
let fetchPending = false;
watch([statusFilter, sortKey, sortOrder, currentPage], () => {
  if (fetchPending) return;
  fetchPending = true;
  nextTick(() => {
    fetchPending = false;
    fetchStaffList();
  });
}, { immediate: true });




// KeepAliveからの復帰時にデータを再取得
onActivated(() => fetchStaffList());
// データ変更後（追加・更新・削除）にリストを再取得
const refreshList = () => fetchStaffList();


// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingUuid = ref<string | null>(null);
const showPassword = ref(false);

// --- インライン編集 ---
const inlineEditId = ref<string | null>(null);
const inlineEditField = ref<string | null>(null);
const inlineEditValue = ref('');

/** インライン編集対象フィールド（Staff型のキーに限定） */
type InlineEditableField = 'status' | 'role' | 'name' | 'nameRomaji' | 'email';

const startInlineEdit = (row: Staff, field: InlineEditableField, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.uuid;
  inlineEditField.value = field;
  inlineEditValue.value = row[field] ?? '';
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  nextTick(() => {
    const input = document.querySelector('.cm-inline-input') as HTMLInputElement;
    if (input) input.focus();
  });
};

const commitInlineEdit = () => {
  if (!inlineEditId.value || !inlineEditField.value) {
    cancelInlineEdit();
    return;
  }
  // composable経由でサーバーに永続化
  updateStaff(inlineEditId.value, { [inlineEditField.value]: inlineEditValue.value } as Partial<Staff>);
  const fieldLabels = STAFF_FIELD_LABELS;
  const label = fieldLabels[inlineEditField.value] ?? inlineEditField.value;
  markDirty(`${label}${UI_MSG.を変更}`);
  markClean();
  cancelInlineEdit();
  refreshList();
};

const cancelInlineEdit = () => {
  inlineEditId.value = null;
  inlineEditField.value = null;
  inlineEditValue.value = '';
};

const panelForm = reactive<StaffForm>(emptyStaffForm());

// --- クリック/ダブルクリック競合回避 ---
let clickTimer: ReturnType<typeof setTimeout> | null = null;

const delayedOpenEditPanel = (row: Staff) => {
  if (inlineEditId.value) return;
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    openEditPanel(row);
    clickTimer = null;
  }, 250);
};

const openAddPanel = () => {
  Object.assign(panelForm, emptyStaffForm());
  panelMode.value = 'add';
  editingUuid.value = null;
  showPassword.value = false;
};

const openEditPanel = (row: Staff) => {
  Object.assign(panelForm, {
    name: row.name,
    nameRomaji: row.nameRomaji ?? '',
    email: row.email,
    password: '',
    role: row.role,
    status: row.status,
  });
  panelMode.value = 'edit';
  editingUuid.value = row.uuid;
  showPassword.value = false;
};

const closePanel = () => {
  panelMode.value = null;
  editingUuid.value = null;
  showPassword.value = false;
};

const saveStaff = async () => {
  if (!panelForm.name) {
    await modal.notify({ title: UI_MSG.名前必須短, variant: 'warning' });
    return;
  }
  if (!panelForm.email) {
    await modal.notify({ title: UI_MSG.メールアドレス必須, variant: 'warning' });
    return;
  }
  if (panelMode.value === 'add' && !panelForm.password) {
    await modal.notify({ title: UI_MSG.パスワード必須新規, variant: 'warning' });
    return;
  }
  const uuid = editingUuid.value ?? generateStaffUuid();
  const data: Staff = {
    uuid,
    name: panelForm.name,
    nameRomaji: panelForm.nameRomaji || undefined,
    email: panelForm.email,
    role: panelForm.role,
    status: panelForm.status,
  };
  if (panelMode.value === 'add') {
    addStaff(data);
    await modal.notify({ title: `「${data.name}」${UI_MSG.を追加しました}`, variant: 'success' });
  } else {
    updateStaff(data.uuid, data);
    await modal.notify({ title: `「${data.name}」${UI_MSG.を更新しました}`, variant: 'success' });
  }
  closePanel();
  markDirty(panelMode.value === 'add' ? `「${data.name}」${UI_MSG.を追加}` : `「${data.name}」${UI_MSG.を更新}`);
  markClean();
  refreshList();
};

// --- 停止・復元 ---
const confirmDeactivate = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.name}」${UI_MSG.停止確認}`,
    message: UI_MSG.スタッフ停止補足,
    variant: 'danger',
    confirmLabel: UI_MSG.停止する,
    cancelLabel: UI_MSG.キャンセル,
  });
  if (ok) {
    panelForm.status = 'inactive';
    saveStaff();
  }
};

const restoreStaff = () => {
  panelForm.status = 'active';
  saveStaff();
};

// --- インポート / エクスポート ---
import { exportCsv, exportExcel, importCsv } from '@/composables/useCsv';
import type { CsvColumnDef } from '@/composables/useCsv';

const importDropdownOpen = ref(false);
const exportDropdownOpen = ref(false);

const staffCsvColumns: CsvColumnDef[] = [
  { key: 'status', label: 'ステータス' },
  { key: 'uuid', label: '内部ID' },
  { key: 'role', label: '権限' },
  { key: 'name', label: '名前' },
  { key: 'nameRomaji', label: '名前（ローマ字）' },
  { key: 'email', label: 'メールアドレス' },
];

const handleStaffCsvExport = () => {
  const rows = filteredRows.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportCsv(`スタッフ_${timestamp}.csv`, staffCsvColumns, rows);
};

const handleStaffExcelExport = () => {
  const rows = filteredRows.value as unknown as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);
  exportExcel(`スタッフ_${timestamp}.xlsx`, staffCsvColumns, rows);
};

const handleStaffCsvImport = async () => {
  const result = await importCsv(staffCsvColumns);
  if (!result) return;

  if (result.unmatchedHeaders.length > 0) {
    console.warn('[スタッフインポート] マッチしなかったヘッダー:', result.unmatchedHeaders);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const skipReasons: string[] = [];

  // 既存メールアドレスのセット（重複チェック用）
  const existingEmails = new Set(staffList.value.map(s => s.email?.toLowerCase()).filter(Boolean));
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i]!;
    const rowNum = i + 1;

    // --- バリデーション ---
    const name = String(row.name || '').trim();
    if (!name) {
      skipCount++;
      skipReasons.push(`行${rowNum}: 名前が空のためスキップ`);
      continue;
    }

    const email = String(row.email || '').trim();
    if (!email) {
      skipCount++;
      skipReasons.push(`行${rowNum}: メールアドレスが空のためスキップ`);
      continue;
    }
    if (!emailRegex.test(email)) {
      skipCount++;
      skipReasons.push(`行${rowNum}: メールアドレス「${email}」の形式が不正のためスキップ`);
      continue;
    }

    // --- 重複チェック ---
    if (existingEmails.has(email.toLowerCase())) {
      skipCount++;
      skipReasons.push(`行${rowNum}: メールアドレス「${email}」が既に存在するためスキップ`);
      continue;
    }

    try {
      const data: Record<string, unknown> = {
        name,
        nameRomaji: row.nameRomaji || '',
        email,
        role: row.role || 'general',
        status: row.status || 'active',
      };
      await addStaff(data as Omit<Staff, 'uuid'>);
      existingEmails.add(email.toLowerCase());
      successCount++;
    } catch (err) {
      errorCount++;
      skipReasons.push(`行${rowNum}: 保存エラー — ${err}`);
      console.error('[スタッフインポート] 保存エラー:', err);
    }
  }

  await fetchStaffList();

  const lines = [`保存: ${successCount}件`];
  if (skipCount > 0) lines.push(`スキップ: ${skipCount}件`);
  if (errorCount > 0) lines.push(`エラー: ${errorCount}件`);
  if (skipReasons.length > 0) lines.push('', ...skipReasons.slice(0, 20));

  await modal.notify({
    title: 'インポート完了',
    message: lines.join('\n'),
    variant: (errorCount > 0 || skipCount > 0) ? 'warning' : 'success',
  });
};

// --- ドロップダウン外クリック閉じ ---
const closeAllDropdowns = () => {
  importDropdownOpen.value = false;
  exportDropdownOpen.value = false;
};
const toggleImportDropdown = () => {
  exportDropdownOpen.value = false;
  importDropdownOpen.value = !importDropdownOpen.value;
};
const toggleExportDropdown = () => {
  importDropdownOpen.value = false;
  exportDropdownOpen.value = !exportDropdownOpen.value;
};

import { onMounted, onUnmounted } from 'vue';
onMounted(() => document.addEventListener('click', closeAllDropdowns));
onUnmounted(() => document.removeEventListener('click', closeAllDropdowns));
</script>

<style>
@import '@/styles/master-staff.css';
</style>
