import { ref, computed } from 'vue'
import { ACCOUNT_MASTER } from '@/shared/data/account-master'
import { useAccountMaster } from './useAccountMaster'
import type { Account } from '@/shared/types/account'

// =============================================
// 型定義
// =============================================

/** 顧問先レベルの科目（マスタからコピー＋上書き） */
export interface ClientAccount extends Account {
  /** 顧問先で非表示に設定されているか */
  hiddenInClient: boolean
  /** カスタム科目か */
  isCustom: boolean
  /** マスタレベルで非表示か（参照情報） */
  hiddenInMaster: boolean
}

// =============================================
// localStorage キー
// =============================================

const STORAGE_PREFIX = 'sugu-suru:client-accounts:'

/** 顧問先ごとの差分データ */
interface ClientOverrides {
  /** 顧問先で非表示にした科目IDの一覧 */
  hiddenIds: string[]
  /** 顧問先で追加したカスタム科目 */
  customAccounts: Account[]
  /** マスタからコピーした時点のマスタ科目ID一覧（差分検出用） */
  copiedMasterIds: string[]
}

// =============================================
// ヘルパー関数
// =============================================

function loadClientOverrides(clientId: string): ClientOverrides | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + clientId)
    if (raw) return JSON.parse(raw)
  } catch { /* 破損データは無視 */ }
  return null
}

function saveClientOverrides(clientId: string, data: ClientOverrides): void {
  localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(data))
}

/** マスタから初期コピーを作成（ルール7） */
function createInitialCopy(): ClientOverrides {
  const { masterAccounts } = useAccountMaster()
  return {
    hiddenIds: masterAccounts.value
      .filter(a => a.hiddenInMaster)
      .map(a => a.id),
    customAccounts: [],
    copiedMasterIds: masterAccounts.value.map(a => a.id),
  }
}

// =============================================
// Composable
// =============================================

export function useClientAccounts(clientId: string) {
  // 既存データを読み込むか、マスタから初期コピー
  const existing = loadClientOverrides(clientId)
  const overrides = ref<ClientOverrides>(existing ?? createInitialCopy())

  // 初回コピー時は保存
  if (!existing) {
    saveClientOverrides(clientId, overrides.value)
  }

  const { masterAccounts } = useAccountMaster()

  /** マスタから新規追加された科目を検出して自動反映（ルール8） */
  const newMasterAccounts = computed<Account[]>(() => {
    const copiedIds = new Set(overrides.value.copiedMasterIds)
    return masterAccounts.value.filter(a => !copiedIds.has(a.id) && !a.isCustom)
  })

  /** 全科目リスト（マスタ＋マスタ新規＋顧問先カスタム） */
  const clientAccounts = computed<ClientAccount[]>(() => {
    // マスタのデフォルト科目（コピー済み）
    const defaultAccounts: ClientAccount[] = ACCOUNT_MASTER.map(a => {
      const masterEntry = masterAccounts.value.find(m => m.id === a.id)
      return {
        ...a,
        hiddenInClient: overrides.value.hiddenIds.includes(a.id),
        isCustom: false,
        hiddenInMaster: masterEntry?.hiddenInMaster ?? false,
      }
    })

    // マスタのカスタム科目（事務所で追加されたもの）
    const masterCustom: ClientAccount[] = masterAccounts.value
      .filter(a => a.isCustom)
      .map(a => ({
        ...a,
        hiddenInClient: overrides.value.hiddenIds.includes(a.id),
        isCustom: true,
        hiddenInMaster: a.hiddenInMaster,
      }))

    // 顧問先固有のカスタム科目
    const clientCustom: ClientAccount[] = overrides.value.customAccounts.map(a => ({
      ...a,
      hiddenInClient: overrides.value.hiddenIds.includes(a.id),
      isCustom: true,
      hiddenInMaster: false,
    }))

    return [...defaultAccounts, ...masterCustom, ...clientCustom]
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  /** 表示中の科目のみ */
  const visibleClientAccounts = computed<ClientAccount[]>(() =>
    clientAccounts.value.filter(a => !a.hiddenInClient && !a.hiddenInMaster)
  )

  /** 科目の表示/非表示をトグル（顧問先レベル） */
  function toggleVisibility(accountId: string): void {
    const idx = overrides.value.hiddenIds.indexOf(accountId)
    if (idx >= 0) {
      overrides.value.hiddenIds.splice(idx, 1)
    } else {
      overrides.value.hiddenIds.push(accountId)
    }
    saveClientOverrides(clientId, overrides.value)
  }

  /** マスタから新規追加された科目を同期（ルール8） */
  function syncFromMaster(): number {
    const newAccounts = newMasterAccounts.value
    if (newAccounts.length === 0) return 0

    for (const a of newAccounts) {
      overrides.value.copiedMasterIds.push(a.id)
    }
    saveClientOverrides(clientId, overrides.value)
    return newAccounts.length
  }

  /** デフォルト設定にリセット（マスタから再コピー） */
  function resetToDefault(): void {
    overrides.value = createInitialCopy()
    saveClientOverrides(clientId, overrides.value)
  }

  return {
    /** 全科目（非表示含む） */
    clientAccounts,
    /** 表示中の科目のみ */
    visibleClientAccounts,
    /** マスタから新規追加された科目 */
    newMasterAccounts,
    toggleVisibility,
    syncFromMaster,
    resetToDefault,
  }
}
