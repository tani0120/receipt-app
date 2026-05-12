<template>
  <div class="ce-page">
    <!-- ヘッダー1行目: ページタイトル -->
    <div class="ce-header-top">
      <span class="ce-page-label">{{ isPreviewMode ? 'プレビュー' : (isLayoutMode ? UI_MSG.標準フォーマット編集 : UI_MSG.顧問先管理) }}</span>
    </div>
    <!-- ヘッダー2行目: アクション -->
    <div class="ce-header">
      <div class="ce-header-left">
        <template v-if="isLayoutMode">
          <button class="ce-btn ce-btn-back" @click="exitLayoutMode"><i class="fa-solid fa-arrow-left"></i> 一覧に戻る</button>
          <button class="ce-btn ce-btn-sm ce-btn-undo" :disabled="!layout.canUndo.value" @click="layout.undo()" title="元に戻す"><i class="fa-solid fa-rotate-left"></i></button>
          <button class="ce-btn ce-btn-sm ce-btn-redo" :disabled="!layout.canRedo.value" @click="layout.redo()" title="やり直す"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="ce-btn ce-btn-sm ce-btn-preview" :class="{ active: isPreviewMode }" @click="isPreviewMode = !isPreviewMode" title="プレビュー表示">
            <i class="fa-solid fa-eye"></i> プレビュー
          </button>
        </template>
        <!-- 閲覧モード -->
        <template v-else-if="!isEditing">
          <button class="ce-btn ce-btn-back" @click="$router.push('/master/clients')"><i class="fa-solid fa-arrow-left"></i> 一覧に戻る</button>
        </template>
        <!-- 編集モード -->
        <template v-else>
          <button class="ce-btn ce-btn-cancel" @click="onCancel">キャンセル</button>
          <button class="ce-btn ce-btn-save" @click="saveClient"><i class="fa-solid fa-save"></i> 保存</button>
        </template>
      </div>
      <div class="ce-header-right">
        <div class="ce-action-icons">
          <!-- レイアウト管理モード: 全社共通の標準フォーマット操作のみ（プレビュー時は非表示） -->
          <template v-if="isLayoutMode && !isPreviewMode && layout.isLayoutEditing.value && isAdmin">
            <button v-if="layout.isLayoutDirty.value" class="ce-btn ce-btn-save ce-btn-sm" @click="layout.saveLayout(currentUserName ?? UI_MSG.不明)"><i class="fa-solid fa-save"></i> レイアウト保存</button>
            <button v-if="layout.isLayoutDirty.value" class="ce-btn ce-btn-sm ce-btn-layout-cancel" @click="cancelLayoutEditing"><i class="fa-solid fa-xmark"></i> レイアウトキャンセル</button>
            <button class="ce-btn ce-btn-cancel ce-btn-sm" @click="layout.resetLayout()">初期化</button>
            <button class="ce-btn ce-btn-sm ce-btn-custom" @click="showCustomFieldModal = true"><i class="fa-solid fa-puzzle-piece"></i> フィールド管理</button>
          </template>
          <!-- 個別顧問先モード: 個別の会社用操作ボタン -->
          <template v-else>
            <button class="ce-icon-btn" title="新規登録" @click="$router.push('/master/clients/new')"><i class="fa-solid fa-plus"></i></button>
            <button v-if="!isEditing && !isNew" class="ce-icon-btn" title="編集" @click="startEditing"><i class="fa-solid fa-pen"></i></button>
            <button v-if="!isEditing && !isNew" class="ce-icon-btn" title="コピーして新規作成" @click="copyAndCreate"><i class="fa-regular fa-copy"></i></button>
          </template>
        </div>
      </div>
    </div>

    <!-- レイアウト管理モード用モーダル -->
    <template v-if="isLayoutMode">
      <CustomFieldModal
        :visible="showCustomFieldModal"
        :custom-defs="layout.customDefs.value"
        :section-keys="sectionKeys"
        :layout-fields="layout.fields.value"
        :field-rows="layout.fieldRows.value"
        :default-field-keys="defaultFieldKeys"
        :label-overrides="layout.labelOverrides.value"
        :hidden-fields="layout.hiddenFields.value"
        :deleted-fields="layout.deletedFields.value"
        :field-options="layout.fieldOptions.value"
        @update:visible="showCustomFieldModal = $event"
        @save="handleSaveFieldManagement"
        @focus-field="scrollToField"
      />
      <AddFieldModal
        :visible="showAddFieldModal"
        :section-keys="sectionKeys"
        :default-section="addFieldDefaultSection"
        @update:visible="showAddFieldModal = $event"
        @add="handleAddField"
      />
    </template>

    <div class="ce-body">
      <!-- 左カラム: フォーム -->
      <div class="ce-main">
        <!-- フラットレイアウト: 1つのDraggableFieldGridで全フィールドを管理 -->
        <DraggableFieldGrid
          :fields="flatFields"
          :is-layout-editing="isLayoutMode && !isPreviewMode && layout.isLayoutEditing.value"
          :form-data="isPreviewMode ? {} : (isLayoutMode ? undefined : enrichedFormData)"
          :is-editing="isPreviewMode ? true : (isLayoutMode ? false : isEditing)"
          :resolve-options="resolveOptions"
          :staff-list="activeStaffList"
          :drag-group="isLayoutMode && !isPreviewMode ? 'clientLayout' : undefined"
          :selected-field-key="selectedPaletteField?.key"
          :field-rows="layout.getFieldRows.value"
          @update:order="(keys: string[]) => layout.updateFieldOrderFlat(keys)"
          @update:width="(key: string, span: number) => layout.updateFieldWidth(key, span)"
          @update:lineBreak="(key: string, val: boolean) => layout.updateFieldLineBreak(key, val)"
          @hide-field="(key: string) => layout.toggleFieldVisibility(key, false)"
          @label-edit="(key: string, label: string) => layout.updateLabelOverride(key, label)"
          @add-field="openAddFieldModal"
          @update:headingSize="(key: string, size: number) => layout.updateHeadingSize(key, size)"
          @update:headingBg="(key: string, color: string) => layout.updateHeadingBg(key, color)"
          @update:headingColor="(key: string, color: string) => layout.updateHeadingColor(key, color)"
          @update:spacerHeight="(key: string, height: number) => layout.updateSpacerHeight(key, height)"
          @update:fieldHeight="(key: string, height: number) => layout.updateFieldHeight(key, height)"
          @update:fieldValue="(key: string, value: unknown) => { (form as Record<string, unknown>)[key] = value }"
          @field-added="(field: import('@/types/fieldLayout').FieldDef) => layout.addDynamicField(field)"
          @select-field="(field: import('@/types/fieldLayout').FieldDef) => selectedPaletteField = field"
          @update:field-options="(key: string, opts: import('@/types/fieldLayout').FieldOption[]) => layout.updateFieldOptions(key, opts)"
          @update:rows="(rows: string[][]) => layout.updateAllRows(rows)"
          @file-upload="handleFileUpload"
          @file-delete="handleFileDelete"
        >
          <!-- status: 契約状況の表示 -->
          <template v-if="!isLayoutMode" #status>
            <div class="ce-field">
              <template v-if="isEditing">
                <select v-model="form.status" class="ce-select" :class="'ce-status-' + form.status">
                  <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </template>
              <span v-else class="ce-readonly" :class="'ce-status-' + form.status">{{ getLabel(STATUS_OPTIONS, form.status) }}</span>
            </div>
          </template>
          <!-- staffId: 担当者選択 -->
          <template v-if="!isLayoutMode" #staffId>
            <div class="ce-field">
              <template v-if="isEditing">
                <select v-model="staffId" class="ce-select">
                  <option value="">{{ PLACEHOLDER_UNSET }}</option>
                  <option v-for="s in activeStaffList" :key="s.uuid" :value="s.uuid">{{ s.name }}</option>
                </select>
              </template>
              <span v-else class="ce-readonly">{{ staffLabel }}</span>
            </div>
          </template>
          <!-- progressLink: 進捗管理リンク -->
          <template v-if="!isLayoutMode" #progressLink>
            <div class="ce-field">
              <div v-if="clientId" class="ce-url-row">
                <a :href="journalListUrl" target="_blank" class="ce-link-url">{{ journalListUrl }}</a>
                <button class="ce-copy-btn" @click="copyToClipboard(journalListUrl)" title="コピー"><i class="fa-regular fa-copy"></i></button>
              </div>
              <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
            </div>
          </template>
          <!-- threeCode: 3コード入力 -->
          <template v-if="!isLayoutMode" #threeCode>
            <div class="ce-field">
              <input v-if="isEditing" type="text" v-model="form.threeCode" class="ce-input ce-w-sm" maxlength="3" placeholder="ABC" @input="form.threeCode = form.threeCode.toUpperCase().replace(/[^A-Z]/g, '')">
              <span v-else class="ce-readonly ce-code">{{ form.threeCode || '—' }}</span>
            </div>
          </template>
          <!-- fiscalDate: 決算日（月/日選択） -->
          <template v-if="!isLayoutMode" #fiscalDate>
            <div class="ce-field">
              <template v-if="isEditing">
                <div class="ce-date-group">
                  <select v-model="form.fiscalMonth" class="ce-select ce-w-sm">
                    <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                  </select>
                  <span>/</span>
                  <select v-model="form.fiscalDay" class="ce-select ce-w-sm">
                    <option :value="FISCAL_DAY_END_LABEL">{{ FISCAL_DAY_END_LABEL }}</option>
                    <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
                  </select>
                </div>
              </template>
              <span v-else class="ce-readonly">{{ form.fiscalMonth }}月 / {{ form.fiscalDay === FISCAL_DAY_END_LABEL ? FISCAL_DAY_END_LABEL : form.fiscalDay + '日' }}</span>
            </div>
          </template>
          <!-- uploadUrlStaff: 社内用URL -->
          <template v-if="!isLayoutMode" #uploadUrlStaff>
            <div class="ce-field">
              <div v-if="clientId" class="ce-url-row">
                <a :href="uploadUrlStaff" target="_blank" class="ce-link-url">{{ uploadUrlStaff }}</a>
                <button class="ce-copy-btn" @click="copyToClipboard(uploadUrlStaff)" title="コピー"><i class="fa-regular fa-copy"></i></button>
              </div>
              <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
            </div>
          </template>
          <!-- uploadUrlGuest: 顧問先用URL -->
          <template v-if="!isLayoutMode" #uploadUrlGuest>
            <div class="ce-field">
              <div v-if="clientId" class="ce-url-row">
                <a :href="uploadUrlGuest" target="_blank" class="ce-link-url">{{ uploadUrlGuest }}</a>
                <button class="ce-copy-btn" @click="copyToClipboard(uploadUrlGuest)" title="コピー"><i class="fa-regular fa-copy"></i></button>
              </div>
              <span v-else class="ce-readonly ce-muted">（保存後に表示）</span>
            </div>
          </template>
          <!-- contactTable: 連絡先テーブル -->
          <template #contactTable>
            <ContactTable
              :contacts="form.contacts || []"
              :columns="layout.tableColumns.value['contactTable']"
              :is-editing="isEditing"
              :is-layout-mode="isLayoutMode"
              @update:contacts="(v: ClientContact[]) => form.contacts = v"
              @update:columns="(cols: ContactColumn[]) => layout.updateTableColumns('contactTable', cols)"
            />
          </template>
          <!-- table部品: 汎用テーブル（動的スロット） -->
          <template v-for="tf in tableFields" :key="tf.key" #[tf.key]>
            <ContactTable
              :contacts="getTableData(tf.key)"
              :columns="layout.tableColumns.value[tf.key]"
              :is-editing="isEditing"
              :is-layout-mode="isLayoutMode"
              @update:contacts="(v: ClientContact[]) => setTableData(tf.key, v)"
              @update:columns="(cols: ContactColumn[]) => layout.updateTableColumns(tf.key, cols)"
            />
          </template>
          <!-- hasRentalIncome: 不動産所得チェック -->
          <template v-if="!isLayoutMode" #hasRentalIncome>
            <div v-if="form.type === 'individual' || form.type === 'sole_proprietor'" class="ce-field">
              <template v-if="isEditing">
                <label class="ce-checkbox"><input type="checkbox" v-model="form.hasRentalIncome"><span>不動産所得あり</span></label>
                <span class="ce-hint">有効にすると不動産関連15科目が選択可能になります</span>
              </template>
              <template v-else>
                <span class="ce-readonly">{{ form.hasRentalIncome ? 'あり' : 'なし' }}</span>
              </template>
            </div>
          </template>
          <!-- accountingSoftwareDisplay: 会計ソフト表示 -->
          <template v-if="!isLayoutMode" #accountingSoftwareDisplay>
            <div class="ce-field">
              <span class="ce-readonly">{{ accountingSoftwareLabel }}</span>
            </div>
          </template>
          <!-- monthlyTotal: 月次合計 -->
          <template v-if="!isLayoutMode" #monthlyTotal>
            <div class="ce-field ce-computed">
              <label>月次合計（自動算出）</label>
              <span class="ce-computed-val">{{ (form.advisoryFee + form.bookkeepingFee + (form.socialInsuranceFee ?? 0) + (form.payrollFee ?? 0) + (form.accountingServiceFee ?? 0) + (form.systemFee ?? 0)).toLocaleString() }} 円</span>
            </div>
          </template>
          <!-- annualTotal: 年間総報酬 -->
          <template v-if="!isLayoutMode" #annualTotal>
            <div class="ce-field ce-computed">
              <label>年間総報酬（自動算出）</label>
              <span class="ce-computed-val">{{ annualTotal.toLocaleString() }} 円</span>
            </div>
          </template>
        </DraggableFieldGrid>

      <!-- マスタ自動コピー通知 -->
      <div v-if="isNew" class="ce-notice">
        <i class="fa-solid fa-circle-info"></i>
        新規作成時、勘定科目マスタと税区分マスタ（デフォルト表示27件）が自動的にコピーされます。
      </div>
      </div>
      <!-- 右カラム: レイアウト管理モード時はパーツパレット -->
      <aside v-if="isLayoutMode && !isPreviewMode" class="ce-palette-panel">
        <FieldPalette
          drag-group="clientLayout"
          :all-fields="layout.fields.value"
          :hidden-keys="layout.hiddenFields.value"
          :selected-field="selectedPaletteField"
          :field-options="layout.fieldOptions.value"
          @restore-field="(key: string) => { layout.toggleFieldVisibility(key, true); layout.restoreFieldToGrid(key); }"
          @hide-field="(key: string) => layout.toggleFieldVisibility(key, false)"
          @delete-field="(key: string) => layout.removeDynamicField(key)"
          @update:field-options="(key: string, opts: import('@/types/fieldLayout').FieldOption[]) => layout.updateFieldOptions(key, opts)"
        />
      </aside>
      <!-- 右カラム: コメント（レイアウト管理モード時は非表示） -->
      <aside v-if="!isLayoutMode" class="ce-comment-panel">
        <h3 class="ce-comment-title"><i class="fa-regular fa-comment-dots"></i> コメント</h3>
        <div class="ce-comment-input-area">
          <div class="ce-mention-wrapper">
            <textarea ref="commentTextarea" v-model="newComment" class="ce-comment-input" :placeholder="UI_MSG.コメント" rows="1" @keydown.ctrl.enter="addComment" @input="onCommentInput" @keydown.exact="onMentionKeydown"></textarea>
            <button class="ce-comment-submit" :disabled="!newComment.trim()" @click="addComment"><i class="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
        <!-- メンションポップアップ（overflow制約回避のためパネル直下に配置） -->
        <div v-if="showMentionPopup" class="ce-mention-popup">
          <div v-if="mentionCandidates.length === 0" class="ce-mention-empty">該当なし</div>
          <button v-for="(s, i) in mentionCandidates" :key="s.uuid" class="ce-mention-item" :class="{ active: i === mentionIndex, inactive: s.status === 'inactive', 'mention-all': s.uuid === '__all__' }" @mousedown.prevent="selectMention(s)"><span v-if="s.uuid === '__all__'" class="ce-mention-all-icon">👥</span><span class="ce-mention-name">{{ s.name }}</span><span v-if="s.nameRomaji" class="ce-mention-romaji">{{ s.nameRomaji }}</span><span v-if="s.status === 'inactive'" class="ce-mention-badge-inactive">停止中</span></button>
        </div>
        <div class="ce-comment-list">
          <div v-if="comments.length === 0" class="ce-comment-empty">コメントはありません。</div>
          <div v-for="c in comments" :key="c.id" class="ce-comment-item">
            <div class="ce-comment-meta">
              <span class="ce-comment-author">{{ c.author }}</span>
              <span class="ce-comment-date">{{ c.date }}</span>
              <button class="ce-comment-delete" title="削除" @click="deleteComment(c.id)"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="ce-comment-body" v-html="renderMentions(c.body)"></p>
          </div>
        </div>
      </aside>
    </div>

    <ConfirmModal :show="modal.confirmState.show" :title="modal.confirmState.title" :message="modal.confirmState.message" :confirm-label="modal.confirmState.confirmLabel" :cancel-label="modal.confirmState.cancelLabel" :variant="modal.confirmState.variant" @confirm="modal.onConfirm" @cancel="modal.onCancel" />
    <NotifyModal :show="modal.notifyState.show" :title="modal.notifyState.title" :message="modal.notifyState.message" :variant="modal.notifyState.variant" @close="modal.onNotifyClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClients, emptyClientForm } from '@/features/client-management/composables/useClients';
