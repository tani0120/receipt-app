<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">税区分マスタ（事務所共通）</span>
        </div>

        <!-- 課税方式切替（4種） -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="proportional" class="as-checkbox-lg"><span>原則（一括比例）</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="individual" class="as-checkbox-lg"><span>原則（個別対応）</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="simplified" class="as-checkbox-lg"><span>簡易</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="exempt" class="as-checkbox-lg"><span>免税</span></label>
          </div>
        </div>

        <!-- 注意バナー -->
        <div v-if="hasMfData" class="as-info-banner" style="background:#e3f2fd;border-color:#90caf9;color:#1565c0;">
          <i class="fa-solid fa-cloud-arrow-down"></i>
          MFで登録されている税区分をダウンロードしています。変更する場合はMF側で変更してください。
        </div>
        <div v-else class="as-info-banner">
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
            <button
              v-if="mfAuthenticated"
              class="cm-mf-import-btn"
              :disabled="mfImporting"
              @click="importFromMf"
              title="MFから税区分をインポート"
            >
              <i v-if="mfImporting" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-cloud-arrow-down"></i>
              MFインポート
            </button>
            <button v-else class="cm-mf-import-btn" disabled title="MF未連携">
              <i class="fa-solid fa-cloud"></i> MF未連携
            </button>
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
              <col :style="{ width: taxColWidths['source'] + 'px' }">
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
                <th class="as-th-check relative" style="text-align:center;">{{ hasMfData ? '表示' : 'MF公式' }}
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative" style="text-align:center;font-size:11px;">出典
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('source', $event)"></div>
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
                  <i v-if="row.deprecated" class="fa-solid fa-eye td-show" @click="showRow(row)" title="表示化"></i>
                  <i v-else class="fa-solid fa-eye-slash td-hide" @click="hideRow(row)" title="非表示化"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.source === 'mf'" style="color:#1976D2;"><MfCloudIcon :size="12" tooltip="MFクラウド" /> MF</span>
                  <span v-else-if="row.isCustom" style="color:#e65100;">カスタム</span>
                  <span v-else><i class="fa-solid fa-circle-check" style="color:#4caf50;font-size:12px;"></i> マスタ</span>
                </td>
                <!-- 適格判定対象 -->
                <td style="text-align: center;" @dblclick="startEdit(row, 'qualified')">
                  <template v-if="isEditing(row.id, 'qualified')">
                    <select v-model="editValue" @change="commitEdit(row, 'qualified')" @blur="cancelEdit()" class="inline-select">
                      <option v-for="o in QUALIFIED_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </template>
                  <template v-else>{{ row.qualified ? '○' : '' }}</template>
                </td>
                <!-- 取引区分 -->
                <td class="td-direction" :class="'dir-' + row.direction" @dblclick="startEdit(row, 'direction')">
                  <template v-if="isEditing(row.id, 'direction')">
                    <select v-model="editValue" @change="commitEdit(row, 'direction')" @blur="cancelEdit()" class="inline-select" ref="editInput">
                      <option v-for="o in TAX_DIRECTION_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </template>
                  <template v-else>{{ getLabel(TAX_DIRECTION_OPTIONS, row.direction) }}</template>
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
                <td class="td-date">{{ row.effectiveTo || UI_MSG.現役 }}</td>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { TaxCategory, TaxDirection } from '@/types/shared-tax-category';
import { extractRateFromName, guessDirectionFromName, guessQualifiedFromName } from '@/types/shared-tax-category';
import { getInitialCopyCounter } from '@/utils/copy-utils';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import { getLabel } from '@/constants/clientOptions';
import { UI_MSG } from '@/constants/uiMessages';
import { TAX_CATEGORY_FIELD_LABELS } from '@/constants/fieldLabels';
import {
  TAX_DIRECTION_OPTIONS, QUALIFIED_OPTIONS,
} from '@/constants/vendorOptions';

// 列幅カスタマイズ
const taxDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  source: 70,
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
type TaxMethodType = 'proportional' | 'individual' | 'simplified' | 'exempt';
const taxMethod = ref<TaxMethodType>('proportional');
const taxPage = ref(1);

