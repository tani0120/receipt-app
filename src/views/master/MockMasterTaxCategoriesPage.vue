<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">{{ UI_MSG.税区分マスタタイトル }}</span>
        </div>
        <!-- 課税方式切替（セグメントボタン） -->
        <div class="as-selectors-center">
          <div class="tax-method-segment">
            <button
              v-for="m in taxMethods"
              :key="m.value"
              class="tax-method-btn"
              :class="{ active: taxMethod === m.value }"
              @click="taxMethod = m.value"
            >
              <i :class="m.icon"></i>
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 注意バナー -->
        <div class="as-info-banner" style="background:#e3f2fd;border-color:#90caf9;color:#1565c0;">
          <i class="fa-solid fa-cloud-arrow-down"></i>
          {{ UI_MSG.MF税区分バナー }}
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
            <span class="as-page-range">{{ taxPageStart }}~{{ taxPageEnd }} / {{ filteredTaxRows.length }}{{ UI_MSG.件 }}</span>
            <!-- §15追加禁止: MFがSSOTのため一括操作（MF公式/非公式切替・コピー・削除・追加）を全て無効化。表示/非表示は個別の目アイコンで操作可能 -->
          </div>
          <div class="as-actions">
            <MfImportButton
              ref="mfImportBtnRef"
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              :tooltip="UI_MSG.MFインポートツールチップ"
              @import="importFromMf"
            />
            <button class="as-action-btn" @click="resetTaxOrder"><i class="fa-solid fa-rotate"></i> {{ UI_MSG.デフォルト順 }}</button>
            <!-- §15追加禁止: MFインポートが唯一の正規ルート -->
            <!-- <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button> -->
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> {{ UI_MSG.保存 }}</button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed;">
            <colgroup>
              <!-- §15: チェックボックス列削除（一括操作無効化に伴い不要） -->
              <col :style="{ width: taxColWidths['mfCompliance'] + 'px' }">
              <col :style="{ width: taxColWidths['source'] + 'px' }">
              <col :style="{ width: taxColWidths['qualified'] + 'px' }">
              <col :style="{ width: taxColWidths['direction'] + 'px' }">
              <col style="width: auto;">
              <col :style="{ width: taxColWidths['rate'] + 'px' }">
              <col :style="{ width: taxColWidths['enabledFrom'] + 'px' }">
              <col :style="{ width: taxColWidths['enabledTo'] + 'px' }">
              <col :style="{ width: taxColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: taxColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <!-- §15: 全選択チェックボックス削除 -->
                <th class="as-th-check relative" style="text-align:center;">{{ txLabels.mfCompliance }}
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('mfCompliance', $event)"></div>
                </th>
                <th class="relative" style="text-align:center;font-size:11px;">{{ txLabels.source }}
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('source', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('qualified')">
                  {{ txLabels.qualified }} <i class="fa-solid fa-circle-question th-help" :title="UI_MSG.適格判定ツールチップ"></i>
                  <i :class="getSortIcon('qualified')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('qualified', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('direction')">
                  {{ txLabels.direction }} <i :class="getSortIcon('direction')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('direction', $event)"></div>
                </th>
                <th class="sortable" @click="sortTax('name')">
                  {{ txLabels.name }} <i :class="getSortIcon('name')"></i>
                </th>
                <th class="sortable relative" @click="sortTaxByRate()">
                  {{ txLabels.rate }} <i :class="getSortIcon('_rate')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('rate', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('enabledFrom')">
                  {{ txLabels.enabledFrom }} <i :class="getSortIcon('enabledFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('enabledFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('enabledTo')">
                  {{ txLabels.enabledTo }} <i :class="getSortIcon('enabledTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('enabledTo', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveFrom')">
                  {{ txLabels.effectiveFrom }} <i :class="getSortIcon('effectiveFrom')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('effectiveFrom', $event)"></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveTo')">
                  {{ txLabels.effectiveTo }} <i :class="getSortIcon('effectiveTo')"></i>
                  <div class="resize-handle" @mousedown.stop="onTaxResizeStart('effectiveTo', $event)"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedTaxRows" :key="row.taxCategoryId"
                :class="{ 'row-deprecated': row.hidden, 'row-custom': row.isCustom }"
              >

                <!-- §15: 行チェックボックス削除 -->
                <td class="as-td-actions">
                  <i v-if="row.hidden" class="fa-solid fa-eye-slash td-hide" @click="showRow(row)" :title="UI_MSG.表示化"></i>
                  <i v-else class="fa-solid fa-eye td-show" @click="hideRow(row)" :title="UI_MSG.非表示化"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.source === 'mcp'" style="color:#1976D2;"><MfCloudIcon :size="12" :tooltip="UI_MSG.MFクラウドツールチップ" /> {{ UI_MSG.出典MF }}</span>
                  <span v-else-if="row.isCustom" style="color:#e65100;">{{ UI_MSG.出典カスタム }}</span>
                  <span v-else><i class="fa-solid fa-circle-check" style="color:#4caf50;font-size:12px;"></i> {{ UI_MSG.出典マスタ }}</span>
                </td>
                <!-- 適格判定対象 -->
                <td style="text-align: center;" @dblclick="startEdit(row, 'qualified')">
                  <template v-if="isEditing(row.taxCategoryId, 'qualified')">
                    <select v-model="editValue" @change="commitEdit(row, 'qualified')" @blur="cancelEdit()" class="inline-select">
                      <option v-for="o in QUALIFIED_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </template>
                  <template v-else>{{ row.qualified ? '○' : '' }}</template>
                </td>
                <!-- 取引区分 -->
                <td class="td-direction" :class="'dir-' + row.direction" @dblclick="startEdit(row, 'direction')">
                  <template v-if="isEditing(row.taxCategoryId, 'direction')">
                    <select v-model="editValue" @change="commitEdit(row, 'direction')" @blur="cancelEdit()" class="inline-select" ref="editInput">
                      <option v-for="o in TAX_DIRECTION_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </template>
                  <template v-else>{{ getLabel(TAX_DIRECTION_OPTIONS, row.direction) }}</template>
                </td>
                <!-- 税区分 -->
                <td @dblclick="startEdit(row, 'name')">
                  <template v-if="isEditing(row.taxCategoryId, 'name')">
                    <input v-model="editValue" @keydown.enter="commitEdit(row, 'name')" @blur="commitEdit(row, 'name')" class="inline-input" ref="editInput" />
                  </template>
                  <template v-else>{{ row.name }}</template>
                </td>
                <!-- 税率 -->
                <td style="text-align: center;" @dblclick="startEdit(row, 'rate')">
                  <template v-if="isEditing(row.taxCategoryId, 'rate')">
                    <input v-model="editValue" @input="onRateInput" @keydown.enter="commitEdit(row, 'rate')" @blur="commitEdit(row, 'rate')" class="inline-input rate-input" ref="editInput" :placeholder="UI_MSG.税率プレースホルダー" />
                  </template>
                  <template v-else>{{ getRate(row) }}</template>
                </td>
                <!-- 利用開始（編集可能） -->
                <td class="td-date td-editable" @dblclick="startEdit(row, 'enabledFrom')">
                  <template v-if="isEditing(row.taxCategoryId, 'enabledFrom')">
                    <input type="date" v-model="editValue" @change="commitEdit(row, 'enabledFrom')" @blur="cancelEdit()" class="inline-input date-input" ref="editInput" />
                  </template>
                  <template v-else>{{ row.enabledFrom || '—' }}</template>
                </td>
                <!-- 利用停止（編集可能） -->
                <td class="td-date td-editable" @dblclick="startEdit(row, 'enabledTo')">
                  <template v-if="isEditing(row.taxCategoryId, 'enabledTo')">
                    <div class="date-edit-wrap-v">
                      <input type="date" v-model="editValue" @change="commitEdit(row, 'enabledTo')" @blur="onDateBlur(row)" class="inline-input date-input" ref="editInput" />
                      <button class="date-active-btn" @mousedown.prevent="editValue = ''; commitEdit(row, 'enabledTo')">{{ UI_MSG.利用中 }}</button>
                    </div>
                  </template>
                  <template v-else>{{ row.enabledTo || '—' }}</template>
                </td>
                <!-- 施行日（読み取り専用） -->
                <td class="td-date">{{ row.effectiveFrom || '—' }}</td>
                <!-- 廃止日（読み取り専用） -->
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

  <!-- MFインポート ウィザードモーダル -->
  <div v-if="mfImportStep > 0" class="modal-overlay" @click.self="mfImportStep = 0">
    <div class="modal-card" style="max-width:520px;">

      <!-- Step1: 顧問先選択 → 即インポート -->
      <template v-if="mfImportStep === 1">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px;"><i class="fa-solid fa-cloud-arrow-down"></i> {{ UI_MSG.MFインポート顧問先選択タイトル }}</h3>
        </div>
        <div class="modal-body" style="max-height:400px;overflow-y:auto;">
          <p style="margin:0 0 12px;color:#666;font-size:13px;">{{ UI_MSG.MF顧問先選択ガイド }}</p>
          <div v-if="mfClients.length === 0" style="color:#999;text-align:center;padding:24px;">
            {{ UI_MSG.MF連携顧問先なし }}
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
              <span v-if="cl.lastImported" class="mf-star" :title="UI_MSG.前回インポート元">★</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="mfImportStep = 0">{{ UI_MSG.キャンセル }}</button>
          <button class="btn-confirm" :disabled="!mfSelectedClientId" @click="executeImport">{{ UI_MSG.インポート実行 }}</button>
        </div>
      </template>

      <!-- Step2: インポート結果 — パターン進捗 -->
      <template v-if="mfImportStep === 2">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px;"><i class="fa-solid fa-list-check"></i> {{ UI_MSG.MFインポートパターン進捗タイトル }}</h3>
        </div>
        <div class="modal-body">
          <p style="margin:0 0 12px;color:#666;font-size:13px;">
            {{ UI_MSG.MFパターン変更ガイド }}
          </p>
          <div
            v-for="pm in patternMethods" :key="pm.key"
            class="mf-pattern-row"
            :class="{ done: pm.imported, 'just-imported': pm.key === lastImportedPattern }"
          >
            <div style="display:flex;align-items:center;gap:10px;">
              <span v-if="pm.imported" style="color:#4caf50;font-size:16px;font-weight:bold;">✓</span>
              <span v-else style="color:#ccc;font-size:16px;">○</span>
              <span style="font-weight:600;">{{ pm.label }}</span>
              <span v-if="pm.key === lastImportedPattern" style="color:#1976D2;font-size:12px;font-weight:600;">{{ UI_MSG.今回ラベル }}</span>
            </div>
            <div v-if="pm.imported" style="font-size:12px;color:#4caf50;margin-left:30px;">
              {{ pm.importedAt }} {{ UI_MSG.インポート済 }}
            </div>
          </div>

          <!-- 未完了パターンのガイド -->
          <div v-if="remainingPatterns.length > 0" class="mf-guide-box">
            <i class="fa-solid fa-circle-info" style="color:#1976D2;"></i>
            <span>{{ UI_MSG.残りパターン接頭 }}<b>{{ remainingPatterns.map(p => p.label).join('、') }}</b><br/>{{ UI_MSG.残りパターンガイド }}</span>
          </div>
          <div v-else class="mf-guide-box" style="background:#f0fdf4;border-color:#86efac;color:#166534;">
            <i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>
            <span><b>{{ UI_MSG.全パターン完了 }}</b></span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="mfImportStep = 1">{{ UI_MSG.別の顧問先 }}</button>
          <button class="btn-confirm" @click="mfImportStep = 0">{{ UI_MSG.閉じる }}</button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import type { TaxCategory, TaxDirection } from '@/types/shared-tax-category';
import type { UnifiedTaxCategory } from '@/features/account-settings/types/account-settings.types';
import { extractRateFromName } from '@/types/shared-tax-category';
// §15追加禁止: getInitialCopyCounter（コピー・追加用）は不要のため削除
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useTaxMasterStore } from '@/stores/taxMasterStore';
import {
  fetchTaxAvailable as fetchTaxAvailableApi,
  fetchMfRawData,
  fetchMfLinkedClients,
  previewMfImport,
  applyMfImport,
} from '@/composables/useMfTaxApi';
import type { MfClientInfo } from '@/composables/useMfTaxApi';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import MfImportButton from '@/components/MfImportButton.vue';
import { getLabel } from '@/constants/clientOptions';
import { UI_MSG } from '@/constants/uiMessages';
import { TAX_CATEGORY_FIELD_LABELS, TAX_METHOD_LABELS } from '@/constants/fieldLabels';
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
  enabledFrom: 90,
  enabledTo: 90,
  effectiveFrom: 100,
  effectiveTo: 100,
};
const { columnWidths: taxColWidths, onResizeStart: onTaxResizeStart } = useColumnResize('master-tax', taxDefaultWidths);

