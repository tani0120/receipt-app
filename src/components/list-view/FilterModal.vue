<template>
  <Teleport to="body">
    <div v-if="visible" class="fm-overlay" @click.self="onCancel">
      <div class="fm-modal">
        <!-- ヘッダー -->
        <div class="fm-header">
          <h2 class="fm-title">絞り込む</h2>
          <button class="fm-close-btn" @click="onCancel" title="閉じる">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 条件セクション -->
        <div class="fm-section">
          <div class="fm-section-label">条件</div>
          <div class="fm-conditions">
            <div
              v-for="(cond, idx) in localConditions"
              :key="idx"
              class="fm-condition-row"
            >
              <!-- フィールド選択（検索可能ドロップダウン） -->
              <div class="fm-searchable-select fm-field-select" @click.stop>
                <button
                  class="fm-ss-trigger"
                  :class="{ active: openFieldIdx === idx }"
                  @click="toggleFieldDropdown(idx)"
                  :title="getFieldLabel(cond.field)"
                >
                  <span class="fm-ss-label">{{ getFieldLabel(cond.field) || 'フィールド選択' }}</span>
                  <i class="fa-solid fa-chevron-down fm-ss-chevron"></i>
                </button>
                <div v-if="openFieldIdx === idx" class="fm-ss-dropdown">
                  <div class="fm-ss-search-wrap">
                    <i class="fa-solid fa-magnifying-glass fm-ss-search-icon"></i>
                    <input
                      ref="fieldSearchInputRef"
                      class="fm-ss-search"
                      type="text"
                      v-model="fieldSearches[idx]"
                      placeholder="フィールド検索…"
                      @keydown.escape.stop="openFieldIdx = null"
                    >
                  </div>
                  <div class="fm-ss-options">
                    <button
                      v-for="col in filteredColumns(idx)"
                      :key="col.key"
                      class="fm-ss-option"
                      :class="{ selected: cond.field === col.key }"
                      @click="selectField(idx, col.key)"
                    >
                      {{ col.label }}
                    </button>
                    <div v-if="filteredColumns(idx).length === 0" class="fm-ss-no-match">
                      該当なし
                    </div>
                  </div>
                </div>
              </div>

              <!-- 演算子選択 -->
              <select
                class="fm-select fm-operator-select"
                :value="cond.operator"
                @change="onOperatorChange(idx, ($event.target as HTMLSelectElement).value as any)"
              >
                <option
                  v-for="op in getOperatorsForField(cond.field)"
                  :key="op.value"
                  :value="op.value"
                >{{ op.label }}</option>
              </select>

              <!-- 値入力：is_empty/is_not_emptyの場合は非表示 -->
              <!-- 複数選択（in / not_in）: チェックボックスリスト -->
              <div
                v-if="isMultiValueOp(cond.operator) && getFieldDef(cond.field)?.filterOptions"
                class="fm-multi-value"
              >
                <div class="fm-multi-value-box" @click="toggleMultiDropdown(idx)">
                  <span v-if="getMultiLabels(cond).length === 0" class="fm-placeholder">選択してください</span>
                  <span v-else class="fm-multi-tags">{{ getMultiLabels(cond).join(', ') }}</span>
                  <i class="fa-solid fa-chevron-down fm-chevron"></i>
                </div>
                <div v-if="openMultiIdx === idx" class="fm-multi-dropdown">
                  <label
                    v-for="opt in getFieldDef(cond.field)?.filterOptions"
                    :key="opt.value"
                    class="fm-multi-option"
                  >
                    <input
                      type="checkbox"
                      :checked="(cond.value as string[]).includes(opt.value)"
                      @change="toggleMultiValue(idx, opt.value)"
                    >
                    <span>{{ opt.label }}</span>
                  </label>
                </div>
              </div>

              <!-- 単一選択（select型 + eq/neq） -->
              <select
                v-else-if="!isNoValueOp(cond.operator) && getFieldDef(cond.field)?.filterType === 'select' && getFieldDef(cond.field)?.filterOptions"
                class="fm-select fm-value-select"
                :value="cond.value as string"
                @change="cond.value = ($event.target as HTMLSelectElement).value"
              >
                <option value="">--</option>
                <option
                  v-for="opt in getFieldDef(cond.field)?.filterOptions"
                  :key="opt.value"
                  :value="opt.value"
                >{{ opt.label }}</option>
              </select>

              <!-- テキスト/数値/日付入力 -->
              <input
                v-else-if="!isNoValueOp(cond.operator)"
                class="fm-input fm-value-input"
                :type="getFieldDef(cond.field)?.filterType === 'number' ? 'number' : getFieldDef(cond.field)?.filterType === 'date' ? 'date' : 'text'"
                :value="cond.value as string"
                @input="cond.value = ($event.target as HTMLInputElement).value"
                placeholder="値を入力"
              >

              <!-- 値不要（is_empty / is_not_empty） -->
              <div v-else class="fm-no-value"></div>

              <!-- 行削除ボタン -->
              <button
                class="fm-remove-btn"
                @click="removeCondition(idx)"
                title="条件を削除"
                :disabled="localConditions.length <= 1"
              >
                <i class="fa-solid fa-circle-minus"></i>
              </button>
            </div>
          </div>

          <!-- 条件追加ボタン -->
          <button class="fm-add-btn" @click="addCondition">
            <i class="fa-solid fa-circle-plus"></i>
          </button>

          <!-- AND / OR 切替 -->
          <div class="fm-logic-row">
            <label class="fm-radio-label">
              <input
                type="radio"
                value="and"
                v-model="localLogic"
                name="filterLogic"
              >
              <span>すべての条件を満たす</span>
            </label>
            <label class="fm-radio-label">
              <input
                type="radio"
                value="or"
                v-model="localLogic"
                name="filterLogic"
              >
              <span>いずれかの条件を満たす</span>
            </label>
          </div>

          <!-- すべてクリア / デフォルトに戻す -->
          <div class="fm-action-row">
            <button class="fm-clear-btn" @click="clearAll">すべてクリア</button>
            <button class="fm-default-btn" @click="restoreDefault">デフォルトに戻す</button>
          </div>
        </div>

        <!-- ソートセクション -->
        <div class="fm-section fm-sort-section">
          <div class="fm-section-label">ソート</div>
          <div class="fm-sort-row">
            <!-- ソートフィールド（検索可能ドロップダウン） -->
            <div class="fm-searchable-select fm-sort-field" @click.stop>
              <button
                class="fm-ss-trigger"
                :class="{ active: sortFieldOpen }"
                @click="sortFieldOpen = !sortFieldOpen; sortFieldSearch = ''"
              >
                <span class="fm-ss-label">{{ getFieldLabel(localSort.key) }}</span>
                <i class="fa-solid fa-chevron-down fm-ss-chevron"></i>
              </button>
              <div v-if="sortFieldOpen" class="fm-ss-dropdown">
                <div class="fm-ss-search-wrap">
                  <i class="fa-solid fa-magnifying-glass fm-ss-search-icon"></i>
                  <input
                    class="fm-ss-search"
                    type="text"
                    v-model="sortFieldSearch"
                    placeholder="フィールド検索…"
                    @keydown.escape.stop="sortFieldOpen = false"
                  >
                </div>
                <div class="fm-ss-options">
                  <button
                    v-for="col in filteredSortColumns"
                    :key="col.key"
                    class="fm-ss-option"
                    :class="{ selected: localSort.key === col.key }"
                    @click="localSort.key = col.key; sortFieldOpen = false"
                  >
                    {{ col.label }}
                  </button>
                  <div v-if="filteredSortColumns.length === 0" class="fm-ss-no-match">
                    該当なし
                  </div>
                </div>
              </div>
            </div>
            <select class="fm-select fm-sort-order" v-model="localSort.order">
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>

        <!-- フッター -->
        <div class="fm-footer">
          <button class="fm-cancel-btn" @click="onCancel">キャンセル</button>
          <button class="fm-apply-btn" @click="onApply">適用</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * FilterModal.vue — kintone風絞り込みモーダル
 *
 * 一覧テーブル共通のフィルタ＆ソート設定UI。
 * フィールドタイプ別に演算子を動的切替し、
 * 複数条件のAND/OR結合をサポートする。
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type {
  FilterColumnDef,
  FilterCondition,
  FilterResult,
  SortSetting,
  OperatorDef,
  FilterOperator,
} from './types'
import {
  getOperatorsForType,
  isNoValueOperator,
  isMultiValueOperator,
} from './types'