import type { Client, ClientForm } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import type { Staff } from '@/features/staff-management/composables/useStaff';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useNotificationCenter } from '@/composables/useNotificationCenter';
import { useModalHelper } from '@/composables/useModalHelper';
import { useDriveFolder } from '@/composables/useDriveFolder';
import { useFieldLayout } from '@/composables/useFieldLayout';
import {
  TYPE_OPTIONS, INDUSTRY_OPTIONS, ACCOUNTING_SOFTWARE_OPTIONS,
  TAX_FILING_OPTIONS, TAX_MODE_OPTIONS, SIMPLIFIED_CATEGORY_OPTIONS,
  TAX_METHOD_OPTIONS, CALCULATION_METHOD_OPTIONS, DEFAULT_PAYMENT_OPTIONS,
  CONSUMPTION_TAX_INTERIM_OPTIONS, NEEDS_OPTIONS, CONTRACT_SCOPE_OPTIONS,
  BOOKKEEPING_TYPE_OPTIONS, YES_NO_OPTIONS, PAYMENT_METHOD_OPTIONS,
  PAYMENT_DAY_OPTIONS, ANNUAL_REVENUE_OPTIONS,
  STATUS_OPTIONS, PLACEHOLDER_UNSET, FISCAL_DAY_END_LABEL,
  getLabel,
} from '@/constants/clientOptions';
import {
  clientSections, clientFieldsFlat,
} from '@/constants/clientFieldDefs';
import { MENTION_ALL_KEYWORD } from '@/constants/vendorOptions';
import DraggableFieldGrid from '@/components/DraggableFieldGrid.vue';
import FieldPalette from '@/components/FieldPalette.vue';
import ContactTable from '@/components/ContactTable.vue';
import type { ContactColumn } from '@/components/ContactTable.vue';
import type { ClientContact } from '@/repositories/types';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NotifyModal from '@/components/NotifyModal.vue';
import CustomFieldModal from '@/components/CustomFieldModal.vue';
import type { CustomFieldDef } from '@/composables/useFieldLayout';
import AddFieldModal from '@/components/AddFieldModal.vue';

