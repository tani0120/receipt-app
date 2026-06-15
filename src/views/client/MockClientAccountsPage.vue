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
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="accountBusinessType === 'individual'" disabled class="as-checkbox-lg"><span>個人事業</span></label>
          </div>
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="clientTaxMethod === 'proportional'" disabled class="as-checkbox-lg"><span>原則（一括比例）</span></label>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="clientTaxMethod === 'individual'" disabled class="as-checkbox-lg"><span>原則（個別対応）</span></label>
            <label class="as-checkbox-label-lg"><input type="checkbox" :checked="clientTaxMethod === 'simplified'" disabled class="as-checkbox-lg"><span>簡易</span></label>
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
          </div>
          <div class="as-actions">
            <MfImportButton
              ref="mfImportBtnRef"
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              tooltip="MFから勘定科目をインポート"
              @import="importFromMf"
            />
            <!-- 追加ボタン廃止。科目の追加はMF側で行う -->
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <col :style="{ width: caColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: caColWidths['source'] + 'px' }">
              <col :style="{ width: caColWidths['aiSelectable'] + 'px' }">
              <col :style="{ width: caColWidths['masterId'] + 'px' }">
              <col :style="{ width: caColWidths['name'] + 'px' }">
              <col :style="{ width: caColWidths['subAccount'] + 'px' }">
              <col :style="{ width: caColWidths['target'] + 'px' }">
              <col :style="{ width: caColWidths['accountGroup'] + 'px' }">
              <col :style="{ width: caColWidths['direction'] + 'px' }">
              <col :style="{ width: caColWidths['category'] + 'px' }">
              <col :style="{ width: caColWidths['defaultTaxCategoryId'] + 'px' }">
              <col :style="{ width: caColWidths['allowedVoucherTypes'] + 'px' }">
              <col :style="{ width: caColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: caColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="th-visibility relative">MF公式
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative" style="text-align:center;font-size:11px;">出典
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('source', $event)"></div>
                </th>
                <th class="relative">税区分自動判定
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('aiSelectable', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('accountId')">
                  マスタID <i :class="getSortIcon('accountId')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('masterId', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('name')">
                  勘定科目 <i :class="getSortIcon('name')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('name', $event)"></div>
                </th>
                <th class="relative">
                  補助科目 <span class="th-help-wrap" data-tooltip="ダブルクリックで入力できます"><i class="fa-solid fa-circle-question th-help"></i></span>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('subAccount', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('target')">
                  事業形態 <i :class="getSortIcon('target')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('target', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('accountGroup')">
                  大分類 <i :class="getSortIcon('accountGroup')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('accountGroup', $event)"></div>
                </th>
                <th class="relative">
                  方向
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('direction', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('category')">
                  科目分類 <i :class="getSortIcon('category')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('category', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('defaultTaxCategoryId')">
                  デフォルト税区分 <i :class="getSortIcon('defaultTaxCategoryId')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('defaultTaxCategoryId', $event)"></div>
                </th>
                <th class="relative">
                  証票意味許容
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('allowedVoucherTypes', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveFrom')">
                  施行日 <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveTo')">
                  廃止日 <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onCaResizeStart('effectiveTo', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in pagedAccountRows" :key="row.accountId"
                :class="{ 'row-hidden': isAccountHidden(row.accountId), 'row-dragging': dragIdx === idx, 'row-custom': row.isCustom }"
                draggable="true"
                @dragstart="onDragStart(idx, $event)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
                @dragend="dragIdx = -1"
              >

                <td class="td-visibility">
                  <i v-if="row.isCustom && !hasMfData" class="fa-solid fa-trash-can td-delete" @click="deleteRow(row)" title="削除（復元不可）"></i>
                  <i v-if="isAccountHidden(row.accountId)" class="fa-solid fa-eye-slash td-hide" @click="showRow(row)" title="表示化"></i>
                  <i v-else class="fa-solid fa-eye td-show" @click="hideRow(row)" title="非表示化"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.source === 'mf'" style="color:#E65100;">MF連携</span>
                  <span v-else><i class="fa-solid fa-building-columns" style="color:#1976D2;font-size:12px;"></i> 全社</span>
                </td>
                <td class="td-ai">
                  {{ row.aiDetermination[clientTaxMethod] }}
                </td>
                <td class="td-master-id" :title="row.accountId">{{ row.accountId }}</td>
                <td @dblclick="row.isCustom && startEdit(row, 'name')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.accountId && editingField === 'name'">
                    <input class="inline-edit" v-model="editValue" @blur="commitEdit(row)" @keyup.enter="commitEdit(row)" ref="editInput" autofocus>
                  </template>
                  <template v-else>
                    <i v-if="!row.isCustom" class="fa-solid fa-circle-check td-mf-ok"></i>
                    {{ row.name }}
                  </template>
                </td>
                <td @dblclick="startEdit(row, 'subAccount')" class="td-sub-account td-editable">
                  <template v-if="editingRow === row.accountId && editingField === 'subAccount'">
                    <input class="inline-edit" v-model="editValue" @blur="commitEdit(row)" @keyup.enter="commitEdit(row)" autofocus>
                  </template>
                  <template v-else>{{ row.subAccount ?? '' }}</template>
                </td>
                <td class="td-target">{{ row.targetLabel }}</td>
                <td class="td-account-group">{{ row.accountGroupLabel }}</td>
                <td class="td-direction">{{ row.directionLabel }}</td>
                <!-- 科目分類 -->
                <td @dblclick="row.isCustom && startEdit(row, 'category')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.accountId && editingField === 'category'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <optgroup v-for="g in categoryGroups" :key="g.label" :label="g.label">
                        <option v-for="c in g.items" :key="c.value" :value="c.value">{{ c.label }}</option>
                      </optgroup>
                    </select>
                  </template>
                  <template v-else>{{ row.categoryLabel }}</template>
                </td>
                <!-- デフォルト税区分 -->
                <td @dblclick="row.isCustom && startEdit(row, 'defaultTaxCategoryId')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.accountId && editingField === 'defaultTaxCategoryId'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <option v-for="tc in filteredTaxCategories(row.accountGroup)" :key="tc.taxCategoryId" :value="tc.taxCategoryId">{{ tc.shortName }}</option>
                    </select>
                  </template>
                  <template v-else>{{ row.defaultTaxes[clientTaxMethod] }}</template>
                </td>
                <td class="td-voucher-types" :title="row.displayAllowedVoucherTypes">{{ row.displayAllowedVoucherTypes }}</td>
                <td class="td-date">{{ row.displayEffectiveFrom }}</td>
                <td class="td-date">{{ row.displayEffectiveTo }}</td>
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
  <NotifyModal
    :show="modal.notifyState.show"
    :title="modal.notifyState.title"
    :message="modal.notifyState.message"
    :variant="modal.notifyState.variant"
    @close="modal.onNotifyClose"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';

import type { Account } from '@/types/shared-account';
import type { EnrichedAccount } from '@/api/services/accountMasterApi';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useClients } from '@/features/client-management/composables/useClients';

import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import MfImportButton from '@/components/MfImportButton.vue';
import { UI_MSG } from '@/constants/uiMessages';
import { CLIENT_ACCOUNT_FIELD_LABELS } from '@/constants/fieldLabels';
import {
  getAccountGroupDirection,
  deriveCategoryDefaults,
} from '@/data/master/account-category-rules';
import { useCategoryGroups } from '@/composables/useCategoryGroups';

// 列幅カスタマイズ
const caDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  source: 70,
  aiSelectable: 80,
  masterId: 120,
  name: 140,
  subAccount: 100,
  target: 70,
  accountGroup: 80,
  direction: 60,
  category: 100,
  defaultTaxCategoryId: 120,
  allowedVoucherTypes: 140,
  effectiveFrom: 80,
  effectiveTo: 80,
};

const { columnWidths: caColWidths, onResizeStart: onCaResizeStart } = useColumnResize('client-accounts', caDefaultWidths);

const props = defineProps<{ clientId: string }>();

const PAGE_SIZE = 50;

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);
const mfImportBtnRef = ref<InstanceType<typeof MfImportButton> | null>(null);
/** MFからインポートされたデータが存在するか（source='mcp'の行が1件以上） */
const hasMfData = computed(() => accountRows.some(r => r.source === 'mcp'));

onMounted(async () => {
  try {
    const res = await fetch(`/api/mf/auth/status?clientId=${props.clientId}`);
    const data = await res.json();
    mfAuthenticated.value = data.authenticated ?? false;
  } catch {
    mfAuthenticated.value = false;
  }
});

async function importFromMf() {
  mfImporting.value = true;
  try {
    const res = await fetch(`/api/mf/import-client-accounts?clientId=${props.clientId}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: UI_MSG.MF勘定科目インポート失敗 }));
      throw new Error(err.error ?? err.detail ?? UI_MSG.MF勘定科目インポート失敗);
    }
    const data = await res.json();
    // APIレスポンスにupdatedAccountsがあれば直接使用（Repository直叩き廃止）
    if (data.updatedAccounts) {
      accountRows.splice(0, accountRows.length, ...data.updatedAccounts);
    }

    await modal.notify({
      title: UI_MSG.MFインポート完了,
      message: data.message ?? `${data.available}件の勘定科目をインポートしました`,
      variant: 'success',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const log = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);
    if (mfImportBtnRef.value) {
      mfImportBtnRef.value.showError(UI_MSG.MFインポート失敗タイトル, msg, log);
    } else {
      await modal.notify({ title: `${UI_MSG.MFインポート失敗タイトル}: ${msg}`, variant: 'warning' });
    }
  } finally {
    mfImporting.value = false;
  }
}
const { clients } = useClients();

// =============== 顧問先情報取得 ===============
const clientId = computed(() => props.clientId);
const currentClientData = computed(() => clients.value.find(c => c.clientId === clientId.value) ?? null);
const accountBusinessType = computed<'corp' | 'individual'>(() => currentClientData.value?.type === 'corp' ? 'corp' : 'individual');

const clientTaxMethod = computed<'proportional' | 'individual' | 'simplified' | 'exempt'>(() => {
  const raw = currentClientData.value?.consumptionTaxMode;
  if (raw === 'exempt') return 'exempt';
  if (raw === 'simplified') return 'simplified';
  if (raw === 'individual') return 'individual';
  return 'proportional'; // デフォルト → 原則（一括比例）
});

// =============== composable接続（useAccountSettings経由） ===============
// clientIdはprops経由で必須。defineProps<{ clientId: string }>()で型安全。
const settings = useAccountSettings('client', props.clientId);
const accountFilter = ref('');
const accountPage = ref(1);

// =============== composable接続 ===============
const accountRows: EnrichedAccount[] = reactive(
  [...settings.accounts.value] as unknown as EnrichedAccount[]
);

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);

// ★DL-042: subAccountのlocalStorage復元を廃止
// subAccountはsaveChanges()でAPI経由でサーバー保存済み。
// 復元はsettings.accounts（API GET）から取得する設計に移行予定。
// 現時点ではsettings.accounts.valueにsubAccountが含まれるため、初期値から復元される。

// composableのtoggleVisibility → buildFullAccountListでhiddenIds→hidden変換済み
// Vue側のwatch変換は不要（Phase 3 #12で削除）

/** 科目が非表示か（マスタ非表示 or 顧問先非表示） */
function isAccountHidden(accountId: string): boolean {
  return settings.isAccountHidden(accountId);
}

// isMasterCustomAccountはmaster-custom削除により不要（常にfalse）。削除済み。

const filteredAccountRows = computed(() => {
  return accountRows.filter(row => {
    if (row.target !== accountBusinessType.value) return false;
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

function hideRow(row: Account) {
  const id = row.accountId;
  if (clientId.value) {
    settings.toggleAccountVisibility(id);
  }
  row.hidden = true;
  row.effectiveTo = row.effectiveTo ?? new Date().toISOString().slice(0, 10);
}
function showRow(row: Account) {
  const id = row.accountId;
  if (clientId.value) {
    settings.toggleAccountVisibility(id);
  }
  row.hidden = false;
  row.effectiveTo = null;
}
async function deleteRow(row: Account) {
  if (!row.isCustom) return;
  const ok = await modal.confirm({ title: `「${row.name}」${UI_MSG.削除確認接尾}`, message: UI_MSG.復元不可, variant: 'danger' });
  if (!ok) return;
  const idx = accountRows.findIndex(r => r.accountId === row.accountId);
  if (idx !== -1) accountRows.splice(idx, 1);
  markDirty(`「${row.name}」${UI_MSG.削除操作接尾}`);
}
async function saveChanges() {
  if (!clientId.value) { modal.notify({ title: UI_MSG.顧問先ID不明, variant: 'warning' }); return; }
  // subAccount情報を全行から収集
  const subAccounts: Record<string, string> = {};
  accountRows.forEach(r => {
    const sub = r.subAccount;
    if (sub) subAccounts[r.accountId] = sub;
  });

  try {
    // composable経由で保存（autoSaveでサーバーに自動保存される）
    settings.saveAccounts(accountRows, subAccounts);
    markClean();
    modal.notify({ title: UI_MSG.保存成功, variant: 'success' });
  } catch {
    await modal.notify({ title: UI_MSG.通信エラー, variant: 'warning' });
  }
}

// =============== インライン編集 ===============
const editingRow = ref('');
const editingField = ref('');
const editValue = ref('');
const editOriginalName = ref('');

type AccountEditField = 'name' | 'category' | 'defaultTaxCategoryId' | 'subAccount';

function startEdit(row: Account, field: AccountEditField) {
  if (field !== 'subAccount' && !row.isCustom) {
    modal.notify({ title: UI_MSG.デフォルト科目編集不可, message: UI_MSG.コピーしてから編集, variant: 'warning' });
    return;
  }
  editingRow.value = row.accountId;
  editingField.value = field;
  switch (field) {
    case 'name': editValue.value = row.name; editOriginalName.value = row.name; break;
    case 'category': editValue.value = row.category; break;
    case 'defaultTaxCategoryId': editValue.value = row.defaultTaxCategoryId ?? ''; break;
    case 'subAccount': editValue.value = row.subAccount ?? ''; break;
  }
}

const mfWarningMessage = ref('');
function commitEdit(row: Account) {
  switch (editingField.value) {
    case 'name':
      if (!editValue.value.trim()) { modal.notify({ title: UI_MSG.科目名空, variant: 'warning' }); return; }
      row.name = editValue.value;
      if (row.isCustom && editValue.value !== editOriginalName.value) {
        mfWarningMessage.value = `${UI_MSG.MF科目名変更警告接頭}「${editValue.value}」${UI_MSG.MF科目名変更警告接尾}`;
      }
      break;
    case 'category':
      row.category = editValue.value;
      // category変更時にdefaultTaxCategoryIdを自動設定
      {
        const defaults = deriveCategoryDefaults(row.accountGroup, settings.taxCategories.value);
        row.defaultTaxCategoryId = defaults.defaultTaxCategoryId;
      }
      break;
    case 'defaultTaxCategoryId':
      row.defaultTaxCategoryId = editValue.value;
      break;
    case 'subAccount':
      row.subAccount = editValue.value;
      break;
  }
  const caFieldLabels = CLIENT_ACCOUNT_FIELD_LABELS;
  markDirty(`勘定科目の${caFieldLabels[editingField.value] ?? editingField.value}${UI_MSG.フィールド変更}`);
  cancelEdit();
}

function cancelEdit() {
  editingRow.value = '';
  editingField.value = '';
}

// =============== categoryグループ分類（composable化済み。DRY） ===============
const { categoryGroups } = useCategoryGroups(accountRows);




function filteredTaxCategories(accountGroup: string) {
  const dir = getAccountGroupDirection(accountGroup);
  return settings.filteredTaxCategories(dir);
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
    markDirty(UI_MSG.科目並び順変更);
  }
  dragIdx.value = -1;
}

// =============== 共通ユーティリティ ===============

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

/* 非表示行のグレーアウト（ルール3） */
.row-hidden { opacity: 0.4; }
.row-hidden td { text-decoration: line-through; color: #999; }

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
