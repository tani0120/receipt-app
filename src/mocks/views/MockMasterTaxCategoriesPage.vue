<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">税区分マスタ（事務所共通）</span>
        </div>

        <!-- 課税方式切替（排他選択） -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="general" class="as-checkbox-lg"><span>本則</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="simplified" class="as-checkbox-lg"><span>簡易</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="exempt" class="as-checkbox-lg"><span>免税</span></label>
          </div>
        </div>

        <!-- 注意バナー -->
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          デフォルト税区分（<i class="fa-solid fa-circle-check" style="font-size:14px;color:#4caf50"></i>）の名称は編集できません。コピー・追加したカスタム税区分のみ編集可能です。
        </div>

        <div class="as-toolbar" style="margin-top: 8px;">
          <div class="as-pagination">
            <span class="as-page-arrow" :class="{ disabled: taxPage <= 1 }" @click="taxPage = Math.max(1, taxPage - 1)">＜</span>
            <span
              v-for="p in taxTotalPages" :key="p"
              class="as-page-num" :class="{ active: taxPage === p }"
              @click="taxPage = p"
            >{{ p }}</span>
            <span class="as-page-arrow" :class="{ disabled: taxPage >= taxTotalPages }" @click="taxPage = Math.min(taxTotalPages, taxPage + 1)">＞</span>
            <span class="as-page-range">{{ taxPageStart }}~{{ taxPageEnd }} / {{ filteredTaxRows.length }}件</span>
            <!-- チェック時の一括操作ボタン -->
            <template v-if="checkedIds.length">
              <span class="as-bulk-badge">{{ checkedIds.length }}件選択中</span>
              <button class="as-bulk-btn blue" @click="promoteToMfChecked"><i class="fa-solid fa-circle-check"></i> MF公式</button>
              <button class="as-bulk-btn red" @click="demoteFromMfChecked"><i class="fa-solid fa-triangle-exclamation"></i> MF非公式</button>
              <span class="as-bulk-divider"></span>
              <button class="as-bulk-btn blue" @click="showChecked"><i class="fa-solid fa-eye"></i> 表示化</button>
              <button class="as-bulk-btn red" @click="hideChecked"><i class="fa-solid fa-eye-slash"></i> 非表示化</button>
              <span class="as-bulk-divider"></span>
              <button class="as-bulk-btn red" @click="deleteChecked"><i class="fa-solid fa-trash-can"></i> 削除（復元できません）</button>
              <button class="as-bulk-btn blue" @click="copyChecked"><i class="fa-solid fa-copy"></i> コピー</button>
              <button class="as-bulk-btn blue" @click="addAfterChecked"><i class="fa-solid fa-plus"></i> 追加</button>
            </template>
          </div>
          <div class="as-actions">
            <button class="as-action-btn" @click="resetTaxOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
            <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 38px;">
              <col :style="{ width: taxColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: taxColWidths['qualified'] + 'px' }">
              <col :style="{ width: taxColWidths['direction'] + 'px' }">
              <col style="width: auto;">
              <col :style="{ width: taxColWidths['rate'] + 'px' }">
              <col :style="{ width: taxColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: taxColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="as-th-check"><input type="checkbox" @change="toggleAllChecked($event)"></th>
                <th class="as-th-check relative" style="text-align:center;">MF公式
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('qualified')">
                  適格判定対象 <i class="fa-solid fa-circle-question th-help" title="この税区分を使う際、取引先のインボイス登録番号の確認が必要かどうか。仕入側の課税取引にのみ○がつきます。"></i>
                  <i :class="getSortIcon('qualified')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('qualified', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('direction')">
                  取引区分 <i :class="getSortIcon('direction')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('direction', $event)"></div>
                </th>
                <th class="sortable" @click="sortTax('name')">
                  税区分 <i :class="getSortIcon('name')"></i>
                </th>
                <th class="sortable relative" @click="sortTaxByRate()">
                  税率 <i :class="getSortIcon('_rate')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('rate', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveFrom')">
                  適用開始日 <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveTo')">
                  適用終了日 <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('effectiveTo', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedTaxRows" :key="row.id"
                :class="{ 'row-deprecated': row.deprecated, 'row-custom': row.isCustom }"
              >
                <td class="as-td-check"><input type="checkbox" v-model="checkedIds" :value="row.id"></td>
                <td class="as-td-actions">
                  <span v-if="!row.isCustom" class="td-mf-badge mf-official" title="MF公式">MF公式</span>
                  <i v-else class="fa-solid fa-triangle-exclamation td-mf-unknown" title="MFインポート時に項目の紐付けが必要になる可能性があります"></i>
                </td>
                <!-- 適格判定対象 -->
                <td style="text-align: center;" @dblclick="startEdit(row, 'qualified')">
                  <template v-if="isEditing(row.id, 'qualified')">
                    <select v-model="editValue" @change="commitEdit(row, 'qualified')" @blur="cancelEdit()" class="inline-select">
                      <option value="true">○</option>
                      <option value="false"></option>
                    </select>
                  </template>
                  <template v-else>{{ row.qualified ? '○' : '' }}</template>
                </td>
                <!-- 取引区分 -->
                <td class="td-direction" :class="'dir-' + row.direction" @dblclick="startEdit(row, 'direction')">
                  <template v-if="isEditing(row.id, 'direction')">
                    <select v-model="editValue" @change="commitEdit(row, 'direction')" @blur="cancelEdit()" class="inline-select" ref="editInput">
                      <option value="common">共通</option>
                      <option value="sales">売上</option>
                      <option value="purchase">仕入</option>
                    </select>
                  </template>
                  <template v-else>{{ directionLabel(row.direction) }}</template>
                </td>
                <!-- 税区分 -->
                <td @dblclick="startEdit(row, 'name')">
                  <template v-if="isEditing(row.id, 'name')">
                    <input v-model="editValue" @keydown.enter="commitEdit(row, 'name')" @blur="commitEdit(row, 'name')" class="inline-input" ref="editInput" />
                  </template>
                  <template v-else>{{ row.name }}</template>
                </td>
                <!-- 税率 -->
                <td style="text-align: center;" @dblclick="startEdit(row, 'rate')">
                  <template v-if="isEditing(row.id, 'rate')">
                    <input v-model="editValue" @input="onRateInput" @keydown.enter="commitEdit(row, 'rate')" @blur="commitEdit(row, 'rate')" class="inline-input rate-input" ref="editInput" placeholder="例: 10" />
                  </template>
                  <template v-else>{{ getRate(row) }}</template>
                </td>
                <td class="td-date">{{ row.effectiveFrom || '—' }}</td>
                <td class="td-date">{{ row.effectiveTo || '現役' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 下部ページネーション -->
        <div class="as-pagination bottom">
          <span class="as-page-arrow" :class="{ disabled: taxPage <= 1 }" @click="taxPage = Math.max(1, taxPage - 1)">＜</span>
          <span
            v-for="p in taxTotalPages" :key="'b' + p"
            class="as-page-num" :class="{ active: taxPage === p }"
            @click="taxPage = p"
          >{{ p }}</span>
          <span class="as-page-arrow" :class="{ disabled: taxPage >= taxTotalPages }" @click="taxPage = Math.min(taxTotalPages, taxPage + 1)">＞</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { TaxCategory, TaxDirection } from '@/shared/types/tax-category';
import { extractRateFromName } from '@/shared/types/tax-category';
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master';
import { getInitialCopyCounter } from '@/shared/utils/copy-utils';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useColumnResize } from '@/mocks/composables/useColumnResize';
import { useUnsavedGuard } from '@/mocks/composables/useUnsavedGuard';

// 列幅カスタマイズ
const taxDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  qualified: 80,
  direction: 80,
  rate: 60,
  effectiveFrom: 100,
  effectiveTo: 100,
};
const { columnWidths: taxColWidths, onResizeStart: onTaxResizeStart } = useColumnResize('master-tax', taxDefaultWidths);

const PAGE_SIZE = 50;

// =============== composable接続（useAccountSettings経由） ===============
const settings = useAccountSettings('master');
// テンプレート互換用のローカル参照
const masterTaxCategories = settings.taxCategories;
const taxMasterOverrides = settings._taxMasterOverrides;

// =============== 税区分マスタ ===============
type TaxMethodType = 'general' | 'simplified' | 'exempt';
const taxMethod = ref<TaxMethodType>('general');
const taxPage = ref(1);

const allTaxRows: TaxCategory[] = reactive([...masterTaxCategories.value]);

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges);

