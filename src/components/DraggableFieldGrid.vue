<template>
  <div
    class="dfg-wrapper"
    :style="wrapperStyle"
  >
    <div ref="containerRef" class="dfg-container">
      <!-- 行ベースレイアウト -->
      <div v-if="localRows.length" class="dfg-rows">
        <div v-for="(row, rowIdx) in localRows" :key="'row-' + rowIdx" class="dfg-row">
          <VueDraggable
            :model-value="row"
            @update:model-value="(val: FieldDef[]) => onRowModelUpdate(rowIdx, val)"
            :disabled="!isLayoutEditing"
            :animation="200"
            :group="getRowDragGroup(row)"
            ghost-class="dfg-ghost"
            drag-class="dfg-drag"
            class="dfg-row-drag-area"
            @end="onRowDragEnd(rowIdx)"
            @add="onRowDragAdd(rowIdx, $event)"
          >
            <template v-for="field in row" :key="field.key">
              <div
                class="dfg-item"
                :class="{ 'dfg-item-selected': isLayoutEditing && selectedFieldKey === field.key, 'dfg-draggable': isLayoutEditing }"
                :style="itemStyle(field)"
                :data-field-key="field.key"
                @click="isLayoutEditing ? emit('select-field', field) : undefined"
              >
                <!-- heading -->
                <template v-if="field.component === 'heading'">
                  <div class="dfg-heading" :style="{ fontSize: (field.headingSize || 14) + 'px', background: field.headingBg || '#4a8dc9', color: field.headingColor || '#fff' }">
                    <input v-if="isLayoutEditing" type="text" :value="field.label" class="dfg-heading-input" :style="{ fontSize: (field.headingSize || 14) + 'px', color: field.headingColor || '#fff' }" @blur="onLabelBlur(field.key, $event)" @keydown.enter="($event.target as HTMLInputElement).blur()">
                    <span v-else>{{ field.label }}</span>
                  </div>
                  <div v-if="isLayoutEditing" class="dfg-heading-settings">
                    <label>サイズ:
                      <select :value="field.headingSize || 14" @change="emit('update:headingSize', field.key, Number(($event.target as HTMLSelectElement).value))">
                        <option :value="12">12px</option><option :value="13">13px</option><option :value="14">14px</option><option :value="16">16px</option><option :value="18">18px</option>
                      </select>
                    </label>
                    <label>背景: <input type="color" :value="field.headingBg || '#4a8dc9'" @input="emit('update:headingBg', field.key, ($event.target as HTMLInputElement).value)"></label>
                    <label>文字色: <input type="color" :value="field.headingColor || '#ffffff'" @input="emit('update:headingColor', field.key, ($event.target as HTMLInputElement).value)"></label>
                  </div>
                </template>
                <!-- spacer -->
                <template v-else-if="field.component === 'spacer'">
                  <div class="dfg-spacer" :style="{ height: (field.spacerHeight || 20) + 'px' }">
                    <span v-if="isLayoutEditing" class="dfg-spacer-label">スペーサー {{ field.spacerHeight || 20 }}px</span>
                  </div>
                  <div v-if="isLayoutEditing" class="dfg-spacer-settings">
                    <label>高さ: <input type="range" min="10" max="60" :value="field.spacerHeight || 20" @input="emit('update:spacerHeight', field.key, Number(($event.target as HTMLInputElement).value))"> <span>{{ field.spacerHeight || 20 }}px</span></label>
                  </div>
                </template>
                <!-- 通常フィールド -->
                <template v-else>
                  <div class="dfg-label-area">
                    <input v-if="isLayoutEditing" type="text" :value="field.label" class="dfg-label-input" @blur="onLabelBlur(field.key, $event)" @keydown.enter="($event.target as HTMLInputElement).blur()">
                    <label v-else class="dfg-label">{{ field.label }}</label>
                  </div>
                  <div class="dfg-content">
                    <slot :name="field.key" :field="field">
                      <div v-if="formData" class="ce-field" :class="field.cssClass">
                        <template v-if="field.component === 'readonly' || field.alwaysReadonly"><span class="ce-readonly" :class="field.cssClass">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'text'"><input v-if="isEditing" type="text" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :class="{ 'ce-w-sm': field.smallWidth }" :placeholder="field.placeholder" :maxlength="field.maxLength"><span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'number'"><input v-if="isEditing" type="number" :value="getFieldValue(field)" @input="setFieldValue(field, Number(($event.target as HTMLInputElement).value))" class="ce-input" :class="{ 'ce-w-sm': field.smallWidth }" :min="field.min"><span v-else class="ce-readonly">{{ getFieldValue(field) != null ? getFieldValue(field) + '名' : '—' }}</span></template>
                        <template v-else-if="field.component === 'date'"><input v-if="isEditing" type="date" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input ce-w-sm"><span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'url'"><input v-if="isEditing" type="url" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :placeholder="field.placeholder"><span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'email'"><input v-if="isEditing" type="email" :value="getFieldValue(field)" @input="setFieldValue(field, ($event.target as HTMLInputElement).value)" class="ce-input" :placeholder="field.placeholder"><span v-else class="ce-readonly">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'select'">
                          <template v-if="isEditing"><select :value="getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLSelectElement).value)" class="ce-select"><option v-for="o in getResolvedOptions(field)" :key="String(o.value)" :value="o.value">{{ o.label }}</option></select></template>
                          <span v-else class="ce-readonly">{{ getSelectLabel(field) }}</span>
                        </template>
                        <template v-else-if="field.component === 'textarea'"><textarea v-if="isEditing" :value="getFieldValue(field) as string" @input="setFieldValue(field, ($event.target as HTMLTextAreaElement).value)" class="ce-input ce-textarea" rows="3" :placeholder="field.placeholder"></textarea><span v-else class="ce-readonly ce-pre-wrap">{{ getFieldDisplayValue(field) }}</span></template>
                        <template v-else-if="field.component === 'checkbox'"><template v-if="isEditing"><label class="ce-checkbox"><input type="checkbox" :checked="!!getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLInputElement).checked)"><span>{{ field.label }}</span></label></template><span v-else class="ce-readonly">{{ getFieldValue(field) ? 'あり' : 'なし' }}</span></template>
                        <template v-else-if="field.component === 'amount'"><template v-if="isEditing"><div class="ce-amount"><input type="number" :value="getFieldValue(field)" @input="setFieldValue(field, Number(($event.target as HTMLInputElement).value))" class="ce-input ce-w-sm" :min="field.min"><span>円</span></div></template><span v-else class="ce-readonly">{{ (getFieldValue(field) ?? 0).toLocaleString() }} 円</span></template>
                        <template v-else-if="field.component === 'staffSelect'"><template v-if="isEditing"><select :value="getFieldValue(field)" @change="setFieldValue(field, ($event.target as HTMLSelectElement).value)" class="ce-select"><option value="">{{ PLACEHOLDER_UNSET }}</option><option v-for="s in (staffList ?? [])" :key="s.uuid" :value="s.uuid">{{ s.name }}</option></select></template><span v-else class="ce-readonly">{{ getStaffLabel(field) }}</span></template>
                        <template v-else><span class="ce-readonly">{{ getFieldDisplayValue(field) }}</span></template>
                        <span v-if="field.hint && isEditing" class="ce-hint">{{ field.hint }}</span>
                      </div>
                      <div v-else class="ce-field">
                        <template v-if="field.component === 'text'"><input type="text" disabled class="ce-input dfg-empty-input" :placeholder="field.placeholder || 'テキスト入力'"></template>
                        <template v-else-if="field.component === 'number'"><input type="number" disabled class="ce-input dfg-empty-input ce-w-sm" placeholder="0"></template>
                        <template v-else-if="field.component === 'date'"><input type="date" disabled class="ce-input dfg-empty-input ce-w-sm"></template>
                        <template v-else-if="field.component === 'dateGroup'"><div class="dfg-empty-input" style="display:flex;gap:4px;align-items:center;"><select disabled class="ce-select" style="width:70px;"><option>1月</option></select><select disabled class="ce-select" style="width:70px;"><option>1日</option></select></div></template>
                        <template v-else-if="field.component === 'url' || field.component === 'urlCopy'"><input type="url" disabled class="ce-input dfg-empty-input" placeholder="https://..."></template>
                        <template v-else-if="field.component === 'link'"><span class="ce-readonly dfg-empty-input" style="color:#2563eb;text-decoration:underline;">リンク</span></template>
                        <template v-else-if="field.component === 'email'"><input type="email" disabled class="ce-input dfg-empty-input" placeholder="email@example.com"></template>
                        <template v-else-if="field.component === 'select'"><select disabled class="ce-select dfg-empty-input"><option>— 選択 —</option></select></template>
                        <template v-else-if="field.component === 'textarea'"><textarea disabled class="ce-input ce-textarea dfg-empty-input" rows="2" placeholder="複数行テキスト"></textarea></template>
                        <template v-else-if="field.component === 'checkbox'"><label class="ce-checkbox dfg-empty-input"><input type="checkbox" disabled><span>{{ field.label }}</span></label></template>
                        <template v-else-if="field.component === 'amount'"><div class="ce-amount dfg-empty-input"><input type="number" disabled class="ce-input ce-w-sm" placeholder="0"><span>円</span></div></template>
                        <template v-else-if="field.component === 'staffSelect'"><select disabled class="ce-select dfg-empty-input"><option value="">— スタッフ選択 —</option><option v-for="s in (staffList ?? [])" :key="s.uuid" :value="s.uuid">{{ s.name }}</option></select></template>
                        <template v-else-if="field.component === 'computed'"><span class="ce-readonly dfg-empty-input" style="font-style:italic;">自動計算</span></template>
                        <template v-else-if="field.component === 'contactTable'"><span class="ce-readonly dfg-empty-input">連絡先テーブル</span></template>
                        <template v-else-if="field.component === 'readonly'"><span class="ce-readonly dfg-empty-input">読み取り専用</span></template>
                        <template v-else><span class="ce-readonly dfg-empty-input">{{ field.component }}</span></template>
                      </div>
                    </slot>
                  </div>
                  <!-- インライン選択肢編集 -->
                  <div v-if="isLayoutEditing && field.component === 'select'" class="dfg-inline-options">
                    <div v-for="(opt, oi) in getResolvedOptions(field)" :key="oi" class="dfg-inline-opt-row">
                      <input type="text" :value="opt.label" class="dfg-inline-opt-input" @blur="onInlineOptionEdit(field.key, oi, ($event.target as HTMLInputElement).value)" @keydown.enter="($event.target as HTMLInputElement).blur()" />
                      <button class="dfg-inline-opt-del" @click.stop="onInlineOptionRemove(field.key, oi)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <button class="dfg-inline-opt-add" @click.stop="onInlineOptionAdd(field.key)"><i class="fa-solid fa-plus"></i> 選択肢追加</button>
                  </div>
                  <!-- スタッフ一覧（読み取り専用） -->
                  <div v-if="isLayoutEditing && field.component === 'staffSelect'" class="dfg-inline-options">
                    <div v-for="s in (staffList ?? [])" :key="s.uuid" class="dfg-inline-opt-row">
                      <span class="dfg-inline-opt-label">{{ s.name }}</span>
                    </div>
                    <div v-if="!(staffList ?? []).length" class="dfg-inline-opt-row">
                      <span class="dfg-inline-opt-label" style="color:#94a3b8;font-style:italic;">スタッフ未登録</span>
                    </div>
                  </div>
                  <!-- 決算日（月/日）選択肢一覧 -->
                  <div v-if="isLayoutEditing && field.component === 'dateGroup'" class="dfg-inline-options">
                    <div class="dfg-inline-opt-row"><span class="dfg-inline-opt-label" style="font-weight:600;">月:</span></div>
                    <div class="dfg-inline-opt-row" style="flex-wrap:wrap;gap:2px;">
                      <span v-for="m in 12" :key="'m'+m" class="dfg-inline-opt-label dfg-dategroup-chip">{{ m }}月</span>
                    </div>
                    <div class="dfg-inline-opt-row" style="margin-top:4px;"><span class="dfg-inline-opt-label" style="font-weight:600;">日:</span></div>
                    <div class="dfg-inline-opt-row" style="flex-wrap:wrap;gap:2px;">
                      <span class="dfg-inline-opt-label dfg-dategroup-chip">末日</span>
                      <span v-for="d in 31" :key="'d'+d" class="dfg-inline-opt-label dfg-dategroup-chip">{{ d }}日</span>
                    </div>
                  </div>
                  <!-- チェックボックスラベル編集 -->
                  <div v-if="isLayoutEditing && field.component === 'checkbox'" class="dfg-inline-options">
                    <div class="dfg-inline-opt-row"><label style="font-size: 11px; color: #475569;">チェック項目名:</label></div>
                    <div class="dfg-inline-opt-row"><input type="text" :value="field.label" class="dfg-inline-opt-input" @blur="emit('label-edit', field.key, ($event.target as HTMLInputElement).value)" @keydown.enter="($event.target as HTMLInputElement).blur()" /></div>
                  </div>
                </template>
                <!-- 右端リサイズハンドル（横幅） -->
                <div v-if="isLayoutEditing" class="dfg-resize dfg-resize-right" :title="UI_MSG.ドラッグ横幅変更" @mousedown.stop="startWidthResize($event, field.key)"></div>
                <!-- 下端リサイズハンドル（高さ） -->
                <div v-if="isLayoutEditing" class="dfg-resize dfg-resize-bottom" title="ドラッグで高さ変更" @mousedown.stop="startFieldHeightResize($event, field.key)"></div>
                <!-- 非表示ボタン -->
                <button v-if="isLayoutEditing" class="dfg-hide-btn" :title="UI_MSG.フィールド非表示" @click.stop="confirmHideField(field)">×</button>
              </div>
            </template>
          </VueDraggable>
        </div>
      </div>

      <!-- ＋フィールド追加ボタン（レイアウト編集時） -->
      <button
        v-if="isLayoutEditing"
        class="dfg-add-field-btn"
        @click="emit('add-field')"
      >
        <i class="fa-solid fa-plus"></i> フィールド追加
      </button>
    </div>

  </div>

  <!-- 非表示確認モーダル -->
  <Teleport to="body">
    <div v-if="showHideConfirm" class="dfg-confirm-overlay" @click.self="cancelHide">
      <div class="dfg-confirm-modal">
        <p>「{{ pendingHideField?.label }}」を非表示にしますか？</p>
        <div class="dfg-confirm-actions">
          <button class="dfg-confirm-yes" @click="executeHide">はい</button>
          <button class="dfg-confirm-no" @click="cancelHide">いいえ</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { FieldDef, FieldOption } from '@/types/fieldLayout';
