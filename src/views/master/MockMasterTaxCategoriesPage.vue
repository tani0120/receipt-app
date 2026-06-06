<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <span class="as-header-label">税区分マスタ（事務所共通）</span>
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
            <!-- §15追加禁止: MFがSSOTのため一括操作（MF公式/非公式切替・コピー・削除・追加）を全て無効化。表示/非表示は個別の目アイコンで操作可能 -->
          </div>
          <div class="as-actions">
            <MfImportButton
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              tooltip="MFから税区分をインポート"
              @import="importFromMf"
            />
            <button class="as-action-btn" @click="resetTaxOrder"><i class="fa-solid fa-rotate"></i> デフォルト順</button>
            <!-- §15追加禁止: MFインポートが唯一の正規ルート -->
            <!-- <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> 追加</button> -->
            <button class="as-action-btn save" @click="saveChanges"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
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
              <col :style="{ width: taxColWidths['effectiveFrom'] + 'px' }">
              <col :style="{ width: taxColWidths['effectiveTo'] + 'px' }">
            </colgroup>
            <thead>
              <tr>
                <!-- §15: 全選択チェックボックス削除 -->
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
              <tr v-for="row in pagedTaxRows" :key="row.taxCategoryId"
                :class="{ 'row-deprecated': row.deprecated, 'row-custom': row.isCustom }"
              >
                <!-- §15: 行チェックボックス削除 -->
                <td class="as-td-actions">
                  <i v-if="row.deprecated" class="fa-solid fa-eye-slash td-hide" @click="showRow(row)" title="表示化"></i>
                  <i v-else class="fa-solid fa-eye td-show" @click="hideRow(row)" title="非表示化"></i>
                </td>
                <td style="text-align:center;font-size:11px;color:#666;">
                  <span v-if="row.source === 'mf'" style="color:#1976D2;"><MfCloudIcon :size="12" tooltip="MFクラウド" /> MF</span>
                  <span v-else-if="row.isCustom" style="color:#e65100;">カスタム</span>
                  <span v-else><i class="fa-solid fa-circle-check" style="color:#4caf50;font-size:12px;"></i> マスタ</span>
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
                    <input v-model="editValue" @input="onRateInput" @keydown.enter="commitEdit(row, 'rate')" @blur="commitEdit(row, 'rate')" class="inline-input rate-input" ref="editInput" placeholder="例: 10" />
                  </template>
                  <template v-else>{{ getRate(row) }}</template>
                </td>
                <td class="td-date td-editable" @dblclick="startEdit(row, 'effectiveFrom')">
                  <template v-if="isEditing(row.taxCategoryId, 'effectiveFrom')">
                    <input type="date" v-model="editValue" @change="commitEdit(row, 'effectiveFrom')" @blur="cancelEdit()" class="inline-input date-input" ref="editInput" />
                  </template>
                  <template v-else>{{ row.effectiveFrom || '—' }}</template>
                </td>
                <td class="td-date td-editable" @dblclick="startEdit(row, 'effectiveTo')">
                  <template v-if="isEditing(row.taxCategoryId, 'effectiveTo')">
                    <div class="date-edit-wrap-v">
                      <input type="date" v-model="editValue" @change="commitEdit(row, 'effectiveTo')" @blur="onDateBlur(row)" class="inline-input date-input" ref="editInput" />
                      <button class="date-active-btn" @mousedown.prevent="editValue = ''; commitEdit(row, 'effectiveTo')">現役</button>
                    </div>
                  </template>
                  <template v-else>{{ row.effectiveTo || UI_MSG.現役 }}</template>
                </td>
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
          <h3 style="margin:0;font-size:16px;"><i class="fa-solid fa-cloud-arrow-down"></i> MFインポート — 顧問先選択</h3>
        </div>
        <div class="modal-body" style="max-height:400px;overflow-y:auto;">
          <p style="margin:0 0 12px;color:#666;font-size:13px;">MF連携済みの顧問先を選択してください。MF側の現在の課税方式設定で自動インポートします。</p>
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

      <!-- Step2: インポート結果 — パターン進捗 -->
      <template v-if="mfImportStep === 2">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px;"><i class="fa-solid fa-list-check"></i> MFインポート — パターン進捗</h3>
        </div>
        <div class="modal-body">
          <p style="margin:0 0 12px;color:#666;font-size:13px;">
            MF側の課税方式を変更して再インポートすることで、全パターンを網羅できます。
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
              <span v-if="pm.key === lastImportedPattern" style="color:#1976D2;font-size:12px;font-weight:600;">← 今回</span>
            </div>
            <div v-if="pm.imported" style="font-size:12px;color:#4caf50;margin-left:30px;">
              {{ pm.importedAt }} インポート済
            </div>
          </div>

          <!-- 未完了パターンのガイド -->
          <div v-if="remainingPatterns.length > 0" class="mf-guide-box">
            <i class="fa-solid fa-circle-info" style="color:#1976D2;"></i>
            <span>残り: <b>{{ remainingPatterns.map(p => p.label).join('、') }}</b><br/>MF側の課税方式を変更してから再度インポートしてください。</span>
          </div>
          <div v-else class="mf-guide-box" style="background:#f0fdf4;border-color:#86efac;color:#166534;">
            <i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>
            <span><b>全パターンのインポートが完了しました。</b></span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="mfImportStep = 1">別の顧問先</button>
          <button class="btn-confirm" @click="mfImportStep = 0">閉じる</button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import type { TaxCategory, TaxDirection } from '@/types/shared-tax-category';
