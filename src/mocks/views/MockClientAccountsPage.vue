<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 勘定科目マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <router-link to="/master/clients" class="as-back-link">
            <i class="fa-solid fa-arrow-left"></i> 顧問先管理
          </router-link>
          <span class="as-header-label">顧問先用勘定科目</span>
        </div>

        <!-- 切替セレクター -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">事業形態:</span>
            <span class="as-fixed-value">{{ clientBusinessTypeLabel }}</span>
          </div>
          <div class="as-selector-group-lg" v-if="accountBusinessType === 'individual'">
            <span class="as-fixed-label">
              <i class="fa-solid" :class="accountHasRealEstate ? 'fa-square-check' : 'fa-square'" style="color:#1976D2"></i>
              不動産所得あり
            </span>
          </div>
        </div>

        <div class="as-filters">
          <input type="text" v-model="accountFilter" placeholder="科目名で絞り込み" class="as-filter-input">
          <span class="as-page-info-text">全{{ filteredAccountRows.length }}件</span>
        </div>

        <!-- 注意コメント -->
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          デフォルト科目（<i class="fa-solid fa-building-columns" style="font-size:14px;color:#1976D2"></i>）の科目名は変更できません。補助科目・表示切替は編集可能です。カスタム科目は全項目を編集できます。
        </div>

        <!-- MF名称変更警告（ルール5） -->
        <div v-if="mfWarningMessage" class="as-mf-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          {{ mfWarningMessage }}
          <button class="as-mf-warning-close" @click="mfWarningMessage = ''">&times;</button>
        </div>

        <div class="as-toolbar">
          <div class="as-pagination">
            <span class="as-page-arrow" :class="{ disabled: accountPage <= 1 }" @click="accountPage = Math.max(1, accountPage - 1)">＜</span>
            <span
              v-for="p in accountTotalPages" :key="p"
              class="as-page-num" :class="{ active: accountPage === p }"
              @click="accountPage = p"
            >{{ p }}</span>
            <span class="as-page-arrow" :class="{ disabled: accountPage >= accountTotalPages }" @click="accountPage = Math.min(accountTotalPages, accountPage + 1)">＞</span>
            <span class="as-page-range">{{ accountPageStart }}~{{ accountPageEnd }} / {{ filteredAccountRows.length }}件</span>
            <!-- チェック時の一括操作ボタン -->
            <template v-if="checkedIds.length">
              <span class="as-bulk-badge">{{ checkedIds.length }}件選択中</span>
              <button class="as-bulk-btn" @click="showChecked"><i class="fa-solid fa-eye"></i> 表示化</button>
              <button class="as-bulk-btn" @click="hideChecked"><i class="fa-solid fa-eye-slash"></i> 非表示化</button>
              <button class="as-bulk-btn danger" @click="deleteChecked"><i class="fa-solid fa-trash-can"></i> 削除（復元できません）</button>
              <button class="as-bulk-btn" @click="copyChecked"><i class="fa-solid fa-copy"></i> コピー</button>
              <button class="as-bulk-btn" @click="addAfterChecked"><i class="fa-solid fa-plus"></i> 追加</button>
            </template>
          </div>
          <div class="as-actions">
            <button class="as-action-btn" @click="resetAccountOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
            <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table">
            <colgroup>
              <col class="col-check">
              <col style="width: 22%;">
              <col style="width: 18%;">
              <col style="width: 18%;">
              <col style="width: 8%;">
              <col style="width: 10%;">
              <col style="width: 10%;">
              <col class="col-check">
            </colgroup>
            <thead>
              <tr>
                <th class="as-th-check"><input type="checkbox" @change="toggleAllChecked($event)"></th>
                <th class="sortable" @click="sortAccounts('name')">
                  勘定科目 <i :class="getSortIcon('name')"></i>
                </th>
                <th>
                  補助科目 <span class="th-help-wrap" data-tooltip="補助科目は顧問先ごとの設定で入力します。マスタでは空白です。"><i class="fa-solid fa-circle-question th-help"></i></span>
                </th>
                <th class="sortable" @click="sortAccounts('defaultTaxCategoryId')">
                  税区分 <i :class="getSortIcon('defaultTaxCategoryId')"></i>
                </th>
                <th>税区分自動選択</th>
                <th class="sortable" @click="sortAccounts('effectiveFrom')">
                  適用開始 <i :class="getSortIcon('effectiveFrom')"></i>
                </th>
                <th class="sortable" @click="sortAccounts('effectiveTo')">
                  適用終了 <i :class="getSortIcon('effectiveTo')"></i>
                </th>
                <th class="as-th-check"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in pagedAccountRows" :key="row.id"
                :class="{ 'row-deprecated': isAccountHidden(row.id), 'row-dragging': dragIdx === idx, 'row-custom': row.isCustom }"
                draggable="true"
                @dragstart="onDragStart(idx, $event)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
                @dragend="dragIdx = -1"
              >
                <td class="as-td-check"><input type="checkbox" v-model="checkedIds" :value="row.id"></td>
                <td @dblclick="row.isCustom && startEdit(row, 'name')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'name'">
                    <input class="inline-edit" v-model="editValue" @blur="commitEdit(row)" @keyup.enter="commitEdit(row)" ref="editInput" autofocus>
                  </template>
                  <template v-else>
                    <i v-if="!row.isCustom" class="fa-solid fa-building-columns td-default-icon"></i>
                    {{ row.name }}
                  </template>
                </td>
                <td class="td-sub-account"></td>
                <td>{{ row.taxDetermination === 'fixed' ? getTaxCategoryName(row.defaultTaxCategoryId) : row.taxDetermination === 'auto_sales' ? '自動選択（売上）' : '自動選択（仕入）' }}</td>
                <td class="td-ai">{{ row.taxDetermination !== 'fixed' ? '○' : '' }}</td>
                <td class="td-date">{{ row.effectiveFrom }}</td>
                <td class="td-date">{{ row.effectiveTo ?? '現役' }}</td>
                <td class="as-td-actions">
                  <i v-if="row.isCustom" class="fa-solid fa-trash-can td-delete" @click="deleteRow(row)" title="削除（復元不可）"></i>
                  <i v-if="isAccountHidden(row.id)" class="fa-solid fa-eye td-show" @click="showRow(row)" title="表示化"></i>
                  <i v-else class="fa-solid fa-eye-slash td-hide" @click="hideRow(row)" title="非表示化"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 下部ページネーション -->
        <div class="as-pagination bottom">
          <span class="as-page-arrow" :class="{ disabled: accountPage <= 1 }" @click="accountPage = Math.max(1, accountPage - 1)">＜</span>
          <span
            v-for="p in accountTotalPages" :key="'b' + p"
            class="as-page-num" :class="{ active: accountPage === p }"
            @click="accountPage = p"
          >{{ p }}</span>
          <span class="as-page-arrow" :class="{ disabled: accountPage >= accountTotalPages }" @click="accountPage = Math.min(accountTotalPages, accountPage + 1)">＞</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Account } from '@/shared/types/account';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';
