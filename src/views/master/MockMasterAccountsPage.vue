<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 勘定科目マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">{{ UI_MSG.マスタ科目_ページタイトル }}</span>
        </div>

        <!-- 事業形態・課税方式切替（排他選択） -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">{{ UI_MSG.マスタ科目_事業形態ラベル }}</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="businessType" value="corp" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_法人 }}</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="businessType" value="individual" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_個人事業 }}</span></label>

          </div>
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">{{ UI_MSG.マスタ科目_課税方式ラベル }}</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="proportional" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_原則一括比例 }}</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="individual" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_原則個別対応 }}</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="simplified" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_簡易 }}</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="exempt" class="as-checkbox-lg"><span>{{ UI_MSG.マスタ科目_免税 }}</span></label>
          </div>
        </div>

        <div class="as-filters">
          <input type="text" v-model="accountFilter" :placeholder="UI_MSG.マスタ科目_絞り込みプレースホルダ" class="as-filter-input">
          <span class="as-page-info-text">全{{ filteredAccountRows.length }}件</span>
        </div>

        <!-- 注意コメント -->
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          <span v-html="UI_MSG.マスタ科目_デフォルト科目注記"></span>
        </div>
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          {{ UI_MSG.マスタ科目_簡易課税注記 }}
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
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              tooltip="MFから勘定科目をインポート"
              @import="importFromMf"
            />
            <!-- 追加ボタン廃止。科目の追加はMF側で行う -->
            <button class="as-action-btn" @click="resetAccountOrder"><i class="fa-solid fa-rotate"></i> {{ UI_MSG.マスタ科目_デフォルト順ボタン }}</button>
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> {{ UI_MSG.マスタ科目_保存ボタン }}</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 50px;">
              <col :style="{ width: acctColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: acctColWidths['aiSelectable'] + 'px' }">
              <col :style="{ width: acctColWidths['masterId'] + 'px' }">
              <col :style="{ width: acctColWidths['name'] + 'px' }">
              <col :style="{ width: acctColWidths['subAccount'] + 'px' }">
              <col :style="{ width: acctColWidths['target'] + 'px' }">
              <col :style="{ width: acctColWidths['accountGroup'] + 'px' }">
              <col :style="{ width: acctColWidths['direction'] + 'px' }">
              <col :style="{ width: acctColWidths['category'] + 'px' }">
              <col :style="{ width: acctColWidths['taxDetermination'] + 'px' }">
              <col :style="{ width: acctColWidths['defaultTaxCategoryId'] + 'px' }">
              <col :style="{ width: acctColWidths['allowedVoucherTypes'] + 'px' }">
              <col :style="{ width: acctColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: acctColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th style="text-align:center;width:50px;">表示</th>
                <th class="relative" style="text-align:center;">{{ UI_MSG.マスタ科目_列MF公式 }}
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative">{{ UI_MSG.マスタ科目_列税区分自動判定 }}
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('aiSelectable', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('accountId')">
                  マスタID <i :class="getSortIcon('accountId')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('masterId', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('name')">
                  {{ UI_MSG.マスタ科目_列勘定科目 }} <i :class="getSortIcon('name')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('name', $event)"></div>
                </th>
                <th class="relative">
                  {{ UI_MSG.マスタ科目_列補助科目 }} <span class="th-help-wrap" :data-tooltip="UI_MSG.マスタ科目_補助科目ヘルプ"><i class="fa-solid fa-circle-question th-help"></i></span>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('subAccount', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('target')">
                  事業形態 <i :class="getSortIcon('target')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('target', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('accountGroup')">
                  大分類 <i :class="getSortIcon('accountGroup')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('accountGroup', $event)"></div>
                </th>
                <th class="relative">
                  方向
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('direction', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('category')">
                  {{ UI_MSG.マスタ科目_列科目分類 }} <i :class="getSortIcon('category')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('category', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('taxDetermination')">
                  {{ UI_MSG.マスタ科目_列税区分判定 }} <i :class="getSortIcon('taxDetermination')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('taxDetermination', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('defaultTaxCategoryId')">
                  {{ UI_MSG.マスタ科目_列デフォルト税区分 }} <i :class="getSortIcon('defaultTaxCategoryId')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('defaultTaxCategoryId', $event)"></div>
                </th>
                <th class="relative">
                  証票意味許容
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('allowedVoucherTypes', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveFrom')">
                  {{ UI_MSG.マスタ科目_列適用開始 }} <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveTo')">
                  {{ UI_MSG.マスタ科目_列適用終了 }} <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('effectiveTo', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedAccountRows" :key="row.accountId"
                :class="{ 'row-deprecated': isHidden(row.accountId) }"
              >
                <!-- 表示/非表示トグル -->
                <td class="td-visibility" style="text-align:center;">
                  <i v-if="isHidden(row.accountId)" class="fa-solid fa-eye-slash td-hide" @click="toggleVisibility(row.accountId)" title="表示する"></i>
                  <i v-else class="fa-solid fa-eye td-show" @click="toggleVisibility(row.accountId)" title="非表示にする"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="!row.isCustom" style="color:#1976D2;"><MfCloudIcon :size="12" tooltip="MFクラウド" /> MF</span>
                  <span v-else-if="row.isCustom" style="color:#e65100;">カスタム</span>
                </td>
                <td class="td-ai">
                  {{ getDisplayAiDet(row) }}
                </td>
                <td class="td-master-id" :title="row.accountId">{{ row.accountId }}</td>
                <!-- 科目名（読み取り専用。修正はMF側で行う） -->
                <td>{{ row.name }}</td>
                <td class="td-sub-account"></td>
                <td class="td-target">{{ targetLabel(row.target) }}</td>
                <td class="td-account-group">{{ accountGroupLabel(row.accountGroup) }}</td>
                <td class="td-direction">{{ directionLabel(row.accountGroup) }}</td>
                <!-- 科目分類 -->
                <!-- 科目分類（読み取り専用） -->
                <td>{{ getCategoryLabel(row.category) }}</td>
                <!-- 税区分判定 -->
                <!-- 税区分判定（読み取り専用） -->
                <td>{{ getDisplayTaxDet(row) }}</td>
                <!-- デフォルト税区分 -->
                <!-- デフォルト税区分（読み取り専用） -->
                <td>{{ getDisplayDefaultTax(row) }}</td>
                <td class="td-voucher-types" :title="getAllowedVoucherTypes(row)">{{ getAllowedVoucherTypes(row) }}</td>
                <td class="td-date">{{ row.effectiveFrom }}</td>
                <td class="td-date">{{ row.effectiveTo ?? UI_MSG.現役 }}</td>
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
  <!-- 通知モーダル -->
  <NotifyModal
    :show="modal.notifyState.show"
    :title="modal.notifyState.title"
    :message="modal.notifyState.message"
    :variant="modal.notifyState.variant"
    @close="modal.onNotifyClose"
  />

  <!-- MFインポート 顧問先選択モーダル -->
  <div v-if="mfImportStep > 0" class="modal-overlay" @click.self="mfImportStep = 0">
    <div class="modal-card" style="max-width:520px;">
      <template v-if="mfImportStep === 1">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px;"><i class="fa-solid fa-cloud-arrow-down"></i> MFインポート — 顧問先選択</h3>
        </div>
        <div class="modal-body" style="max-height:400px;overflow-y:auto;">
          <p style="margin:0 0 12px;color:#666;font-size:13px;">MF連携済みの顧問先を選択してください。選択した顧問先のMCPトークンで勘定科目をインポートします。</p>
          <div v-if="mfClients.length === 0" style="color:#999;text-align:center;padding:24px;">
            MF連携済みの顧問先がありません
          </div>
          <div
            v-for="cl in mfClients" :key="cl.clientId"
            class="mf-client-row"
            :class="{ selected: mfSelectedClientId === cl.clientId }"
            @click="mfSelectedClientId = cl.clientId"
          >
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="radio" :checked="mfSelectedClientId === cl.clientId" style="margin:0;" />
              <span style="font-weight:600;">{{ cl.threeCode }}</span>
              <span>{{ cl.companyName }}</span>
              <span v-if="cl.lastImported" class="mf-star" title="前回インポート元">★</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="mfImportStep = 0">キャンセル</button>
          <button class="btn-confirm" :disabled="!mfSelectedClientId" @click="executeImport">インポート実行</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { Account } from '@/types/shared-account';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import MfImportButton from '@/components/MfImportButton.vue';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import { UI_MSG } from '@/constants/uiMessages';
import {
  getAccountGroupDirection,
  taxDetLabel,
  getCategoryLabel,
} from '@/data/master/account-category-rules';
import { VOUCHER_TYPE_RULES } from '@/data/master/voucherTypeRules';

// 列幅カスタマイズ
const acctDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  aiSelectable: 80,
  masterId: 120,
  name: 140,
  subAccount: 100,
  target: 70,
  accountGroup: 80,
  direction: 60,
  category: 100,
  taxDetermination: 100,
  defaultTaxCategoryId: 120,
  allowedVoucherTypes: 140,
  effectiveFrom: 80,
  effectiveTo: 80,
};

/** accountGroup（大分類）の日本語ラベル */
function accountGroupLabel(ag: string): string {
  switch (ag) {
    case 'BS_ASSET': return 'BS資産';
    case 'BS_LIABILITY': return 'BS負債';
    case 'BS_EQUITY': return 'BS純資産';
    case 'PL_REVENUE': return 'PL収益';
    case 'PL_EXPENSE': return 'PL費用';
    default: return ag;
  }
}

/** target（事業形態）の日本語ラベル */
function targetLabel(t: string): string {
  switch (t) {
    case 'corp': return '法人';
    case 'individual': return '個人';
    default: return t;
  }
}

/** direction（方向）の日本語ラベル（accountGroupから直接判定。データ駆動） */
function directionLabel(accountGroup: string): string {
  const dir = getAccountGroupDirection(accountGroup);
  switch (dir) {
    case 'sales': return '売上';
    case 'purchase': return '仕入';
    case 'common': return '共通';
    default: return dir;
  }
}

/** 科目が許容されるvoucher_typeを算出 */
function getAllowedVoucherTypes(row: { accountId: string; accountGroup: string; category: string }): string {
  const debitTypes: string[] = [];
  const creditTypes: string[] = [];
  for (const [vtName, rule] of Object.entries(VOUCHER_TYPE_RULES)) {
    const d = rule.debit;
    if (d.allowedGroups?.includes(row.accountGroup) || d.allowedIds?.includes(row.accountId) || d.allowedCategories?.includes(row.category)) {
      debitTypes.push(vtName);
    }
    const c = rule.credit;
    if (c.allowedGroups?.includes(row.accountGroup) || c.allowedIds?.includes(row.accountId) || c.allowedCategories?.includes(row.category)) {
      creditTypes.push(vtName);
    }
  }
  const parts: string[] = [];
  if (debitTypes.length > 0) parts.push(`借:${debitTypes.join(',')}`);
  if (creditTypes.length > 0) parts.push(`貸:${creditTypes.join(',')}`);
  return parts.join(' / ') || '—';
}
const { columnWidths: acctColWidths, onResizeStart: onAcctResizeStart } = useColumnResize('master-accounts', acctDefaultWidths);

const PAGE_SIZE = 50;

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);

// --- MFインポート 顧問先選択UI状態 ---
const mfImportStep = ref(0); // 0:非表示 1:顧問先選択
const mfSelectedClientId = ref('');
interface MfClientInfo {
  clientId: string;
  threeCode: string;
  companyName: string;
  lastImported?: string;
}
const mfClients = ref<MfClientInfo[]>([]);

onMounted(async () => {
  // 全顧問先のMF認証状態を一括チェック
  try {
    const clientsRes = await fetch('/api/clients');
    const clientsData = await clientsRes.json();
    const allClients = clientsData.clients ?? clientsData ?? [];
    const ids = allClients.map((c: { clientId: string }) => c.clientId);
    if (ids.length === 0) return;

    const bulkRes = await fetch('/api/mf/auth/status/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientIds: ids }),
    });
    const bulkData = await bulkRes.json() as Record<string, { authenticated: boolean }>;

    // MF連携済み顧問先のみ抽出
    const authenticatedClients: MfClientInfo[] = [];
    for (const cl of allClients) {
      if (bulkData[cl.clientId]?.authenticated) {
        authenticatedClients.push({
          clientId: cl.clientId,
          threeCode: cl.threeCode ?? '',
          companyName: cl.companyName ?? '',
        });
      }
    }

    mfClients.value = authenticatedClients;
    mfAuthenticated.value = authenticatedClients.length > 0;
  } catch {
    mfAuthenticated.value = false;
  }
});

/** MFインポートボタン押下 → 顧問先選択モーダル表示 */
async function importFromMf() {
  mfSelectedClientId.value = '';
  mfImportStep.value = 1;
}

/** 顧問先選択後 → インポート実行（バックエンドAPI経由） */
async function executeImport() {
  const clientId = mfSelectedClientId.value;
  if (!clientId) return;
  mfImportStep.value = 0;
  mfImporting.value = true;
  try {
    // バックエンドAPIで差分検知 + マスタ保存を一括実行
    const res = await fetch('/api/mf/import-master-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'MF勘定科目インポート失敗' }));
      throw new Error(err.error ?? err.detail ?? 'MF勘定科目インポート失敗');
    }
    const result = await res.json() as {
      success: boolean;
      mfCount: number;
      diff: { matched: unknown[]; added: unknown[] };
      summary: string;
      reportLines: string[];
      updatedAccounts: Account[];
      hasDiff: boolean;
    };

    if (!result.hasDiff) {
      // 差分なし → MFフィールド付与のみ
      accountRows.splice(0, accountRows.length, ...result.updatedAccounts);
      await modal.notify({ title: `MF勘定科目 ${result.mfCount}件と照合完了`, message: result.reportLines.join('\n'), variant: 'success' });
      markClean();
      return;
    }

    // 差分あり → 確認モーダル表示
    const confirmed = await modal.confirm({
      title: 'MF勘定科目インポート差分レポート',
      message: result.reportLines.join('\n'),
      confirmLabel: '適用する',
      cancelLabel: 'キャンセル',
    });
    if (!confirmed) return;

    // 差分適用 → reactiveを同期
    accountRows.splice(0, accountRows.length, ...result.updatedAccounts);
    await modal.notify({ title: `MF差分マージ完了（${result.summary}）`, variant: 'success' });
    markClean();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await modal.notify({ title: `MFインポート失敗: ${msg}`, variant: 'warning' });
  } finally {
    mfImporting.value = false;
  }
}

// =============== composable接続（useAccountSettings経由） ===============
const settings = useAccountSettings('master');
// テンプレート互換用のローカル参照
const masterAccounts = settings.accounts;
const overrides = settings._accountMasterOverrides;
function toggleVisibility(id: string) { settings.toggleAccountVisibility(id); }
function isHidden(id: string) { return settings.isAccountHidden(id); }

// =============== 勘定科目マスタ ===============
type BusinessTypeValue = 'corp' | 'individual';
type TaxMethodType = 'proportional' | 'individual' | 'simplified' | 'exempt';
const businessType = ref<BusinessTypeValue>('corp');
const taxMethod = ref<TaxMethodType>('proportional');
const accountFilter = ref('');
const accountPage = ref(1);

const accountRows: Account[] = reactive([...masterAccounts.value]);

// SWR再検証完了後にaccountRowsを最新データに同期する
// localStorageキャッシュ→即時描画→fetchFresh()完了→ストア更新→ここでaccountRows再同期
// マスタ画面は編集機能全廃済みのため、編集中データ上書きのリスクなし
watch(masterAccounts, (newVal) => {
  accountRows.splice(0, accountRows.length, ...newVal);
}, { deep: true });

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markClean } = useUnsavedGuard(saveChanges, modal);



const filteredAccountRows = computed(() => {
  return accountRows.filter(row => {
    // 事業形態フィルタ（排他選択）
    if (businessType.value === 'corp') {
      if (row.target !== 'corp') return false;
    } else {
      if (row.target !== 'individual') return false;
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


async function saveChanges() {
  try {
    // API経由でサーバー側に保存
    const response = await fetch('/api/accounts/master', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: accountRows }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: UI_MSG.保存失敗 }));
      await modal.notify({ title: err.message ?? UI_MSG.保存失敗, variant: 'warning' });
      return;
    }

    // composable側のoverridesにも同期（顧問先ページへの反映用）
    const defaultAccountIds = settings.defaultAccountIds.value;
    const customRows = accountRows.filter(r => !defaultAccountIds.has(r.accountId));
    const today = new Date().toISOString().slice(0, 10);
    const hiddenIds = accountRows.filter(r => r.deprecated || (r.effectiveTo && r.effectiveTo <= today)).map(r => r.accountId);
    overrides.value = { hiddenIds, customAccounts: customRows };
    // ★DL-042: localStorage書き込み廃止済み（API保存に一本化）

    markClean();
    modal.notify({ title: UI_MSG.保存成功, variant: 'success' });
  } catch {
    await modal.notify({ title: UI_MSG.通信エラー, variant: 'warning' });
  }
}

/** 課税方式に応じた「税区分自動判定」列の表示値 */
function getDisplayAiDet(row: Account): string {
  if (taxMethod.value === 'exempt') return '';
  return row.taxDetermination !== 'fixed' ? '○' : '';
}

/** 課税方式に応じた「税区分判定」列の表示値 */
function getDisplayTaxDet(row: Account): string {
  if (taxMethod.value === 'exempt') return UI_MSG.免税固定;
  return taxDetLabel(row.taxDetermination);
}

/** 課税方式に応じた「デフォルト税区分」列の表示値 */
function getDisplayDefaultTax(row: Account): string {
  if (taxMethod.value === 'exempt') return UI_MSG.免税対象外;
  return getTaxCategoryName(row.defaultTaxCategoryId);
}

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

<style>
@import '@/styles/master-accounts.css';
</style>

<style scoped>
/* 表示/非表示トグル（顧問先画面と同じスタイル） */
.td-visibility { white-space: nowrap; text-align: center; }
.td-hide { color: #999; cursor: pointer; font-size: 14px; }
.td-hide:hover { color: #616161; }
.td-show { color: #4caf50; cursor: pointer; font-size: 14px; }
.td-show:hover { color: #2e7d32; }
</style>
