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
                <td class="cm-email td-editable" @dblclick.stop="startInlineEdit(row, 'email', $event)">
                  <input v-if="inlineEditId === row.uuid && inlineEditField === 'email'" v-model="inlineEditValue" class="cm-inline-input" @blur="commitInlineEdit" @keydown.enter="commitInlineEdit" @keydown.escape="cancelInlineEdit" @click.stop>
                  <span v-else>{{ row.email }}</span>
                </td>
              </tr>
              <tr v-if="pagedRows.length === 0">
                <td colspan="5" class="cm-empty">該当するスタッフがいません</td>
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
import { ref, reactive, computed, nextTick } from 'vue';
import {
  useStaff,
  emptyStaffForm,
  generateStaffUuid,
} from '@/features/staff-management/composables/useStaff';
import type { Staff, StaffForm } from '@/features/staff-management/composables/useStaff';
import { useColumnResize } from '@/mocks/composables/useColumnResize';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';
import { useModalHelper } from '@/mocks/composables/useModalHelper';
import ConfirmModal from '@/mocks/components/ConfirmModal.vue';
import NotifyModal from '@/mocks/components/NotifyModal.vue';

// 列幅カスタマイズ
const staffDefaultWidths: Record<string, number> = {
  status: 80,
  uuid: 160,
  role: 80,
  name: 200,
};
const { columnWidths: staffColWidths, onResizeStart: onStaffResizeStart } = useColumnResize('master-staff', staffDefaultWidths);

// --- スタッフデータ（composableから取得） ---
const { staffList, addStaff, updateStaff } = useStaff();

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード（JSON永続化移行済み。composable経由でAPI呼び出し済み）
const { markDirty } = useUnsavedGuard(null, modal);

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

// --- フィルター＋ソート済みデータ ---
const filteredRows = computed((): Staff[] => {
  let rows = staffList.value.slice();
  if (statusFilter.value !== 'all') {
    rows = rows.filter(r => r.status === statusFilter.value);
  }
  const key = sortKey.value as keyof Staff;
  rows.sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    if (va < vb) return sortOrder.value === 'asc' ? -1 : 1;
    if (va > vb) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
});

// --- ページネーション ---
const PAGE_SIZE = 20;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(filteredRows.value.length / PAGE_SIZE));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredRows.value.slice(start, start + PAGE_SIZE);
});

// --- パネル ---
const panelMode = ref<'add' | 'edit' | null>(null);
const editingUuid = ref<string | null>(null);
const showPassword = ref(false);

// --- インライン編集 ---
const inlineEditId = ref<string | null>(null);
const inlineEditField = ref<string | null>(null);
const inlineEditValue = ref('');

const startInlineEdit = (row: Staff, field: string, event: Event) => {
  event.stopPropagation();
  inlineEditId.value = row.uuid;
  inlineEditField.value = field;
  inlineEditValue.value = (row as unknown as Record<string, string>)[field] ?? '';
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  nextTick(() => {
    const input = document.querySelector('.cm-inline-input') as HTMLInputElement;
    if (input) input.focus();
  });
};