import { ACCOUNT_MASTER } from '@/shared/data/account-master';
import { useClients } from '@/features/client-management/composables/useClients';
import { useClientAccounts } from '@/features/account-management/composables/useClientAccounts';

const PAGE_SIZE = 50;
const route = useRoute();
const { clients } = useClients();

// =============== 顧問先情報取得 ===============
const clientId = computed(() => {
  const match = route.path.match(/\/client\/settings\/accounts\/([^/]+)/);
  return match ? match[1] : null;
});
const currentClientData = computed(() => clients.value.find(c => c.clientId === clientId.value) ?? null);
const accountBusinessType = computed<'corp' | 'individual'>(() => currentClientData.value?.type === 'corp' ? 'corp' : 'individual');
const accountHasRealEstate = computed(() => currentClientData.value?.hasRentalIncome ?? false);
const clientBusinessTypeLabel = computed(() => accountBusinessType.value === 'corp' ? '法人' : '個人事業主');
const accountFilter = ref('');
const accountPage = ref(1);

// =============== composable接続 ===============
const clientAccountsComposable = clientId.value ? useClientAccounts(clientId.value) : null;
const accountRows: Account[] = reactive(
  clientAccountsComposable ? [...clientAccountsComposable.clientAccounts.value] : [...ACCOUNT_MASTER]
);