import { extractRateFromName } from '@/types/shared-tax-category';
// §15追加禁止: getInitialCopyCounter（コピー・追加用）は不要のため削除
import { useAccountSettings } from '@/features/account-settings/composables/useAccountSettings';
import { useTaxMasterStore } from '@/stores/taxMasterStore';
import { useColumnResize } from '@/composables/useColumnResize';
import { useUnsavedGuard } from '@/composables/useUnsavedGuard';
import { useModalHelper } from '@/composables/useModalHelper';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import MfCloudIcon from '@/components/MfCloudIcon.vue';
import MfImportButton from '@/components/MfImportButton.vue';
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
const taxMethods = [
  { value: 'proportional' as const, label: '原則（一括比例）', icon: 'fa-solid fa-scale-balanced' },
  { value: 'individual' as const, label: '原則（個別対応）', icon: 'fa-solid fa-list-check' },
  { value: 'simplified' as const, label: '簡易', icon: 'fa-solid fa-bolt' },
  { value: 'exempt' as const, label: '免税', icon: 'fa-solid fa-ban' },
];
const taxPage = ref(1);

const allTaxRows: TaxCategory[] = reactive(
  masterTaxCategories.value.map(({ hidden, hiddenInMaster, visibilityOverride, source: rawSource, ...rest }) => {
    // UnifiedTaxCategory.source → TaxCategory.source に変換
    const source: TaxCategory['source'] =
      rawSource === 'mf' ? 'mf' :
      rawSource === 'master-custom' ? 'master' :
      rawSource === 'client-custom' ? 'custom' :
      undefined;
    return { ...rest, deprecated: hidden, source };
  })
);

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);
const hasMfData = computed(() => allTaxRows.some(r => r.source === 'mf'));

// --- MFインポート ウィザード状態 ---
const mfImportStep = ref(0); // 0:非表示 1:顧問先選択 2:パターン進捗
const mfSelectedClientId = ref('');
interface MfClientInfo {
  clientId: string;
  threeCode: string;
  companyName: string;
  lastImported?: string;
}
const mfClients = ref<MfClientInfo[]>([]);

// --- パターン進捗 ---
interface PatternMethod {
  key: string;
  label: string;
  imported: boolean;
  importedAt?: string;
}
const patternMethods = ref<PatternMethod[]>([
  { key: 'proportional', label: '原則（一括比例）', imported: false },
  { key: 'individual', label: '原則（個別対応）', imported: false },
  { key: 'simplified', label: '簡易', imported: false },
  { key: 'exempt', label: '免税', imported: false },
]);