import { PLACEHOLDER_UNSET } from '@/constants/clientOptions';
import { UI_MSG } from '@/constants/uiMessages';

const props = defineProps<{
  /** 表示するフィールド一覧（order順） */
  fields: FieldDef[];
  /** レイアウト編集モードか */
  isLayoutEditing: boolean;
  /** セクションの高さ（px, undefined=auto） */
  sectionHeight?: number;
  /** フォームデータ（自動レンダリング用、任意） */
  formData?: Record<string, unknown>;
  /** 編集モードか（自動レンダリング用、任意） */
  isEditing?: boolean;
  /** 選択肢文字列→配列を解決する関数（自動レンダリング用、任意） */
  resolveOptions?: (optionsKey: string) => readonly FieldOption[];
  /** スタッフリスト（staffSelect用、任意） */
  staffList?: { uuid: string; name: string }[];
  /** D&Dグループ名（FieldPaletteと共有） */
  dragGroup?: string;
  /** 選択中フィールドのキー（レイアウト編集時のハイライト用） */
  selectedFieldKey?: string;
  /** 行ベースレイアウト（FieldDef[][] 行の配列） */
  fieldRows?: FieldDef[][];
}>();

const emit = defineEmits<{
  (e: 'update:order', keys: string[]): void;
  (e: 'update:width', key: string, widthPercent: number): void;
  (e: 'update:lineBreak', key: string, value: boolean): void;
  (e: 'update:sectionHeight', height: number): void;
  (e: 'update:fieldHeight', key: string, height: number): void;
  (e: 'hide-field', key: string): void;
  (e: 'label-edit', key: string, newLabel: string): void;
  (e: 'add-field'): void;
  (e: 'update:fieldValue', key: string, value: unknown): void;
  (e: 'update:headingSize', key: string, size: number): void;
  (e: 'update:headingBg', key: string, color: string): void;
  (e: 'update:headingColor', key: string, color: string): void;
  (e: 'update:spacerHeight', key: string, height: number): void;
  (e: 'field-added', field: FieldDef): void;
  (e: 'select-field', field: FieldDef): void;
  (e: 'update:fieldOptions', key: string, options: FieldOption[]): void;
  (e: 'update:rows', rows: string[][]): void;
}>();

