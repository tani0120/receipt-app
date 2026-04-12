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

        <!-- 切替チェックボックス（編集不可） -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">事業形態:</span>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="accountBusinessType === 'corp'" disabled class="as-checkbox-lg"><span>法人</span></label>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="accountBusinessType === 'individual' && !accountHasRealEstate" disabled class="as-checkbox-lg"><span>個人事業</span></label>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="accountBusinessType === 'individual' && accountHasRealEstate" disabled class="as-checkbox-lg"><span>個人事業(不動産所得あり)</span></label>
          </div>
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="clientTaxMethod !== 'exempt'" disabled class="as-checkbox-lg"><span>課税（本則・簡易）</span></label>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="clientTaxMethod === 'exempt'" disabled class="as-checkbox-lg"><span>免税</span></label>
          </div>
        </div>

        <div class="as-filters">
          <input type="text" v-model="accountFilter" placeholder="科目名で絞り込み" class="as-filter-input">
          <span class="as-page-info-text">全{{ filteredAccountRows.length }}件</span>
        </div>

        <!-- 注意コメント -->
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          デフォルト科目（<i class="fa-solid fa-circle-check" style="font-size:14px;color:#4caf50"></i>）の科目名は変更できません。補助科目・表示切替は編集可能です。カスタム科目は全項目を編集できます。免税・本則・簡易の税額はMF側で計算されます。
        </div>
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          簡易課税の場合、複数の事業種別があるときは売上に関する勘定科目または補助科目を分けて登録してください。（例：売上高（卸売）、売上高（小売）等）
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
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 38px;">
              <col :style="{ width: caColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: caColWidths['source'] + 'px' }">
              <col :style="{ width: caColWidths['aiSelectable'] + 'px' }">
              <col :style="{ width: caColWidths['name'] + 'px' }">
              <col :style="{ width: caColWidths['subAccount'] + 'px' }">
              <col :style="{ width: caColWidths['category'] + 'px' }">
              <col :style="{ width: caColWidths['taxDetermination'] + 'px' }">
              <col :style="{ width: caColWidths['defaultTaxCategoryId'] + 'px' }">
              <col :style="{ width: caColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: caColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="as-th-check"><input type="checkbox" @change="toggleAllChecked($event)"></th>
                <th class="th-visibility relative">MF公式
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative" style="text-align:center;font-size:11px;">出典
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('source', $event)"></div>
                </th>
                <th class="relative">税区分自動判定
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('aiSelectable', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('name')">
                  勘定科目 <i :class="getSortIcon('name')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('name', $event)"></div>
                </th>
                <th class="relative">
                  補助科目 <span class="th-help-wrap" data-tooltip="ダブルクリックで入力できます"><i class="fa-solid fa-circle-question th-help"></i></span>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('subAccount', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('category')">
                  科目分類 <i :class="getSortIcon('category')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('category', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('taxDetermination')">
                  税区分判定 <i :class="getSortIcon('taxDetermination')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('taxDetermination', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('defaultTaxCategoryId')">
                  デフォルト税区分 <i :class="getSortIcon('defaultTaxCategoryId')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('defaultTaxCategoryId', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveFrom')">
                  適用開始 <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveTo')">
                  適用終了 <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('effectiveTo', $event)"></div>
                </th>
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
                <td class="td-visibility">
                  <i v-if="row.isCustom" class="fa-solid fa-trash-can td-delete" @click="deleteRow(row)" title="削除（復元不可）"></i>
                  <i v-if="isAccountHidden(row.id)" class="fa-solid fa-eye td-show" @click="showRow(row)" title="表示化"></i>
                  <i v-else class="fa-solid fa-eye-slash td-hide" @click="hideRow(row)" title="非表示化"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.isCustom && !isMasterCustomAccount(row.id)" style="color:#E65100;">顧問先独自</span>
                  <span v-else-if="isMasterCustomAccount(row.id)" style="color:#1976D2;"><i class="fa-solid fa-building-columns" style="font-size:12px;"></i> マスタ（カスタム）</span>
                  <span v-else><i class="fa-solid fa-building-columns" style="color:#1976D2;font-size:12px;"></i> マスタ</span>
                </td>
                <td class="td-ai" @dblclick="row.isCustom && startEdit(row, 'aiDetermination')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'aiDetermination'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <template v-if="getAllowedTaxDeterminations(row).length > 1">
                        <option value="true">○</option>
                        <option value="false"></option>
                      </template>
                      <template v-else>
                        <option value="false"></option>
                      </template>
                    </select>
                  </template>
                  <template v-else>{{ getDisplayAiDet(row) }}</template>
                </td>
                <td @dblclick="row.isCustom && startEdit(row, 'name')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'name'">
                    <input class="inline-edit" v-model="editValue" @blur="commitEdit(row)" @keyup.enter="commitEdit(row)" ref="editInput" autofocus>
                  </template>
                  <template v-else>
                    <i v-if="!row.isCustom" class="fa-solid fa-circle-check td-mf-ok"></i>
                    {{ row.name }}
                  </template>
                </td>
                <td @dblclick="startEdit(row, 'subAccount')" class="td-sub-account td-editable">
                  <template v-if="editingRow === row.id && editingField === 'subAccount'">
                    <input class="inline-edit" v-model="editValue" @blur="commitEdit(row)" @keyup.enter="commitEdit(row)" autofocus>
                  </template>
                  <template v-else>{{ (row as any).subAccount ?? '' }}</template>
                </td>
                <!-- 科目分類 -->
                <td @dblclick="row.isCustom && startEdit(row, 'category')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'category'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <optgroup v-for="g in categoryGroups" :key="g.label" :label="g.label">
                        <option v-for="c in g.items" :key="c" :value="c">{{ c }}</option>
                      </optgroup>
                    </select>
                  </template>
                  <template v-else>{{ row.category }}</template>
                </td>
                <!-- 税区分判定 -->
                <td @dblclick="row.isCustom && startEdit(row, 'taxDetermination')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'taxDetermination'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <option v-for="td in getAllowedTaxDeterminations(row)" :key="td" :value="td">{{ taxDetLabel(td) }}</option>
                    </select>
                  </template>
                  <template v-else>{{ getDisplayTaxDet(row) }}</template>
                </td>
                <!-- デフォルト税区分 -->
                <td @dblclick="row.isCustom && startEdit(row, 'defaultTaxCategoryId')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'defaultTaxCategoryId'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <option v-for="tc in filteredTaxCategories(row.category)" :key="tc.id" :value="tc.id">{{ tc.shortName }}</option>
                    </select>
                  </template>
                  <template v-else>{{ getDisplayDefaultTax(row) }}</template>
                </td>
                <td class="td-date">{{ row.effectiveFrom }}</td>
                <td class="td-date">{{ row.effectiveTo ?? '現役' }}</td>
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
import { ref, reactive, computed, watch, nextTick } from 'vue';

import type { Account } from '@/shared/types/account';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useClients } from '@/features/client-management/composables/useClients';
import { getInitialCopyCounter } from '@/shared/utils/copy-utils';
import { useColumnResize } from '@/mocks/composables/useColumnResize';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';

// 列幅カスタマイズ
const caDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  source: 70,
  aiSelectable: 80,
  name: 140,
  subAccount: 100,
  category: 100,
  taxDetermination: 100,
  defaultTaxCategoryId: 120,
  effectiveFrom: 80,
  effectiveTo: 80,
};
const { columnWidths: caColWidths, onResizeStart: onCaResizeStart } = useColumnResize('client-accounts', caDefaultWidths);