// composableの変更を監視してaccountRowsを同期（マスタ側の非表示変更が反映される）
if (clientAccountsComposable) {
  watch(clientAccountsComposable.clientAccounts, (newVal) => {
    accountRows.splice(0, accountRows.length, ...newVal);
  }, { deep: true });
}

/** 科目が非表示か（マスタ非表示 or 顧問先非表示） */
function isAccountHidden(accountId: string): boolean {
  if (!clientAccountsComposable) return false;
  const entry = clientAccountsComposable.clientAccounts.value.find(a => a.id === accountId);
  if (!entry) return false;
  return entry.hiddenInClient || entry.hiddenInMaster;
}

const filteredAccountRows = computed(() => {
  return accountRows.filter(row => {
    if (row.target !== 'both' && row.target !== accountBusinessType.value) return false;
    if (accountBusinessType.value === 'individual' && !accountHasRealEstate.value) {
      if (row.category === '不動産収入' || row.category === '不動産経費' || row.category === '不動産') return false;
    }
    if (accountFilter.value && !row.name.includes(accountFilter.value)) return false;
    return true;
  });
});

const accountTotalPages = computed(() => Math.max(1, Math.ceil(filteredAccountRows.value.length / PAGE_SIZE)));
const accountPageStart = computed(() => (accountPage.value - 1) * PAGE_SIZE + 1);
const accountPageEnd = computed(() => Math.min(accountPage.value * PAGE_SIZE, filteredAccountRows.value.length));
const pagedAccountRows = computed(() => filteredAccountRows.value.slice(accountPageStart.value - 1, accountPageEnd.value));

watch(filteredAccountRows, () => { if (accountPage.value > accountTotalPages.value) accountPage.value = 1; });

// =============== チェックボックス選択 ===============
const checkedIds = ref<string[]>([]);
function toggleAllChecked(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  checkedIds.value = checked ? pagedAccountRows.value.map(r => r.id) : [];
}
function hideRow(row: Account) {
  if (clientAccountsComposable) clientAccountsComposable.toggleVisibility(row.id);
}
function showRow(row: Account) {
  if (clientAccountsComposable) clientAccountsComposable.toggleVisibility(row.id);
}
function hideChecked() {
  checkedIds.value.forEach(id => {
    if (!isAccountHidden(id) && clientAccountsComposable) clientAccountsComposable.toggleVisibility(id);
  });
  checkedIds.value = [];
}
function showChecked() {
  checkedIds.value.forEach(id => {
    if (isAccountHidden(id) && clientAccountsComposable) clientAccountsComposable.toggleVisibility(id);
  });
  checkedIds.value = [];
}
function deleteRow(row: Account) {
  if (!row.isCustom) return;
  if (!confirm(`「${row.name}」を削除しますか？復元できません。`)) return;
  const idx = accountRows.findIndex(r => r.id === row.id);
  if (idx !== -1) accountRows.splice(idx, 1);
}
function deleteChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = accountRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { alert('カスタム科目のみ削除できます。'); return; }
  if (!confirm(`${customIds.length}件のカスタム科目を削除しますか？復元できません。`)) return;
  customIds.forEach(id => {
    const idx = accountRows.findIndex(r => r.id === id);
    if (idx !== -1) accountRows.splice(idx, 1);
  });
  checkedIds.value = [];
}
let copyCounter = 0;
function copyChecked() {
  // チェック行を逆順にし、各行の直下にコピーを挿入
  const ids = [...checkedIds.value];
  ids.reverse().forEach(id => {
    const srcIdx = accountRows.findIndex(r => r.id === id);
    if (srcIdx === -1) return;
    const src = accountRows[srcIdx];
    if (!src) return;
    copyCounter++;
    const copy: Account = {
      id: `${src.id}_COPY_${copyCounter}`,
      name: `${src.name}（コピー）`,
      target: src.target,
      category: src.category,
      defaultTaxCategoryId: src.defaultTaxCategoryId,
      taxDetermination: src.taxDetermination,
      deprecated: src.deprecated,
      effectiveFrom: src.effectiveFrom,
      effectiveTo: src.effectiveTo,
      sortOrder: src.sortOrder + 0.5,
      isCustom: true,
    };
    accountRows.splice(srcIdx + 1, 0, copy);
  });
  checkedIds.value = [];
}
function addAfterChecked() {
  // 最後にチェックした行の直下に新規行を挿入
  const ids = [...checkedIds.value];
  const lastId = ids[ids.length - 1];
  const insertIdx = lastId ? accountRows.findIndex(r => r.id === lastId) + 1 : accountRows.length;
  copyCounter++;
  const newRow: Account = {
    id: `NEW_${copyCounter}`,
    name: '新規科目',
    target: accountBusinessType.value === 'corp' ? 'corp' : 'individual',
    category: '経費',
    defaultTaxCategoryId: 'COMMON_EXEMPT',
    taxDetermination: 'fixed',
    deprecated: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
    sortOrder: insertIdx,
    isCustom: true,
  };
  accountRows.splice(insertIdx, 0, newRow);
  checkedIds.value = [];
}
function saveChanges() {
  alert('保存しました（モック）');
}

