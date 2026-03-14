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

  const clientTaxCategories = computed<ClientTaxCategory[]>(() =>
    TAX_CATEGORY_MASTER.map(tc => {
      const masterEntry = masterTaxCategories.value.find(m => m.id === tc.id)
      const aiOverride = overrides.value.aiSelectableOverrides[tc.id] ?? null
      return {
        ...tc,
        hiddenInClient: overrides.value.hiddenIds.includes(tc.id),
        hiddenInMaster: masterEntry?.hiddenInMaster ?? false,
        aiSelectableOverride: aiOverride,
        // 実効値: 上書きがあればそれ、なければマスタ値
        aiSelectable: aiOverride !== null ? aiOverride : tc.aiSelectable,
      }
    })
  )

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

  return {
    clientTaxCategories,
    visibleClientTaxCategories,
    toggleVisibility,
    setAiSelectable,
    resetToDefault,
  }
}