/** フォームからフィールド値を取得 */
const getFieldValue = (field: FieldDef): unknown => {
  if (!props.formData) return undefined;
  const key = field.modelKey || field.key;
  return props.formData[key];
};

/** フォームにフィールド値を設定 */
const setFieldValue = (field: FieldDef, value: unknown) => {
  const key = field.modelKey || field.key;
  emit('update:fieldValue', key, value);
};

/** 表示用テキスト取得 */
const getFieldDisplayValue = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (val == null || val === '') return '—';
  return String(val);
};

/** 選択肢を解決 */
const getResolvedOptions = (field: FieldDef): readonly FieldOption[] => {
  if (!field.options) return [];
  if (Array.isArray(field.options)) return field.options;
  // 文字列参照 → resolveOptions関数で解決
  if (props.resolveOptions) return props.resolveOptions(field.options);
  return [];
};

/** select系フィールドの表示ラベル取得 */
const getSelectLabel = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (val == null || val === '') return '—';
  const opts = getResolvedOptions(field);
  const found = opts.find(o => String(o.value) === String(val));
  return found ? found.label : String(val);
};

/** スタッフ名取得 */
const getStaffLabel = (field: FieldDef): string => {
  const val = getFieldValue(field);
  if (!val) return UI_MSG.未設定;
  const staff = (props.staffList ?? []).find(s => s.uuid === val);
  return staff ? staff.name : UI_MSG.未設定;
};