import { UI_MSG } from '@/constants/uiMessages';

const route = useRoute();
const router = useRouter();
const { clients, updateClientLocal, addClient, updateSharedFolderId } = useClients();
const { activeStaff: activeStaffList } = useStaff();
const { userName: currentUserName, currentStaffId: myStaffId, isAdmin } = useCurrentUser();
const { sendMentionNotification } = useNotificationCenter();
const modal = useModalHelper();
const { createFolder, renameFolder } = useDriveFolder();

/** フィールドレイアウト管理 */
const layout = useFieldLayout('client', clientSections, clientFieldsFlat);
// デフォルトレイアウトをlocalStorageから読み込み
layout.loadLayout();
/** フラットフィールド一覧（テンプレートで使用） */
const flatFields = layout.getAllFieldsFlat;

/** table部品のフィールド一覧 */
const tableFields = computed(() =>
  layout.getAllFieldsFlat.value.filter(f => f.component === 'table')
);
/** テーブルデータ取得 */
const getTableData = (fieldKey: string): ClientContact[] => {
  return ((form as Record<string, unknown>)[fieldKey] as ClientContact[]) ?? [{}];
};
/** テーブルデータ設定 */
const setTableData = (fieldKey: string, v: ClientContact[]) => {
  (form as Record<string, unknown>)[fieldKey] = v;
};

/** パレットで選択中のフィールド（選択肢編集用） */
const selectedPaletteField = ref<import('@/types/fieldLayout').FieldDef | null>(null);

/** 選択肢文字列→配列を解決するマップ */
const optionsMap: Record<string, readonly import('@/types/fieldLayout').FieldOption[]> = {
  TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  ANNUAL_REVENUE_OPTIONS,
  ACCOUNTING_SOFTWARE_OPTIONS,
  TAX_FILING_OPTIONS,
  TAX_MODE_OPTIONS,
  SIMPLIFIED_CATEGORY_OPTIONS,
  TAX_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS,
  DEFAULT_PAYMENT_OPTIONS,
  CONSUMPTION_TAX_INTERIM_OPTIONS,
  NEEDS_OPTIONS,
  CONTRACT_SCOPE_OPTIONS,
  BOOKKEEPING_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_DAY_OPTIONS,
  STATUS_OPTIONS,
};
/** DFGの自動レンダリングに渡す選択肢解決関数 */
const resolveOptions = (key: string) => optionsMap[key] ?? [];