const props = defineProps<{ clientId: string }>();

const PAGE_SIZE = 50;
const { clients } = useClients();

// =============== 顧問先情報取得 ===============
const clientId = computed(() => props.clientId);
const currentClientData = computed(() => clients.value.find(c => c.clientId === clientId.value) ?? null);
const accountBusinessType = computed<'corp' | 'individual'>(() => currentClientData.value?.type === 'corp' ? 'corp' : 'individual');
const accountHasRealEstate = computed(() => currentClientData.value?.hasRentalIncome ?? false);
const clientTaxMethod = computed<'general' | 'simplified' | 'exempt'>(() => currentClientData.value?.consumptionTaxMode ?? 'general');

// =============== composable接続（useAccountSettings経由） ===============
// clientIdはprops経由で必須。defineProps<{ clientId: string }>()で型安全。
const settings = useAccountSettings('client', props.clientId);
const accountFilter = ref('');
const accountPage = ref(1);

// =============== composable接続 ===============
const accountRows: Account[] = reactive(
  [...settings.accounts.value]
);

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges);

// subAccountをlocalStorageから復元
if (clientId.value) {
  try {
    const raw = localStorage.getItem('sugu-suru:client-accounts:' + clientId.value);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.subAccounts) {
        accountRows.forEach(r => {
          if (saved.subAccounts[r.id]) {
            (r as Record<string, unknown>).subAccount = saved.subAccounts[r.id];
          }
        });
      }
    }
  } catch { /* 破損データは無視 */ }
}