const containerRef = ref<HTMLElement | null>(null);

/** ローカルフィールド（D&D用） */
const localFields = ref<FieldDef[]>([...(props.fields ?? [])]);

/** 行ベースローカルデータ（D&D用） */
const localRows = ref<FieldDef[][]>(
  props.fieldRows?.length
    ? props.fieldRows.map(r => [...r])
    : [[...(props.fields ?? [])]]
);

/** propsのfieldRows変更を監視（キーリストで比較） */
const fieldRowsSignature = computed(() =>
  props.fieldRows?.map(r => r.map(f => f.key).join(',')).join('|') ?? ''
);
watch(fieldRowsSignature, () => {
  const nv = props.fieldRows;
  if (nv) {
    localRows.value = nv.map(r => [...r]);
  }
});

/** propsのfields変更を監視 */
const fieldsSignature = computed(() =>
  props.fields?.map(f => `${f.key}:${f.widthPercent}:${f.label}`).join(',') ?? ''
);
watch(fieldsSignature, () => {
  localFields.value = [...(props.fields ?? [])];
});

/** 行ごとのD&Dグループ設定（heading/spacerはput:falseで割り込み禁止） */
/** グループオブジェクトをキャッシュ（毎回新しいオブジェクト参照を返すとSortableJS再初期化の原因） */
const dragGroupNormal = computed(() => {
  const groupName = props.dragGroup || 'dfg-row-group';
  return { name: groupName, pull: true, put: true };
});
const dragGroupLocked = computed(() => {
  const groupName = props.dragGroup || 'dfg-row-group';
  return { name: groupName, pull: true, put: false };
});
const getRowDragGroup = (row: FieldDef[]) => {
  // heading/spacerのみの行はフィールド割り込み禁止
  if (row.length === 1 && (row[0]?.component === 'heading' || row[0]?.component === 'spacer')) {
    return dragGroupLocked.value;
  }
  return dragGroupNormal.value;
};

