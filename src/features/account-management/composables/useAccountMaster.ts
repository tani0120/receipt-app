/**
 * useAccountMaster — 勘定科目マスタ composable（API接続版）
 *
 * 【設計原則】useJournals.tsパターン準拠
 * - サーバーAPI（/api/accounts/master）を通じてデータを永続化
 * - モジュールスコープのシングルトンrefでフロント側キャッシュ
 * - 変更操作時にサーバーへ自動保存（デバウンス300ms）
 * - 初回アクセス時にサーバーから読み込み
 *
 * 準拠: DL-042, Phase 2 Step 2
 */
import { ref, computed, watch } from 'vue'
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

/** マスタ差分データ（非表示ID + カスタム科目） */
interface MasterOverrides {
  /** 非表示にした科目IDの一覧 */
  hiddenIds: string[]
  /** カスタム追加した科目の一覧 */
  customAccounts: Account[]
}

// =============================================
// API通信ヘルパー
// =============================================

const API_BASE = '/api/accounts'

async function fetchMasterFromServer(): Promise<MasterOverrides | null> {
  try {
    const res = await fetch(`${API_BASE}/master?pageSize=200`)
    if (!res.ok) return null
    const data = await res.json() as { items: Account[] }
    // サーバーから返された全件データからoverrides形式を復元
    const defaultIds = new Set(ACCOUNT_MASTER.map(a => a.id))
    const hiddenIds = data.items
      .filter((a: Account) => a.deprecated || a.effectiveTo)
      .filter((a: Account) => !a.isCustom)
      .map((a: Account) => a.id)
    const customAccounts = data.items.filter((a: Account) => !defaultIds.has(a.id))
    return { hiddenIds, customAccounts }
  } catch (err) {
    console.error('[useAccountMaster] サーバー取得失敗:', err)
    return null
  }
}

async function saveOverridesToServer(overrides: MasterOverrides): Promise<void> {
  try {
    // overridesからフル科目リストを再構成してPUT
    const defaultAccounts = ACCOUNT_MASTER.map(a => ({
      ...a,
      deprecated: overrides.hiddenIds.includes(a.id) ? true : a.deprecated,
    }))
    const allAccounts = [...defaultAccounts, ...overrides.customAccounts]
    await fetch(`${API_BASE}/master`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: allAccounts }),
    })
  } catch (err) {
    console.error('[useAccountMaster] サーバー保存失敗:', err)
  }
}

// =============================================
// モジュールスコープ（シングルトン）
// =============================================

const overrides = ref<MasterOverrides>({ hiddenIds: [], customAccounts: [] })
let initialized = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

// autoSave: overrides変更時にサーバーへ自動保存（デバウンス300ms）
watch(overrides, () => {
  if (!initialized) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveOverridesToServer(overrides.value), 300)
}, { deep: true })

// 非同期でサーバーから初期データを取得
fetchMasterFromServer().then(serverData => {
  if (serverData) {
    overrides.value = serverData
    console.log('[useAccountMaster] サーバーからマスタ科目を取得')
  }
  initialized = true
})

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
    isCustom: a.isCustom ?? true,
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
  }

  /** カスタム科目を追加 */
  function addCustomAccount(account: Account): void {
    overrides.value.customAccounts.push(account)
  }

  /** カスタム科目を削除（デフォルト科目は削除不可） */
  function removeCustomAccount(accountId: string): boolean {
    const idx = overrides.value.customAccounts.findIndex(a => a.id === accountId)
    if (idx < 0) return false
    overrides.value.customAccounts.splice(idx, 1)
    // 非表示リストからも除去
    const hidIdx = overrides.value.hiddenIds.indexOf(accountId)
    if (hidIdx >= 0) overrides.value.hiddenIds.splice(hidIdx, 1)
    return true
  }

  /** デフォルト設定にリセット */
  function resetToDefault(): void {
    overrides.value = { hiddenIds: [], customAccounts: [] }
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