const allTaxRows: TaxCategory[] = reactive(
  masterTaxCategories.value.map(({ hidden, hiddenInMaster, visibilityOverride, source, ...rest }) => ({
    ...rest,
    deprecated: hidden,
  }))
);

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);
const hasMfData = computed(() => allTaxRows.some(r => r.source === 'mf'));

import { onMounted } from 'vue';
onMounted(async () => {
  try {
    // 任意の顧問先IDでMF認証状態を確認
    const res = await fetch('/api/mf/auth/status?clientId=c_wTdnMKDO');
    const data = await res.json();
    mfAuthenticated.value = data.authenticated ?? false;
  } catch {
    mfAuthenticated.value = false;
  }
});

/** MFから税区分を取得して全社マスタを更新 */
async function importFromMf() {
  if (mfImporting.value) return;
  mfImporting.value = true;
  try {
    const res = await fetch('/api/mf/taxes?clientId=c_wTdnMKDO');
    if (!res.ok) throw new Error('MF税区分取得失敗');
    const data = await res.json();
    const mfTaxes = data.taxes ?? [];

    const imported: TaxCategory[] = mfTaxes.map((t: { id: string; name: string; abbreviation?: string; available: boolean; tax_rate?: number }, idx: number) => {
      const dir = guessDirectionFromName(t.name);
      return {
        id: 'MF_' + t.name.replace(/\s+/g, '_').replace(/[()\uff08\uff09]/g, '').replace(/-/g, '_').replace(/%/g, 'PCT').replace(/\./g, 'D'),
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: dir,
        qualified: guessQualifiedFromName(t.name, dir),
        aiSelectable: true,
        active: true,
        deprecated: false,
        effectiveFrom: '2019-10-01',
        effectiveTo: null,
        defaultVisible: true,
        source: 'mf' as const,
        mfId: t.id,
        displayOrder: idx + 1,
      };
    });

    // 全社マスタを置換
    allTaxRows.splice(0, allTaxRows.length, ...imported);
    markDirty('MFから税区分を取込');
    await modal.notify({ title: `MFから${imported.length}件の税区分を取込みました`, variant: 'success' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await modal.notify({ title: `MFインポート失敗: ${msg}`, variant: 'warning' });
  } finally {
    mfImporting.value = false;
  }
}

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);

const filteredTaxRows = computed(() => {
  const isT = (id: string) => /_T[1-6]$/.test(id);
  return allTaxRows.filter(row => {
    // --- 免税 ---
    // 免税事業者は消費税区分不要。direction='common'（「対象外」「不明」）のみ表示。
    if (taxMethod.value === 'exempt') {
      return row.direction === 'common';
    }
    // --- 簡易 ---
    if (taxMethod.value === 'simplified') {
      if (!row.active && !isT(row.id)) return false;
      if (row.direction === 'sales' && !isT(row.id)) return false;
      return isT(row.id) || row.direction === 'purchase' || row.direction === 'common';
    }
    // --- 原則（個別対応） ---
    if (taxMethod.value === 'individual') {
      if (!row.active) return false;
      return true; // 共通課税仕入/非課税対応仕入も表示
    }
    // --- 原則（一括比例） ---
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

// =============== 非表示化・表示化 ===============
function hideRow(row: TaxCategory) {
  const today = new Date().toISOString().slice(0, 10);
  row.deprecated = true;
  row.effectiveTo = today;
}
function showRow(row: TaxCategory) {
  row.deprecated = false;
  row.effectiveTo = null;
}



function hideChecked() {
  const today = new Date().toISOString().slice(0, 10);
  checkedIds.value.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) { row.deprecated = true; row.effectiveTo = today; }
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分非表示);
}
async function promoteToMfChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { await modal.notify({ title: UI_MSG.カスタム税区分のみMF公式, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${customIds.length}${UI_MSG.税区分MF公式変更}` });
  if (!ok) return;
  customIds.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) row.isCustom = false;
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分MF公式);
}
async function demoteFromMfChecked() {
  const officialIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row && !row.isCustom;
  });
  if (!officialIds.length) { await modal.notify({ title: UI_MSG.MF公式税区分のみMF非公式, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${officialIds.length}${UI_MSG.税区分MF非公式変更}`, message: UI_MSG.MF非公式警告, variant: 'danger' });
  if (!ok) return;
  officialIds.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) row.isCustom = true;
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分MF非公式);
}
function showChecked() {
  checkedIds.value.forEach(id => {
    const row = allTaxRows.find(r => r.id === id);
    if (row) { row.deprecated = false; row.effectiveTo = null; }
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分表示);
}



async function deleteChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = allTaxRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { await modal.notify({ title: UI_MSG.カスタム税区分のみ, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${customIds.length}${UI_MSG.税区分削除確認}`, message: UI_MSG.復元不可, variant: 'danger' });
  if (!ok) return;
  customIds.forEach(id => {
    const idx = allTaxRows.findIndex(r => r.id === id);
    if (idx !== -1) allTaxRows.splice(idx, 1);
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分削除);
}

// =============== コピー・追加 ===============
let copyCounter = getInitialCopyCounter(allTaxRows);
async function copyChecked() {
  if (!checkedIds.value.length) return;
  const ok = await modal.confirm({ title: `${checkedIds.value.length}${UI_MSG.税区分コピー確認}` });
  if (!ok) return;
  const ids = [...checkedIds.value];
  ids.reverse().forEach(id => {
    const srcIdx = allTaxRows.findIndex(r => r.id === id);
    if (srcIdx === -1) return;
    const src = allTaxRows[srcIdx];
    if (!src) return;
    copyCounter++;
    const copy: TaxCategory = {
      id: `${src.id}_COPY_${copyCounter}`,
      name: `${src.name}${UI_MSG.コピー接尾}`,
      shortName: `${src.shortName}${UI_MSG.コピー接尾}`,
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
  markDirty(UI_MSG.税区分コピー);
}
async function addAfterChecked() {
  const ok = await modal.confirm({ title: UI_MSG.税区分追加確認 });
  if (!ok) return;
  const ids = [...checkedIds.value];
  const lastId = ids[ids.length - 1];
  const insertIdx = lastId ? allTaxRows.findIndex(r => r.id === lastId) + 1 : allTaxRows.length;
  copyCounter++;
  const newRow: TaxCategory = {
    id: `NEW_TAX_${copyCounter}`,
    name: UI_MSG.新規税区分名,
    shortName: UI_MSG.新規税区分略称,
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
  markDirty(UI_MSG.税区分追加);
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
    modal.notify({ title: UI_MSG.デフォルト税区分編集不可, message: UI_MSG.コピーしてから編集, variant: 'warning' });
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
      if (!editValue.value.trim()) { modal.notify({ title: UI_MSG.税区分名空, variant: 'warning' }); return; }
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
  const txFieldLabels = TAX_CATEGORY_FIELD_LABELS;
  markDirty(`${UI_MSG.税区分変更}${txFieldLabels[field] ?? field}${UI_MSG.を変更}`);
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
async function saveChanges() {
  try {
    // API経由でサーバー側に保存
    const response = await fetch('/api/tax-categories/master', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxCategories: allTaxRows }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: UI_MSG.保存失敗 }));
      await modal.notify({ title: err.message ?? UI_MSG.保存失敗, variant: 'warning' });
      return;
    }

    // composable側のoverridesにも同期（顧問先ページへの反映用）
    const defaultTaxIds = settings.defaultTaxIds.value;
    const hiddenIds = allTaxRows.filter(r => r.deprecated).map(r => r.id);
    const customTaxCategories = allTaxRows.filter(r => !defaultTaxIds.has(r.id));
    taxMasterOverrides.value = {
      hiddenIds,
      visibilityOverrides: taxMasterOverrides.value.visibilityOverrides,
      customTaxCategories,
    };
    // ★DL-042: localStorage書き込み廃止済み（API保存に一本化）

    markClean();
    modal.notify({ title: UI_MSG.保存成功, variant: 'success' });
  } catch {
    await modal.notify({ title: UI_MSG.通信エラー, variant: 'warning' });
  }
}

// =============== 共通ユーティリティ ===============


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

<style>
@import '@/styles/master-tax-categories.css';
</style>