interface Props {
  /** モーダル表示フラグ */
  visible: boolean
  /** フィルタ対象列定義（フィールドタイプ・選択肢付き） */
  columns: FilterColumnDef[]
  /** 現在のフィルタ条件 */
  conditions?: FilterCondition[]
  /** 現在の結合方式 */
  logic?: 'and' | 'or'
  /** 現在のソート設定 */
  sort?: SortSetting
  /** デフォルトのフィルタ条件（ビュー定義のdefaultFilters） */
  defaultConditions?: FilterCondition[]
  /** デフォルトのソート設定（ビュー定義のdefaultSort） */
  defaultSort?: SortSetting
}

const props = withDefaults(defineProps<Props>(), {
  conditions: () => [],
  logic: 'and',
  sort: () => ({ key: 'threeCode', order: 'asc' as const }),
  defaultConditions: () => [],
  defaultSort: () => ({ key: 'threeCode', order: 'asc' as const }),
})

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'apply', result: FilterResult): void
}>()

// --- ローカル状態 ---

/** 空の条件行を生成 */
const createEmptyCondition = (): FilterCondition => {
  const firstCol = props.columns[0]
  const ops = getOperatorsForType(firstCol?.filterType ?? 'text')
  return {
    field: firstCol?.key ?? '',
    operator: ops[0]?.value ?? 'eq',
    value: isMultiValueOperator(ops[0]?.value ?? 'eq') ? [] : '',
  }
}