const PAGE_SIZE = 50;

// =============== composable接続（useAccountSettings経由） ===============
const settings = useAccountSettings('master');
// テンプレート互換用のローカル参照
const masterTaxCategories = settings.taxCategories;


// =============== 税区分マスタ ===============
type TaxMethodType = 'proportional' | 'individual' | 'simplified' | 'exempt';
const taxMethod = ref<TaxMethodType>('proportional');
const taxMethods = TAX_METHOD_LABELS;
const taxMethodValues = taxMethods.map(m => m.value) as TaxMethodType[];
const txLabels = TAX_CATEGORY_FIELD_LABELS;
const taxPage = ref(1);

const allTaxRows: UnifiedTaxCategory[] = reactive([...masterTaxCategories.value]);

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);
const mfImportBtnRef = ref<InstanceType<typeof MfImportButton> | null>(null);
// hasMfData: 全データがsource='mcp'のため常にtrue → バナーv-if削除に伴い不要。削除済み。

// MF課税方式別availableデータ（表示フィルタの判定基準。mf-tax-available.jsonから取得）
const taxAvailable = ref<Record<string, Record<string, boolean>>>({}); 

/** composable経由でavailableデータを取得 */
async function fetchTaxAvailable(): Promise<void> {
  try {
    taxAvailable.value = await fetchTaxAvailableApi();
  } catch { /* MF未連携時は空→フォールバック */ }
}