// =============== インライン編集 ===============
const editingRow = ref('');
const editingField = ref('');
const editValue = ref('');
const editOriginalName = ref('');
function startEdit(row: Account, field: 'name') {
  editingRow.value = row.id;
  editingField.value = field;
  editValue.value = row[field];
  editOriginalName.value = row[field];
}
const mfWarningMessage = ref('');
function commitEdit(row: Account) {
  if (editingField.value === 'name' && row) {
    row.name = editValue.value;
    if (row.isCustom && editValue.value !== editOriginalName.value) {
      mfWarningMessage.value = `⚠️ 「${editValue.value}」: この科目名を変更すると、MFインポート時に新しい勘定科目の登録または既存科目への変換を求められる可能性があります。`;
    }
  }
  editingRow.value = '';
  editingField.value = '';
}

// =============== ドラッグ並替え ===============
const dragIdx = ref(-1);
function onDragStart(idx: number, e: DragEvent) {
  dragIdx.value = idx;
  e.dataTransfer!.effectAllowed = 'move';
}
function onDragOver(_idx: number) {
  // placeholder for future hover highlight
}
function onDrop(targetIdx: number) {
  if (dragIdx.value === -1 || dragIdx.value === targetIdx) return;
  const startIdx = (accountPage.value - 1) * PAGE_SIZE;
  const srcGlobal = startIdx + dragIdx.value;
  const dstGlobal = startIdx + targetIdx;
  const removed = accountRows.splice(srcGlobal, 1);
  if (removed.length > 0) {
    accountRows.splice(dstGlobal, 0, removed[0]!);
    accountRows.forEach((r, i) => { r.sortOrder = i + 1; });
  }
  dragIdx.value = -1;
}

// =============== 共通ユーティリティ ===============
function getTaxCategoryName(id?: string): string {
  if (!id) return '';
  const found = TAX_CATEGORY_MASTER.find(tc => tc.id === id);
  return found ? found.shortName : id;
}

function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key]; const vb = b[key];
    if (typeof va === 'boolean' && typeof vb === 'boolean') return asc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
    return asc ? String(va ?? '').localeCompare(String(vb ?? ''), 'ja') : String(vb ?? '').localeCompare(String(va ?? ''), 'ja');
  });
}

const sortState = reactive({ key: '' as keyof Account | '', asc: true });

