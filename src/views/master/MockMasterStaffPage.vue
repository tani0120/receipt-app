<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <div class="flex-1 overflow-auto">
      <div class="cm-settings">
        <!-- ヘッダー -->
        <div class="cm-header">
          <h1 class="cm-title">スタッフ管理</h1>
        </div>

        <!-- ツールバー -->
        <div class="cm-toolbar">
          <div class="cm-toolbar-left">
            <select v-model="statusFilter" class="cm-filter-select">
              <option value="all">全て</option>
              <option value="active">有効</option>
              <option value="inactive">停止中</option>
            </select>
            <span class="cm-page-info">全{{ filteredRows.length }}件</span>
          </div>
          <div class="cm-toolbar-right">
            <button class="cm-action-btn primary" @click="openAddPanel">
              <i class="fa-solid fa-plus"></i> 新規追加
            </button>
          </div>
        </div>

        <!-- テーブル -->
        <div class="cm-table-wrap">
          <table class="cm-table" style="table-layout: fixed;">
            <colgroup>
              <col :style="{ width: staffColWidths['status'] + 'px' }">
              <col :style="{ width: staffColWidths['uuid'] + 'px' }">
              <col :style="{ width: staffColWidths['role'] + 'px' }">
              <col :style="{ width: staffColWidths['name'] + 'px' }">
              <col :style="{ width: staffColWidths['nameRomaji'] + 'px' }">
              <col style="width: auto;">
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
                <th class="sortable" @click="sortBy('email')">
                  メールアドレス <i :class="getSortIcon('email')"></i>
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
                    <option value="active">有効</option>
                    <option value="inactive">停止中</option>
                  </select>
                  <span v-else class="cm-status-badge" :class="'status-' + row.status">
                    {{ row.status === 'active' ? '有効' : '停止中' }}
                  </span>
                </td>
                <td class="cm-uuid">{{ row.uuid }}</td>
                <!-- 権限: select -->
                <td class="td-editable" @dblclick.stop="startInlineEdit(row, 'role', $event)">
                  <select v-if="inlineEditId === row.uuid && inlineEditField === 'role'" v-model="inlineEditValue" class="cm-inline-select" @blur="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                    <option value="admin">管理者</option>
                    <option value="member">一般</option>
                  </select>
                  <span v-else class="cm-role-badge" :class="'role-' + row.role">
                    {{ row.role === 'admin' ? '管理者' : '一般' }}
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

        <!-- ページネーション -->
        <div class="cm-pagination" v-if="totalPages > 1">
          <span class="cm-page-arrow" :class="{ disabled: currentPage <= 1 }" @click="currentPage = Math.max(1, currentPage - 1)">＜</span>
          <span
            v-for="p in totalPages" :key="p"
            class="cm-page-num" :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</span>
          <span class="cm-page-arrow" :class="{ disabled: currentPage >= totalPages }" @click="currentPage = Math.min(totalPages, currentPage + 1)">＞</span>
        </div>
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
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';

// 列幅カスタマイズ
const staffDefaultWidths: Record<string, number> = {
  status: 80,
  uuid: 160,
  role: 80,
  name: 160,
  nameRomaji: 150,
};
const { columnWidths: staffColWidths, onResizeStart: onStaffResizeStart } = useColumnResize('master-staff', staffDefaultWidths);

// --- スタッフデータ（composableから取得） ---
const { addStaff, updateStaff } = useStaff();

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
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = ref(1);
const pagedRows = computed(() => filteredRows.value);
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
  const fieldLabels: Record<string, string> = { status: 'ステータス', role: '権限', name: '名前', nameRomaji: 'ローマ字', email: 'メール' };
  const label = fieldLabels[inlineEditField.value] ?? inlineEditField.value;
  markDirty(`${label}を変更`);
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
    await modal.notify({ title: '名前は必須です', variant: 'warning' });
    return;
  }
  if (!panelForm.email) {
    await modal.notify({ title: 'メールアドレスは必須です', variant: 'warning' });
    return;
  }
  if (panelMode.value === 'add' && !panelForm.password) {
    await modal.notify({ title: '新規作成時はパスワードが必須です', variant: 'warning' });
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
    await modal.notify({ title: `「${data.name}」を追加しました`, variant: 'success' });
  } else {
    updateStaff(data.uuid, data);
    await modal.notify({ title: `「${data.name}」を更新しました`, variant: 'success' });
  }
  closePanel();
  markDirty(panelMode.value === 'add' ? `「${data.name}」を追加` : `「${data.name}」を更新`);
  markClean();
  refreshList();
};

// --- 停止・復元 ---
const confirmDeactivate = async () => {
  const ok = await modal.confirm({
    title: `「${panelForm.name}」を停止しますか？`,
    message: 'スタッフデータは保持されます。再開も可能です。',
    variant: 'danger',
    confirmLabel: '停止する',
    cancelLabel: 'キャンセル',
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
</script>

<style>
@import '@/styles/master-staff.css';
</style>