const commitInlineEdit = () => {
  if (inlineEditId.value && inlineEditField.value) {
    // composable経由でサーバーに永続化
    updateStaff(inlineEditId.value, { [inlineEditField.value]: inlineEditValue.value } as Partial<Staff>);
  }
  markDirty();
  cancelInlineEdit();
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
  markDirty();
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

<style scoped>
.cm-settings { max-width: 1000px; margin: 0 auto; padding: 20px 24px; }
.cm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.cm-back-link { color: #3b82f6; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 4px; }
.cm-back-link:hover { text-decoration: underline; }
.cm-title { font-size: 18px; font-weight: 700; color: #1e293b; }

/* ツールバー */
.cm-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; }
.cm-toolbar-left { display: flex; align-items: center; gap: 12px; }
.cm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.cm-filter-select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; font-size: 12px; color: #334155; background: white; cursor: pointer; outline: none; }
.cm-filter-select:focus { border-color: #3b82f6; }
.cm-page-info { font-size: 12px; color: #64748b; }
.cm-action-btn { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 14px; font-size: 12px; cursor: pointer; background: white; color: #334155; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
.cm-action-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.cm-action-btn.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
.cm-action-btn.primary:hover { background: #2563eb; }

/* テーブル */
.cm-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 6px; background: white; }
.cm-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.cm-table thead th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; white-space: nowrap; user-select: none; }
.cm-table thead th.sortable { cursor: pointer; }
.cm-table thead th.sortable:hover { color: #3b82f6; }
.cm-table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: nowrap; }
.cm-table tbody tr:hover { background: #f8fafc; }
.cm-table tbody tr.row-inactive { opacity: 0.5; background: #f1f5f9; }
.cm-staff-name { font-weight: 600; }
.cm-email { color: #64748b; }
.cm-uuid { font-family: 'Menlo', monospace; font-size: 10px; color: #94a3b8; letter-spacing: 0.5px; }
.cm-empty { text-align: center; color: #94a3b8; padding: 40px 12px !important; }
.cm-sort-icon { font-size: 10px; color: #94a3b8; margin-left: 2px; }
.cm-sort-icon.active { color: #3b82f6; }

/* ステータスバッジ */
.cm-status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fee2e2; color: #991b1b; }

/* 権限バッジ */
.cm-role-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.role-admin { background: #dbeafe; color: #1e40af; }
.role-general { background: #f1f5f9; color: #64748b; }

/* ページネーション */
.cm-pagination { display: flex; justify-content: center; align-items: center; gap: 4px; margin-top: 16px; padding: 8px 0; }
.cm-page-arrow { cursor: pointer; padding: 4px 8px; color: #3b82f6; font-size: 13px; user-select: none; }
.cm-page-arrow.disabled { color: #cbd5e1; pointer-events: none; }
.cm-page-num { cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #64748b; }
.cm-page-num.active { background: #3b82f6; color: white; }

/* インライン編集 */
.cm-inline-input { width: 100%; border: 1px solid #3b82f6; border-radius: 3px; padding: 4px 6px; font-size: 12px; color: #334155; outline: none; background: #eff6ff; box-sizing: border-box; }
.cm-inline-select { width: 100%; border: 1px solid #3b82f6; border-radius: 3px; padding: 3px 4px; font-size: 12px; color: #334155; outline: none; background: #eff6ff; box-sizing: border-box; cursor: pointer; }

/* 編集可能セルホバー（accounts準拠） */
.td-editable { cursor: text; }
.td-editable:hover { background: #fff9c4; outline: 1px dashed #fbc02d; }

/* スライドインパネル */
.cm-panel-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; display: flex; justify-content: flex-end; background: rgba(0,0,0,0.15); }
.cm-panel-container { width: 440px; max-width: 90vw; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; height: 100%; }
.cm-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.cm-panel-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.cm-panel-header-actions { display: flex; align-items: center; gap: 10px; }
.cm-panel-cancel { color: #3b82f6; font-size: 13px; background: none; border: none; cursor: pointer; }
.cm-panel-cancel:hover { text-decoration: underline; }
.cm-panel-save { color: white; font-size: 13px; background: #3b82f6; border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-save:hover { background: #2563eb; }
.cm-panel-terminate-btn { color: white; font-size: 12px; background: #ef4444; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-terminate-btn:hover { background: #dc2626; }
.cm-panel-restore-btn { color: white; font-size: 12px; background: #22c55e; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.cm-panel-restore-btn:hover { background: #16a34a; }
.cm-panel-body { flex: 1; overflow-y: auto; padding: 20px; }

/* セクション */
.cm-section { margin-bottom: 24px; }
.cm-section-title { font-size: 14px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; margin-bottom: 14px; }
.cm-field { margin-bottom: 12px; }
.cm-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.cm-hint { font-weight: 400; font-size: 10px; color: #94a3b8; }
.cm-required { color: #ef4444; }
.cm-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 7px 10px; font-size: 13px; color: #334155; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.cm-input:focus { border-color: #3b82f6; }
.cm-readonly { background: #f8fafc; color: #94a3b8; font-family: 'Menlo', monospace; font-size: 11px; letter-spacing: 0.5px; }
.cm-radio-group { display: flex; align-items: center; gap: 14px; margin-top: 2px; }
.cm-radio { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #334155; cursor: pointer; }
.cm-radio input[type="radio"] { accent-color: #3b82f6; }

/* パスワード入力 */
.cm-password-wrap { position: relative; }
.cm-password-input { padding-right: 36px; }
.cm-password-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; }
.cm-password-toggle:hover { color: #64748b; }

/* 権限説明 */
.cm-permission-info { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.cm-permission-block { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background: #f8fafc; border-radius: 4px; font-size: 11px; line-height: 1.5; }
.cm-permission-role-label { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; flex-shrink: 0; margin-top: 1px; }
.cm-permission-desc { color: #64748b; }

/* スライドアニメーション */
.slide-panel-enter-active, .slide-panel-leave-active { transition: opacity 0.25s ease; }
.slide-panel-enter-active .cm-panel-container, .slide-panel-leave-active .cm-panel-container { transition: transform 0.25s ease; }
.slide-panel-enter-from { opacity: 0; }
.slide-panel-enter-from .cm-panel-container { transform: translateX(100%); }
.slide-panel-leave-to { opacity: 0; }
.slide-panel-leave-to .cm-panel-container { transform: translateX(100%); }

/* リサイズハンドル */
.resize-handle {
  position: absolute; top: 0; right: 0; width: 4px; height: 100%;
  cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2;
}
.resize-handle:hover { background: #3b82f6; }
</style>