const filteredTaxRows = computed(() => {
  const isT = (id: string) => /_T[1-6]$/.test(id);
  return allTaxRows.filter(row => {
    // --- 免税 ---
    if (taxMethod.value === 'exempt') {
      return row.id === 'COMMON_EXEMPT';
    }
    // --- 簡易 ---
    if (taxMethod.value === 'simplified') {
      // active=falseでもT系（事業区分付き）は通す
      if (!row.active && !isT(row.id)) return false;
      // 事業区分なしの原則用売上を除外
      if (row.direction === 'sales' && !isT(row.id)) return false;
      // T系（事業区分付き売上）+ 仕入系 + 共通系を表示
      return isT(row.id) || row.direction === 'purchase' || row.direction === 'common';
    }
    // --- 本則 ---
    if (!row.active) return false;
    return row.defaultVisible;
  });
});

const taxTotalPages = computed(() => Math.max(1, Math.ceil(filteredTaxRows.value.length / PAGE_SIZE)));
const taxPageStart = computed(() => (taxPage.value - 1) * PAGE_SIZE + 1);
const taxPageEnd = computed(() => Math.min(taxPage.value * PAGE_SIZE, filteredTaxRows.value.length));
const pagedTaxRows = computed(() => filteredTaxRows.value.slice(taxPageStart.value - 1, taxPageEnd.value));