// --- MFインポート ウィザード状態 ---
const mfImportStep = ref(0); // 0:非表示 1:顧問先選択 2:パターン進捗
const mfSelectedClientId = ref('');
const mfClients = ref<MfClientInfo[]>([]);

// --- パターン進捗 ---
interface PatternMethod {
  key: string;
  label: string;
  imported: boolean;
  importedAt?: string;
}
const patternMethods = ref<PatternMethod[]>(
  taxMethods.map(m => ({ key: m.value, label: m.label, imported: false }))
);

/** パターン進捗をMF生データから更新 */
async function refreshPatternProgress() {
  try {
    const histData = await fetchMfRawData();
    const patterns = histData.patterns ?? [];
    for (const pm of patternMethods.value) {
      const found = patterns.find((p) => p.pattern === `taxes-${pm.key}`);
      if (found) {
        pm.imported = true;
        pm.importedAt = new Date(found.importedAt).toLocaleDateString('ja-JP');
      } else {
        pm.imported = false;
        pm.importedAt = undefined;
      }
    }
    // 顧問先の★マーク更新
    for (const cl of mfClients.value) {
      cl.lastImported = undefined;
    }
    for (const p of patterns) {
      if (p.pattern.startsWith('taxes-')) {
        const cl = mfClients.value.find(c => c.clientId === p.clientId);
        if (cl && (!cl.lastImported || p.importedAt > cl.lastImported)) {
          cl.lastImported = new Date(p.importedAt).toLocaleDateString('ja-JP');
        }
      }
    }
  } catch { /* 履歴取得失敗は無視 */ }
}