/** パターン進捗をMF生データから更新 */
async function refreshPatternProgress() {
  try {
    const histRes = await fetch('/api/mf/raw-data');
    const histData = await histRes.json();
    const patterns = histData.patterns ?? [];
    for (const pm of patternMethods.value) {
      const found = patterns.find((p: { pattern: string }) => p.pattern === `taxes-${pm.key}`);
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
  // （Pinia persistedstateのlocalStorageキャッシュが古い場合への対策）
  const taxStore = useTaxMasterStore();
  await taxStore.fetchFresh();
  const freshRows = masterTaxCategories.value.map(({ hidden, hiddenInMaster, visibilityOverride, source: rawSource, ...rest }) => {
    const source: TaxCategory['source'] =
      rawSource === 'mf' ? 'mf' :
      rawSource === 'master-custom' ? 'master' :
      rawSource === 'client-custom' ? 'custom' :
      undefined;
    return { ...rest, deprecated: hidden, source };
  });
  allTaxRows.splice(0, allTaxRows.length, ...freshRows);

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

    // MFから最新の事業者名を取得
    for (const cl of authenticatedClients) {
      try {
        const officeRes = await fetch(`/api/mf/office?clientId=${cl.clientId}`);
        if (officeRes.ok) {
          const officeData = await officeRes.json();
          if (officeData.office?.name) cl.companyName = officeData.office.name;
        }
      } catch { /* MF取得失敗はclients.jsonのデータで表示 */ }
    }

    mfClients.value = authenticatedClients;
    mfAuthenticated.value = authenticatedClients.length > 0;

    // パターン進捗を取得
    await refreshPatternProgress();
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

/** Step1 → インポート実行（バックエンドAPI経由） */
async function executeImport() {
  const clientId = mfSelectedClientId.value;
  if (!clientId) return;
  mfImportStep.value = 0;
  mfImporting.value = true;
  try {
    // 1. プレビュー: 差分検知（サーバー側で照合）
    const previewRes = await fetch('/api/mf/import-taxes/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    if (!previewRes.ok) {
      const err = await previewRes.json().catch(() => ({}));
      throw new Error(err.error ?? err.detail ?? 'プレビュー失敗');
    }
    const preview = await previewRes.json();
    lastImportedPattern.value = preview.pattern;

    // MF側の課税方式にタブを切替
    if (preview.pattern && ['proportional', 'individual', 'simplified', 'exempt'].includes(preview.pattern)) {
      taxMethod.value = preview.pattern as TaxMethodType;
    }

    // 2. 差分なし＆自動ルールなし＆リセットなし → 即完了
    if (!preview.hasDiff && preview.autoRuleApplied === 0 && preview.deprecatedReset === 0) {
      const noDiffRes = await fetch('/api/mf/import-taxes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const noDiffResult = noDiffRes.ok ? await noDiffRes.json() : {};
      // availableキャッシュも更新
      const availRes0 = await fetch('/api/mf/tax-available');
      if (availRes0.ok) { mfTaxAvailable.value = await availRes0.json(); }
      // ルールベースID変換失敗チェック
      if (noDiffResult.unknownTaxNames?.length > 0) {
        await modal.notify({
          title: '⚠️ 税区分マスタID自動生成に失敗した項目があります',
          message: [
            `以下の${noDiffResult.unknownTaxNames.length}件の税区分名はルールベース変換に失敗し、仮IDで登録されました。`,
            '管理者がtaxIdGenerator.tsに変換ルールを追加する必要があります。',
            '',
            '--- コピペ用 ---',
            noDiffResult.unknownTaxNames.join('\n'),
            '--- ここまで ---',
          ].join('\n'),
          variant: 'warning',
        });
      }
      const methodLabel = taxMethods.find(m => m.value === taxMethod.value)?.label ?? taxMethod.value;
      await modal.notify({ title: 'MFの最新状態に更新しました', message: `※${methodLabel}: ${filteredTaxRows.value.length}件表示`, variant: 'success' });
      return;
    }

    // 3. 差分レポートを表示して確認
    const confirmed = preview.hasDiff
      ? await modal.confirm({
          title: 'MFインポート差分レポート',
          message: preview.reportLines.join('\n'),
          confirmLabel: '適用する',
          cancelLabel: 'キャンセル',
        })
      : true; // 差分なし（自動ルール/リセットのみ）→ 自動適用
    if (!confirmed) return;

    // 4. 適用: サーバーで差分適用→マスタ保存
    const applyRes = await fetch('/api/mf/import-taxes/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    if (!applyRes.ok) {
      const err = await applyRes.json().catch(() => ({}));
      throw new Error(err.error ?? err.detail ?? '適用失敗');
    }
    const result = await applyRes.json();

    // 5. フロントのallTaxRowsを更新後マスタで置換
    allTaxRows.splice(0, allTaxRows.length, ...result.updatedMaster);

    // 6. availableキャッシュも更新
    const availRes = await fetch('/api/mf/tax-available');
    if (availRes.ok) {
      mfTaxAvailable.value = await availRes.json();
    }

    // 7. ルールベースID変換に失敗した税区分がある場合 → 管理者に警告（コピペ可能）
    if (result.unknownTaxNames && result.unknownTaxNames.length > 0) {
      const unknownList = result.unknownTaxNames.join('\n');
      await modal.notify({
        title: '⚠️ 税区分マスタID自動生成に失敗した項目があります',
        message: [
          `以下の${result.unknownTaxNames.length}件の税区分名はルールベース変換に失敗し、仮IDで登録されました。`,
          '管理者がtaxIdGenerator.tsに変換ルールを追加する必要があります。',
          '',
          '--- コピペ用 ---',
          unknownList,
          '--- ここまで ---',
        ].join('\n'),
        variant: 'warning',
      });
    }

    const methodLabel2 = taxMethods.find(m => m.value === taxMethod.value)?.label ?? taxMethod.value;
    await modal.notify({ title: 'MFの最新状態に更新しました', message: `※${methodLabel2}: ${filteredTaxRows.value.length}件表示`, variant: 'success' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await modal.notify({ title: `MFインポート失敗: ${msg}`, variant: 'warning' });
  } finally {
    mfImporting.value = false;
    await refreshPatternProgress();
    if (lastImportedPattern.value) {
      mfImportStep.value = 2;
    }
  }
}


// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);



// --- MFのavailableデータ（4方式分） ---
type TaxAvailableMap = Record<string, Record<string, boolean>>;
const mfTaxAvailable = ref<TaxAvailableMap>({});

// 起動時にavailableデータを取得
onMounted(async () => {
  try {
    const res = await fetch('/api/mf/tax-available');
    if (res.ok) {
      mfTaxAvailable.value = await res.json();
    }
  } catch { /* availableデータなし → フォールバック */ }
});

const filteredTaxRows = computed(() => {
  const methodKey = taxMethod.value;
  const availableData = mfTaxAvailable.value[methodKey] ?? null;

  return allTaxRows.filter(row => {
    // MF独自カスタム税区分は常に表示（顧問先が意図的に作成したため）
    if (row.isCustom && row.source === 'mf') return true;
    // direction='common'（不明・対象外）は全方式で常に表示
    if (row.direction === 'common') return true;

    // --- MFのavailableベースのフィルタ ---
    if (availableData && row.taxCategoryId) {
      return availableData[row.taxCategoryId] === true;
    }

    // availableデータなし → 全件表示（MF未連携の初期状態）
    return row.defaultVisible;
  });
});

const taxTotalPages = computed(() => Math.max(1, Math.ceil(filteredTaxRows.value.length / PAGE_SIZE)));
const taxPageStart = computed(() => (taxPage.value - 1) * PAGE_SIZE + 1);
const taxPageEnd = computed(() => Math.min(taxPage.value * PAGE_SIZE, filteredTaxRows.value.length));
const pagedTaxRows = computed(() => filteredTaxRows.value.slice(taxPageStart.value - 1, taxPageEnd.value));

watch(filteredTaxRows, () => { if (taxPage.value > taxTotalPages.value) taxPage.value = 1; });

// =============== 非表示化・表示化（個別の目アイコン用） ===============
function hideRow(row: TaxCategory) {
  if (!row.isCustom) {
    modal.notify({ title: 'MFインポートで自動復元されます', message: 'MF公式税区分の非表示はインポート時にavailable=trueで上書きされます。', variant: 'warning' });
  }
  const today = new Date().toISOString().slice(0, 10);
  row.deprecated = true;
  row.effectiveTo = today;
}
function showRow(row: TaxCategory) {
  row.deprecated = false;
  row.effectiveTo = null;
}

// §15追加禁止: 以下の一括操作関数は削除済み（toggleAllChecked, hideChecked, promoteToMfChecked, demoteFromMfChecked, showChecked, deleteChecked, copyChecked, addAfterChecked）
// MFがSSOTのため一括操作は設計矛盾。個別の目アイコンで表示/非表示は操作可能。

// =============== インライン編集 ===============
type EditableField = 'direction' | 'name' | 'rate' | 'qualified' | 'effectiveFrom' | 'effectiveTo';
const editingRowId = ref('');
const editingFieldName = ref<EditableField | ''>('');
const editValue = ref('');

function isEditing(rowId: string, field: string): boolean {
  return editingRowId.value === rowId && editingFieldName.value === field;
}

function startEdit(row: TaxCategory, field: EditableField) {
  // sugusuru独自項目（適用開始日/終了日）はisCustomに関係なく編集可能
  const sugusuruOnlyFields: EditableField[] = ['effectiveFrom', 'effectiveTo'];
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
    case 'effectiveFrom': editValue.value = row.effectiveFrom || ''; break;
    case 'effectiveTo': editValue.value = row.effectiveTo || ''; break;
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
    case 'effectiveFrom':
      row.effectiveFrom = editValue.value || '';
      break;
    case 'effectiveTo':
      row.effectiveTo = editValue.value || null;
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
function onDateBlur(row: TaxCategory) {
  // 値が変更されていたらcommit、されていなければcancel
  if (editValue.value && editValue.value !== (row.effectiveTo || '')) {
    commitEdit(row, 'effectiveTo');
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

function getRate(row: TaxCategory): string {
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
    const hiddenIds = allTaxRows.filter(r => r.deprecated).map(r => r.taxCategoryId);
    const customTaxCategories = allTaxRows.filter(r => !defaultTaxIds.has(r.taxCategoryId));
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