watch(filteredTaxRows, () => { if (taxPage.value > taxTotalPages.value) taxPage.value = 1; });

// =============== チェックボックス ===============
const checkedIds = ref<string[]>([]);
function toggleAllChecked(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  checkedIds.value = checked ? pagedTaxRows.value.map(r => r.id) : [];
}



function hideChecked() {
  const today = new Date().toISOString().slice(0, 10);
  checkedIds.value.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) { row.deprecated = true; row.effectiveTo = today; }
  });
  checkedIds.value = [];
  markDirty();
}
function promoteToMfChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { alert('カスタム税区分のみMF公式に変更できます。'); return; }
  if (!confirm(`${customIds.length}件のカスタム税区分をMF公式に変更しますか？`)) return;
  customIds.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) row.isCustom = false;
  });
  checkedIds.value = [];
  markDirty();
}
function demoteFromMfChecked() {
  const officialIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row && !row.isCustom;
  });
  if (!officialIds.length) { alert('MF公式税区分のみMF非公式に変更できます。'); return; }
  if (!confirm(`${officialIds.length}件の税区分をMF非公式に変更しますか？\nMFインポート時に項目の紐付けが必要になる可能性があります。`)) return;
  officialIds.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) row.isCustom = true;
  });
  checkedIds.value = [];
  markDirty();
}
function showChecked() {
  checkedIds.value.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) { row.deprecated = false; row.effectiveTo = null; }
  });
  checkedIds.value = [];
  markDirty();
}



function deleteChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { alert('カスタム税区分のみ削除できます。'); return; }
  if (!confirm(`${customIds.length}件のカスタム税区分を削除しますか？復元できません。`)) return;
  customIds.forEach(id => {
    const idx = allTaxRows.findIndex(r => r.id === id);
    if (idx !== -1) allTaxRows.splice(idx, 1);
  });
  checkedIds.value = [];
  markDirty();
}

// =============== コピー・追加 ===============
let copyCounter = getInitialCopyCounter(allTaxRows);
function copyChecked() {
  if (!checkedIds.value.length) return;
  if (!confirm(`${checkedIds.value.length}件の税区分をコピーしますか？`)) return;
  const ids = [...checkedIds.value];
  ids.reverse().forEach(id => {
    const srcIdx = allTaxRows.findIndex(r => r.id === id);
    if (srcIdx === -1) return;
    const src = allTaxRows[srcIdx];
    if (!src) return;
    copyCounter++;
    const copy: TaxCategory = {
      id: `${src.id}_COPY_${copyCounter}`,
      name: `${src.name}（コピー）`,
      shortName: `${src.shortName}（コピー）`,
      direction: src.direction,
      qualified: src.qualified,
      aiSelectable: src.aiSelectable,
      active: true,
      deprecated: false,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      defaultVisible: true,
      displayOrder: src.displayOrder + 0.5,
      isCustom: true,
      insertAfter: src.id,
    };
    allTaxRows.splice(srcIdx + 1, 0, copy);
  });
  checkedIds.value = [];
  markDirty();
}
function addAfterChecked() {
  if (!confirm('新規税区分を追加しますか？')) return;
  const ids = [...checkedIds.value];
  const lastId = ids[ids.length - 1];
  const insertIdx = lastId ? allTaxRows.findIndex(r => r.id === lastId) + 1 : allTaxRows.length;
  copyCounter++;
  const newRow: TaxCategory = {
    id: `NEW_TAX_${copyCounter}`,
    name: '新規税区分',
    shortName: '新規',
    direction: 'common',
    qualified: false,
    aiSelectable: false,
    active: true,
    deprecated: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
    defaultVisible: true,
    displayOrder: insertIdx,
    isCustom: true,
    insertAfter: lastId ?? allTaxRows[allTaxRows.length - 1]?.id,
  };
  allTaxRows.splice(insertIdx, 0, newRow);
  checkedIds.value = [];
  markDirty();
}

