<template>
  <div class="tft-toolbar">
    <div class="tft-toolbar-left">
      <!-- ビュー切替ドロップダウン -->
      <div v-if="views && views.length > 0" class="tft-filter-group">
        <div class="tft-view-dropdown-wrap" @click.stop>
          <button class="tft-view-trigger" @click="showViewDropdown = !showViewDropdown">
            <i class="fa-solid fa-table-list tft-view-icon"></i>
            <span class="tft-view-label">{{ currentViewName }}</span>
            <i class="fa-solid fa-chevron-down tft-chevron" :class="{ open: showViewDropdown }"></i>
          </button>
          <div v-if="showViewDropdown" class="tft-view-dropdown">
            <button
              v-for="(v, idx) in views"
              :key="idx"
              class="tft-view-option"
              :class="{ active: localViewIndex === idx }"
              @click="selectView(idx)"
            >
              <i v-if="localViewIndex === idx" class="fa-solid fa-check tft-view-check"></i>
              <span>{{ v.name }}</span>
            </button>
          </div>
        </div>
      </div>
      <!-- ファンネルアイコン（絞り込みモーダル起動） -->
      <button
        class="tft-filter-funnel"
        :class="{ active: hasActiveFilter }"
        @click="showFilterModal = true"
        title="絞り込む"
      >
        <i class="fa-solid fa-filter"></i>
      </button>
      <!-- 適用中のフィルタ条件タグ -->
      <div v-if="filterTags.length > 0" class="tft-filter-tags">
        <span
          v-for="(tag, ti) in filterTags"
          :key="ti"
          class="tft-filter-tag"
        >
          <span class="tft-tag-field">{{ tag.fieldLabel }}</span>
          <span class="tft-tag-op">{{ tag.opLabel }}</span>
          <span class="tft-tag-value">{{ tag.valueLabel }}</span>
          <i class="fa-solid fa-xmark tft-tag-remove" @click.stop="removeFilter(ti)"></i>
        </span>
      </div>
      <span class="tft-page-info">全{{ totalCount }}件</span>
    </div>
    <div class="tft-toolbar-right">
      <slot name="actions"></slot>
    </div>
  </div>

  <!-- 絞り込みモーダル -->
  <FilterModal
    v-if="showFilterModal && resolvedFilterColumns.length > 0"
    v-model:visible="showFilterModal"
    :columns="resolvedFilterColumns"
    :conditions="filterConditions"
    :logic="filterLogic"
    :sort="filterSort"
    :default-conditions="defaultConditions"
    :default-sort="defaultSort"
    @apply="onFilterApply"
  />
</template>

<script setup lang="ts">
/**
 * TableFilterToolbar.vue — テーブル一覧共通ツールバー
 *
 * ビュー切替と絞り込みモーダルを統合。
 * 顧問先一覧・見込先一覧で共通使用。
 *
 * 適用中のフィルタ条件をタグで常時表示する。
 */
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import FilterModal from '@/components/list-view/FilterModal.vue'
import type { FilterColumnDef, FilterCondition, FilterResult, SortSetting, ViewDef } from '@/components/list-view/types'

/** 列定義（テーブル表示用） */
export interface ColumnDef {
  key: string
  label: string
}

const props = defineProps<{
  /** 全列定義 */
  columns: ColumnDef[]
  /** 現在の表示列キー配列 */
  visibleColumns: string[]
  /** 表示中の件数 */
  totalCount: number
  /** ビュー定義配列 */
  views?: ViewDef[]
  /** 現在のビューインデックス */
  activeViewIndex?: number
  /** 絞り込みモーダル用列定義（フィールドタイプ・選択肢付き） */
  filterColumns?: FilterColumnDef[]
  /** 現在のフィルタ条件 */
  filterConditions?: FilterCondition[]
  /** 条件結合方式 */
  filterLogic?: 'and' | 'or'
  /** ソート設定 */
  filterSort?: SortSetting
  /** デフォルトのフィルタ条件（ビュー定義のdefaultFilters） */
  defaultConditions?: FilterCondition[]
  /** デフォルトのソート設定（ビュー定義のdefaultSort） */
  defaultSort?: SortSetting
}>()

const emit = defineEmits<{
  (e: 'update:visibleColumns', value: string[]): void
  (e: 'update:activeViewIndex', value: number): void
  (e: 'filterChange'): void
  (e: 'filterApply', result: FilterResult): void
  (e: 'filterRemove', index: number): void
  (e: 'viewChange', index: number): void
}>()

// ローカルstate
const localVisibleCols = ref<string[]>([...props.visibleColumns])
const showFilterModal = ref(false)
const showViewDropdown = ref(false)
const localViewIndex = ref(props.activeViewIndex ?? 0)

/** filterColumnsのundefined対策 */
const resolvedFilterColumns = computed(() => props.filterColumns ?? [])

/** 現在のビュー名 */
const currentViewName = computed(() => {
  if (!props.views || props.views.length === 0) return ''
  return props.views[localViewIndex.value]?.name ?? ''
})

/** フィルター条件が適用中か */
const hasActiveFilter = computed(() => {
  if (props.filterConditions && props.filterConditions.length > 0) return true
  return false
})