// composableの変更を監視して非表示フラグのみ同期（順序は維持）
if (clientId.value) {
  watch(settings.accounts, (newVal) => {
    const today = new Date().toISOString().slice(0, 10);
    accountRows.forEach(row => {
      const unified = newVal.find(a => a.id === row.id);
      if (unified) {
        const isHidden = unified.hidden;
        if (isHidden && !row.deprecated) {
          row.effectiveTo = row.effectiveTo ?? today;
          row.deprecated = true;
        } else if (!isHidden && row.deprecated) {
          row.effectiveTo = null;
          row.deprecated = false;
        }
      }
    });
  }, { deep: true, immediate: true });
}

/** 科目が非表示か（マスタ非表示 or 顧問先非表示） */
function isAccountHidden(accountId: string): boolean {
  return settings.isAccountHidden(accountId);
}

/** マスタレベルで追加されたカスタム科目か */
function isMasterCustomAccount(accountId: string): boolean {
  const entry = settings.accounts.value.find(a => a.id === accountId);
  return entry ? entry.isMasterCustom : false;
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
  const id = row.id;
  const today = new Date().toISOString().slice(0, 10);
  if (clientId.value) {
    settings.toggleAccountVisibility(id);
  }
  // watch発火後のaccountRowsから対象を再取得して更新
  nextTick(() => {
    const target = accountRows.find(r => r.id === id);
    if (target) { target.effectiveTo = today; target.deprecated = true; }
  });
}
function showRow(row: Account) {
  const id = row.id;
  if (clientId.value) {
    settings.toggleAccountVisibility(id);
  }
  nextTick(() => {
    const target = accountRows.find(r => r.id === id);
    if (target) { target.effectiveTo = null; target.deprecated = false; }
  });
}
function hideChecked() {
  const today = new Date().toISOString().slice(0, 10);
  const ids = [...checkedIds.value];
  ids.forEach(id => {
    if (!isAccountHidden(id) && clientId.value) settings.toggleAccountVisibility(id);
  });
  nextTick(() => {
    ids.forEach(id => {
      const row = accountRows.find(r => r.id === id);
      if (row) { row.effectiveTo = today; row.deprecated = true; }
    });
  });
  checkedIds.value = [];
  markDirty();
}
function showChecked() {
  const ids = [...checkedIds.value];
  ids.forEach(id => {
    if (isAccountHidden(id) && clientId.value) settings.toggleAccountVisibility(id);
  });
  nextTick(() => {
    ids.forEach(id => {
      const row = accountRows.find(r => r.id === id);
      if (row) { row.effectiveTo = null; row.deprecated = false; }
    });
  });
  checkedIds.value = [];
  markDirty();
}
function deleteRow(row: Account) {
  if (!row.isCustom) return;
  if (!confirm(`「${row.name}」を削除しますか？復元できません。`)) return;
  const idx = accountRows.findIndex(r => r.id === row.id);
  if (idx !== -1) accountRows.splice(idx, 1);
  markDirty();
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
  markDirty();
}
let copyCounter = getInitialCopyCounter(accountRows);
function copyChecked() {
  if (!checkedIds.value.length) return;
  if (!confirm(`${checkedIds.value.length}件の科目をコピーしますか？`)) return;
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
      accountGroup: src.accountGroup,
      category: src.category,
      defaultTaxCategoryId: src.defaultTaxCategoryId,
      taxDetermination: src.taxDetermination,
      deprecated: src.deprecated,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      sortOrder: src.sortOrder + 0.5,
      isCustom: true,
      insertAfter: src.id,
    };
    accountRows.splice(srcIdx + 1, 0, copy);
  });
  checkedIds.value = [];
  markDirty();
}
function addAfterChecked() {
  if (!confirm('新規科目を追加しますか？')) return;
  // 最後にチェックした行の直下に新規行を挿入
  const ids = [...checkedIds.value];
  const lastId = ids[ids.length - 1];
  const insertIdx = lastId ? accountRows.findIndex(r => r.id === lastId) + 1 : accountRows.length;
  copyCounter++;
  const newRow: Account = {
    id: `NEW_${copyCounter}`,
    name: '新規科目',
    target: accountBusinessType.value === 'corp' ? 'corp' : 'individual',
    accountGroup: 'PL_EXPENSE',
    category: '経費',
    defaultTaxCategoryId: 'COMMON_EXEMPT',
    taxDetermination: 'fixed',
    deprecated: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
    sortOrder: insertIdx,
    isCustom: true,
    insertAfter: lastId ?? accountRows[accountRows.length - 1]?.id,
  };
  accountRows.splice(insertIdx, 0, newRow);
  checkedIds.value = [];
  markDirty();
}
function saveChanges() {
  if (!clientId.value) { alert('顧問先IDが不明です'); return; }
  // subAccount情報を全行から収集
  const subAccounts: Record<string, string> = {};
  accountRows.forEach(r => {
    const sub = (r as Record<string, unknown>).subAccount;
    if (sub) subAccounts[r.id] = sub as string;
  });
  // settings経由で保存（overrides refも同時に更新される）
  settings.saveAccounts(accountRows, subAccounts);
  markClean();
  alert('保存しました — 変更はlocalStorageに永続化済み');
}

