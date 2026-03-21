import { ref, computed } from 'vue'
import { TAX_CATEGORY_MASTER } from '@/shared/data/tax-category-master'
import { useTaxMaster } from './useTaxMaster'
import type { TaxCategory } from '@/shared/types/tax-category'

// =============================================
// 型定義
// =============================================

/** 顧問先レベルの税区分 */
export interface ClientTaxCategory extends TaxCategory {
  /** 顧問先で非表示に設定されているか */
  hiddenInClient: boolean
  /** マスタレベルで非表示か */
  hiddenInMaster: boolean
  /** 顧問先レベルのAI選択可否上書き（null=マスタ設定を使用） */
  aiSelectableOverride: boolean | null
}

// =============================================
// localStorage キー
// =============================================

const STORAGE_PREFIX = 'sugu-suru:client-tax:'

interface ClientTaxOverrides {
  hiddenIds: string[]
  aiSelectableOverrides: Record<string, boolean>
  copiedMasterIds: string[]
  /** ページで追加されたカスタム税区分 */
  customTaxCategories: TaxCategory[]
}

// =============================================
// ヘルパー関数
// =============================================

function loadOverrides(clientId: string): ClientTaxOverrides | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + clientId)
    if (raw) return JSON.parse(raw)
  } catch { /* 破損データは無視 */ }
  return null
}

function saveOverrides(clientId: string, data: ClientTaxOverrides): void {
  localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(data))
}

function createInitialCopy(): ClientTaxOverrides {
  const { masterTaxCategories } = useTaxMaster()
  return {
    hiddenIds: masterTaxCategories.value
      .filter(tc => tc.hiddenInMaster)
      .map(tc => tc.id),
    aiSelectableOverrides: {},
    copiedMasterIds: masterTaxCategories.value.map(tc => tc.id),
    customTaxCategories: [],
  }
}

// =============================================
// Composable
// =============================================

export function useClientTaxCategories(clientId: string) {
  const existing = loadOverrides(clientId)
  const overrides = ref<ClientTaxOverrides>(existing ?? createInitialCopy())

  if (!existing) {
    saveOverrides(clientId, overrides.value)
  }

  const { masterTaxCategories } = useTaxMaster()

  const clientTaxCategories = computed<ClientTaxCategory[]>(() => {
    // マスタの税区分（デフォルト+カスタム追加分）をベースにする
    const baseRows: ClientTaxCategory[] = masterTaxCategories.value.map(tc => {
      const aiOverride = overrides.value.aiSelectableOverrides[tc.id] ?? null
      return {
        ...tc,
        hiddenInClient: overrides.value.hiddenIds.includes(tc.id),
        hiddenInMaster: tc.hiddenInMaster,
        aiSelectableOverride: aiOverride,
        aiSelectable: aiOverride !== null ? aiOverride : tc.aiSelectable,
      }
    })

    // 顧問先ページで独自に追加されたカスタム税区分（マスタにない行）
    const masterIds = new Set(masterTaxCategories.value.map(tc => tc.id))
    const clientCustomRows: ClientTaxCategory[] = (overrides.value.customTaxCategories ?? [])
      .filter(tc => !masterIds.has(tc.id)) // マスタに既にあるものは除外
      .map(tc => ({
        ...tc,
        hiddenInClient: overrides.value.hiddenIds.includes(tc.id),
        hiddenInMaster: false,
        aiSelectableOverride: overrides.value.aiSelectableOverrides[tc.id] ?? null,
        isCustom: true,
      }))

    return [...baseRows, ...clientCustomRows].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
  })

  const visibleClientTaxCategories = computed<ClientTaxCategory[]>(() =>
    clientTaxCategories.value.filter(tc => !tc.hiddenInClient && !tc.hiddenInMaster)
  )

  function toggleVisibility(taxCategoryId: string): void {
    const idx = overrides.value.hiddenIds.indexOf(taxCategoryId)
    if (idx >= 0) {
      overrides.value.hiddenIds.splice(idx, 1)
    } else {
      overrides.value.hiddenIds.push(taxCategoryId)
    }
    saveOverrides(clientId, overrides.value)
  }

  /** AI選択可否を上書き（ルール9） */
  function setAiSelectable(taxCategoryId: string, selectable: boolean): void {
    overrides.value.aiSelectableOverrides[taxCategoryId] = selectable
    saveOverrides(clientId, overrides.value)
  }

  function resetToDefault(): void {
    overrides.value = createInitialCopy()
    saveOverrides(clientId, overrides.value)
  }

  /** ページから全行データを受け取り、composableの保存形式に分解して保存 */
  function saveAll(allRows: TaxCategory[]): void {
    const hiddenIds = allRows.filter(r => r.deprecated).map(r => r.id)
    const customTaxCategories = allRows.filter(r => r.isCustom)
    const aiSelectableOverrides: Record<string, boolean> = {}
    // AI選択可否がマスタと異なる行を収集
    allRows.forEach(r => {
      const master = TAX_CATEGORY_MASTER.find(m => m.id === r.id)
      if (master && r.aiSelectable !== master.aiSelectable) {
        aiSelectableOverrides[r.id] = r.aiSelectable
      }
    })
    overrides.value = {
      hiddenIds,
      customTaxCategories,
      aiSelectableOverrides,
      copiedMasterIds: TAX_CATEGORY_MASTER.map(t => t.id),
    }
    saveOverrides(clientId, overrides.value)
  }

  return {
    clientTaxCategories,
    visibleClientTaxCategories,
    toggleVisibility,
    setAiSelectable,
    resetToDefault,
    saveAll,
  }
}