/** ラッパースタイル */
const wrapperStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.sectionHeight && props.sectionHeight > 0) {
    s['height'] = `${props.sectionHeight}px`;
    s['overflow-y'] = 'auto';
  }
  return s;
});

/** アイテムスタイル */
const itemStyle = (field: FieldDef) => {
  const w = (field.component === 'spacer' || field.component === 'contactTable')
    ? '100%'
    : `${field.widthPercent}%`;
  const s: Record<string, string> = { width: w, 'flex-shrink': '0', 'flex-grow': '0' };
  if (field.fieldHeight && field.fieldHeight > 0) {
    s['min-height'] = `${field.fieldHeight}px`;
  }
  return s;
};

/** VueDraggableのmodel-value更新ガード */
const onRowModelUpdate = (rowIdx: number, val: FieldDef[]) => {
  const cur = localRows.value[rowIdx];
  const curKeys = cur?.map(f => f.key).join(',') ?? '';
  const newKeys = val.map(f => f.key).join(',');
  if (curKeys !== newKeys) {
    localRows.value[rowIdx] = val;
  }
};

/** 行内D&D終了時 */
const onRowDragEnd = (_rowIdx: number) => {
  emitRowsUpdate();
};

/** 行へのD&D追加時 */
const onRowDragAdd = (rowIdx: number, _evt: unknown) => {
  // ① まずlocalRowsの現在状態（VueDraggableが既に挿入済み）をfieldRowsに反映
  emitRowsUpdate();
  // ② 次に新規フィールドをfields配列に追加
  const allKnown = new Set(props.fields.map(f => f.key));
  const row = localRows.value[rowIdx];
  if (row) {
    for (const f of row) {
      if (!allKnown.has(f.key)) {
        emit('field-added', { ...f });
      }
    }
  }
};

/** 行更新を親に通知 */
const emitRowsUpdate = () => {
  const rows = localRows.value
    .map(r => r.map(f => f.key));
  emit('update:rows', rows);
};


/** ラベル編集 */
const onLabelBlur = (key: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  const newLabel = input.value.trim();
  if (newLabel) emit('label-edit', key, newLabel);
};

/** 非表示確認モーダル */
const pendingHideField = ref<FieldDef | null>(null);
const showHideConfirm = ref(false);

const confirmHideField = (field: FieldDef) => {
  pendingHideField.value = field;
  showHideConfirm.value = true;
};

const executeHide = () => {
  if (pendingHideField.value) {
    emit('hide-field', pendingHideField.value.key);
  }
  showHideConfirm.value = false;
  pendingHideField.value = null;
};

const cancelHide = () => {
  showHideConfirm.value = false;
  pendingHideField.value = null;
};

/** ─── インライン選択肢編集 ─── */
const onInlineOptionAdd = (fieldKey: string) => {
  const field = localFields.value.find(f => f.key === fieldKey);
  if (!field) return;
  // 文字列参照（'TYPE_OPTIONS'等）の場合、resolveOptionsで解決してから配列に変換
  let opts: FieldOption[];
  if (Array.isArray(field.options)) {
    opts = [...field.options];
  } else if (typeof field.options === 'string' && props.resolveOptions) {
    opts = [...props.resolveOptions(field.options)];
  } else {
    opts = [];
  }
  const idx = opts.length + 1;
  opts.push({ value: `opt_${idx}`, label: `選択肢${idx}` });
  field.options = opts;
  emit('update:fieldOptions', fieldKey, opts);
};