// =============== インライン編集 ===============
const editingRow = ref('');
const editingField = ref('');
const editValue = ref('');
const editOriginalName = ref('');

type AccountEditField = 'name' | 'category' | 'taxDetermination' | 'defaultTaxCategoryId' | 'subAccount' | 'aiDetermination';

function startEdit(row: Account, field: AccountEditField) {
  if (field !== 'subAccount' && !row.isCustom) {
    alert('デフォルト科目は編集できません。コピーしてから編集してください。');
    return;
  }
  editingRow.value = row.id;
  editingField.value = field;
  switch (field) {
    case 'name': editValue.value = row.name; editOriginalName.value = row.name; break;
    case 'category': editValue.value = row.category; break;
    case 'taxDetermination': editValue.value = row.taxDetermination; break;
    case 'defaultTaxCategoryId': editValue.value = row.defaultTaxCategoryId ?? ''; break;
    case 'subAccount': editValue.value = (row as Record<string, unknown>).subAccount as string ?? ''; break;
    case 'aiDetermination': editValue.value = String(row.taxDetermination !== 'fixed'); break;
  }
}

const mfWarningMessage = ref('');
function commitEdit(row: Account) {
  switch (editingField.value) {
    case 'name':
      if (!editValue.value.trim()) { alert('科目名は空にできません。'); return; }
      row.name = editValue.value;
      if (row.isCustom && editValue.value !== editOriginalName.value) {
        mfWarningMessage.value = `⚠️ 「${editValue.value}」: この科目名を変更すると、MFインポート時に新しい勘定科目の登録または既存科目への変換を求められる可能性があります。`;
      }
      break;
    case 'category':
      row.category = editValue.value;
      // category変更時にaccountGroup・taxDetermination・defaultTaxCategoryIdを自動設定
      row.accountGroup = getCategoryAccountGroup(editValue.value);
      if (SALES_CATEGORIES.includes(editValue.value)) {
        row.taxDetermination = 'auto_sales';
        row.defaultTaxCategoryId = 'SALES_TAXABLE_10';
      } else if (PURCHASE_CATEGORIES.includes(editValue.value)) {
        row.taxDetermination = 'auto_purchase';
        row.defaultTaxCategoryId = 'PURCHASE_TAXABLE_10';
      } else {
        row.taxDetermination = 'fixed';
        row.defaultTaxCategoryId = 'COMMON_EXEMPT';
      }
      break;
    case 'taxDetermination':
      row.taxDetermination = editValue.value as 'auto_purchase' | 'auto_sales' | 'fixed';
      break;
    case 'defaultTaxCategoryId':
      row.defaultTaxCategoryId = editValue.value;
      break;
    case 'subAccount':
      (row as Record<string, unknown>).subAccount = editValue.value;
      break;
    case 'aiDetermination':
      if (editValue.value === 'true') {
        if (row.taxDetermination === 'fixed') {
          const dir = getCategoryDirection(row.category);
          row.taxDetermination = dir === 'sales' ? 'auto_sales' : 'auto_purchase';
        }
      } else {
        row.taxDetermination = 'fixed';
      }
      break;
  }
  markDirty();
  cancelEdit();
}