const localConditions = ref<FilterCondition[]>([])
const localLogic = ref<'and' | 'or'>('and')
const localSort = ref<SortSetting>({ key: 'threeCode', order: 'asc' })
const openMultiIdx = ref<number | null>(null)

// --- フィールド検索用state ---
/** 各条件行の検索テキスト（インデックス対応） */
const fieldSearches = ref<Record<number, string>>({})
/** 開いているフィールドドロップダウンのインデックス */
const openFieldIdx = ref<number | null>(null)
/** フィールド検索inputのref（フォーカス用） */
const fieldSearchInputRef = ref<HTMLInputElement | null>(null)
/** ソートのフィールド検索 */
const sortFieldSearch = ref('')
const sortFieldOpen = ref(false)

/** props → ローカル状態同期（v-ifマウント時もimmediate:trueで初期化） */
watch(() => props.visible, (v) => {
  if (v) {
    localConditions.value = props.conditions.length > 0
      ? props.conditions.map(c => ({
          ...c,
          value: Array.isArray(c.value) ? [...c.value] : c.value,
        }))
      : [createEmptyCondition()]
    localLogic.value = props.logic
    localSort.value = { ...props.sort }
    openMultiIdx.value = null
    openFieldIdx.value = null
    fieldSearches.value = {}
    sortFieldSearch.value = ''
    sortFieldOpen.value = false
  }
}, { immediate: true })

// --- ヘルパー ---

/** フィールドキーから列定義を取得 */
const getFieldDef = (key: string): FilterColumnDef | undefined => {
  return props.columns.find(c => c.key === key)
}

/** フィールドキーからラベルを取得 */
const getFieldLabel = (key: string): string => {
  return getFieldDef(key)?.label ?? ''
}

/** フィールドキーから使用可能な演算子を取得 */
const getOperatorsForField = (fieldKey: string): OperatorDef[] => {
  const def = getFieldDef(fieldKey)
  return getOperatorsForType(def?.filterType ?? 'text')
}

