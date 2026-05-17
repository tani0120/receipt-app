<template>
  <div class="ce-page">
    <!-- ヘッダー1行目: ページタイトル -->
    <div class="ce-header-top">
      <span class="ce-page-label">進捗管理</span>
    </div>
    <!-- ヘッダー2行目: アクション -->
    <div class="ce-header">
      <div class="ce-header-left">
        <button class="ce-btn ce-btn-cancel" @click="goBack">キャンセル</button>
      </div>
      <div class="ce-header-right">
        <div class="ce-action-icons">
          <!-- レイアウト編集ボタン（常時表示、管理者のみ有効） -->
          <button class="ce-icon-btn" :class="{ 'ce-icon-active': layout.isLayoutEditing.value, 'ce-icon-disabled': !isAdmin }" :title="!isAdmin ? 'レイアウト編集（管理者のみ）' : layout.isLayoutEditing.value ? 'レイアウト編集終了' : 'レイアウト編集'" :disabled="!isAdmin" @click="layout.isLayoutEditing.value = !layout.isLayoutEditing.value"><i class="fa-solid fa-grip"></i></button>
          <template v-if="layout.isLayoutEditing.value && isAdmin">
            <button class="ce-btn ce-btn-save ce-btn-sm" :disabled="!layout.isLayoutDirty.value" @click="layout.saveLayout(currentUserName ?? '不明')"><i class="fa-solid fa-save"></i> レイアウト保存</button>
            <button class="ce-btn ce-btn-cancel ce-btn-sm" :disabled="!layout.isLayoutDirty.value" @click="layout.cancelLayoutEditing()"><i class="fa-solid fa-xmark"></i> レイアウトキャンセル</button>
            <button class="ce-btn ce-btn-cancel ce-btn-sm" @click="layout.resetLayout()">初期化</button>
          </template>
        </div>
      </div>
    </div>

    <div class="ce-body">
      <!-- 左カラム: フォーム -->
      <div class="ce-main">
        <!-- フラットレイアウト: DraggableFieldGridで全フィールドを管理 -->
        <DraggableFieldGrid
          :fields="flatFields"
          :is-layout-editing="layout.isLayoutEditing.value"
          :form-data="(formData as unknown as Record<string, unknown>)"
          :is-editing="false"
          :resolve-options="resolveOptions"
          :field-rows="layout.getFieldRows.value"
          @update:rows="(rows: string[][]) => layout.updateAllRows(rows)"
          :staff-list="activeStaffList"
          :drag-group="layout.isLayoutEditing.value ? 'progressLayout' : undefined"
          @update:order="(keys: string[]) => layout.updateFieldOrderFlat(keys)"
          @update:width="(key: string, span: number) => layout.updateFieldWidth(key, span)"
          @update:lineBreak="(key: string, val: boolean) => layout.updateFieldLineBreak(key, val)"
          @hide-field="(key: string) => layout.toggleFieldVisibility(key, false)"
          @label-edit="(key: string, label: string) => layout.updateLabelOverride(key, label)"
          @update:headingSize="(key: string, size: number) => layout.updateHeadingSize(key, size)"
          @update:headingBg="(key: string, color: string) => layout.updateHeadingBg(key, color)"
          @update:spacerHeight="(key: string, height: number) => layout.updateSpacerHeight(key, height)"
          @update:fieldValue="() => {}"
          @field-added="(field: import('@/types/fieldLayout').FieldDef) => layout.addDynamicField(field)"
        >
          <!-- ステータスフィールド -->
          <template #status="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #threeCode="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #companyName="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #staffName="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #fiscalMonth="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #shareStatus="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #receivedDate="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #unsorted="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #unexported="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
          <template #jobStatus="{ field }"><div class="ce-field"><label>{{ field.label }}</label><span class="ce-readonly-val">—</span></div></template>
        </DraggableFieldGrid>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useFieldLayout } from '@/composables/useFieldLayout';
import { progressSections, progressFieldsFlat } from '@/constants/progressFieldDefs';
import DraggableFieldGrid from '@/components/DraggableFieldGrid.vue';

const route = useRoute();
const router = useRouter();
const { activeStaff: activeStaffList } = useStaff();
const { userName: currentUserName, isAdmin } = useCurrentUser();

/** フィールドレイアウト管理 */
const layout = useFieldLayout('progress', progressSections, progressFieldsFlat);
const flatFields = layout.getAllFieldsFlat;

/** 選択肢解決関数（DFG自動レンダリング用） */
const resolveOptions = (_optionsKey: string): readonly { value: string; label: string }[] => {
  return [];
};

/** ダミーフォームデータ（レイアウト管理専用のため空） */
const formData = reactive<Record<string, unknown>>({});

/** 一覧画面からの「レイアウト管理」遷移対応 */
const isLayoutMode = computed(() => route.name === 'ProgressLayout');
watch(isLayoutMode, (v) => {
  if (v && isAdmin) {
    layout.startLayoutEditing();
  } else if (!v) {
    layout.isLayoutEditing.value = false;
  }
}, { immediate: true });

onMounted(() => {
  layout.loadLayout();
});

const goBack = () => router.push('/master/progress');
</script>

<style scoped>
/* ページ全体 */
.ce-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  font-family: "Meiryo", "Noto Sans JP", sans-serif;
  font-size: 13px;
}

/* ヘッダー1行目: 進捗管理タイトル */
.ce-header-top {
  padding: 12px 24px;
  background: #0284c7;
}
.ce-page-label {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

/* ヘッダー2行目 */
.ce-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.ce-header-left { display: flex; align-items: center; gap: 16px; }
.ce-header-right { display: flex; align-items: center; gap: 8px; }

/* ボタン */
.ce-btn {
  border: none; padding: 8px 16px; border-radius: 6px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.ce-btn-save { background: #3b82f6; color: #fff; }
.ce-btn-save:hover { background: #2563eb; }
.ce-btn-cancel { background: #f1f5f9; color: #475569; }
.ce-btn-cancel:hover { background: #e2e8f0; }
.ce-btn-sm { font-size: 12px; padding: 5px 10px; }
.ce-btn-save:disabled, .ce-btn-cancel:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }

/* アイコンボタン */
.ce-action-icons { display: flex; align-items: center; gap: 8px; }
.ce-icon-btn {
  width: 36px; height: 36px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; cursor: pointer; display: flex;
  align-items: center; justify-content: center; font-size: 14px; transition: all 0.15s;
}
.ce-icon-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
.ce-icon-active { background: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }
.ce-icon-disabled { opacity: 0.4; cursor: not-allowed; }

/* ボディ */
.ce-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; display: flex; gap: 16px; }
.ce-main { flex: 1; min-width: 0; overflow-y: auto; }

/* フィールド表示 */
.ce-field { margin-bottom: 8px; }
.ce-field label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.ce-readonly-val { font-size: 13px; color: #94a3b8; }
</style>
<!-- 進捗管理レイアウト編集ページ -->