const onInlineOptionRemove = (fieldKey: string, optIdx: number) => {
  const field = localFields.value.find(f => f.key === fieldKey);
  if (!field) return;
  // 文字列参照の場合、先に配列に変換
  let opts: FieldOption[];
  if (Array.isArray(field.options)) {
    opts = [...field.options];
  } else if (typeof field.options === 'string' && props.resolveOptions) {
    opts = [...props.resolveOptions(field.options)];
  } else {
    return;
  }
  opts.splice(optIdx, 1);
  field.options = opts;
  emit('update:fieldOptions', fieldKey, opts);
};

const onInlineOptionEdit = (fieldKey: string, optIdx: number, newLabel: string) => {
  const field = localFields.value.find(f => f.key === fieldKey);
  if (!field) return;
  // 文字列参照の場合、先に配列に変換
  let opts: FieldOption[];
  if (Array.isArray(field.options)) {
    opts = [...field.options];
  } else if (typeof field.options === 'string' && props.resolveOptions) {
    opts = [...props.resolveOptions(field.options)];
  } else {
    return;
  }
  if (opts[optIdx]) {
    opts[optIdx] = { ...opts[optIdx], label: newLabel || opts[optIdx].label };
  }
  field.options = opts;
  emit('update:fieldOptions', fieldKey, opts);
};/** ─── 横幅リサイズ（%単位） ─── */
let resizingKey = '';
let startX = 0;
let startWidthPct = 20;
let containerWidth = 0;

const startWidthResize = (e: MouseEvent, fieldKey: string) => {
  e.preventDefault();
  const field = findFieldByKey(fieldKey);
  if (!field) return;
  resizingKey = fieldKey;
  startX = e.clientX;
  startWidthPct = field.widthPercent;
  if (containerRef.value) {
    containerWidth = containerRef.value.clientWidth;
  }
  document.addEventListener('mousemove', onWidthResizeMove);
  document.addEventListener('mouseup', onWidthResizeEnd);
};

/** フィールドをキーで検索（全行を横断） */
const findFieldByKey = (key: string): FieldDef | undefined => {
  for (const row of localRows.value) {
    const f = row.find(ff => ff.key === key);
    if (f) return f;
  }
  return localFields.value.find(f => f.key === key);
};

const onWidthResizeMove = (e: MouseEvent) => {
  if (!resizingKey || !containerWidth) return;
  const dx = e.clientX - startX;
  const deltaPct = (dx / containerWidth) * 100;
  const newPct = Math.max(5, Math.min(100, startWidthPct + deltaPct));
  const field = findFieldByKey(resizingKey);
  if (field) field.widthPercent = newPct;
};

const onWidthResizeEnd = () => {
  if (resizingKey) {
    const field = findFieldByKey(resizingKey);
    if (field) {
      emit('update:width', field.key, field.widthPercent);
    }
  }
  resizingKey = '';
  document.removeEventListener('mousemove', onWidthResizeMove);
  document.removeEventListener('mouseup', onWidthResizeEnd);
};

/** ─── フィールド個別の高さリサイズ ─── */
let heightResizingKey = '';
let startY = 0;
let startFieldHeight = 0;

const startFieldHeightResize = (e: MouseEvent, fieldKey: string) => {
  e.preventDefault();
  const field = findFieldByKey(fieldKey);
  if (!field) return;
  heightResizingKey = fieldKey;
  startY = e.clientY;
  // 実際のDOM要素の高さを取得
  const el = containerRef.value?.querySelector(`[data-field-key="${fieldKey}"]`) as HTMLElement | null;
  startFieldHeight = el ? el.offsetHeight : (field.fieldHeight || 60);
  document.addEventListener('mousemove', onFieldHeightMove);
  document.addEventListener('mouseup', onFieldHeightEnd);
};

const onFieldHeightMove = (e: MouseEvent) => {
  if (!heightResizingKey) return;
  const dy = e.clientY - startY;
  const newHeight = Math.max(30, startFieldHeight + dy);
  const field = findFieldByKey(heightResizingKey);
  if (field) field.fieldHeight = newHeight;
};

const onFieldHeightEnd = () => {
  if (heightResizingKey) {
    const field = findFieldByKey(heightResizingKey);
    if (field) {
      emit('update:fieldHeight', field.key, field.fieldHeight || 60);
    }
  }
  heightResizingKey = '';
  document.removeEventListener('mousemove', onFieldHeightMove);
  document.removeEventListener('mouseup', onFieldHeightEnd);
};