/** 条件行のフィールド検索結果（部分一致フィルタ） */
const filteredColumns = (idx: number): FilterColumnDef[] => {
  const q = (fieldSearches.value[idx] ?? '').trim().toLowerCase()
  if (!q) return props.columns
  return props.columns.filter(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
}

/** ソートのフィールド検索結果 */
const filteredSortColumns = computed(() => {
  const q = sortFieldSearch.value.trim().toLowerCase()
  if (!q) return props.columns
  return props.columns.filter(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
})

/** フィールドドロップダウンの開閉 */
const toggleFieldDropdown = (idx: number) => {
  if (openFieldIdx.value === idx) {
    openFieldIdx.value = null
  } else {
    openFieldIdx.value = idx
    fieldSearches.value[idx] = ''
    // 検索inputにフォーカス
    nextTick(() => {
      if (fieldSearchInputRef.value) fieldSearchInputRef.value.focus()
    })
  }
}

/** フィールド選択確定 */
const selectField = (idx: number, key: string) => {
  openFieldIdx.value = null
  onFieldChange(idx, key)
}

const isNoValueOp = (op: FilterOperator) => isNoValueOperator(op)
const isMultiValueOp = (op: FilterOperator) => isMultiValueOperator(op)

/** 複数選択のラベル一覧を取得 */
const getMultiLabels = (cond: FilterCondition): string[] => {
  const def = getFieldDef(cond.field)
  if (!def?.filterOptions || !Array.isArray(cond.value)) return []
  return (cond.value as string[])
    .map(v => def.filterOptions!.find(o => o.value === v)?.label ?? v)
}

// --- イベントハンドラ ---

/** フィールド変更：演算子・値をリセット */
const onFieldChange = (idx: number, fieldKey: string) => {
  const ops = getOperatorsForField(fieldKey)
  const defaultOp = ops[0]?.value ?? 'eq'
  localConditions.value[idx] = {
    field: fieldKey,
    operator: defaultOp,
    value: isMultiValueOperator(defaultOp) ? [] : '',
  }
}

/** 演算子変更：値をリセット */
const onOperatorChange = (idx: number, op: FilterOperator) => {
  const cond = localConditions.value[idx]
  if (!cond) return
  cond.operator = op
  if (isNoValueOperator(op)) {
    cond.value = ''
  } else if (isMultiValueOperator(op)) {
    cond.value = Array.isArray(cond.value) ? cond.value : []
  } else {
    cond.value = typeof cond.value === 'string' ? cond.value : ''
  }
}

/** 複数選択ドロップダウンの開閉 */
const toggleMultiDropdown = (idx: number) => {
  openMultiIdx.value = openMultiIdx.value === idx ? null : idx
}

/** 複数選択の値トグル */
const toggleMultiValue = (idx: number, val: string) => {
  const cond = localConditions.value[idx]
  if (!cond) return
  const arr = cond.value as string[]
  const i = arr.indexOf(val)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(val)
}

/** 条件行を追加 */
const addCondition = () => {
  localConditions.value.push(createEmptyCondition())
}

/** 条件行を削除 */
const removeCondition = (idx: number) => {
  if (localConditions.value.length > 1) {
    localConditions.value.splice(idx, 1)
  }
}

/** すべてクリア */
const clearAll = () => {
  localConditions.value = [createEmptyCondition()]
  localLogic.value = 'and'
}

/** デフォルトに戻す（ビュー定義のdefaultFilters/defaultSortを復元） */
const restoreDefault = () => {
  if (props.defaultConditions.length > 0) {
    localConditions.value = props.defaultConditions.map(c => ({
      ...c,
      value: Array.isArray(c.value) ? [...c.value] : c.value,
    }))
  } else {
    localConditions.value = [createEmptyCondition()]
  }
  localLogic.value = 'and'
  localSort.value = { ...props.defaultSort }
}

/** キャンセル */
const onCancel = () => {
  openMultiIdx.value = null
  openFieldIdx.value = null
  sortFieldOpen.value = false
  emit('update:visible', false)
}

/** 適用 */
const onApply = () => {
  // 空フィールドの行を除外、is_empty/is_not_emptyは値なしでも有効
  const validConditions = localConditions.value.filter(c => {
    if (!c.field) return false
    if (isNoValueOperator(c.operator)) return true
    if (isMultiValueOperator(c.operator)) return (c.value as string[]).length > 0
    return (c.value as string) !== ''
  })

  emit('apply', {
    conditions: validConditions,
    logic: localLogic.value,
    sort: { ...localSort.value },
  })
  emit('update:visible', false)
}

// --- ESCキーで閉じる ---
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) onCancel()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ===== オーバーレイ ===== */
.fm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}

/* ===== モーダル本体 ===== */
.fm-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  width: 740px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ===== ヘッダー ===== */
.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  border-bottom: 1px solid #e8e8e8;
}
.fm-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}
.fm-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}
.fm-close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

/* ===== セクション ===== */
.fm-section {
  padding: 16px 24px;
}
.fm-section-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
}

/* ===== 条件行 ===== */
.fm-conditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fm-condition-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