// カスタムフィールドはlayout.customDefsに統合済み（loadLayout時にAPIから復元）
// 初期化時にカスタムフィールドをlayout.fieldsに追加
for (const def of layout.customDefs.value) {
  layout.addDynamicField({
    key: def.key,
    label: def.label,
    section: def.section,
    component: def.component,
    widthPercent: def.widthPercent,
    order: def.order,
  });
}

/** レイアウト管理モード用変数・ハンドラ */
const isPreviewMode = ref(false);
const showCustomFieldModal = ref(false);
const showAddFieldModal = ref(false);
const addFieldDefaultSection = ref('');
const sectionKeys = clientSections.map(s => s.key);

/** ＋ボタン→追加専用モーダルを開く */
const openAddFieldModal = () => {
  showAddFieldModal.value = true;
};

/** 初期フィールドのキー一覧（削除不可判定用） */
const defaultFieldKeys = layout.defaultFields.map(f => f.key);

/** フィールド管理からのフォーカス：該当フィールドへスクロール＋ハイライト */
const scrollToField = (key: string) => {
  const el = document.querySelector(`[data-field-key="${key}"]`) as HTMLElement | null;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('dfg-flash');
    setTimeout(() => el.classList.remove('dfg-flash'), 1500);
  }
};

/** フィールド追加ハンドラ */
const handleAddField = (payload: { label: string; component: import('@/types/fieldLayout').FieldComponent; section: string }) => {
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const def: CustomFieldDef = {
    key,
    label: payload.label,
    section: payload.section,
    component: payload.component,
    widthPercent: 20,
    order: 100 + layout.customDefs.value.length,
  };
  layout.customDefs.value = [...layout.customDefs.value, def];
  layout.addDynamicField({
    key: def.key,
    label: def.label,
    section: def.section,
    component: def.component,
    widthPercent: def.widthPercent,
    order: def.order,
  });
};

/** フィールド管理保存ハンドラ */
const handleSaveFieldManagement = (payload: {
  customDefs: CustomFieldDef[];
  labelOverrides: Record<string, string>;
  hiddenFields: string[];
  deletedFields: string[];
  fieldOptions: Record<string, import('@/types/fieldLayout').FieldOption[]>;
}) => {
  // カスタムフィールドの差分管理（fieldRows順序を壊さない）
  const oldKeys = new Set(layout.customDefs.value.map(d => d.key));
  const newKeys = new Set(payload.customDefs.map(d => d.key));

  // 削除されたカスタムフィールドを除去
  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      layout.removeDynamicField(key);
    }
  }

  // 新規追加 or 既存更新
  for (const def of payload.customDefs) {
    const existing = layout.fields.value.find(f => f.key === def.key);
    if (existing) {
      // 既存: ラベル・セクション等を更新（fieldRows順序は維持）
      existing.label = def.label;
      existing.section = def.section;
      existing.component = def.component;
    } else {
      // 新規: 追加（addDynamicFieldがfieldRowsにも追加）
      layout.addDynamicField({
        key: def.key,
        label: def.label,
        section: def.section,
        component: def.component,
        widthPercent: def.widthPercent,
        order: def.order,
      });
    }
  }
  layout.customDefs.value = payload.customDefs;

  // ラベル上書きの同期
  for (const key of Object.keys(layout.labelOverrides.value)) {
    layout.removeLabelOverride(key);
  }
  for (const [key, newLabel] of Object.entries(payload.labelOverrides)) {
    layout.updateLabelOverride(key, newLabel);
  }

  // 非表示の同期
  for (const key of [...layout.hiddenFields.value]) {
    layout.toggleFieldVisibility(key, true);
  }
  for (const key of payload.hiddenFields) {
    layout.toggleFieldVisibility(key, false);
  }

  // 論理削除の同期
  const currentDeleted = new Set(layout.deletedFields.value);
  const newDeleted = new Set(payload.deletedFields);
  for (const key of payload.deletedFields) {
    if (!currentDeleted.has(key)) {
      layout.softDeleteField(key);
    }
  }
  for (const key of [...layout.deletedFields.value]) {
    if (!newDeleted.has(key)) {
      layout.restoreDeletedField(key);
    }
  }

  // 選択肢の同期
  for (const [key, opts] of Object.entries(payload.fieldOptions)) {
    if (opts.length > 0) {
      layout.updateFieldOptions(key, opts);
    }
  }
};

const exitLayoutMode = () => {
  // 未保存の変更がある場合のみスナップショットに巻き戻す
  // 保存済み（dirty=false）の場合は現在の状態（=保存後の状態）を維持
  if (layout.isLayoutDirty.value) {
    layout.cancelLayoutEditing();
  } else {
    // 保存済み: 編集状態フラグのみ解除（スナップショット復元しない）
    layout.isLayoutEditing.value = false;
  }
  router.push('/master/clients');
};

/** 一覧画面からの「レイアウト管理」遷移対応 */
const isLayoutMode = computed(() => route.query.mode === 'layout');
// レイアウト管理モードで遷移された場合のみレイアウト編集をON、それ以外は常にOFF
watch(isLayoutMode, (v) => {
  if (v && isAdmin) {
    layout.startLayoutEditing();
  } else {
    layout.isLayoutEditing.value = false;
  }
}, { immediate: true });

/** レイアウト編集キャンセル */
const cancelLayoutEditing = () => {
  layout.cancelLayoutEditing();
};

/** 新規 or 編集判定 */
const clientId = computed(() => route.params.clientId as string | undefined);
const routeIsNew = computed(() => !clientId.value || route.name === 'ClientNew');
/** コピー新規モード（画面遷移なしで新規作成として保存する） */
const isCopyNew = ref(false);
/** 実質的な新規判定（ルート上の新規 or コピー新規） */
const isNew = computed(() => routeIsNew.value || isCopyNew.value);
/** 編集モード（false=閲覧、true=編集） */
const isEditing = ref(false);

const form = reactive<ClientForm>(emptyClientForm());
const staffId = ref('');
const sharedEmail = ref('');
/** 編集前のスナップショット（キャンセル時の復元用） */
let originalSnapshot: string = '';

/** 閲覧モード用ラベル変換（clientOptions.ts の getLabel に統一） */
const accountingSoftwareLabel = computed(() => getLabel(ACCOUNTING_SOFTWARE_OPTIONS, form.accountingSoftware));
const staffLabel = computed(() => {
  if (!staffId.value) return UI_MSG.未設定;
  const s = activeStaffList.value.find(s => s.uuid === staffId.value);
  return s?.name ?? UI_MSG.不明;
});
/** 自動生成URL */
const uploadUrlStaff = computed(() => clientId.value ? `${location.origin}/#/upload/${clientId.value}/staff` : '');
const uploadUrlGuest = computed(() => clientId.value ? `${location.origin}/#/guest/${clientId.value}` : '');
const journalListUrl = computed(() => clientId.value ? `${location.origin}/#/journal-list/${clientId.value}` : '');