onMounted(async () => {
  // ストアの最新データを取得してallTaxRowsを再構築
  const taxStore = useTaxMasterStore();
  await taxStore.fetchFresh();
  allTaxRows.splice(0, allTaxRows.length, ...masterTaxCategories.value);

  // composable経由でMF連携済み顧問先リストを構築
  try {
    const authenticatedClients = await fetchMfLinkedClients();
    mfClients.value = authenticatedClients;
    mfAuthenticated.value = authenticatedClients.length > 0;

    // パターン進捗を取得
    await refreshPatternProgress();

    // MF availableデータを取得（表示フィルタ用）
    await fetchTaxAvailable();
  } catch {
    mfAuthenticated.value = false;
  }
});

/** MFインポートボタン押下 → Step1: 顧問先選択 */
async function importFromMf() {
  mfSelectedClientId.value = '';
  lastImportedPattern.value = '';
  await refreshPatternProgress();
  mfImportStep.value = 1;
}

/** 今回インポートしたパターン */
const lastImportedPattern = ref('');

/** 未完了パターン */
const remainingPatterns = computed(() =>
  patternMethods.value.filter(pm => !pm.imported)
);

/** ルールベースID変換失敗時の警告モーダル表示 */
async function showUnknownTaxWarning(unknownNames: string[]): Promise<void> {
  if (unknownNames.length === 0) return;
  await modal.notify({
    title: UI_MSG.税区分ID生成失敗,
    message: [
      `以下の${unknownNames.length}${UI_MSG.件ルールベース変換失敗}`,
      UI_MSG.管理者ルール追加必要,
      '',
      UI_MSG.コピペ用区切り開始,
      unknownNames.join('\n'),
      UI_MSG.コピペ用区切り終了,
    ].join('\n'),
    variant: 'warning',
  });
}

