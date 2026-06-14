<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- 税区分マスタ コンテンツ -->
    <div class="flex-1 overflow-auto">
      <div class="account-settings">
        <!-- ヘッダー -->
        <div class="as-header">
          <router-link to="/master/clients" class="as-back-link">
            <i class="fa-solid fa-arrow-left"></i> {{ UI_MSG.顧問先管理 }}
          </router-link>
          <span class="as-header-label">{{ UI_MSG.顧問先用税区分 }}</span>
        </div>

        <!-- 課税方式表示（セグメントボタン・編集不可） -->
        <div class="as-selectors-center">
          <div class="tax-method-segment">
            <button
              v-for="m in taxMethods"
              :key="m.value"
              class="tax-method-btn"
              :class="{ active: taxTabMethod === m.value }"
              disabled
            >
              <i :class="m.icon"></i>
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 注意バナー -->
        <div
          v-if="hasMfData"
          class="as-info-banner"
          style="background: #e3f2fd; border-color: #90caf9; color: #1565c0"
        >
          <i class="fa-solid fa-cloud-arrow-down"></i>
          {{ UI_MSG.MF税区分バナー }}
        </div>
        <div v-else class="as-info-banner">
          <i class="fa-solid fa-circle-info"></i>
          <span v-html="UI_MSG.顧問先税区分デフォルトバナー"></span>
        </div>

        <!-- MF名称変更警告（ルール5） -->
        <div v-if="mfWarningMessage" class="as-mf-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          {{ mfWarningMessage }}
          <button class="as-mf-warning-close" @click="mfWarningMessage = ''">&times;</button>
        </div>

        <div class="as-toolbar" style="margin-top: 8px">
          <div class="as-pagination">
            <span
              class="as-page-arrow"
              :class="{ disabled: taxPage <= 1 }"
              @click="taxPage = Math.max(1, taxPage - 1)"
              >{{ UI_MSG.ページ前 }}</span
            >
            <span
              v-for="p in taxTotalPages"
              :key="p"
              class="as-page-num"
              :class="{ active: taxPage === p }"
              @click="taxPage = p"
              >{{ p }}</span
            >
            <span
              class="as-page-arrow"
              :class="{ disabled: taxPage >= taxTotalPages }"
              @click="taxPage = Math.min(taxTotalPages, taxPage + 1)"
              >{{ UI_MSG.ページ次 }}</span
            >
            <span class="as-page-range"
              >{{ taxPageStart }}~{{ taxPageEnd }} / {{ filteredTaxRows.length }}{{ UI_MSG.件 }}</span
            >
            <!-- チェック時の一括操作ボタン -->
            <template v-if="checkedIds.length">
              <span class="as-bulk-badge">{{ checkedIds.length }}{{ UI_MSG.件選択中 }}</span>
              <button class="as-bulk-btn" @click="showChecked">
                <i class="fa-solid fa-eye"></i> {{ UI_MSG.表示化 }}
              </button>
              <button class="as-bulk-btn" @click="hideChecked">
                <i class="fa-solid fa-eye-slash"></i> {{ UI_MSG.非表示化 }}
              </button>
              <button class="as-bulk-btn danger" :disabled="hasMfData" @click="deleteChecked">
                <i class="fa-solid fa-trash-can"></i> {{ UI_MSG.削除復元不可 }}
              </button>
              <button class="as-bulk-btn" :disabled="hasMfData" @click="copyChecked">
                <i class="fa-solid fa-copy"></i> {{ UI_MSG.コピー }}
              </button>
              <button class="as-bulk-btn" :disabled="hasMfData" @click="addAfterChecked">
                <i class="fa-solid fa-plus"></i> {{ UI_MSG.追加 }}
              </button>
            </template>
          </div>
          <div class="as-actions">
            <MfImportButton
              ref="mfImportBtnRef"
              :authenticated="mfAuthenticated"
              :loading="mfImporting"
              :tooltip="UI_MSG.MFインポートツールチップ"
              @import="importFromMf"
            />
            <button class="as-action-btn" @click="resetTaxOrder">
              <i class="fa-solid fa-rotate"></i> {{ UI_MSG.デフォルト順 }}
            </button>
            <button class="as-action-btn primary"><i class="fa-solid fa-plus"></i> {{ UI_MSG.追加 }}</button>
            <button class="as-action-btn save" @click="saveChanges">
              <i class="fa-solid fa-floppy-disk"></i> {{ UI_MSG.保存 }}
            </button>
          </div>
        </div>
        <div class="as-table-wrap">
          <table class="as-table" style="table-layout: fixed">
            <colgroup>
              <col style="width: 38px" />
              <col :style="{ width: ctColWidths['mfCompliance'] + 'px' }" />
              <col :style="{ width: ctColWidths['source'] + 'px' }" />
              <col :style="{ width: ctColWidths['qualified'] + 'px' }" />
              <col :style="{ width: ctColWidths['direction'] + 'px' }" />
              <col style="width: auto" />
              <col :style="{ width: ctColWidths['rate'] + 'px' }" />
              <col :style="{ width: ctColWidths['enabledFrom'] + 'px' }" />
              <col :style="{ width: ctColWidths['enabledTo'] + 'px' }" />
              <col :style="{ width: ctColWidths['effectiveFrom'] + 'px' }" />
              <col :style="{ width: ctColWidths['effectiveTo'] + 'px' }" />
            </colgroup>
            <thead>
              <tr>
                <th class="as-th-check">
                  <input type="checkbox" @change="toggleAllChecked($event)" />
                </th>
                <th class="as-th-check relative">
                  {{ UI_MSG.列表示 }}
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('mfCompliance', $event)"
                  ></div>
                </th>
                <th class="relative" style="text-align: center; font-size: 11px">
                  {{ UI_MSG.列出典 }}
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('source', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('qualified')">
                  {{ UI_MSG.列適格判定対象 }}
                  <i
                    class="fa-solid fa-circle-question th-help"
                    :title="UI_MSG.適格判定ツールチップ"
                  ></i>
                  <i :class="getSortIcon('qualified')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('qualified', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('direction')">
                  {{ UI_MSG.列取引区分 }} <i :class="getSortIcon('direction')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('direction', $event)"
                  ></div>
                </th>
                <th class="sortable" @click="sortTax('name')">
                  {{ UI_MSG.列税区分 }} <i :class="getSortIcon('name')"></i>
                </th>
                <th class="sortable relative" @click="sortTaxByRate()">
                  {{ UI_MSG.列税率 }} <i :class="getSortIcon('_rate')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('rate', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('enabledFrom')">
                  {{ UI_MSG.列利用開始 }} <i :class="getSortIcon('enabledFrom')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('enabledFrom', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('enabledTo')">
                  {{ UI_MSG.列利用停止 }} <i :class="getSortIcon('enabledTo')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('enabledTo', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveFrom')">
                  {{ UI_MSG.列施行日 }} <i :class="getSortIcon('effectiveFrom')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('effectiveFrom', $event)"
                  ></div>
                </th>
                <th class="sortable relative" @click="sortTax('effectiveTo')">
                  {{ UI_MSG.列廃止日 }} <i :class="getSortIcon('effectiveTo')"></i>
                  <div
                    class="resize-handle"
                    @mousedown.stop="onCtResizeStart('effectiveTo', $event)"
                  ></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedTaxRows"
                :key="row.taxCategoryId"
                :class="{ 'row-hidden': row.hidden, 'row-custom': row.isCustom }"
              >
                <td class="as-td-check">
                  <input type="checkbox" v-model="checkedIds" :value="row.taxCategoryId" />
                </td>
                <td class="as-td-actions">
                  <i
                    v-if="row.hidden"
                    class="fa-solid fa-eye-slash td-hide"
                    @click="showRow(row)"
                    :title="UI_MSG.表示化"
                  ></i>
                  <i
                    v-else
                    class="fa-solid fa-eye td-show"
                    @click="hideRow(row)"
                    :title="UI_MSG.非表示化"
                  ></i>
                </td>
                <td style="text-align: center; font-size: 11px; color: #666">
                  <span v-if="row.source === 'mcp'" style="color: #1976d2"
                    ><MfCloudIcon :size="12" :tooltip="UI_MSG.出典MFクラウド" /> {{ UI_MSG.出典MF }}</span
                  >
                  <span
                    v-else-if="row.isCustom"
                    style="color: #e65100"
                    >{{ UI_MSG.出典カスタム }}</span
                  >
                  <span v-else
                    ><i
                      class="fa-solid fa-circle-check"
                      style="color: #4caf50; font-size: 12px"
                    ></i>
                    {{ UI_MSG.出典マスタ }}</span
                  >
                </td>
                <!-- 適格判定対象 -->
                <td style="text-align: center" @dblclick="startEdit(row, 'qualified')">
                  <template v-if="isEditing(row.taxCategoryId, 'qualified')">
                    <select
                      v-model="editValue"
                      @change="commitEdit(row, 'qualified')"
                      @blur="cancelEdit()"
                      class="inline-select"
                    >
                      <option v-for="o in QUALIFIED_OPTIONS" :key="o.value" :value="o.value">
                        {{ o.label }}
                      </option>
                    </select>
                  </template>
                  <template v-else>{{ row.qualified ? "○" : "" }}</template>
                </td>
                <!-- 取引区分 -->
                <td
                  class="td-direction"
                  :class="'dir-' + row.direction"
                  @dblclick="startEdit(row, 'direction')"
                >
                  <template v-if="isEditing(row.taxCategoryId, 'direction')">
                    <select
                      v-model="editValue"
                      @change="commitEdit(row, 'direction')"
                      @blur="cancelEdit()"
                      class="inline-select"
                      ref="editInput"
                    >
                      <option v-for="o in TAX_DIRECTION_OPTIONS" :key="o.value" :value="o.value">
                        {{ o.label }}
                      </option>
                    </select>
                  </template>
                  <template v-else>{{ getLabel(TAX_DIRECTION_OPTIONS, row.direction) }}</template>
                </td>
                <!-- 税区分 -->
                <td @dblclick="startEdit(row, 'name')">
                  <i v-if="!row.isCustom" class="fa-solid fa-circle-check td-mf-ok"></i>
                  <template v-if="isEditing(row.taxCategoryId, 'name')">
                    <input
                      v-model="editValue"
                      @keydown.enter="commitEdit(row, 'name')"
                      @blur="commitEdit(row, 'name')"
                      class="inline-input"
                      ref="editInput"
                    />
                  </template>
                  <template v-else>{{ row.name }}</template>
                </td>
                <!-- 税率 -->
                <td style="text-align: center" @dblclick="startEdit(row, 'rate')">
                  <template v-if="isEditing(row.taxCategoryId, 'rate')">
                    <input
                      v-model="editValue"
                      @input="onRateInput"
                      @keydown.enter="commitEdit(row, 'rate')"
                      @blur="commitEdit(row, 'rate')"
                      class="inline-input rate-input"
                      ref="editInput"
                      :placeholder="UI_MSG.税率プレースホルダー"
                    />
                  </template>
                  <template v-else>{{ getRate(row) }}</template>
                </td>
                <td class="td-date">{{ row.enabledFrom || "—" }}</td>
                <td class="td-date">{{ row.enabledTo || "—" }}</td>
                <td class="td-date td-readonly">{{ row.effectiveFrom || "—" }}</td>
                <td class="td-date td-readonly">{{ row.effectiveTo || UI_MSG.現役 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 下部ページネーション -->
        <div class="as-pagination bottom">
          <span
            class="as-page-arrow"
            :class="{ disabled: taxPage <= 1 }"
            @click="taxPage = Math.max(1, taxPage - 1)"
            >{{ UI_MSG.ページ前 }}</span
          >
          <span
            v-for="p in taxTotalPages"
            :key="'b' + p"
            class="as-page-num"
            :class="{ active: taxPage === p }"
            @click="taxPage = p"
            >{{ p }}</span
          >
          <span
            class="as-page-arrow"
            :class="{ disabled: taxPage >= taxTotalPages }"
            @click="taxPage = Math.min(taxTotalPages, taxPage + 1)"
            >{{ UI_MSG.ページ次 }}</span
          >
        </div>
      </div>
    </div>
  </div>

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
import { ref, reactive, computed, watch, onMounted } from "vue";

import type { TaxCategory, TaxDirection } from "@/types/shared-tax-category";
import type { UnifiedTaxCategory } from "@/features/account-settings/types/account-settings.types";
import { extractRateFromName } from "@/types/shared-tax-category";
import { useAccountSettings } from "@/features/account-settings/composables/useAccountSettings";
import { useClients } from "@/features/client-management/composables/useClients";
import { getInitialCopyCounter } from "@/utils/copy-utils";
import { useColumnResize } from "@/composables/useColumnResize";
import { useUnsavedGuard } from "@/composables/useUnsavedGuard";
import { useModalHelper } from "@/composables/useModalHelper";
import ConfirmModal from "@/components/ConfirmModal.vue";
import NotifyModal from "@/components/NotifyModal.vue";
import MfCloudIcon from "@/components/MfCloudIcon.vue";
import MfImportButton from "@/components/MfImportButton.vue";
import { getLabel } from "@/constants/clientOptions";
import { TAX_DIRECTION_OPTIONS, QUALIFIED_OPTIONS } from "@/constants/vendorOptions";
import { UI_MSG } from "@/constants/uiMessages";
import { fetchTaxAvailable as apiFetchTaxAvailable, fetchMfAuthStatus, importClientTaxes as apiImportClientTaxes } from "@/composables/useMfTaxApi";
import { TAX_CATEGORY_FIELD_LABELS, TAX_METHOD_LABELS } from "@/constants/fieldLabels";

// 列幅カスタマイズ
const ctDefaultWidths: Record<string, number> = {
  mfCompliance: 60,
  source: 70,
  qualified: 80,
  direction: 80,
  rate: 80,
  enabledFrom: 90,
  enabledTo: 90,
  effectiveFrom: 90,
  effectiveTo: 90,
};
const { columnWidths: ctColWidths, onResizeStart: onCtResizeStart } = useColumnResize(
  "client-tax",
  ctDefaultWidths,
);

const props = defineProps<{ clientId: string }>();

const PAGE_SIZE = 50;
const { clients } = useClients();

// =============== 顧問先情報取得 ===============
const clientId = computed(() => props.clientId);
const currentClientData = computed(
  () => clients.value.find((c) => c.clientId === clientId.value) ?? null,
);

type TaxMethodType = 'proportional' | 'individual' | 'simplified' | 'exempt';
/** consumptionTaxModeは統一済み → 直接使用 */
const taxTabMethod = computed<TaxMethodType>(() =>
  (currentClientData.value?.consumptionTaxMode as TaxMethodType) ?? 'proportional',
);
const taxMethods = TAX_METHOD_LABELS;

const mfWarningMessage = ref("");
const taxPage = ref(1);

// =============== MF連携状態 ===============
const mfAuthenticated = ref(false);
const mfImporting = ref(false);
const mfImportBtnRef = ref<InstanceType<typeof MfImportButton> | null>(null);
const mfImportedIds = ref<string[]>([]);
/** MFからインポートされたデータが存在するか（source='mcp'の行が1件以上） */
const hasMfData = computed(() => allTaxRows.some((r) => r.source === "mcp"));

// MF課税方式別availableデータ（表示フィルタの判定基準。mf-tax-available.jsonから取得）
const taxAvailable = ref<Record<string, Record<string, boolean>>>({});

/** /api/mf/tax-available からavailableデータを取得（useMfTaxApi経由） */
async function fetchTaxAvailable(): Promise<void> {
  try {
    taxAvailable.value = await apiFetchTaxAvailable();
  } catch { /* MF未連携時は空→フォールバック */ }
}

onMounted(async () => {
  try {
    const data = await fetchMfAuthStatus(props.clientId);
    mfAuthenticated.value = data.authenticated ?? false;
  } catch {
    mfAuthenticated.value = false;
  }

  // MF availableデータを取得（表示フィルタ用）
  await fetchTaxAvailable();
});

/** MFから税区分を取得してテーブルに反映（バックエンドAPI一括処理） */
async function importFromMf() {
  if (mfImporting.value) return;
  mfImporting.value = true;
  try {
    const result = await apiImportClientTaxes(props.clientId);

    const imported: TaxCategory[] = (result.imported ?? []) as TaxCategory[];

    // imported(TaxCategory[])をUnifiedTaxCategory[]に変換してテーブル置換
    const unifiedImported: UnifiedTaxCategory[] = imported.map(tc => ({
      ...tc,
      hidden: tc.hidden ?? false,
      hiddenInMaster: false,
      visibilityOverride: null as boolean | null,
      source: (tc.source ?? 'mcp') as UnifiedTaxCategory['source'],
    }));
    allTaxRows.splice(0, allTaxRows.length, ...unifiedImported);
    mfImportedIds.value = imported.map((t) => t.taxCategoryId);

    // composable側にも同期
    settings.saveTaxCategories(imported);
    markClean();

    // consumptionTaxModeの更新をフロントにも反映
    if (result.consumptionTaxMode && currentClientData.value) {
      currentClientData.value.consumptionTaxMode = result.consumptionTaxMode as TaxMethodType;
    }


    // allTaxRows.spliceで更新済み → filteredTaxRows(computed)が自動再計算

    const methodLabel = taxMethods.find(m => m.value === taxTabMethod.value)?.label ?? taxTabMethod.value;
    await modal.notify({
      title: UI_MSG.MFインポート成功,
      message: `※${methodLabel}: ${filteredTaxRows.value.length}${UI_MSG.件表示}`,
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
    // インポート後にavailableデータを再取得（フィルタ件数を即時更新）
    await fetchTaxAvailable();
  }
}

// =============== composable接続（useAccountSettings経由） ===============
// clientIdはprops経由で必須。defineProps<{ clientId: string }>()で型安全。
const settings = useAccountSettings("client", props.clientId);

// 旧キーマイグレーションはuseAccountSettings内部で実行済み

// isMasterCustomTaxはmaster-custom削除により不要（常にfalse）。削除済み。

// loadTaxRows廃止済み。composable出力(UnifiedTaxCategory[])をそのまま使用。
// source/hidden/hiddenInMaster等のプロパティを保持し、hasMfDataが正しく機能する。
const allTaxRows: UnifiedTaxCategory[] = reactive([...settings.taxCategories.value]);

// モーダルヘルパー
const modal = useModalHelper();

// 未保存変更ガード
const { markDirty, markClean } = useUnsavedGuard(saveChanges, modal);




// --- 表示用computed: allTaxRowsからMF availableデータでフィルタ ---
// 判定基準: mf-tax-available.json（MF実データ）。設計書§4-1準拠。
// simplifiedOnlyフラグはバリデーション用であり、表示フィルタには使用しない。
const filteredTaxRows = computed(() => {
  const mode = taxTabMethod.value;
  const modeAvail = taxAvailable.value[mode] ?? {};
  const hasAvail = Object.keys(modeAvail).length > 0;
  return allTaxRows.filter(row => {
    // MFカスタム税区分は常に表示
    if (row.isCustom && row.source === 'mcp') return true;
    // direction='common'（対象外・不明）は全方式で常に表示
    if (row.direction === 'common') return true;
    // 免税 → commonのみ
    if (mode === 'exempt') return false;
    // 廃止済み（effectiveTo < 今日）→ 該当タブでのみ表示（グレーアウト）
    const today = new Date().toISOString().slice(0, 10);
    if (row.effectiveTo && row.effectiveTo < today) {
      if (row.simplifiedOnly) return mode === 'simplified';
      return mode !== 'simplified';
    }
    // availableデータあり → MF実データで判定
    if (hasAvail && row.taxCategoryId) {
      return modeAvail[row.taxCategoryId] === true;
    }
    // フォールバック（MF未連携）
    return !row.hidden && row.defaultVisible !== false;
  });
});

const taxTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTaxRows.value.length / PAGE_SIZE)),
);
const taxPageStart = computed(() => (taxPage.value - 1) * PAGE_SIZE + 1);
const taxPageEnd = computed(() =>
  Math.min(taxPage.value * PAGE_SIZE, filteredTaxRows.value.length),
);
const pagedTaxRows = computed(() =>
  filteredTaxRows.value.slice(taxPageStart.value - 1, taxPageEnd.value),
);

watch(filteredTaxRows, () => {
  if (taxPage.value > taxTotalPages.value) taxPage.value = 1;
});

// =============== チェックボックス ===============
const checkedIds = ref<string[]>([]);
function toggleAllChecked(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  checkedIds.value = checked ? pagedTaxRows.value.map((r) => r.taxCategoryId) : [];
}

// =============== 非表示化・表示化 ===============
/** hidden/enabledTo同期ヘルパー */
function setRowVisibility(row: UnifiedTaxCategory, hidden: boolean) {
  row.hidden = hidden;
  row.enabledTo = hidden ? new Date().toISOString().slice(0, 10) : null;
}

function hideRow(row: UnifiedTaxCategory) {
  setRowVisibility(row, true);
}
function showRow(row: UnifiedTaxCategory) {
  setRowVisibility(row, false);
}
function hideChecked() {
  checkedIds.value.forEach((id) => {
    const row = allTaxRows.find((r) => r.taxCategoryId === id);
    if (row) setRowVisibility(row, true);
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分非表示);
}
function showChecked() {
  checkedIds.value.forEach((id) => {
    const row = allTaxRows.find((r) => r.taxCategoryId === id);
    if (row) setRowVisibility(row, false);
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分表示);
}

async function deleteChecked() {
  const customIds = checkedIds.value.filter((id) => {
    const row = allTaxRows.find((r) => r.taxCategoryId === id);
    return row?.isCustom;
  });
  if (!customIds.length) {
    await modal.notify({ title: UI_MSG.カスタム税区分のみ, variant: "warning" });
    return;
  }
  const ok = await modal.confirm({
    title: `${customIds.length}${UI_MSG.カスタム税区分削除確認}`,
    message: UI_MSG.復元不可,
    variant: "danger",
  });
  if (!ok) return;
  customIds.forEach((id) => {
    const idx = allTaxRows.findIndex((r) => r.taxCategoryId === id);
    if (idx !== -1) allTaxRows.splice(idx, 1);
  });
  checkedIds.value = [];
  markDirty(UI_MSG.税区分削除);
}

// =============== コピー・追加 ===============
let copyCounter = getInitialCopyCounter(allTaxRows as unknown as Record<string, unknown>[]);
async function copyChecked() {
  if (!checkedIds.value.length) return;
  const ok = await modal.confirm({
    title: `${checkedIds.value.length}${UI_MSG.税区分コピー確認}`,
  });
  if (!ok) return;
  const ids = [...checkedIds.value];
  ids.reverse().forEach((id) => {
    const srcIdx = allTaxRows.findIndex((r) => r.taxCategoryId === id);
    if (srcIdx === -1) return;
    const src = allTaxRows[srcIdx];
    if (!src) return;
    copyCounter++;
    const copy: UnifiedTaxCategory = {
      taxCategoryId: `${src.taxCategoryId}_COPY_${copyCounter}`,
      name: `${src.name}${UI_MSG.コピー接尾}`,
      shortName: `${src.shortName}${UI_MSG.コピー接尾}`,
      direction: src.direction,
      qualified: src.qualified,
      aiSelectable: src.aiSelectable,
      hidden: false,
      enabledFrom: new Date().toISOString().slice(0, 10),
      effectiveFrom: null,
      effectiveTo: null,
      defaultVisible: true,
      displayOrder: src.displayOrder + 0.5,
      isCustom: true,
      insertAfter: src.taxCategoryId,
      hiddenInMaster: false,
      visibilityOverride: null,
      source: 'client-custom',
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
  const insertIdx = lastId ? allTaxRows.findIndex((r) => r.taxCategoryId === lastId) + 1 : allTaxRows.length;
  copyCounter++;
  const newRow: UnifiedTaxCategory = {
    taxCategoryId: `NEW_TAX_${copyCounter}`,
    name: UI_MSG.新規税区分名,
    shortName: UI_MSG.新規税区分略称,
    direction: "common",
    qualified: false,
    aiSelectable: false,
    hidden: false,
    enabledFrom: new Date().toISOString().slice(0, 10),
    effectiveFrom: null,
    effectiveTo: null,
    defaultVisible: true,
    displayOrder: insertIdx,
    isCustom: true,
    insertAfter: lastId ?? allTaxRows[allTaxRows.length - 1]?.taxCategoryId,
    hiddenInMaster: false,
    visibilityOverride: null,
    source: 'client-custom',
  };
  allTaxRows.splice(insertIdx, 0, newRow);
  checkedIds.value = [];
  markDirty(UI_MSG.税区分追加);
}

// =============== インライン編集 ===============
type EditableField = "direction" | "name" | "rate" | "qualified";
const editingRowId = ref("");
const editingFieldName = ref<EditableField | "">("");
const editValue = ref("");

function isEditing(rowId: string, field: string): boolean {
  return editingRowId.value === rowId && editingFieldName.value === field;
}

function startEdit(row: TaxCategory, field: EditableField) {
  if (!row.isCustom) {
    modal.notify({
      title: UI_MSG.デフォルト税区分編集不可,
      message: UI_MSG.コピーしてから編集,
      variant: "warning",
    });
    return;
  }
  editingRowId.value = row.taxCategoryId;
  editingFieldName.value = field;
  switch (field) {
    case "direction":
      editValue.value = row.direction;
      break;
    case "name":
      editValue.value = row.name;
      break;
    case "rate":
      editValue.value = row.taxRate != null ? String(Math.round(row.taxRate * 100)) : extractRateFromName(row.name).replace("%", "");
      break;
    case "qualified":
      editValue.value = String(row.qualified);
      break;
  }
}

function commitEdit(row: TaxCategory, field: EditableField) {
  switch (field) {
    case "direction":
      row.direction = editValue.value as TaxDirection;
      break;
    case "name":
      if (!editValue.value.trim()) {
        modal.notify({ title: UI_MSG.税区分名空, variant: "warning" });
        return;
      }
      row.name = editValue.value;
      row.shortName = editValue.value;
      break;
    case "rate": {
      const rateStr = editValue.value.trim();
      if (rateStr) {
        const existing = row.name.match(/[\d.]+%/);
        if (existing) {
          row.name = row.name.replace(/[\d.]+%/, rateStr + "%");
        } else {
          row.name = row.name + " " + rateStr + "%";
        }
        row.shortName = row.name;
      }
      break;
    }
    case "qualified":
      row.qualified = editValue.value === "true";
      break;
  }
  const ctFieldLabels = TAX_CATEGORY_FIELD_LABELS;
  markDirty(`${UI_MSG.税区分変更}${ctFieldLabels[field] ?? field}${UI_MSG.を変更}`);
  cancelEdit();
}

function cancelEdit() {
  editingRowId.value = "";
  editingFieldName.value = "";
}

function onRateInput(e: Event) {
  const input = e.target as HTMLInputElement;
  input.value = input.value.replace(/[^0-9.]/g, "");
  editValue.value = input.value;
}

function getRate(row: TaxCategory): string {
  if (row.taxRate != null) return `${Math.round(row.taxRate * 100)}%`;
  const rate = extractRateFromName(row.name);
  return rate || "-";
}

// =============== 保存 ===============
async function saveChanges() {
  if (!clientId.value) {
    modal.notify({ title: UI_MSG.顧問先ID不明, variant: "warning" });
    return;
  }

  try {
    // composable経由で保存（autoSaveでサーバーに自動保存される）
    settings.saveTaxCategories(allTaxRows as unknown as TaxCategory[]);
    markClean();
    modal.notify({ title: UI_MSG.保存成功, variant: "success" });
  } catch {
    await modal.notify({ title: UI_MSG.通信エラー, variant: "warning" });
  }
}

// =============== 共通ユーティリティ ===============

function compareByKey<T>(arr: T[], key: keyof T, asc: boolean): void {
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === "boolean" && typeof vb === "boolean")
      return asc ? (va === vb ? 0 : va ? -1 : 1) : va === vb ? 0 : va ? 1 : -1;
    return asc
      ? String(va ?? "").localeCompare(String(vb ?? ""), "ja")
      : String(vb ?? "").localeCompare(String(va ?? ""), "ja");
  });
}

const sortState = reactive({ key: "" as keyof TaxCategory | "" | "_rate", asc: true });

function getSortIcon(key: string) {
  if (sortState.key !== key) return "fa-solid fa-sort sort-icon inactive";
  return sortState.asc ? "fa-solid fa-sort-up sort-icon" : "fa-solid fa-sort-down sort-icon";
}

function sortTax(key: keyof TaxCategory) {
  if (sortState.key === key) {
    sortState.asc = !sortState.asc;
  } else {
    sortState.key = key;
    sortState.asc = true;
  }
  compareByKey(allTaxRows, key, sortState.asc);
}

function sortTaxByRate() {
  if (sortState.key === "_rate") {
    sortState.asc = !sortState.asc;
  } else {
    sortState.key = "_rate";
    sortState.asc = true;
  }
  allTaxRows.sort((a, b) => {
    const ra = a.taxRate != null ? a.taxRate * 100 : parseFloat(extractRateFromName(a.name)) || -1;
    const rb = b.taxRate != null ? b.taxRate * 100 : parseFloat(extractRateFromName(b.name)) || -1;
    return sortState.asc ? ra - rb : rb - ra;
  });
}

function resetTaxOrder() {
  // displayOrderでソート（初期ロードと同じ並び順に復元）
  allTaxRows.sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
  sortState.key = "";
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
  color: #1976d2;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.as-back-link:hover {
  text-decoration: underline;
}
.as-header-label {
  color: #1976d2;
  font-weight: 600;
}

/* ========== セレクター（中央・大きめ） ========== */
.as-selectors-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}
.as-selector-group-lg {
  display: flex;
  align-items: center;
  gap: 10px;
}
.as-selector-label-lg {
  font-size: 15px;
  color: #555;
  font-weight: 700;
}
.as-selector-lg {
  padding: 8px 14px;
  font-size: 16px;
  border: 2px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
  min-width: 160px;
}
.as-selector-lg:focus {
  border-color: #1976d2;
}

.as-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

/* ========== ページネーション ========== */
.as-pagination {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  flex-wrap: wrap;
}
.as-pagination.bottom {
  justify-content: center;
  padding: 8px 0 12px;
}
.as-page-arrow {
  padding: 4px 10px;
  cursor: pointer;
  color: #1976d2;
  font-weight: 600;
  border-radius: 3px;
  user-select: none;
}
.as-page-arrow:hover {
  background: #e3f2fd;
}
.as-page-arrow.disabled {
  color: #ccc;
  pointer-events: none;
}
.as-page-num {
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 3px;
  color: #555;
  min-width: 28px;
  text-align: center;
  user-select: none;
}
.as-page-num:hover {
  background: #e3f2fd;
}
.as-page-num.active {
  background: #1976d2;
  color: white;
  font-weight: 600;
}
.as-page-range {
  margin-left: 10px;
  color: #888;
  font-size: 11px;
}

.as-actions {
  display: flex;
  gap: 8px;
}
.as-action-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.as-action-btn:hover {
  text-decoration: underline;
}
.as-action-btn.primary {
  font-weight: 600;
}

/* ========== テーブル ========== */
.as-table-wrap {
  overflow: auto;
  flex: 1;
  min-height: 0;
}
.as-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  border: 1px solid #d0d7de;
}
.col-check {
  width: 38px;
}
.as-table thead {
  background: #e3f2fd;
  position: sticky;
  top: 0;
  z-index: 1;
}
.as-table th {
  padding: 6px 10px;
  text-align: center;
  font-weight: 600;
  color: #555;
  font-size: 11px;
  white-space: nowrap;
  border: 1px solid #d0d7de;
}
.as-th-check,
.as-td-check {
  width: 38px;
  text-align: center;
}
.as-table td {
  padding: 5px 10px;
  border: 1px solid #e0e0e0;
  color: #333;
}
.as-table tbody tr {
  cursor: grab;
}
.as-table tbody tr:hover {
  background: #f5f9ff;
}

.td-ai {
  text-align: center;
  color: #1976d2;
  font-weight: 600;
}
.td-direction {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
}
.dir-sales {
  color: #2e7d32;
}
.dir-purchase {
  color: #c62828;
}
.dir-common {
  color: #555;
}

.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover {
  background: #d0e8fc;
}
.sort-icon {
  font-size: 9px;
  margin-left: 2px;
  color: #1976d2;
}
.sort-icon.inactive {
  color: #ccc;
}
.th-help {
  color: #999;
  font-size: 10px;
  cursor: help;
  margin-left: 2px;
}

/* 注意バナー */
.as-info-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 8px 0;
  border-radius: 4px;
  background: #e3f2fd;
  color: #1565c0;
  font-size: 12px;
  border: 1px solid #bbdefb;
}
.as-info-banner i {
  font-size: 14px;
  flex-shrink: 0;
}

/* 非表示行のグレーアウト */
.row-hidden {
  opacity: 0.4;
}
.row-hidden td {
  text-decoration: line-through;
  color: #999;
}

/* カスタム行の背景色（薄黄） */
.row-custom {
  background: #fffde7;
}
.row-custom:hover {
  background: #fff9c4;
}

/* デフォルト税区分のアイコン（税区分名左） */
.td-default-icon {
  color: #1976d2;
  font-size: 1em;
  margin-right: 4px;
  vertical-align: middle;
}

/* 固定値表示（編集不可） */
.as-fixed-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  padding: 8px 14px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  min-width: 160px;
  display: inline-block;
  text-align: center;
}