/** Drive取込の表示値（自動生成） */
const driveUrlDisplay = computed(() => {
  const c = clientId.value ? clients.value.find(cl => cl.clientId === clientId.value) : null;
  if (!c?.sharedFolderId) return '※保存後に自動生成';
  return `https://drive.google.com/drive/folders/${c.sharedFolderId}`;
});

/** 主な連絡手段の表示値（自動判定: contacts配列から判定） */
const contactDisplay = computed(() => {
  const contacts = (form as Record<string, unknown>).contacts as { method: string; value: string }[] | undefined;
  const chatRow = contacts?.find(c => c.method === 'チャット' && c.value);
  if (chatRow) return 'チャットワーク';
  const emailRow = contacts?.find(c => c.method === 'メール' && c.value);
  if (emailRow) return 'メール';
  // 旧フィールドフォールバック
  if (form.chatRoomUrl) return 'チャットワーク';
  if (form.email) return 'メール';
  return '—';
});

/** DFGに渡す拡張フォームデータ（自動生成フィールドを含む） */
const enrichedFormData = computed(() => ({
  ...(form as unknown as Record<string, unknown>),
  clientId: clientId.value ?? '（自動発番）',
  driveUrl: driveUrlDisplay.value,
  contact: contactDisplay.value,
  staffId: staffId.value,
  sharedEmail: sharedEmail.value,
  uploadUrlStaff: uploadUrlStaff.value,
  uploadUrlGuest: uploadUrlGuest.value,
}));
/** クリップボードコピー */
const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); };

/** スナップショット取得（現在のフォーム状態を文字列化） */
const takeSnapshot = () => JSON.stringify({ ...form, staffId: staffId.value, sharedEmail: sharedEmail.value });

/** 編集モードに入る */
const startEditing = () => {
  originalSnapshot = takeSnapshot();
  isEditing.value = true;
};

/** 変更があるか判定 */
const hasChanges = () => takeSnapshot() !== originalSnapshot;

const annualTotal = computed(() => {
  const monthly = form.advisoryFee + form.bookkeepingFee
    + (form.socialInsuranceFee ?? 0) + (form.payrollFee ?? 0)
    + (form.accountingServiceFee ?? 0) + (form.systemFee ?? 0);
  return monthly * 12 + form.settlementFee + form.taxFilingFee;
});

/** 法人→個人切替時にhasRentalIncomeリセット */
watch(() => form.type, (v) => { if (v === 'corp') form.hasRentalIncome = false; });