/** Step1 → インポート実行（バックエンドAPI経由） */
async function executeImport() {
  const clientId = mfSelectedClientId.value;
  if (!clientId) return;
  mfImportStep.value = 0;
  mfImporting.value = true;
  try {
    // 1. プレビュー: 差分検知（サーバー側で照合）
    const preview = await previewMfImport(clientId);
    lastImportedPattern.value = preview.pattern;

    // MF側の課税方式にタブを切替
    if (preview.pattern && (taxMethodValues as string[]).includes(preview.pattern)) {
      taxMethod.value = preview.pattern as TaxMethodType;
    }

    // 2. 差分なし＆自動ルールなし → 即完了
    if (!preview.hasDiff && preview.autoRuleApplied === 0) {
      const noDiffResult = await applyMfImport(clientId);
      // ルールベースID変換失敗チェック
      if (noDiffResult.unknownTaxNames?.length) {
        await showUnknownTaxWarning(noDiffResult.unknownTaxNames);
      }
      const methodLabel = taxMethods.find(m => m.value === taxMethod.value)?.label ?? taxMethod.value;
      await modal.notify({ title: UI_MSG.MFインポート成功, message: `※${methodLabel}: ${filteredTaxRows.value.length}${UI_MSG.件表示}`, variant: 'success' });
      return;
    }

    // 3. 差分レポートを表示して確認
    const confirmed = preview.hasDiff
      ? await modal.confirm({
          title: UI_MSG.MFインポート差分レポート,
          message: preview.reportLines.join('\n'),
          confirmLabel: UI_MSG.適用する,
          cancelLabel: UI_MSG.キャンセル,
        })
      : true; // 差分なし（自動ルール/リセットのみ）→ 自動適用
    if (!confirmed) return;

    // 4. 適用: サーバーで差分適用→マスタ保存
    const result = await applyMfImport(clientId);

    allTaxRows.splice(0, allTaxRows.length, ...(result.updatedMaster as UnifiedTaxCategory[]));

    // 5. ルールベースID変換に失敗した税区分がある場合 → 管理者に警告
    if (result.unknownTaxNames && result.unknownTaxNames.length > 0) {
      await showUnknownTaxWarning(result.unknownTaxNames);
    }

    const methodLabel2 = taxMethods.find(m => m.value === taxMethod.value)?.label ?? taxMethod.value;
    await modal.notify({ title: UI_MSG.MFインポート成功, message: `※${methodLabel2}: ${filteredTaxRows.value.length}${UI_MSG.件表示}`, variant: 'success' });
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
    await refreshPatternProgress();
    // インポート後にavailableデータを再取得（フィルタ件数を即時更新）
    await fetchTaxAvailable();
    if (lastImportedPattern.value) {
      mfImportStep.value = 2;
    }
  }
}


// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);



// --- 表示用computed: allTaxRowsからMF availableデータでフィルタ ---
// 判定基準: mf-tax-available.json（MF実データ）。設計書§4-1準拠。
// simplifiedOnlyフラグはバリデーション用であり、表示フィルタには使用しない。
const filteredTaxRows = computed(() => {
  const mode = taxMethod.value;
  const modeAvail = taxAvailable.value[mode] ?? {};
  const hasAvail = Object.keys(modeAvail).length > 0;
  return allTaxRows.filter(row => {
    // MFカスタム税区分は常に表示
    if (row.isCustom && row.source === 'mcp') return true;
    // direction='common'（対象外・不明）は全方式で常に表示
    if (row.direction === 'common') return true;
    // availableデータあり → MF実データで判定
    if (hasAvail && row.taxCategoryId) {
      return modeAvail[row.taxCategoryId] === true;
    }
    // フォールバック（availableデータなし = MF未連携）
    if (mode === 'exempt') return false;
    if (row.hidden) return false;
    return row.active !== false && row.defaultVisible !== false;
  });
});

const taxTotalPages = computed(() => Math.max(1, Math.ceil(filteredTaxRows.value.length / PAGE_SIZE)));
const taxPageStart = computed(() => (taxPage.value - 1) * PAGE_SIZE + 1);
const taxPageEnd = computed(() => Math.min(taxPage.value * PAGE_SIZE, filteredTaxRows.value.length));
const pagedTaxRows = computed(() => filteredTaxRows.value.slice(taxPageStart.value - 1, taxPageEnd.value));

watch(filteredTaxRows, () => { if (taxPage.value > taxTotalPages.value) taxPage.value = 1; });

// =============== 非表示化・表示化（個別の目アイコン用） ===============
function hideRow(row: UnifiedTaxCategory) {
  if (!row.isCustom) {
    modal.notify({ title: UI_MSG.MFインポート自動復元, message: UI_MSG.MF公式非表示注意, variant: 'warning' });
  }
  const today = new Date().toISOString().slice(0, 10);
  row.hidden = true;
  // deprecated: 後方互換のためhiddenと同期（将来hiddenに一本化予定）
  row.deprecated = true;
  row.enabledTo = today;
}
function showRow(row: UnifiedTaxCategory) {
  row.hidden = false;
  row.deprecated = false;
  row.enabledTo = null;
}

// §15追加禁止: 以下の一括操作関数は削除済み（toggleAllChecked, hideChecked, promoteToMfChecked, demoteFromMfChecked, showChecked, deleteChecked, copyChecked, addAfterChecked）
// MFがSSOTのため一括操作は設計矛盾。個別の目アイコンで表示/非表示は操作可能。

// =============== インライン編集 ===============
type EditableField = 'direction' | 'name' | 'rate' | 'qualified' | 'enabledFrom' | 'enabledTo';
const editingRowId = ref('');
const editingFieldName = ref<EditableField | ''>('');
const editValue = ref('');

function isEditing(rowId: string, field: string): boolean {
  return editingRowId.value === rowId && editingFieldName.value === field;
}

