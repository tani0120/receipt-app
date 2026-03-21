import { ref, computed } from 'vue'
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master'
import type { TaxCategory } from '@/shared/types/tax-category'

// =============================================
// 型定義
// =============================================

/** マスタレベルの税区分拡張 */
export interface MasterTaxCategory extends TaxCategory {
  /** 事務所マスタで非表示に設定されているか */
  hiddenInMaster: boolean
}

// =============================================
// localStorage キー
// =============================================

const STORAGE_KEY = 'sugu-suru:tax-master:overrides'

interface TaxMasterOverrides {
  /** 非表示にした税区分IDの一覧 */
  hiddenIds: string[]
  /** defaultVisible を上書きしたID→値のマップ */
  visibilityOverrides: Record<string, boolean>
  /** マスタページで追加されたカスタム税区分 */
  customTaxCategories?: TaxCategory[]
}

// =============================================
// ヘルパー関数
// =============================================

function loadOverrides(): TaxMasterOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* 破損データは無視 */ }
  return { hiddenIds: [], visibilityOverrides: {}, customTaxCategories: [] }
}

function saveOverrides(data: TaxMasterOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

const overrides = ref<TaxMasterOverrides>(loadOverrides())

/** 全税区分（マスタデフォルト + カスタム追加分。非表示フラグ適用済み） */
const masterTaxCategories = computed<MasterTaxCategory[]>(() => {
  // ハードコードされたマスタ税区分
  const defaultRows: MasterTaxCategory[] = TAX_CATEGORY_MASTER.map(tc => ({
    ...tc,
    hiddenInMaster: overrides.value.hiddenIds.includes(tc.id),
  }))
  // マスタページで追加されたカスタム税区分
  const customRows: MasterTaxCategory[] = (overrides.value.customTaxCategories ?? []).map(tc => ({
    ...tc,
    hiddenInMaster: overrides.value.hiddenIds.includes(tc.id),
    isCustom: tc.isCustom ?? true,
  }))
  return [...defaultRows, ...customRows].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
})

/** デフォルト表示の税区分のみ */
const visibleMasterTaxCategories = computed<MasterTaxCategory[]>(() =>
  masterTaxCategories.value.filter(tc => {
    if (tc.hiddenInMaster) return false
    // visibilityOverrides があればそれを優先、なければ defaultVisible
    if (tc.id in overrides.value.visibilityOverrides) {
      return overrides.value.visibilityOverrides[tc.id]
    }
    return tc.defaultVisible
  })
)

// =============================================
// Composable
// =============================================

export function useTaxMaster() {
  /** 税区分の表示/非表示をトグル */
  function toggleVisibility(taxCategoryId: string): void {
    const idx = overrides.value.hiddenIds.indexOf(taxCategoryId)
    if (idx >= 0) {
      overrides.value.hiddenIds.splice(idx, 1)
    } else {
      overrides.value.hiddenIds.push(taxCategoryId)
    }
    saveOverrides(overrides.value)
  }

  /** defaultVisibleの上書き設定 */
  function setDefaultVisible(taxCategoryId: string, visible: boolean): void {
    overrides.value.visibilityOverrides[taxCategoryId] = visible
    saveOverrides(overrides.value)
  }

  /** デフォルト設定にリセット */
  function resetToDefault(): void {
    overrides.value = { hiddenIds: [], visibilityOverrides: {}, customTaxCategories: [] }
    saveOverrides(overrides.value)
  }

  return {
    /** 全税区分（非表示含む） */
    masterTaxCategories,
    /** 表示中の税区分のみ */
    visibleMasterTaxCategories,
    /** 現在の差分データ */
    overrides,
    toggleVisibility,
    setDefaultVisible,
    resetToDefault,
  }
}