// =============== インライン編集 ===============
type EditableField = 'direction' | 'name' | 'rate' | 'qualified';
const editingRowId = ref('');
const editingFieldName = ref<EditableField | ''>('');
const editValue = ref('');

function isEditing(rowId: string, field: string): boolean {
  return editingRowId.value === rowId && editingFieldName.value === field;
}

function startEdit(row: TaxCategory, field: EditableField) {
  if (!row.isCustom) {
    alert('デフォルト税区分は編集できません。コピーしてから編集してください。');
    return;
  }
  editingRowId.value = row.id;
  editingFieldName.value = field;
  switch (field) {
    case 'direction': editValue.value = row.direction; break;
    case 'name': editValue.value = row.name; break;
    case 'rate': editValue.value = extractRateFromName(row.name).replace('%', ''); break;
    case 'qualified': editValue.value = String(row.qualified); break;
  }
}

function commitEdit(row: TaxCategory, field: EditableField) {
  switch (field) {
    case 'direction':
      row.direction = editValue.value as TaxDirection;
      break;
    case 'name':
      if (!editValue.value.trim()) { alert('税区分名は空にできません。'); return; }
      row.name = editValue.value;
      row.shortName = editValue.value;
      break;
    case 'rate': {
      // 税率を名前に反映（既存名の税率部分を置換、なければ末尾に追加）
      const rateStr = editValue.value.trim();
      if (rateStr) {
        const existing = row.name.match(/[\d.]+%/);
        if (existing) {
          row.name = row.name.replace(/[\d.]+%/, rateStr + '%');
        } else {
          row.name = row.name + ' ' + rateStr + '%';
        }
        row.shortName = row.name;
      }
      break;
    }
    case 'qualified':
      row.qualified = editValue.value === 'true';
      break;
  }
  markDirty();
  cancelEdit();
}

function cancelEdit() {
  editingRowId.value = '';
  editingFieldName.value = '';
}

function onRateInput(e: Event) {
  const input = e.target as HTMLInputElement;
  // 半角数字と小数点のみ許可
  input.value = input.value.replace(/[^0-9.]/g, '');
  editValue.value = input.value;
}

function getRate(row: TaxCategory): string {
  const rate = extractRateFromName(row.name);
  return rate || '-';
}

// =============== 保存 ===============
function saveChanges() {
  // composableのoverridesに同期 → 顧問先ページに反映
  // TAX_CATEGORY_MASTERに存在しないID = カスタム追加された行（MF準拠昇格でisCustom=falseでも保持）
  const defaultTaxIds = new Set(TAX_CATEGORY_MASTER.map(t => t.id));
  const hiddenIds = allTaxRows.filter(r => r.deprecated).map(r => r.id);
  const customTaxCategories = allTaxRows.filter(r => !defaultTaxIds.has(r.id));
  taxMasterOverrides.value = {
    hiddenIds,
    visibilityOverrides: taxMasterOverrides.value.visibilityOverrides,
    customTaxCategories,
  };
  localStorage.setItem('sugu-suru:tax-master:overrides', JSON.stringify(taxMasterOverrides.value));
  markClean();
  alert('保存しました');
}

// =============== 共通ユーティリティ ===============
function directionLabel(dir: TaxDirection): string {
  switch (dir) { case 'sales': return '売上'; case 'purchase': return '仕入'; case 'common': return '共通'; }
}

function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key]; const vb = b[key];
    if (typeof va === 'boolean' && typeof vb === 'boolean') return asc ? (va === vb ? 0 : va ? -1 : 1) : (va === vb ? 0 : va ? 1 : -1);
    return asc ? String(va ?? '').localeCompare(String(vb ?? ''), 'ja') : String(vb ?? '').localeCompare(String(va ?? ''), 'ja');
  });
}