function startEdit(row: UnifiedTaxCategory, field: EditableField) {
  // 利用開始/利用停止はisCustomに関係なく編集可能（システム上の運用日付）
  const sugusuruOnlyFields: EditableField[] = ['enabledFrom', 'enabledTo'];
  if (!row.isCustom && !sugusuruOnlyFields.includes(field)) {
    modal.notify({ title: UI_MSG.デフォルト税区分編集不可, message: UI_MSG.コピーしてから編集, variant: 'warning' });
    return;
  }
  editingRowId.value = row.taxCategoryId;
  editingFieldName.value = field;
  switch (field) {
    case 'direction': editValue.value = row.direction; break;
    case 'name': editValue.value = row.name; break;
    case 'rate': editValue.value = row.taxRate != null ? String(Math.round(row.taxRate * 100)) : extractRateFromName(row.name).replace('%', ''); break;
    case 'qualified': editValue.value = String(row.qualified); break;
    case 'enabledFrom': editValue.value = row.enabledFrom || ''; break;
    case 'enabledTo': editValue.value = row.enabledTo || ''; break;
  }
}

function commitEdit(row: UnifiedTaxCategory, field: EditableField) {
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
    case 'enabledFrom':
      row.enabledFrom = editValue.value || null;
      break;
    case 'enabledTo':
      row.enabledTo = editValue.value || null;
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

// 文書全体のクリックで編集を閉じる
function onDocumentClick(e: MouseEvent) {
  if (!editingRowId.value) return;
  const target = e.target as HTMLElement;
  // 編集中のinput/select/button内のクリックは無視
  if (target.closest('.inline-input, .inline-select, .date-active-btn, .date-edit-wrap-v')) return;
  cancelEdit();
}
onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => document.removeEventListener('click', onDocumentClick));

/** 適用終了日のblur処理（現役ボタンの@mousedown.preventが先に発火するため、blur時は単純にcancelEdit） */
function onDateBlur(row: UnifiedTaxCategory) {
  // 値が変更されていたらcommit、されていなければcancel
  if (editValue.value && editValue.value !== (row.enabledTo || '')) {
    commitEdit(row, 'enabledTo');
  } else {
    cancelEdit();
  }
}

function onRateInput(e: Event) {
  const input = e.target as HTMLInputElement;
  // 半角数字と小数点のみ許可
  input.value = input.value.replace(/[^0-9.]/g, '');
  editValue.value = input.value;
}

function getRate(row: UnifiedTaxCategory): string {
  // MFのtax_rateがあればそちらを優先表示
  if (row.taxRate != null) {
    if (row.taxRate === 0) return '-';
    return `${Math.round(row.taxRate * 100)}%`;
  }
  const rate = extractRateFromName(row.name);
  return rate || '-';
}

// =============== 保存 ===============
async function saveChanges() {
  try {
    // composable経由で保存（autoSaveでサーバーに自動保存される）
    settings.saveTaxCategories(allTaxRows as unknown as TaxCategory[]);
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

const sortState = reactive({ key: '' as keyof UnifiedTaxCategory | '' | '_rate', asc: true });

function getSortIcon(key: string) {
  if (sortState.key !== key) return 'fa-solid fa-sort sort-icon inactive';
  return sortState.asc ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
}

function sortTax(key: keyof UnifiedTaxCategory) {
  if (sortState.key === key) { sortState.asc = !sortState.asc; } else { sortState.key = key; sortState.asc = true; }
  compareByKey(allTaxRows, key, sortState.asc);
}

function sortTaxByRate() {
  if (sortState.key === '_rate') { sortState.asc = !sortState.asc; } else { sortState.key = '_rate'; sortState.asc = true; }
  allTaxRows.sort((a, b) => {
    const ra = a.taxRate != null ? a.taxRate * 100 : parseFloat(extractRateFromName(a.name)) || -1;
    const rb = b.taxRate != null ? b.taxRate * 100 : parseFloat(extractRateFromName(b.name)) || -1;
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