/** ファイルアップロードハンドラ */
const handleFileUpload = async (fieldKey: string, files: FileList) => {
  console.log('[ClientEdit] ファイルアップロード開始:', clientId.value, fieldKey, Array.from(files).map(f => f.name));
  if (!clientId.value) { console.warn('[ClientEdit] clientIdがない'); return; }
  for (const file of Array.from(files)) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`/api/attachments/${clientId.value}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok && data.attachment) {
        const current = ((form as Record<string, unknown>)[fieldKey] as unknown[]) ?? [];
        const updated = [...current, data.attachment];
        (form as Record<string, unknown>)[fieldKey] = updated;
        console.log(`[ClientEdit] form[${fieldKey}]更新:`, updated.length, '件');
      } else {
        console.error('[ClientEdit] APIエラー:', data);
      }
    } catch (err) {
      console.error('[ClientEdit] ファイルアップロード失敗:', err);
    }
  }
};

/** ファイル削除ハンドラ */
const handleFileDelete = async (fieldKey: string, fileId: string) => {
  if (!clientId.value) return;
  try {
    await fetch(`/api/attachments/${clientId.value}/${fileId}`, { method: 'DELETE' });
    const list = (form as Record<string, unknown>)[fieldKey] as { id: string }[] ?? [];
    (form as Record<string, unknown>)[fieldKey] = list.filter(f => f.id !== fileId);
  } catch (err) {
    console.error('[ClientEdit] ファイル削除失敗:', err);
  }
};

/** メンション用スタッフリスト（useStaffから取得） */
const { staffList: mentionStaffList } = useStaff();

/** 既存データをフォームに読み込み */
const loadClientData = () => {
  if (clientId.value) {
    const c = clients.value.find(cl => cl.clientId === clientId.value);
    if (!c) { router.replace('/master/clients'); return; }
    const { clientId: _id, contact, extraFields: ef, ...rest } = c;
    Object.assign(form, { ...rest, contactType: contact.type, contactValue: contact.value });
    // カスタムフィールドの値をextraFieldsからフォームのトップレベルに展開
    if (ef) {
      for (const [k, v] of Object.entries(ef)) {
        (form as Record<string, unknown>)[k] = v;
      }
    }
    // 旧フィールド→contacts自動マッピング（後方互換）
    if (!c.contacts || c.contacts.length < 3) {
      const defaultContacts = [
        { name: '', method: '電話', value: c.phoneNumber || '', usage: '', memo: '' },
        { name: '', method: 'メール', value: c.email || '', usage: '', memo: '' },
        { name: '', method: 'チャット', value: c.chatRoomUrl || '', usage: '', memo: '' },
      ];
      // 既存contactsがあればマージ
      if (c.contacts) {
        for (let i = 0; i < c.contacts.length && i < 3; i++) {
          const src = c.contacts[i];
          const dst = defaultContacts[i];
          if (!src || !dst) continue;
          defaultContacts[i] = {
            name: src.name ?? dst.name,
            method: src.method ?? dst.method,
            value: src.value ?? dst.value,
            usage: src.usage ?? dst.usage,
            memo: src.memo ?? dst.memo,
          };
        }
      }
      (form as Record<string, unknown>).contacts = defaultContacts;
    }
    staffId.value = c.staffId ?? '';
    sharedEmail.value = c.sharedEmail ?? '';
  }
};

/** スナップショットからフォームを復元 */
const restoreFromSnapshot = () => {
  try {
    const data = JSON.parse(originalSnapshot);
    const { staffId: sId, sharedEmail: sEmail, ...rest } = data;
    Object.assign(form, rest);
    staffId.value = sId ?? '';
    sharedEmail.value = sEmail ?? '';
  } catch { /* 復元失敗時は何もしない */ }
};

onMounted(async () => {
  initPage();
});

/** ルート変更時（同一コンポーネント間遷移）にフォームを再初期化 */
watch(() => route.fullPath, () => {
  initPage();
});

/** ページ初期化（新規/既存の判定とフォーム設定） */
const initPage = () => {
  // コピー新規モードをリセット
  isCopyNew.value = false;
  if (routeIsNew.value) {
    // 新規作成: フォームをまっさらにして編集モード
    Object.assign(form, emptyClientForm());
    staffId.value = '';
    sharedEmail.value = '';
    isEditing.value = true;
    comments.value = [];
  } else {
    // 既存顧問先: データ読み込み → 閲覧モード
    loadClientData();
    isEditing.value = false;
  }
  originalSnapshot = takeSnapshot();
  loadComments();
};

/** キャンセル処理 */
const onCancel = async () => {
  // 変更があればconfirm
  if (hasChanges()) {
    const ok = await modal.confirm({ title: UI_MSG.変更破棄確認, message: UI_MSG.変更破棄補足, confirmLabel: UI_MSG.破棄する, cancelLabel: UI_MSG.編集を続ける, variant: 'danger' });
    if (!ok) return;
  }

  if (routeIsNew.value) {
    // 新規登録 or コピー新規: 直前の画面に戻る
    router.back();
    return;
  }

  // 既存編集: スナップショットから復元 → 閲覧モードに戻る（画面遷移なし）
  restoreFromSnapshot();
  isEditing.value = false;
  isCopyNew.value = false;
};

/** コピーして新規作成（画面遷移なし） */
const copyAndCreate = () => {
  // clientId・3コードをクリアして新規作成モードに切替
  form.threeCode = '';
  isCopyNew.value = true;
  isEditing.value = true;
  comments.value = [];
  originalSnapshot = takeSnapshot();
};

// --- コメント機能 ---
interface ClientComment { id: string; author: string; body: string; date: string; }
const newComment = ref('');
const comments = ref<ClientComment[]>([]);
const commentStorageKey = computed(() => `client-comments-${clientId.value || 'new'}`);
const commentTextarea = ref<HTMLTextAreaElement | null>(null);

const loadComments = async () => {
  if (!clientId.value) { comments.value = []; return; }
  try {
    // localStorage → API移行（初回のみ）
    const lsKey = commentStorageKey.value;
    const lsRaw = localStorage.getItem(lsKey);
    if (lsRaw) {
      const lsComments = JSON.parse(lsRaw) as ClientComment[];
      if (lsComments.length > 0) {
        // localStorageのデータをAPIに移行
        for (const c of lsComments) {
          await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...c, entityType: 'client', entityId: clientId.value }),
          });
        }
        console.log(`[ClientEdit] コメント${lsComments.length}件をlocalStorage→APIに移行`);
      }
      localStorage.removeItem(lsKey);
    }
    // APIからコメント取得
    const res = await fetch(`/api/comments?entityType=client&entityId=${clientId.value}`);
    const data = await res.json();
    comments.value = (data.comments ?? []) as ClientComment[];
  } catch { comments.value = []; }
};
const saveComment = async (comment: ClientComment) => {
  if (!clientId.value) return;
  await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...comment, entityType: 'client', entityId: clientId.value }),
  });
};
const addComment = async () => {
  if (!newComment.value.trim()) return;
  showMentionPopup.value = false;
  const body = newComment.value.trim();
  const cmtId = `cmt-${crypto.randomUUID().slice(0, 8)}`;
  const comment: ClientComment = { id: cmtId, author: currentUserName.value, body, date: new Date().toLocaleString('ja-JP') };
  comments.value.unshift(comment);
  newComment.value = '';
  // テキストエリアの高さをリセット
  if (commentTextarea.value) {
    commentTextarea.value.style.height = 'auto';
  }
  await saveComment(comment);
  // メンション通知をサーバーAPIに委譲（フロントにロジックなし）
  if (body.includes('@')) {
    sendMentionNotification({
      commentBody: body,
      authorName: currentUserName.value,
      authorStaffId: myStaffId.value ?? '',
      clientId: clientId.value ?? '',
      clientName: form.companyName || UI_MSG.新規顧問先,
    });
  }
};
const deleteComment = async (id: string) => {
  comments.value = comments.value.filter(c => c.id !== id);
  await fetch(`/api/comments/${id}`, { method: 'DELETE' });
};

/** @メンションをハイライト表示 */
const renderMentions = (text: string): string => {
  // URL自動リンク化（メンション処理の前に実行）
  let html = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" class="ce-comment-link">$1</a>');
  // @メンションハイライト
  html = html.replace(/@([\u3000-\u9FFF\w\s]+?)(?=\s|$|@)/g, '<span class="ce-mention-tag">@$1</span>');
  return html;
};

// --- メンションポップアップ ---
const showMentionPopup = ref(false);
const mentionQuery = ref('');
const mentionStart = ref(0);
const mentionIndex = ref(0);

const mentionCandidates = computed(() => {
  // @all 候補を先頭に追加
  const allEntry: Staff = { uuid: '__all__', name: UI_MSG.全員候補名, email: '', role: 'general' as const, status: 'active' as const };
  const staffEntries = mentionStaffList.value;
  if (!mentionQuery.value) return [allEntry, ...staffEntries];
  const q = mentionQuery.value.toLowerCase();
  if ('all'.includes(q) || MENTION_ALL_KEYWORD.includes(q)) {
    return [allEntry, ...staffEntries.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.nameRomaji && s.nameRomaji.toLowerCase().includes(q))
    )];
  }
  return staffEntries.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    (s.nameRomaji && s.nameRomaji.toLowerCase().includes(q))
  );
});

const onCommentInput = () => {
  const ta = commentTextarea.value;
  if (!ta) return;
  // テキストエリア自動拡張
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
  const pos = ta.selectionStart;
  const text = newComment.value.slice(0, pos);
  const atMatch = text.match(/@([^@]*)$/);
  if (atMatch) {
    const query = atMatch[1] ?? '';
    // 確定済みメンションチェック: @名前 の後にスペースがあれば確定済み
    const isConfirmed = query.startsWith('all ') ||
      mentionStaffList.value.some(s => query.startsWith(s.name + ' '));
    if (isConfirmed) {
      showMentionPopup.value = false;
      return;
    }
    showMentionPopup.value = true;
    mentionQuery.value = query;
    mentionStart.value = pos - atMatch[0].length;
    mentionIndex.value = 0;
  } else {
    showMentionPopup.value = false;
  }
};

const onMentionKeydown = (e: KeyboardEvent) => {
  if (!showMentionPopup.value) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mentionIndex.value = Math.min(mentionIndex.value + 1, mentionCandidates.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    mentionIndex.value = Math.max(mentionIndex.value - 1, 0);
  } else if (e.key === 'Enter' && !e.ctrlKey) {
    e.preventDefault();
    const candidate = mentionCandidates.value[mentionIndex.value];
    if (candidate) selectMention(candidate);
  } else if (e.key === 'Escape') {
    showMentionPopup.value = false;
  }
};

const selectMention = (staff: Staff) => {
  if (!commentTextarea.value) return;
  const insertName = staff.uuid === '__all__' ? 'all' : staff.name;
  const before = newComment.value.slice(0, mentionStart.value);
  const after = newComment.value.slice(commentTextarea.value?.selectionStart ?? mentionStart.value);
  newComment.value = `${before}@${insertName} ${after}`;
  showMentionPopup.value = false;
  nextTick(() => {
    const pos = mentionStart.value + insertName.length + 2;
    commentTextarea.value?.setSelectionRange(pos, pos);
    commentTextarea.value?.focus();
  });
};

const saveClient = async () => {
  if (!form.threeCode) {
    await modal.notify({ title: UI_MSG.コード必須, message: UI_MSG.コード必須補足, variant: 'warning' });
    return;
  }
  if (!form.companyName && !form.repName) {
    await modal.notify({ title: UI_MSG.名前必須, variant: 'warning' });
    return;
  }
  if (form.threeCode) {
    const dup = clients.value.find(c => c.threeCode === form.threeCode && c.clientId !== clientId.value);
    if (dup) {
      await modal.notify({ title: UI_MSG.コード重複, message: `「${dup.companyName}（${dup.clientId}）」${UI_MSG.コード既使用}`, variant: 'warning' });
      return;
    }
  }
  const { contactType, contactValue, ...fields } = form;
  // デフォルトフォームのキー以外を全てextraFieldsに動的に集約
  const defaultKeys = new Set(Object.keys(emptyClientForm()));
  defaultKeys.add('contactType');
  defaultKeys.add('contactValue');
  const extraFields: Record<string, unknown> = {};
  const cleanFields = { ...fields } as Record<string, unknown>;
  for (const key of Object.keys(cleanFields)) {
    if (!defaultKeys.has(key)) {
      extraFields[key] = cleanFields[key];
      delete cleanFields[key];
    }
  }
  if (Object.keys(extraFields).length > 0) {
    cleanFields.extraFields = extraFields;
  }

  // 自動算出: 月次合計・年間総報酬を計算
  const monthly = (form.advisoryFee || 0) + (form.bookkeepingFee || 0)
    + ((form as any).socialInsuranceFee ?? 0) + ((form as any).payrollFee ?? 0)
    + ((form as any).accountingServiceFee ?? 0) + ((form as any).systemFee ?? 0);
  cleanFields.monthlyTotal = monthly;
  cleanFields.annualTotal = monthly * 12 + (form.settlementFee || 0) + (form.taxFilingFee || 0);

  // contacts→旧フィールド同期（後方互換）
  const contacts = (cleanFields.contacts as { method: string; value: string }[]) ?? [];
  const phoneRow = contacts.find(r => r.method === '電話');
  const emailRow = contacts.find(r => r.method === 'メール');
  const chatRow = contacts.find(r => r.method === 'チャット');
  cleanFields.phoneNumber = phoneRow?.value || '';
  cleanFields.email = emailRow?.value || '';
  cleanFields.chatRoomUrl = chatRow?.value || '';

  if (isNew.value) {
    // 新規: サーバーがIDを発番して返す
    const data = { ...cleanFields, staffId: staffId.value || null, sharedEmail: sharedEmail.value, contact: { type: contactType, value: contactValue } };
    try {
      const saved = await addClient(data as Omit<Client, 'clientId'>);
      createDriveFolderForClient(saved).catch(e => console.error('[clients] Driveフォルダ作成失敗:', e));
      await modal.notify({ title: `「${saved.companyName}」${UI_MSG.追加完了}`, message: UI_MSG.マスタ自動コピー完了, variant: 'success' });
      router.push(`/master/clients/${saved.clientId}`);
    } catch (err) {
      await modal.notify({ title: UI_MSG.顧問先追加失敗, message: String(err), variant: 'warning' });
    }
  } else {
    // 既存更新
    const id = clientId.value!;
    const data: Client = { ...cleanFields, clientId: id, staffId: staffId.value || null, sharedEmail: sharedEmail.value, contact: { type: contactType, value: contactValue } } as Client;
    try {
      const old = clients.value.find(c => c.clientId === id);
      await updateClientLocal(id, data);
      if (old && old.threeCode !== data.threeCode) {
        const renamed = await renameDriveFolderForClient(data);
        if (renamed) await modal.notify({ title: `${UI_MSG.ドライブ名変更}${renamed}${UI_MSG.に変更}`, variant: 'success' });
      }
      await modal.notify({ title: `「${data.companyName}」${UI_MSG.更新完了}`, variant: 'success' });
      isEditing.value = false;
      isCopyNew.value = false;
      originalSnapshot = takeSnapshot();
    } catch (err) {
      await modal.notify({ title: UI_MSG.顧問先更新失敗, message: String(err), variant: 'warning' });
    }
  }
};


/** Driveフォルダ自動作成 */
const createDriveFolderForClient = async (client: Client) => {
  const folderName = `${client.threeCode}_${client.companyName}`;
  try {
    const folderId = await createFolder(folderName, client.sharedEmail || undefined);
    updateSharedFolderId(client.clientId, folderId);
  } catch (e) { console.error(`[clients] Driveフォルダ作成失敗:`, e); }
};

/** Driveフォルダリネーム */
const renameDriveFolderForClient = async (client: Client): Promise<string | null> => {
  if (!client.sharedFolderId) return null;
  const newName = `${client.threeCode}_${client.companyName}`;
  try {
    return await renameFolder(client.sharedFolderId, newName);
  } catch (e) { console.error(`[clients] Driveフォルダリネーム失敗:`, e); return null; }
};
</script>

<style scoped>
/* ページ全体 */
.ce-page { height: 100%; display: flex; flex-direction: column; background: #fff; font-family: 'Meiryo', 'Noto Sans JP', sans-serif; font-size: 13px; }

/* ヘッダー1行目: 顧問先管理タイトル */
.ce-header-top { padding: 12px 24px; background: #0284c7; }
.ce-page-label { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }

/* ヘッダー2行目 */
.ce-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.ce-header-left { display: flex; align-items: center; gap: 16px; }
.ce-header-right { display: flex; align-items: center; gap: 8px; }
.ce-back-btn { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 6px; transition: background 0.15s; }
.ce-back-btn:hover { background: #eff6ff; }
.ce-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.ce-client-id { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }

/* ボタン */
.ce-btn { border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.ce-btn-save { background: #3b82f6; color: #fff; }
.ce-btn-save:hover { background: #2563eb; }
.ce-btn-cancel { background: #f1f5f9; color: #475569; }
.ce-btn-cancel:hover { background: #e2e8f0; }
.ce-btn-layout-cancel { background: #ef4444; color: #fff; }
.ce-btn-layout-cancel:hover { background: #dc2626; }
.ce-btn-undo, .ce-btn-redo { background: #f1f5f9; color: #475569; min-width: 32px; padding: 4px 8px; }
.ce-btn-undo:hover, .ce-btn-redo:hover { background: #e2e8f0; }
.ce-btn-undo:disabled, .ce-btn-redo:disabled { opacity: 0.35; cursor: not-allowed; }
.ce-btn-preview { background: #f1f5f9; color: #475569; padding: 4px 12px; gap: 4px; display: inline-flex; align-items: center; }
.ce-btn-preview:hover { background: #e2e8f0; }
.ce-btn-preview.active { background: #3b82f6; color: #fff; }

.ce-link-url { color: #2563eb; text-decoration: underline; word-break: break-all; }
.ce-btn-custom { background: #8b5cf6; color: #fff; }
.ce-btn-custom:hover { background: #7c3aed; }
.ce-btn-back { background: none; border: 1px solid #d1d5db; color: #475569; display: flex; align-items: center; gap: 6px; }
.ce-btn-back:hover { background: #f1f5f9; color: #1e293b; }

/* 閲覧モード用テキスト表示（薄灰色背景の枠付きボックス） */
.ce-readonly { font-size: 13px; color: #333; padding: 6px 8px; min-height: 18px; line-height: 1.4; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 3px; }
.ce-readonly.ce-muted { color: #999; font-size: 12px; background: #fafafa; }
.ce-readonly.ce-code { font-family: 'Consolas', 'Monaco', monospace; font-weight: 700; font-size: 13px; color: #0284c7; letter-spacing: 1px; }
.ce-btn-warn { background: #fef3c7; color: #92400e; }
.ce-btn-warn:hover { background: #fde68a; }
.ce-btn-danger { background: #fee2e2; color: #991b1b; }
.ce-btn-danger:hover { background: #fecaca; }
.ce-btn-restore { background: #dcfce7; color: #166534; }
.ce-btn-restore:hover { background: #bbf7d0; }

/* ボディ */
.ce-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; display: flex; gap: 16px; }
.ce-main { flex: 1; min-width: 0; overflow-y: auto; }

/* レイアウト管理モード: パーツパレット（右1/4） */
.ce-palette-panel {
  flex: 0 0 25%;
  max-width: 280px;
  min-width: 200px;
  overflow-y: auto;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

/* セクション（kintone風: フラット、カードなし） */
.ce-section { background: none; border-radius: 0; padding: 0; margin-bottom: 8px; box-shadow: none; }
.ce-section-title { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 12px; padding: 6px 12px; border-bottom: none; background: #4a8dc9; border-radius: 0; }

/* グリッド */
.ce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.ce-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; }
.ce-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 12px; }
.ce-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px 12px; }
.ce-field-wide { grid-column: span 2; }

/* フィールド */
.ce-field { display: flex; flex-direction: column; gap: 2px; }
.ce-field label { font-size: 11px; font-weight: 700; color: #333; }
.ce-input { width: 100%; border: 1px solid #ccc; border-radius: 3px; padding: 6px 8px; font-size: 13px; transition: border-color 0.15s; background: #fff; box-sizing: border-box; }
.ce-input:focus { border-color: #4a8dc9; outline: none; box-shadow: 0 0 0 2px rgba(74,141,201,0.15); }
.ce-input:disabled { background: #f5f5f5; color: #999; }
.ce-select { width: 100%; border: 1px solid #ccc; border-radius: 3px; padding: 6px 8px; font-size: 13px; background: #fff; box-sizing: border-box; }
.ce-w-sm { max-width: 160px; }
.ce-hint { font-size: 10px; color: #999; font-weight: 400; }
.ce-required { color: #e74c3c; font-weight: 700; font-size: 13px; }

/* ラジオ/チェックボックス */
.ce-radio-group { display: flex; gap: 16px; align-items: center; }
.ce-radio-group label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.ce-checkbox { display: flex; align-items: center; gap: 6px; cursor: pointer; }

/* 日付グループ */
.ce-date-group { display: flex; align-items: center; gap: 8px; }

/* 金額 */
.ce-amount { display: flex; align-items: center; gap: 8px; }
.ce-amount span { font-size: 13px; color: #475569; }
.ce-computed { background: #f8fafc; padding: 12px; border-radius: 8px; }
.ce-computed-val { font-size: 16px; font-weight: 700; color: #1e293b; }

/* 通知 */
.ce-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #1e40af; display: flex; align-items: center; gap: 8px; }

/* アクションアイコン */
.ce-action-icons { display: flex; gap: 4px; margin-left: 8px; }
.ce-icon-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #d1d5db; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.15s; }
.ce-icon-btn:hover { background: #f1f5f9; color: #3b82f6; border-color: #3b82f6; }
.ce-icon-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.ce-icon-active:hover { background: #2563eb; }

/* コメントパネル */
.ce-comment-panel { width: 320px; flex-shrink: 0; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; max-height: calc(100vh - 100px); }
.ce-comment-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; padding: 16px 16px 12px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
.ce-comment-input-area { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.ce-comment-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 40px 8px 12px; font-size: 13px; resize: none; font-family: inherit; overflow: hidden; min-height: 36px; box-sizing: border-box; field-sizing: content; }
.ce-comment-input:focus { border-color: #3b82f6; outline: none; }
.ce-comment-submit { position: absolute; right: 8px; bottom: 6px; width: 28px; height: 28px; border-radius: 50%; border: none; background: #3b82f6; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; transition: background 0.15s; flex-shrink: 0; }
.ce-comment-submit:hover { background: #2563eb; }
.ce-comment-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
.ce-comment-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.ce-comment-empty { padding: 24px 16px; text-align: center; color: #94a3b8; font-size: 13px; }
.ce-comment-item { padding: 10px 16px; border-bottom: 1px solid #f8fafc; }
.ce-comment-item:hover { background: #f8fafc; }
.ce-comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ce-comment-author { font-size: 12px; font-weight: 600; color: #1e293b; }
.ce-comment-date { font-size: 10px; color: #94a3b8; }
.ce-comment-delete { background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 11px; margin-left: auto; padding: 2px; }
.ce-comment-delete:hover { color: #ef4444; }
.ce-comment-body { font-size: 13px; color: #475569; margin: 0; white-space: pre-wrap; line-height: 1.5; }

/* メンション */
.ce-mention-wrapper { position: relative; }
.ce-mention-popup { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); max-height: 360px; overflow-y: auto; z-index: 10; margin: 0 0 4px 0; }
.ce-mention-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border: none; background: none; text-align: left; font-size: 13px; cursor: pointer; color: #1e293b; transition: background 0.1s; border-bottom: 1px solid #f8fafc; }
.ce-mention-item:last-child { border-bottom: none; }
.ce-mention-item:hover, .ce-mention-item.active { background: #eff6ff; color: #1d4ed8; }
.ce-mention-name { font-weight: 600; }
.ce-mention-romaji { font-size: 12px; color: #64748b; font-style: italic; }
.ce-mention-item.inactive { opacity: 0.5; }
.ce-mention-badge-inactive { font-size: 10px; color: #ef4444; background: #fee2e2; padding: 1px 6px; border-radius: 8px; margin-left: auto; }
.ce-mention-item.mention-all { background: #eff6ff; border-bottom: 2px solid #dbeafe; }
.ce-mention-item.mention-all .ce-mention-name { color: #2563eb; }
.ce-mention-all-icon { font-size: 16px; }
.ce-mention-empty { padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; }
.ce-comment-body :deep(.ce-mention-tag) { color: #2563eb; font-weight: 600; background: #eff6ff; padding: 0 4px; border-radius: 3px; }
.ce-comment-body :deep(.ce-comment-link) { color: #2563eb; text-decoration: underline; word-break: break-all; }
.ce-comment-body :deep(.ce-comment-link:hover) { color: #1d4ed8; }

/* Kintone拡張スタイル */
.ce-sub-title { font-size: 13px; font-weight: 700; color: #fff; margin: 12px 0 8px; padding: 4px 10px; background: #7fb0d4; border-radius: 0; border-bottom: none; }
.ce-warn-text { color: #ef4444; font-size: 10px; font-weight: 400; }
.ce-grid-full { display: grid; grid-template-columns: 1fr; gap: 16px; }
.ce-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
.ce-pre-wrap { white-space: pre-wrap; }
.ce-url-row { display: flex; align-items: center; gap: 6px; }
.ce-url-text { font-size: 12px; color: #64748b; word-break: break-all; }
.ce-copy-btn { background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; cursor: pointer; color: #64748b; font-size: 12px; transition: all 0.15s; }
.ce-copy-btn:hover { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
.ce-link-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #eff6ff; color: #2563eb; border-radius: 6px; font-size: 13px; text-decoration: none; transition: background 0.15s; }
.ce-link-btn:hover { background: #dbeafe; }
.ce-status-active { color: #16a34a; font-weight: 600; }
.ce-status-suspension { color: #d97706; font-weight: 600; }
.ce-status-inactive { color: #dc2626; font-weight: 600; }

/* レイアウト編集ボタン */
.ce-icon-active { background: #dbeafe !important; color: #2563eb !important; border-color: #2563eb !important; }
.ce-icon-disabled { opacity: 0.4; cursor: not-allowed !important; }
.ce-icon-disabled:hover { background: inherit; color: inherit; }
.ce-btn-sm { padding: 4px 10px; font-size: 12px; border-radius: 4px; }
</style>