const sortState = reactive({ key: '' as keyof TaxCategory | '' | '_rate', asc: true });

function getSortIcon(key: string) {
  if (sortState.key !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortState.asc ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

function sortTax(key: keyof TaxCategory) {
  if (sortState.key === key) { sortState.asc = !sortState.asc; } else { sortState.key = key; sortState.asc = true; }
  compareByKey(allTaxRows, key, sortState.asc);
}

function sortTaxByRate() {
  if (sortState.key === '_rate') { sortState.asc = !sortState.asc; } else { sortState.key = '_rate'; sortState.asc = true; }
  allTaxRows.sort((a, b) => {
    const pa = parseFloat(extractRateFromName(a.name));
    const pb = parseFloat(extractRateFromName(b.name));
    const ra = isNaN(pa) ? -1 : pa;
    const rb = isNaN(pb) ? -1 : pb;
    return sortState.asc ? ra - rb : rb - ra;
  });
}




function resetTaxOrder() {
  // displayOrderでソート（初期ロードと同じ並び順に復元）
  allTaxRows.sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
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

.as-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }

/* ========== ページネーション ========== */
.as-pagination { display: flex; align-items: center; gap: 2px; font-size: 12px; flex-wrap: wrap; }
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

.td-ai { text-align: center; color: #1976D2; font-weight: 600; }
.td-direction { text-align: center; font-size: 10px; font-weight: 600; }
.dir-sales { color: #2e7d32; }
.dir-purchase { color: #c62828; }
.dir-common { color: #555; }

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #d0e8fc; }
.sort-icon { font-size: 9px; margin-left: 2px; color: #1976D2; }
.sort-icon.inactive { color: #ccc; }
.th-help { color: #999; font-size: 10px; cursor: help; margin-left: 2px; }

/* 注意バナー */
.as-info-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; margin: 8px 0; border-radius: 4px;
  background: #e3f2fd; color: #1565c0;
  font-size: 12px; border: 1px solid #bbdefb;
}
.as-info-banner i { font-size: 14px; flex-shrink: 0; }

/* deprecated行のグレーアウト */
.row-deprecated { opacity: 0.4; }
.row-deprecated td { text-decoration: line-through; color: #999; }

/* カスタム行の背景色（薄黄） */
.row-custom { background: #fffde7; }
.row-custom:hover { background: #fff9c4; }

/* デフォルト行のロックアイコン（税区分名左） */
.td-lock { color: #f9a825; font-size: 1em; margin-right: 4px; vertical-align: middle; }

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

/* 保存ボタン */
.as-action-btn.save {
  background: #4caf50; color: #fff; border: 1px solid #388e3c;
  border-radius: 4px; padding: 3px 10px;
}
.as-action-btn.save:hover { background: #388e3c; }

/* インライン編集 */
.inline-input {
  width: 100%; padding: 2px 4px; font-size: 12px;
  border: 1px solid #1976D2; border-radius: 3px;
  outline: none; box-sizing: border-box;
}
.inline-input:focus { box-shadow: 0 0 0 2px rgba(25,118,210,0.2); }
.rate-input { width: 60px; text-align: center; }
.inline-select {
  padding: 2px 4px; font-size: 12px;
  border: 1px solid #1976D2; border-radius: 3px;
  outline: none; background: #fff; cursor: pointer;
}
.inline-select:focus { box-shadow: 0 0 0 2px rgba(25,118,210,0.2); }

/* 適用終了日 */
.td-date { white-space: nowrap; text-align: center; font-size: 11px; }

/* MF公式バッジ */
.td-mf-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.4;
  vertical-align: middle;
}
.td-mf-badge.mf-official {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}
/* MF非公式アイコン */
.td-mf-unknown { color: #ff9800; font-size: 14px; }

/* MF公式一括ボタン */
.as-bulk-btn.blue { color: #1976D2; border-color: #1976D2; }
.as-bulk-btn.blue:hover { background: #e3f2fd; }
/* MF非公式・削除等 */
.as-bulk-btn.red { color: #e53935; border-color: #e53935; }
.as-bulk-btn.red:hover { background: #ffebee; }
/* 仕切り線 */
.as-bulk-divider {
  display: inline-block;
  width: 1px; height: 18px;
  background: #ccc;
  margin: 0 6px;
  vertical-align: middle;
}

/* リサイズハンドル */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  z-index: 2;
}
.resize-handle:hover {
  background: #1976D2;
}
</style>