function cancelEdit() {
  editingRow.value = '';
  editingField.value = '';
}

// =============== categoryグループ分類 ===============
import type { AccountGroup } from '@/shared/types/account';

const SALES_CATEGORIES = ['売上', '不動産収入', '営業外収益', '特別利益'];
const PURCHASE_CATEGORIES = ['経費', '売上原価', '販管費', '不動産経費', '営業外費用', '繰入額等', '特別損失'];
const BS_ASSET_CATEGORIES = [
  '現金及び預金', '売上債権', '有価証券', 'その他流動資産', '有形固定資産',
  '無形固定資産', '投資その他', '棚卸資産', '繰延資産',
];
const BS_LIABILITY_CATEGORIES = ['仕入債務', 'その他流動負債', '固定負債'];
const BS_EQUITY_CATEGORIES = ['純資産', '事業主貸', '事業主借', '資本の部', '諸口'];
const OTHER_PL_CATEGORIES = ['繰戻額等'];

// BS_ASSET内でauto_purchaseを許可する中分類（資産取得の課税仕入）
const BS_ASSET_PURCHASE_CATEGORIES = ['有形固定資産', '無形固定資産'];

const categoryGroups = [
  { label: 'PL収益', items: SALES_CATEGORIES },
  { label: 'PL費用', items: PURCHASE_CATEGORIES },
  { label: 'BS資産', items: BS_ASSET_CATEGORIES },
  { label: 'BS負債', items: BS_LIABILITY_CATEGORIES },
  { label: 'BS純資産', items: BS_EQUITY_CATEGORIES },
  { label: 'PLその他', items: OTHER_PL_CATEGORIES },
];

