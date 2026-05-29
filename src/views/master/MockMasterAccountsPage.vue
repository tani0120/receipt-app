<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 勘定科目マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">勘定科目マスタ（事務所共通）</span>
        </div>

        <!-- 事業形態・課税方式切替（排他選択） -->
        <div class="as-selectors-center">
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">事業形態:</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="businessType" value="corp" class="as-checkbox-lg"><span>法人</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="businessType" value="individual" class="as-checkbox-lg"><span>個人事業</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="businessType" value="realEstate" class="as-checkbox-lg"><span>個人事業(不動産所得あり)</span></label>
          </div>
          <div class="as-selector-group-lg">
            <span class="as-selector-label-lg">課税方式:</span>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="proportional" class="as-checkbox-lg"><span>原則（一括比例）</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="individual" class="as-checkbox-lg"><span>原則（個別対応）</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="simplified" class="as-checkbox-lg"><span>簡易</span></label>
            <label class="as-checkbox-label-lg"><input type="radio" v-model="taxMethod" value="exempt" class="as-checkbox-lg"><span>免税</span></label>
          </div>
        </div>

        <div class="as-filters">
          <input type="text" v-model="accountFilter" placeholder="科目名で絞り込み" class="as-filter-input">
          <span class="as-page-info-text">全{{ filteredAccountRows.length }}件</span>
        </div>

        <!-- 注意コメント -->
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          デフォルト科目（<i class="fa-solid fa-circle-check" style="font-size:14px;color:#4caf50"></i>）の勘定科目名・税区分は編集できません。コピー・追加したカスタム科目のみ編集可能です。免税・本則・簡易の税額はMF側で計算されます。
        </div>
        <div class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          簡易課税の場合、複数の事業種別があるときは売上に関する勘定科目または補助科目を分けて登録してください。（例：売上高（卸売）、売上高（小売）等）
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
            <MfImportButton
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              tooltip="MFから勘定科目をインポート"
              @import="importFromMf"
            />
            <button class="as-action-btn" @click="resetAccountOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
            <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button>
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 38px;">
              <col :style="{ width: acctColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: acctColWidths['aiSelectable'] + 'px' }">
              <col :style="{ width: acctColWidths['name'] + 'px' }">
              <col :style="{ width: acctColWidths['subAccount'] + 'px' }">
              <col :style="{ width: acctColWidths['category'] + 'px' }">
              <col :style="{ width: acctColWidths['taxDetermination'] + 'px' }">
              <col :style="{ width: acctColWidths['defaultTaxCategoryId'] + 'px' }">
              <col :style="{ width: acctColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: acctColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <th class="as-th-check"><input type="checkbox" @change="toggleAllChecked($event)"></th>
                <th class="relative" style="text-align:center;">MF公式
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative">税区分自動判定
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('aiSelectable', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('name')">
                  勘定科目 <i :class="getSortIcon('name')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('name', $event)"></div>
                </th>
                <th class="relative">
                  補助科目 <span class="th-help-wrap" data-tooltip="補助科目は顧問先ごとの設定で入力します。マスタでは空白です。"><i class="fa-solid fa-circle-question th-help"></i></span>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('subAccount', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('category')">
                  科目分類 <i :class="getSortIcon('category')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('category', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('taxDetermination')">
                  税区分判定 <i :class="getSortIcon('taxDetermination')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('taxDetermination', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('defaultTaxCategoryId')">
                  デフォルト税区分 <i :class="getSortIcon('defaultTaxCategoryId')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('defaultTaxCategoryId', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveFrom')">
                  適用開始 <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortAccounts('effectiveTo')">
                  適用終了 <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onAcctResizeStart('effectiveTo', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in pagedAccountRows" :key="row.id"
                :class="{ 'row-deprecated': isHidden(row.id), 'row-dragging': dragIdx === idx, 'row-custom': row.isCustom }"
                draggable="true"
                @dragstart="onDragStart(idx, $event)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
                @dragend="dragIdx = -1"
              >
                <td class="as-td-check"><input type="checkbox" v-model="checkedIds" :value="row.id"></td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.mfAccountId" style="color:#1976D2;"><MfCloudIcon :size="12" tooltip="MFクラウド" /> MF</span>
                  <span v-else-if="row.isCustom" style="color:#e65100;">カスタム</span>
                  <span v-else><i class="fa-solid fa-circle-check" style="color:#4caf50;font-size:12px;"></i> マスタ</span>
                </td>
                <td class="td-ai" @dblclick="row.isCustom && startEdit(row, 'aiDetermination')" :class="{ 'td-editable': row.isCustom }">
                  <template v-if="editingRow === row.id && editingField === 'aiDetermination'">
                    <select class="inline-select" v-model="editValue" @change="commitEdit(row)" @blur="cancelEdit()">
                      <template v-if="getAllowedTaxDeterminations(row).length > 1">
                        <option v-for="o in QUALIFIED_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </template>
                      <template v-else>
                        <option v-for="o in QUALIFIED_OPTIONS.filter(o => o.value === 'false')" :key="o.value" :value="o.value">{{ o.label }}</option>
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
                    {{ row.name }}
                  </template>
                </td>
                <td class="td-sub-account"></td>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { Account } from '@/types/shared-account';
import { MF_CATEGORY_MAP, deriveMfAccountGroup, deriveTaxDetermination, deriveTarget } from '@/data/master/mf-account-category-mapping';
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { getInitialCopyCounter } from '@/utils/copy-utils';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import { QUALIFIED_OPTIONS } from '@/constants/vendorOptions';
import MfImportButton from '@/components/MfImportButton.vue';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import { UI_MSG } from '@/constants/uiMessages';
import { ACCOUNT_FIELD_LABELS } from '@/constants/fieldLabels';
import {
  CATEGORY_GROUPS,
  getCategoryDirection,
  getAllowedTaxDeterminations as getAllowedTaxDeterminationsRaw,
  taxDetLabel,
  deriveCategoryDefaults,
} from '@/data/master/account-category-rules';

// 列幅カスタマイズ
const acctDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  aiSelectable: 80,
  name: 140,
  subAccount: 100,
  category: 100,
  taxDetermination: 100,
  defaultTaxCategoryId: 120,
  effectiveFrom: 80,
  effectiveTo: 80,
};
const { columnWidths: acctColWidths, onResizeStart: onAcctResizeStart } = useColumnResize('master-accounts', acctDefaultWidths);

const PAGE_SIZE = 50;

// =============== MFインポート ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);

onMounted(async () => {
  try {
    const res = await fetch('/api/mf/auth/status?clientId=c_rODnkCDN');
    const data = await res.json();
    mfAuthenticated.value = data.authenticated ?? false;
  } catch {
    mfAuthenticated.value = false;
  }
});

/** MFから勘定科目を取得して全社マスタを差分マージ */
async function importFromMf() {
  if (mfImporting.value) return;
  mfImporting.value = true;
  try {
    // 1. MCP経由で勘定科目取得
    const res = await fetch('/api/mf/accounts?clientId=c_rODnkCDN');
    if (!res.ok) throw new Error('MF勘定科目取得失敗');
    const data = await res.json();
    const mfAccounts: {
      id: string; name: string; account_group: string;
      category: string; financial_statement_type: string;
      available: boolean; tax_id: string;
    }[] = data.accounts ?? [];

    // 2. 税区分マスタ読み込み（tax_id変換用）
    const taxRes = await fetch('/api/tax-categories/master?page=1&pageSize=200');
    const taxData = await taxRes.json() as { items: { id: string; name: string; mfId?: string }[] };
    const taxCategories = taxData.items ?? [];
    const mfTaxIdToMasterId = new Map<string, string>();
    for (const t of taxCategories) {
      if (t.mfId) mfTaxIdToMasterId.set(t.mfId, t.id);
    }

    // 3. MFデータ→全社マスタ変換（データ駆動: mf-account-category-mapping.ts）

    // 4. 名前照合＋差分検知
    const mfIdToRow = new Map<string, Account>();
    for (const row of accountRows) {
      if (row.mfAccountId) mfIdToRow.set(row.mfAccountId, row);
    }
    const nameToRow = new Map<string, Account>();
    for (const row of accountRows) {
      nameToRow.set(row.name, row);
    }

    const diff = {
      updated: [] as { name: string; mfId: string }[],
      added: [] as { name: string; mfId: string; category: string }[],
      nameChanged: [] as { mfId: string; oldName: string; newName: string }[],
      unchanged: 0,
    };

    let maxSort = Math.max(...accountRows.map(a => a.sortOrder), 0);

    for (const mf of mfAccounts) {
      // まずmfAccountIdで照合、なければ名前で照合
      const byMfId = mfIdToRow.get(mf.id);
      const byName = nameToRow.get(mf.name);
      const existing = byMfId ?? byName;

      const masterCat = MF_CATEGORY_MAP[mf.category] ?? '経費';
      const masterTaxId = mfTaxIdToMasterId.get(mf.tax_id);

      if (existing) {
        // MFフィールド付与
        existing.mfAccountId = mf.id;
        existing.mfAccountGroup = mf.account_group;
        existing.mfFinancialStatementType = mf.financial_statement_type;
        existing.mfDefaultTaxId = mf.tax_id;

        // デフォルト税区分未設定の場合のみ補完
        if (!existing.defaultTaxCategoryId && masterTaxId) {
          existing.defaultTaxCategoryId = masterTaxId;
        }

        // 名前変更検知（mfAccountIdで照合して名前が違う場合）
        if (byMfId && byMfId.name !== mf.name) {
          diff.nameChanged.push({ mfId: mf.id, oldName: byMfId.name, newName: mf.name });
        } else {
          diff.updated.push({ name: mf.name, mfId: mf.id });
        }
      } else {
        // 新規追加
        maxSort++;
        const newAccount: Account = {
          id: `MF_${mf.name.replace(/[^a-zA-Z0-9\u3000-\u9FFF]/g, '_')}`,
          name: mf.name,
          target: deriveTarget(masterCat, mf.financial_statement_type),
          accountGroup: deriveMfAccountGroup(mf.account_group, mf.category),
          category: masterCat,
          defaultTaxCategoryId: masterTaxId,
          taxDetermination: deriveTaxDetermination(masterCat),
          deprecated: false,
          effectiveFrom: '2019-10-01',
          effectiveTo: null,
          sortOrder: maxSort,
          isCustom: false,
          mfAccountId: mf.id,
          mfAccountGroup: mf.account_group,
          mfFinancialStatementType: mf.financial_statement_type,
          mfDefaultTaxId: mf.tax_id,
        };
        accountRows.push(newAccount);
        diff.added.push({ name: mf.name, mfId: mf.id, category: masterCat });
      }
    }

    // 5. 差分レポート表示
    const reportLines: string[] = [];
    reportLines.push(`📥 MF勘定科目 ${mfAccounts.length}件を照合`);
    if (diff.updated.length > 0) {
      reportLines.push(`✅ MFフィールド付与: ${diff.updated.length}件`);
    }
    if (diff.added.length > 0) {
      reportLines.push(`➕ 新規追加: ${diff.added.length}件`);
      for (const a of diff.added.slice(0, 5)) reportLines.push(`  ・${a.name}（${a.category}）`);
      if (diff.added.length > 5) reportLines.push(`  …他${diff.added.length - 5}件`);
    }
    if (diff.nameChanged.length > 0) {
      reportLines.push(`✏️ 名前変更: ${diff.nameChanged.length}件`);
      for (const c of diff.nameChanged) reportLines.push(`  ・${c.oldName} → ${c.newName}`);
    }

    const hasDiff = diff.added.length > 0 || diff.nameChanged.length > 0;

    if (!hasDiff) {
      await modal.notify({ title: `MF勘定科目 ${mfAccounts.length}件と照合完了`, message: reportLines.join('\n'), variant: 'success' });
      markDirty('MFインポート: MFフィールド付与');
      return;
    }

    const confirmed = await modal.confirm({
      title: 'MF勘定科目インポート差分レポート',
      message: reportLines.join('\n'),
      confirmLabel: '適用する',
      cancelLabel: 'キャンセル',
    });
    if (!confirmed) return;

    // 名前変更の適用
    for (const c of diff.nameChanged) {
      const row = mfIdToRow.get(c.mfId);
      if (row) row.name = c.newName;
    }

    markDirty('MFから勘定科目を差分マージ');
    const summary = [
      diff.updated.length > 0 ? `更新${diff.updated.length}` : '',
      diff.added.length > 0 ? `追加${diff.added.length}` : '',
      diff.nameChanged.length > 0 ? `名前変更${diff.nameChanged.length}` : '',
    ].filter(Boolean).join(', ');
    await modal.notify({ title: `MF差分マージ完了（${summary}）`, variant: 'success' });
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
type BusinessTypeValue = 'corp' | 'individual' | 'realEstate';
type TaxMethodType = 'proportional' | 'individual' | 'simplified' | 'exempt';
const businessType = ref<BusinessTypeValue>('corp');
const taxMethod = ref<TaxMethodType>('proportional');
const accountFilter = ref('');
const accountPage = ref(1);

const accountRows: Account[] = reactive([...masterAccounts.value]);

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);



const filteredAccountRows = computed(() => {
  return accountRows.filter(row => {
    // 事業形態フィルタ（排他選択）
    if (businessType.value === 'corp') {
      if (row.target !== 'both' && row.target !== 'corp') return false;
    } else {
      // individual または realEstate
      if (row.target !== 'both' && row.target !== 'individual') return false;
    }
    // 不動産フィルタ（realEstate以外は不動産科目非表示）
    if (businessType.value !== 'realEstate') {
      if (row.category === UI_MSG.不動産収入 || row.category === UI_MSG.不動産経費 || row.category === UI_MSG.不動産) return false;
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

function hideChecked() {
  const today = new Date().toISOString().slice(0, 10);
  checkedIds.value.forEach(id => {
    if (!isHidden(id)) {
      const row = accountRows.find(r => r.id === id);
      if (row) row.effectiveTo = today;
      toggleVisibility(id);
    }
  });
  checkedIds.value = [];
  markDirty(UI_MSG.科目非表示);
}
function showChecked() {
  checkedIds.value.forEach(id => {
    if (isHidden(id)) {
      const row = accountRows.find(r => r.id === id);
      if (row) row.effectiveTo = null;
      toggleVisibility(id);
    }
  });
  checkedIds.value = [];
  markDirty(UI_MSG.科目表示);
}
async function promoteToMfChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = accountRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { await modal.notify({ title: UI_MSG.カスタム科目のみMF公式, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${customIds.length}${UI_MSG.MF公式変更確認}` });
  if (!ok) return;
  customIds.forEach(id => {
    const row = accountRows.find(r => r.id === id);
    if (row) row.isCustom = false;
  });
  checkedIds.value = [];
  markDirty(UI_MSG.科目MF公式);
}
async function demoteFromMfChecked() {
  const officialIds = checkedIds.value.filter(id => {
    const row = accountRows.find(r => r.id === id);
    return row && !row.isCustom;
  });
  if (!officialIds.length) { await modal.notify({ title: UI_MSG.MF公式科目のみMF非公式, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${officialIds.length}${UI_MSG.MF非公式変更確認}`, message: UI_MSG.MF非公式警告, variant: 'danger' });
  if (!ok) return;
  officialIds.forEach(id => {
    const row = accountRows.find(r => r.id === id);
    if (row) row.isCustom = true;
  });
  checkedIds.value = [];
  markDirty(UI_MSG.科目MF非公式);
}

async function deleteChecked() {
  const customIds = checkedIds.value.filter(id => {
    const row = accountRows.find(r => r.id === id);
    return row?.isCustom;
  });
  if (!customIds.length) { await modal.notify({ title: UI_MSG.カスタム科目のみ, variant: 'warning' }); return; }
  const ok = await modal.confirm({ title: `${customIds.length}${UI_MSG.カスタム科目削除確認}`, message: UI_MSG.復元不可, variant: 'danger' });
  if (!ok) return;
  customIds.forEach(id => {
    const idx = accountRows.findIndex(r => r.id === id);
    if (idx !== -1) accountRows.splice(idx, 1);
  });
  checkedIds.value = [];
  markDirty(UI_MSG.科目削除);
}
let copyCounter = getInitialCopyCounter(accountRows);
async function copyChecked() {
  if (!checkedIds.value.length) return;
  const ok = await modal.confirm({ title: `${checkedIds.value.length}${UI_MSG.科目コピー確認}` });
  if (!ok) return;
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
      name: `${src.name}${UI_MSG.コピー接尾}`,
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
  markDirty(UI_MSG.科目コピー);
}
async function addAfterChecked() {
  const ok = await modal.confirm({ title: UI_MSG.科目追加確認 });
  if (!ok) return;
  // 最後にチェックした行の直下に新規行を挿入
  const ids = [...checkedIds.value];
  const lastId = ids[ids.length - 1];
  const insertIdx = lastId ? accountRows.findIndex(r => r.id === lastId) + 1 : accountRows.length;
  copyCounter++;
  const newRow: Account = {
    id: `NEW_${copyCounter}`,
    name: UI_MSG.新規科目名,
    target: businessType.value === 'corp' ? 'corp' : 'individual',
    accountGroup: 'PL_EXPENSE',
    category: UI_MSG.デフォルト科目カテゴリ,
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
  markDirty(UI_MSG.科目追加);
}
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
    const customRows = accountRows.filter(r => !defaultAccountIds.has(r.id));
    const hiddenIds = accountRows.filter(r => r.deprecated || r.effectiveTo).map(r => r.id);
    overrides.value = { hiddenIds, customAccounts: customRows };
    // ★DL-042: localStorage書き込み廃止済み（API保存に一本化）

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

type AccountEditField = 'name' | 'category' | 'taxDetermination' | 'defaultTaxCategoryId' | 'aiDetermination';

function startEdit(row: Account, field: AccountEditField) {
  if (!row.isCustom) {
    modal.notify({ title: UI_MSG.デフォルト科目編集不可, message: UI_MSG.コピーしてから編集, variant: 'warning' });
    return;
  }
  editingRow.value = row.id;
  editingField.value = field;
  switch (field) {
    case 'name': editValue.value = row.name; break;
    case 'category': editValue.value = row.category; break;
    case 'taxDetermination': editValue.value = row.taxDetermination; break;
    case 'defaultTaxCategoryId': editValue.value = row.defaultTaxCategoryId ?? ''; break;
    case 'aiDetermination': editValue.value = String(row.taxDetermination !== 'fixed'); break;
  }
}

function commitEdit(row: Account) {
  switch (editingField.value) {
    case 'name':
      if (!editValue.value.trim()) { modal.notify({ title: UI_MSG.科目名空, variant: 'warning' }); return; }
      row.name = editValue.value;
      break;
    case 'category':
      row.category = editValue.value;
      // category変更時にaccountGroup・taxDetermination・defaultTaxCategoryIdを自動設定
      {
        const defaults = deriveCategoryDefaults(editValue.value);
        row.accountGroup = defaults.accountGroup;
        row.taxDetermination = defaults.taxDetermination;
        row.defaultTaxCategoryId = defaults.defaultTaxCategoryId;
      }
      break;
    case 'taxDetermination':
      row.taxDetermination = editValue.value as 'auto_purchase' | 'auto_sales' | 'fixed';
      break;
    case 'defaultTaxCategoryId':
      row.defaultTaxCategoryId = editValue.value;
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
  const acFieldLabels = ACCOUNT_FIELD_LABELS;
  markDirty(`${UI_MSG.勘定科目変更}${acFieldLabels[editingField.value] ?? editingField.value}${UI_MSG.を変更}`);
  cancelEdit();
}

function cancelEdit() {
  editingRow.value = '';
  editingField.value = '';
}

// =============== categoryグループ分類（shared/data/account-category-rules.ts からimport済み） ===============
const categoryGroups = CATEGORY_GROUPS;

/** 科目の大分類+中分類+課税方式に基づいて許可されるtaxDetermination値を返す */
function getAllowedTaxDeterminations(row: Account): string[] {
  return getAllowedTaxDeterminationsRaw(row.accountGroup, row.category, taxMethod.value);
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

function filteredTaxCategories(category: string) {
  const dir = getCategoryDirection(category);
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