/* 非表示化アイコン（目マーク） */
.td-hide {
  color: #999;
  cursor: pointer;
  font-size: 14px;
}
.td-hide:hover {
  color: #616161;
}
.td-show {
  color: #4caf50;
  cursor: pointer;
  font-size: 14px;
}
.td-show:hover {
  color: #2e7d32;
}

/* 物理削除アイコン（ゴミ箱・カスタムのみ） */
.td-delete {
  color: #e53935;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
}
.td-delete:hover {
  color: #b71c1c;
}

/* アクション列 */
.as-td-actions {
  white-space: nowrap;
  text-align: center;
}

/* 一括操作ボタン */
.as-bulk-badge {
  display: inline-block;
  margin-left: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #1976d2;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.as-bulk-btn {
  margin-left: 4px;
  padding: 3px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.as-bulk-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}
.as-bulk-btn.danger {
  color: #e53935;
  border-color: #e53935;
}
.as-bulk-btn.danger:hover {
  background: #ffebee;
}

/* 保存ボタン */
.as-action-btn.save {
  background: #4caf50;
  color: #fff;
  border: 1px solid #388e3c;
  border-radius: 4px;
  padding: 3px 10px;
}
.as-action-btn.save:hover {
  background: #388e3c;
}

/* MF名称変更警告バナー（ルール5） */
.as-mf-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 4px 0 8px;
  border-radius: 4px;
  background: #fff3e0;
  color: #e65100;
  font-size: 12px;
  border: 1px solid #ffcc80;
}
.as-mf-warning i {
  font-size: 14px;
  flex-shrink: 0;
  color: #f57c00;
}
.as-mf-warning-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #e65100;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
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
  background: #1976d2;
}

/* ========== 課税方式セグメントボタン ========== */
.tax-method-segment {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #d0d7de;
  background: #f6f8fa;
}
.tax-method-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tax-method-btn + .tax-method-btn {
  border-left: 1px solid #d0d7de;
}
.tax-method-btn:hover:not(.active):not(:disabled) {
  background: #e8eef4;
  color: #333;
}
.tax-method-btn.active {
  background: #1976D2;
  color: #fff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
}
.tax-method-btn.active + .tax-method-btn,
.tax-method-btn + .tax-method-btn.active {
  border-left-color: transparent;
}
.tax-method-btn.active i { color: #fff; }
.tax-method-btn i { font-size: 12px; color: #888; transition: color 0.2s ease; }
.tax-method-btn:disabled { cursor: default; opacity: 0.5; }
.tax-method-btn:disabled.active { opacity: 1; background: #1976D2; color: #fff; }
</style>