function getSortIcon(key: string) {
  if (sortState.key !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortState.asc ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

function sortAccounts(key: keyof Account) {
  if (sortState.key === key) { sortState.asc = !sortState.asc; } else { sortState.key = key; sortState.asc = true; }
  compareByKey(accountRows, key, sortState.asc);
}

function resetAccountOrder() {
  if (clientAccountsComposable) {
    clientAccountsComposable.resetToDefault();
    accountRows.splice(0, accountRows.length, ...clientAccountsComposable.clientAccounts.value);
  } else {
    accountRows.splice(0, accountRows.length, ...ACCOUNT_MASTER);
  }
  sortState.key = '';
}
</script>

<style scoped>
.account-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #333;
  background: #ffffff;
  padding: 0 16px;
  overflow: auto;
}

.as-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 12px;
}
.as-back-link {
  color: #1976D2;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.as-back-link:hover { text-decoration: underline; }
.as-header-label { color: #1976D2; font-weight: 600; }

/* ========== セレクター（中央・大きめ） ========== */
.as-selectors-center {
  display: flex; justify-content: center; align-items: center;
  gap: 24px; padding: 14px 0; border-bottom: 1px solid #f0f0f0;
}
.as-selector-group-lg { display: flex; align-items: center; gap: 10px; }
.as-selector-label-lg { font-size: 15px; color: #555; font-weight: 700; }
.as-selector-lg {
  padding: 8px 14px; font-size: 16px; border: 2px solid #ccc;
  border-radius: 6px; background: #fff; color: #333; cursor: pointer; outline: none;
  min-width: 160px;
}
.as-selector-lg:focus { border-color: #1976D2; }
.as-checkbox-label-lg {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; color: #333; cursor: pointer;
}
.as-checkbox-lg { width: 18px; height: 18px; accent-color: #1976D2; cursor: pointer; }

/* ========== フィルター等 ========== */
.as-filters { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.as-filter-input {
  border: 1px solid #ccc; border-radius: 3px; padding: 4px 8px;
  font-size: 11px; width: 200px; outline: none;
}
.as-filter-input:focus { border-color: #1976D2; }
.as-page-info-text { margin-left: auto; color: #888; font-size: 11px; }

.as-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }

/* ========== ページネーション ========== */
.as-pagination { display: flex; align-items: center; gap: 2px; font-size: 12px; }
.as-pagination.bottom { justify-content: center; padding: 8px 0 12px; }
.as-page-arrow {
  padding: 4px 10px; cursor: pointer; color: #1976D2; font-weight: 600;
  border-radius: 3px; user-select: none;
}
.as-page-arrow:hover { background: #e3f2fd; }
.as-page-arrow.disabled { color: #ccc; pointer-events: none; }
.as-page-num {
  padding: 4px 10px; cursor: pointer; border-radius: 3px; color: #555;
  min-width: 28px; text-align: center; user-select: none;
}
.as-page-num:hover { background: #e3f2fd; }
.as-page-num.active { background: #1976D2; color: white; font-weight: 600; }
.as-page-range { margin-left: 10px; color: #888; font-size: 11px; }

.as-actions { display: flex; gap: 8px; }
.as-action-btn {
  background: none; border: none; color: #1976D2;
  font-size: 11px; cursor: pointer; padding: 2px 4px;
  display: flex; align-items: center; gap: 3px;
}
.as-action-btn:hover { text-decoration: underline; }
.as-action-btn.primary { font-weight: 600; }

/* ========== テーブル ========== */
.as-table-wrap { overflow: auto; flex: 1; min-height: 0; }
.as-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #d0d7de; }
.col-check { width: 38px; }
.as-table thead { background: #e3f2fd; position: sticky; top: 0; z-index: 1; }
.as-table th {
  padding: 6px 10px; text-align: center; font-weight: 600;
  color: #555; font-size: 11px; white-space: nowrap; border: 1px solid #d0d7de;
}
.as-th-check, .as-td-check { width: 38px; text-align: center; }
.as-table td { padding: 5px 10px; border: 1px solid #e0e0e0; color: #333; }
.as-table tbody tr { cursor: grab; }
.as-table tbody tr:hover { background: #f5f9ff; }

.td-trash { color: #bbb; cursor: pointer; font-size: 12px; }
.td-trash:hover { color: #e53935; }
.td-sub-account { color: #888; font-size: 11px; }

/* カスタムツールチップ */
.th-help-wrap {
  position: relative;
  cursor: help;
}
.th-help-wrap[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  font-size: 11px;
  font-weight: 400;
  padding: 6px 10px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.18);
}
.td-ai { text-align: center; color: #1976D2; font-weight: 600; }
.td-date { text-align: center; color: #888; font-size: 10px; white-space: nowrap; }

/* deprecated行のグレーアウト（ルール3） */
.row-deprecated { opacity: 0.4; }
.row-deprecated td { text-decoration: line-through; color: #999; }

/* ドラッグ中の行 */
.row-dragging { opacity: 0.5; background: #e3f2fd; }

/* インライン編集 */
.inline-edit {
  width: 100%; border: 1px solid #1976D2; border-radius: 3px;
  padding: 2px 6px; font-size: 12px; outline: none;
  background: #fffde7;
}

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }

/* 注意コメントバナー */
.as-info-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; margin: 0 0 8px; border-radius: 4px;
  background: #e3f2fd; color: #1565c0;
  font-size: 12px; border: 1px solid #bbdefb;
}
.as-info-banner i { font-size: 14px; flex-shrink: 0; }

/* 一括操作ボタン */
.as-bulk-badge {
  display: inline-block; margin-left: 12px;
  padding: 2px 8px; border-radius: 10px;
  background: #1976D2; color: #fff;
  font-size: 11px; font-weight: 600;
}
.as-bulk-btn {
  margin-left: 4px; padding: 3px 10px; border: 1px solid #ccc;
  border-radius: 4px; background: #fff; color: #555;
  font-size: 11px; cursor: pointer; white-space: nowrap;
}
.as-bulk-btn:hover { background: #f5f5f5; border-color: #999; }
.as-bulk-btn.danger { color: #e53935; border-color: #e53935; }
.as-bulk-btn.danger:hover { background: #ffebee; }

/* 復元アイコン */
.td-restore { color: #4caf50; cursor: pointer; font-size: 12px; }
.td-restore:hover { color: #2e7d32; }

/* 非表示化アイコン（目マーク） */
.td-hide { color: #999; cursor: pointer; font-size: 14px; }
.td-hide:hover { color: #616161; }
.td-show { color: #4caf50; cursor: pointer; font-size: 14px; }
.td-show:hover { color: #2e7d32; }

/* 物理削除アイコン（ゴミ箱・カスタムのみ） */
.td-delete { color: #e53935; cursor: pointer; font-size: 14px; margin-right: 8px; }
.td-delete:hover { color: #b71c1c; }

/* アクション列 */
.as-td-actions { white-space: nowrap; text-align: center; }

/* カスタム行の背景色（薄黄） */
.row-custom { background: #fffde7; }
.row-custom:hover { background: #fff9c4; }

/* デフォルト科目のアイコン（科目名左） */
.td-default-icon { color: #1976D2; font-size: 1em; margin-right: 4px; vertical-align: middle; }

/* 固定値表示（編集不可） */
.as-fixed-value {
  font-size: 16px; font-weight: 700; color: #333;
  padding: 8px 14px; background: #f5f5f5; border: 2px solid #e0e0e0;
  border-radius: 6px; min-width: 160px; display: inline-block; text-align: center;
}
.as-fixed-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; color: #555;
}

/* MF名称変更警告バナー（ルール5） */
.as-mf-warning {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; margin: 4px 0 8px; border-radius: 4px;
  background: #fff3e0; color: #e65100;
  font-size: 12px; border: 1px solid #ffcc80;
}
.as-mf-warning i { font-size: 14px; flex-shrink: 0; color: #f57c00; }
.as-mf-warning-close {
  margin-left: auto; background: none; border: none;
  color: #e65100; font-size: 16px; cursor: pointer; padding: 0 4px;
}

/* 編集可能セル */
.td-editable { cursor: text; }
.td-editable:hover { background: #fff9c4; outline: 1px dashed #fbc02d; }
.td-edit-icon { font-size: 14px; color: #d84315; margin-right: 6px; }

/* 保存ボタン */
.as-action-btn.save {
  background: #4caf50; color: #fff; border: 1px solid #388e3c;
}
.as-action-btn.save:hover { background: #388e3c; }
</style>