/** categoryからaccountGroupを導出 */
function getCategoryAccountGroup(category: string): AccountGroup {
  if (SALES_CATEGORIES.includes(category)) return 'PL_REVENUE';
  if (PURCHASE_CATEGORIES.includes(category) || OTHER_PL_CATEGORIES.includes(category)) return 'PL_EXPENSE';
  if (BS_ASSET_CATEGORIES.includes(category)) return 'BS_ASSET';
  if (BS_LIABILITY_CATEGORIES.includes(category)) return 'BS_LIABILITY';
  if (BS_EQUITY_CATEGORIES.includes(category)) return 'BS_EQUITY';
  return 'PL_EXPENSE';
}

/** 科目の大分類+中分類に基づいて許可されるtaxDetermination値を返す */
function getAllowedTaxDeterminations(row: Account): string[] {
  // 免税事業者: 全科目 fixed のみ
  if (clientTaxMethod.value === 'exempt') return ['fixed'];
  const group = row.accountGroup;
  if (group === 'PL_REVENUE') return ['auto_sales', 'fixed'];
  if (group === 'PL_EXPENSE') return ['auto_purchase', 'fixed'];
  if (group === 'BS_ASSET' && BS_ASSET_PURCHASE_CATEGORIES.includes(row.category)) {
    return ['auto_purchase', 'fixed'];
  }
  return ['fixed'];
}



/** 課税方式に応じた「税区分自動判定」列の表示値 */
function getDisplayAiDet(row: Account): string {
  if (clientTaxMethod.value === 'exempt') return '';
  return row.taxDetermination !== 'fixed' ? '○' : '';
}

/** 課税方式に応じた「税区分判定」列の表示値 */
function getDisplayTaxDet(row: Account): string {
  if (clientTaxMethod.value === 'exempt') return '固定';
  return taxDetLabel(row.taxDetermination);
}

/** 課税方式に応じた「デフォルト税区分」列の表示値 */
function getDisplayDefaultTax(row: Account): string {
  if (clientTaxMethod.value === 'exempt') return '対象外';
  return getTaxCategoryName(row.defaultTaxCategoryId);
}

function getCategoryDirection(category: string): 'sales' | 'purchase' | 'common' {
  if (SALES_CATEGORIES.includes(category)) return 'sales';
  if (PURCHASE_CATEGORIES.includes(category)) return 'purchase';
  return 'common';
}

function filteredTaxCategories(category: string) {
  const dir = getCategoryDirection(category);
  return settings.filteredTaxCategories(dir);
}

function taxDetLabel(td: string): string {
  switch (td) {
    case 'auto_purchase': return '自動(仕入)';
    case 'auto_sales': return '自動(売上)';
    case 'fixed': return '固定';
    default: return td;
  }
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
    markDirty();
  }
  dragIdx.value = -1;
}

// =============== 共通ユーティリティ ===============
function getTaxCategoryName(id?: string): string {
  if (!id) return '';
  return settings.resolveTaxCategoryShortName(id);
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
  // sortOrderでソート（初期ロードと同じ並び順に復元）
  accountRows.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
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
.inline-select {
  padding: 2px 4px; font-size: 11px;
  border: 1px solid #1976D2; border-radius: 3px;
  outline: none; background: #fff; cursor: pointer;
  max-width: 100%;
}
.inline-select:focus { box-shadow: 0 0 0 2px rgba(25,118,210,0.2); }

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
.as-info-simplified {
  background: #fff8e1; border-color: #ffca28; color: #5d4037;
}
.td-simplified-ref {
  opacity: 0.5;
  background: #f5f5f5 !important;
}

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

/* 表示/削除列（左2番目） */
.td-visibility { white-space: nowrap; text-align: center; }
.th-visibility { font-size: 11px; text-align: center; white-space: nowrap; }

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

/* リサイズハンドル */
.resize-handle {
  position: absolute; top: 0; right: 0; width: 4px; height: 100%;
  cursor: col-resize; background: transparent; transition: background 0.15s; z-index: 2;
}
.resize-handle:hover { background: #1976D2; }
</style>