// --- 演算子ラベル ---
const OP_LABELS: Record<string, string> = {
  eq: '=', neq: '≠',
  contains: '含む', not_contains: '含まない',
  in: 'のいずれか', not_in: 'のいずれでもない',
  gte: '≧', lte: '≦', gt: '>', lt: '<',
  is_empty: '空', is_not_empty: '空でない',
}

/** 適用中フィルタの表示用タグ情報 */
interface FilterTag {
  fieldLabel: string
  opLabel: string
  valueLabel: string
}

const filterTags = computed<FilterTag[]>(() => {
  if (!props.filterConditions || props.filterConditions.length === 0) return []
  return props.filterConditions.map(cond => {
    // フィールドラベル解決
    const colDef = resolvedFilterColumns.value.find(c => c.key === cond.field)
    const fieldLabel = colDef?.label ?? cond.field

    // 演算子ラベル
    const opLabel = OP_LABELS[cond.operator] ?? cond.operator

    // 値ラベル（select型の場合は選択肢ラベルに変換）
    let valueLabel = ''
    if (cond.operator === 'is_empty' || cond.operator === 'is_not_empty') {
      valueLabel = ''
    } else if (Array.isArray(cond.value)) {
      valueLabel = cond.value.map(v => resolveOptionLabel(colDef, v)).join(', ')
    } else {
      valueLabel = resolveOptionLabel(colDef, cond.value)
    }

    return { fieldLabel, opLabel, valueLabel }
  })
})

/** select型の値をラベルに変換 */
function resolveOptionLabel(colDef: FilterColumnDef | undefined, value: string): string {
  if (!colDef || !colDef.filterOptions) return value
  const opt = colDef.filterOptions.find(o => o.value === value)
  return opt?.label ?? value
}

/** フィルタ条件を個別削除 */
function removeFilter(index: number) {
  emit('filterRemove', index)
}

// propsからの同期
watch(() => props.visibleColumns, (v) => { localVisibleCols.value = [...v] }, { deep: true })
watch(() => props.activeViewIndex, (v) => { if (v !== undefined) localViewIndex.value = v })

// 表示列変更時
watch(localVisibleCols, (v) => {
  emit('update:visibleColumns', [...v])
  emit('filterChange')
}, { deep: true })

/** ビュー選択 */
const selectView = (idx: number) => {
  localViewIndex.value = idx
  showViewDropdown.value = false
  emit('update:activeViewIndex', idx)
  emit('viewChange', idx)

  // ビュー定義に基づいてvisibleColumnsを切替
  if (props.views && props.views[idx]) {
    const view = props.views[idx]
    if (view.columns === null) {
      // （すべて）: 全列表示
      const allKeys = props.columns.map(c => c.key)
      localVisibleCols.value = allKeys
      emit('update:visibleColumns', allKeys)
    } else {
      localVisibleCols.value = [...view.columns]
      emit('update:visibleColumns', [...view.columns])
    }
    emit('filterChange')
  }
}

/** FilterModal適用時 */
const onFilterApply = (result: FilterResult) => {
  emit('filterApply', result)
}

// ドロップダウン外クリックで閉じる
const closeDropdowns = () => {
  showViewDropdown.value = false
}
onMounted(() => document.addEventListener('click', closeDropdowns))
onUnmounted(() => document.removeEventListener('click', closeDropdowns))
</script>

<style scoped>
.tft-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; }
.tft-toolbar-left { display: flex; align-items: center; gap: 12px; }
.tft-toolbar-right { display: flex; align-items: center; gap: 8px; }
.tft-filter-group { display: flex; align-items: center; }
.tft-page-info { font-size: 12px; color: #64748b; }

/* ビュー切替ドロップダウン */
.tft-view-dropdown-wrap { position: relative; }
.tft-view-trigger {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border: 1px solid #bfdbfe; border-radius: 6px;
  background: #eff6ff; color: #1d4ed8;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.tft-view-trigger:hover { background: #dbeafe; border-color: #93c5fd; }
.tft-view-icon { font-size: 14px; }
.tft-view-label { max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
.tft-chevron { font-size: 9px; transition: transform 0.15s; }
.tft-chevron.open { transform: rotate(180deg); }
.tft-view-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  min-width: 180px; padding: 6px 0;
  overflow: hidden;
}
.tft-view-option {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 9px 14px;
  border: none; background: none;
  font-size: 13px; color: #334155; text-align: left;
  cursor: pointer; transition: background 0.1s;
}
.tft-view-option:hover { background: #f0f7ff; }
.tft-view-option.active { color: #2563eb; font-weight: 600; }
.tft-view-check { font-size: 11px; color: #2563eb; }

/* ファンネルアイコン */
.tft-filter-funnel {
  width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid #cbd5e1; background: white;
  color: #94a3b8; font-size: 13px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.tft-filter-funnel:hover { border-color: #3b82f6; color: #3b82f6; }
.tft-filter-funnel.active { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }

/* フィルタタグ */
.tft-filter-tags {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.tft-filter-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 4px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  font-size: 11px; color: #1e40af;
  white-space: nowrap; line-height: 1.4;
}
.tft-tag-field { font-weight: 600; }
.tft-tag-op { color: #64748b; font-size: 10px; }
.tft-tag-value { color: #1d4ed8; font-weight: 500; }
.tft-tag-remove {
  font-size: 9px; cursor: pointer; color: #94a3b8;
  margin-left: 2px; transition: color 0.15s;
}
.tft-tag-remove:hover { color: #ef4444; }
</style>