/* ===== 共通セレクト/インプット ===== */
.fm-select,
.fm-input {
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  padding: 0 10px;
  background: #fff;
  color: #333;
  transition: border-color 0.15s;
}
.fm-select:focus,
.fm-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
}

.fm-field-select {
  min-width: 160px;
  flex: 0 0 auto;
}
.fm-operator-select {
  min-width: 170px;
  flex: 0 0 auto;
}
.fm-value-input,
.fm-value-select {
  flex: 1;
  min-width: 120px;
}
.fm-no-value {
  flex: 1;
  min-width: 120px;
}

/* ===== 検索可能ドロップダウン ===== */
.fm-searchable-select {
  position: relative;
}
.fm-ss-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 10px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: border-color 0.15s;
  gap: 6px;
}
.fm-ss-trigger:hover,
.fm-ss-trigger.active {
  border-color: #3498db;
}
.fm-ss-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: left;
}
.fm-ss-chevron {
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.fm-ss-trigger.active .fm-ss-chevron {
  transform: rotate(180deg);
}
.fm-ss-dropdown {
  position: absolute;
  top: 40px;
  left: 0;
  min-width: 100%;
  width: max-content;
  max-width: 280px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
  z-index: 20;
  overflow: hidden;
}
.fm-ss-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}
.fm-ss-search-icon {
  font-size: 12px;
  color: #aaa;
  flex-shrink: 0;
}
.fm-ss-search {
  width: 100%;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
  background: transparent;
}
.fm-ss-search::placeholder {
  color: #bbb;
}
.fm-ss-options {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}
.fm-ss-option {
  display: block;
  width: 100%;
  padding: 7px 12px;
  font-size: 13px;
  color: #333;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.1s;
}
.fm-ss-option:hover {
  background: #f0f7ff;
}
.fm-ss-option.selected {
  color: #3498db;
  font-weight: 600;
  background: #f0f7ff;
}
.fm-ss-no-match {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #aaa;
}

/* ===== 複数選択ボックス ===== */
.fm-multi-value {
  position: relative;
  flex: 1;
  min-width: 160px;
}
.fm-multi-value-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 10px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.15s;
}
.fm-multi-value-box:hover {
  border-color: #3498db;
}
.fm-placeholder {
  color: #aaa;
  font-size: 13px;
}
.fm-multi-tags {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fm-chevron {
  font-size: 10px;
  color: #999;
  margin-left: 8px;
}
.fm-multi-dropdown {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 10;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px 0;
}
.fm-multi-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background 0.1s;
}
.fm-multi-option:hover {
  background: #f0f7ff;
}
.fm-multi-option input[type="checkbox"] {
  accent-color: #3498db;
}

/* ===== 行追加/削除ボタン ===== */
.fm-remove-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  padding: 8px 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.fm-remove-btn:hover:not(:disabled) {
  color: #e74c3c;
}
.fm-remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.fm-add-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 18px;
  cursor: pointer;
  padding: 8px 0;
  margin-top: 4px;
  transition: color 0.15s;
}
.fm-add-btn:hover {
  color: #2980b9;
}

/* ===== AND/OR ===== */
.fm-logic-row {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding-top: 8px;
}
.fm-radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}
.fm-radio-label input[type="radio"] {
  accent-color: #3498db;
}

/* ===== すべてクリア / デフォルトに戻す ===== */
.fm-action-row {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
.fm-clear-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.fm-clear-btn:hover {
  color: #2980b9;
  text-decoration: underline;
}
.fm-default-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.fm-default-btn:hover {
  color: #2980b9;
  text-decoration: underline;
}

/* ===== ソートセクション ===== */
.fm-sort-section {
  border-top: 1px solid #e8e8e8;
}
.fm-sort-row {
  display: flex;
  gap: 8px;
}
.fm-sort-field {
  flex: 1;
  min-width: 180px;
}
.fm-sort-order {
  min-width: 100px;
}

/* ===== フッター ===== */
.fm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
}
.fm-cancel-btn {
  background: #fff;
  border: 1px solid #ccc;
  color: #3498db;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.fm-cancel-btn:hover {
  background: #f8f8f8;
  border-color: #3498db;
}
.fm-apply-btn {
  background: #3498db;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 48px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.fm-apply-btn:hover {
  background: #2980b9;
}
</style>
