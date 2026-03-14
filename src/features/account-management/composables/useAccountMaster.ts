import { ref, computed } from 'vue'
import { ACCOUNT_MASTER } from '@/shared/data/account-master'
import type { Account } from '@/shared/types/account'

// =============================================
// 型定義
// =============================================

/** マスタレベルの科目拡張（非表示フラグ＋カスタム識別） */
export interface MasterAccount extends Account {
  /** 事務所マスタで非表示に設定されているか */
  hiddenInMaster: boolean
  /** カスタム科目か（事務所で追加した科目） */
  isCustom: boolean
}

// =============================================
// localStorage キー
// =============================================

const STORAGE_KEY = 'sugu-suru:account-master:overrides'

/** localStorage に保存する差分データ */
interface MasterOverrides {
  /** 非表示にした科目IDの一覧 */
  hiddenIds: string[]
  /** カスタム追加した科目の一覧 */
  customAccounts: Account[]
}

// =============================================
// ヘルパー関数
// =============================================

function loadOverrides(): MasterOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* 破損データは無視 */ }
  return { hiddenIds: [], customAccounts: [] }
}

function saveOverrides(data: MasterOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// =============================================
// モジュールスコープ（シングルトン）
// Phase B TODO: Supabase APIに差し替え
// =============================================

const overrides = ref<MasterOverrides>(loadOverrides())

/** デフォルト科目 ＋ カスタム科目を統合した全科目リスト */
const masterAccounts = computed<MasterAccount[]>(() => {
  const defaultAccounts: MasterAccount[] = ACCOUNT_MASTER.map(a => ({
    ...a,
    hiddenInMaster: overrides.value.hiddenIds.includes(a.id),
    isCustom: false,
  }))

  const customAccounts: MasterAccount[] = overrides.value.customAccounts.map(a => ({
    ...a,
    hiddenInMaster: overrides.value.hiddenIds.includes(a.id),
    isCustom: true,
  }))

  return [...defaultAccounts, ...customAccounts].sort((a, b) => a.sortOrder - b.sortOrder)
})

/** 表示中の科目のみ（非表示を除外） */
const visibleMasterAccounts = computed<MasterAccount[]>(() =>
  masterAccounts.value.filter(a => !a.hiddenInMaster)
)

// =============================================
// Composable
// =============================================

export function useAccountMaster() {
  /** 科目の表示/非表示をトグル */
  function toggleVisibility(accountId: string): void {
    const idx = overrides.value.hiddenIds.indexOf(accountId)
    if (idx >= 0) {
      overrides.value.hiddenIds.splice(idx, 1)
    } else {
      overrides.value.hiddenIds.push(accountId)
    }
    saveOverrides(overrides.value)
  }

  /** カスタム科目を追加 */
  function addCustomAccount(account: Account): void {
    overrides.value.customAccounts.push(account)
    saveOverrides(overrides.value)
  }

  /** カスタム科目を削除（デフォルト科目は削除不可） */
  function removeCustomAccount(accountId: string): boolean {
    const idx = overrides.value.customAccounts.findIndex(a => a.id === accountId)
    if (idx < 0) return false
    overrides.value.customAccounts.splice(idx, 1)
    // 非表示リストからも除去
    const hidIdx = overrides.value.hiddenIds.indexOf(accountId)
    if (hidIdx >= 0) overrides.value.hiddenIds.splice(hidIdx, 1)
    saveOverrides(overrides.value)
    return true
  }

  /** デフォルト設定にリセット */
  function resetToDefault(): void {
    overrides.value = { hiddenIds: [], customAccounts: [] }
    saveOverrides(overrides.value)
  }

  /** 科目が非表示かどうか */
  function isHidden(accountId: string): boolean {
    return overrides.value.hiddenIds.includes(accountId)
  }

  return {
    /** 全科目（非表示含む） */
    masterAccounts,
    /** 表示中の科目のみ */
    visibleMasterAccounts,
    /** 現在の差分データ（顧問先コピー用） */
    overrides,
    toggleVisibility,
    addCustomAccount,
    removeCustomAccount,
    resetToDefault,
    isHidden,
  }
}