/** クリーンアップ */
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onWidthResizeMove);
  document.removeEventListener('mouseup', onWidthResizeEnd);
  document.removeEventListener('mousemove', onFieldHeightMove);
  document.removeEventListener('mouseup', onFieldHeightEnd);
});
</script>

<style scoped>
.dfg-wrapper {
  position: relative;
}

.dfg-container {
  width: 100%;
}

.dfg-rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dfg-row {
  min-height: 32px;
}

.dfg-row-drag-area {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  min-height: 32px;
  gap: 0;
  overflow-x: auto;
}

.dfg-drag-area {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px 0;
  width: 100%;
}

.dfg-item {
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 4px;
  cursor: default;
}
.dfg-draggable {
  cursor: grab;
}
.dfg-draggable:active {
  cursor: grabbing;
}
.dfg-item-selected {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.04);
}

.dfg-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  cursor: grab;
  color: #aaa;
  font-size: 10px;
  flex-shrink: 0;
  border-right: 1px dashed #ddd;
  margin-right: 4px;
  transition: color 0.15s;
}
.dfg-handle:hover {
  color: #4a8dc9;
}
.dfg-handle:active {
  cursor: grabbing;
}

.dfg-content {
  flex: 1;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 6px;
  background: #f5f5f5;
  /* 全フィールド値の書式を統一（「法人」と同じ） */
  font-size: 13px;
  color: #333;
  font-weight: 400;
}

/* dfg-content内の入力要素は外枠で統一。内部の個別border/backgroundを消す */
.dfg-content :deep(.ce-readonly) {
  border: none;
  background: transparent;
  padding: 2px 0;
  font-size: 13px;
  color: #333;
  font-weight: 400;
}
.dfg-content :deep(.ce-input) {
  border: none;
  background: transparent;
  padding: 2px 0;
  box-shadow: none;
  font-size: 13px;
  color: #333;
  font-weight: 400;
}
.dfg-content :deep(.ce-input:focus) {
  box-shadow: none;
}
.dfg-content :deep(.ce-select) {
  border: none;
  background: transparent;
  padding: 2px 0;
  font-size: 13px;
  color: #333;
  font-weight: 400;
}
/* ステータス色・特殊書式を統一（ce-status-active, ce-code等） */
.dfg-content :deep([class*="ce-status-"]) {
  color: #333 !important;
  font-weight: 400 !important;
}
.dfg-content :deep(.ce-code) {
  font-family: inherit !important;
  font-weight: 400 !important;
  color: #333 !important;
  letter-spacing: normal !important;
}

.dfg-resize {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  cursor: col-resize;
  color: #ccc;
  font-size: 10px;
  flex-shrink: 0;
  margin-left: 2px;
  transition: color 0.15s;
}
.dfg-resize:hover {
  color: #4a8dc9;
}

/* 幅%表示ラベル */
.dfg-width-label {
  position: absolute;
  top: 0;
  right: 14px;
  font-size: 9px;
  color: #999;
  background: rgba(255,255,255,0.8);
  padding: 0 2px;
  border-radius: 2px;
  pointer-events: none;
}

/* 行区切りボタン */
.dfg-linebreak-btn {
  position: absolute;
  bottom: 0;
  right: 14px;
  width: 18px;
  height: 18px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  color: #999;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: all 0.15s;
}
.dfg-linebreak-btn:hover {
  opacity: 1;
  background: #e0ecf7;
  color: #2563eb;
}
.dfg-linebreak-btn.active {
  opacity: 1;
  background: #dbeafe;
  color: #2563eb;
  border-color: #93c5fd;
}

/* 非表示ボタン */
.dfg-hide-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.15s;
  z-index: 5;
}
.dfg-hide-btn:hover {
  opacity: 1;
  background: #fca5a5;
  transform: scale(1.2);
}



/* 行区切り（強制改行） */
.dfg-line-break {
  width: 100%;
  height: 0;
  flex-basis: 100%;
}

/* セクション縦幅リサイズハンドル */
.dfg-height-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  cursor: row-resize;
  background: linear-gradient(to bottom, transparent, #f0f0f0);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  transition: background 0.15s;
  user-select: none;
}
.dfg-height-handle:hover {
  background: linear-gradient(to bottom, transparent, #dbeafe);
}
.dfg-height-handle-icon {
  font-size: 14px;
  color: #aaa;
  letter-spacing: 2px;
  line-height: 1;
}
.dfg-height-handle:hover .dfg-height-handle-icon {
  color: #2563eb;
}

/* ドラッグ中のゴースト */
.dfg-ghost {
  opacity: 0.4;
  background: #e8f0fe;
  border: 2px dashed #4a8dc9;
  border-radius: 4px;
}

/* ドラッグ中のアイテム */
.dfg-drag {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: #fff;
}

/* ラベルエリア */
.dfg-label-area {
  padding: 2px 4px 0;
}
.dfg-label-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid #93c5fd;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  background: #eff6ff;
  box-sizing: border-box;
}
.dfg-label-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
}

/* 通常時のラベル */
.dfg-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin: 0;
  padding: 0 0 2px;
}

/* ＋フィールド追加ボタン */
.dfg-add-field-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  margin: 4px;
  border: 1px dashed #93c5fd;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.dfg-add-field-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

/* ===== タイトルフィールド（heading） ===== */
.dfg-heading {
  width: 100%;
  padding: 6px 12px;
  color: #fff;
  font-weight: 700;
  border-radius: 0;
  box-sizing: border-box;
}
.dfg-heading-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 3px;
  font-weight: 700;
  color: #fff;
  background: transparent;
  box-sizing: border-box;
}
.dfg-heading-input:focus {
  border-color: #fff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
}
.dfg-heading-settings {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: 0 0 4px 4px;
  font-size: 11px;
  color: #475569;
}
.dfg-heading-settings label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
.dfg-heading-settings select,
.dfg-heading-settings input[type="color"] {
  padding: 1px 4px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  font-size: 11px;
}
.dfg-heading-settings input[type="color"] {
  width: 24px;
  height: 20px;
  padding: 0;
  cursor: pointer;
}

/* ===== スペーサーフィールド（spacer） ===== */
.dfg-spacer {
  width: 100%;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.dfg-spacer-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 600;
}
.dfg-spacer-settings {
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: 0 0 4px 4px;
  font-size: 11px;
  color: #475569;
}
.dfg-spacer-settings label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.dfg-spacer-settings input[type="range"] {
  width: 100px;
}

/* 右端リサイズハンドル */
.dfg-resize-right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  z-index: 2;
}
.dfg-resize-right:hover,
.dfg-resize-right:active {
  background: rgba(59, 130, 246, 0.3);
}

/* 下端リサイズハンドル（高さ）※.dfg-resizeの共通スタイルを上書き */
.dfg-resize-bottom {
  position: absolute;
  display: block;
  width: auto;
  margin-left: 0;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 8px;
  cursor: row-resize;
  background: rgba(59, 130, 246, 0.25);
  border-radius: 0 0 3px 3px;
  transition: background 0.15s;
  z-index: 2;
}
.dfg-resize-bottom:hover,
.dfg-resize-bottom:active {
  background: rgba(59, 130, 246, 0.5);
}

/* インライン選択肢編集 */
.dfg-inline-options {
  margin-top: 4px;
  padding: 4px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
}
.dfg-inline-opt-row {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 2px;
}
.dfg-inline-opt-input {
  flex: 1;
  padding: 2px 4px;
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  font-size: 11px;
}
.dfg-inline-opt-input:focus {
  outline: none;
  border-color: #3b82f6;
}
.dfg-inline-opt-del {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 1px 3px;
  font-size: 10px;
}
.dfg-inline-opt-add {
  display: flex;
  align-items: center;
  gap: 3px;
  width: 100%;
  padding: 3px 6px;
  margin-top: 2px;
  background: #dbeafe;
  border: 1px dashed #93c5fd;
  border-radius: 3px;
  color: #1e40af;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}
.dfg-inline-opt-add:hover {
  background: #bfdbfe;
}
.dfg-inline-opt-label {
  font-size: 12px; color: #334155; padding: 2px 6px;
}
.dfg-dategroup-chip {
  display: inline-block; background: #f0f9ff; border: 1px solid #bae6fd;
  border-radius: 4px; padding: 1px 6px; font-size: 11px; color: #0369a1;
}

/* 非表示確認モーダル */
.dfg-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.dfg-confirm-modal {
  background: #fff;
  border-radius: 8px;
  padding: 20px 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  min-width: 280px;
  text-align: center;
}
.dfg-confirm-modal p {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.dfg-confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.dfg-confirm-yes {
  padding: 6px 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}
.dfg-confirm-yes:hover {
  background: #dc2626;
}
.dfg-confirm-no {
  padding: 6px 20px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}
.dfg-confirm-no:hover {
  background: #cbd5e1;
}
/* フィールド管理からのフォーカスフラッシュ */
.dfg-item.dfg-flash {
  animation: dfg-flash-anim 1.5s ease;
}
@keyframes dfg-flash-anim {
  0% { box-shadow: 0 0 0 3px #3b82f6; }
  30% { box-shadow: 0 0 12px 4px rgba(59,130,246,0.5); }
  100% { box-shadow: none; }
}

/* レイアウト編集時の空UI要素 */
.dfg-empty-input { opacity: 0.7; cursor: default; }
</style>
