/**
 * useClientAccounts — 顧問先科目 composable（API接続版）
 *
 * 【設計原則】useJournals.tsパターン準拠
 * - サーバーAPI（/api/accounts/client/:clientId）を通じてデータを永続化
 * - 顧問先ID別キャッシュMapでフロント側キャッシュ
 * - 変更操作時にサーバーへ自動保存（デバウンス300ms）
 * - 初回アクセス時にサーバーから読み込み
 *
 * 準拠: DL-042, Phase 2 Step 3
 */
import { ref, computed, watch, type Ref } from 'vue'
import { useAccountMaster } from './useAccountMaster'
import type { Account } from '@/types/shared-account'

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
  /** マスタレベルで追加されたカスタム科目か（マスタカスタム vs 顧問先カスタムの区別用） */
  isMasterCustom: boolean
}

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
// API通信ヘルパー
// =============================================

const API_BASE = '/api/accounts'

async function fetchClientFromServer(clientId: string): Promise<{ accounts: Account[]; subAccounts?: Record<string, string> } | null> {
  try {
    const res = await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}?pageSize=200`)
    if (!res.ok) return null
    const data = await res.json() as { items: Account[] }
    return { accounts: data.items }
  } catch (err) {
    console.error(`[useClientAccounts] サーバー取得失敗 (${clientId}):`, err)
    return null
  }
}

async function saveClientToServer(clientId: string, accounts: Account[], subAccountsData?: Record<string, string>): Promise<void> {
  try {
    await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts, subAccounts: subAccountsData }),
    })
  } catch (err) {
    console.error(`[useClientAccounts] サーバー保存失敗 (${clientId}):`, err)
  }
}

// =============================================
// 顧問先別キャッシュ
// =============================================

interface ClientCache {
  overrides: Ref<ClientOverrides>
  subAccounts: Ref<Record<string, string>>
  initialized: boolean
}

const clientCacheMap = new Map<string, ClientCache>()

// =============================================
// Composable
// =============================================

export function useClientAccounts(clientId: string) {
  const { masterAccounts } = useAccountMaster()

  /** マスタから初期コピーを作成（ルール7） */
  function createInitialCopy(): ClientOverrides {
    return {
      hiddenIds: masterAccounts.value
        .filter(a => a.hiddenInMaster)
        .map(a => a.id),
      customAccounts: [],
      copiedMasterIds: masterAccounts.value.map(a => a.id),
    }
  }

  // キャッシュから取得、なければ新規作成
  if (!clientCacheMap.has(clientId)) {
    const overridesRef = ref<ClientOverrides>(createInitialCopy())
    const subAccountsRef = ref<Record<string, string>>({})
    const cache: ClientCache = { overrides: overridesRef, subAccounts: subAccountsRef, initialized: false }
    clientCacheMap.set(clientId, cache)

    // autoSave: overrides変更時にサーバーへ自動保存（デバウンス300ms）
    let saveTimer: ReturnType<typeof setTimeout> | null = null
    watch([overridesRef, subAccountsRef], () => {
      if (!cache.initialized) return
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        // overridesから全件データを再構成してPUT
        const allAccounts = buildFullAccountList(overridesRef.value, masterAccounts.value)
        saveClientToServer(clientId, allAccounts, subAccountsRef.value)
      }, 300)
    }, { deep: true })

    // 非同期でサーバーから初期データを取得
    fetchClientFromServer(clientId).then(serverData => {
      if (serverData && serverData.accounts.length > 0) {
        // サーバーデータからoverrides形式を復元
        const masterIds = new Set(masterAccounts.value.map(a => a.id))
        overridesRef.value = {
          hiddenIds: serverData.accounts.filter(a => a.deprecated).map(a => a.id),
          customAccounts: serverData.accounts.filter(a => !masterIds.has(a.id)),
          copiedMasterIds: serverData.accounts.filter(a => masterIds.has(a.id)).map(a => a.id),
        }
        console.log(`[useClientAccounts] ${clientId}: サーバーから${serverData.accounts.length}件を取得`)
      } else {
        // サーバーにデータがない場合はマスタから初期コピーを保存
        const allAccounts = buildFullAccountList(overridesRef.value, masterAccounts.value)
        saveClientToServer(clientId, allAccounts, subAccountsRef.value)
        console.log(`[useClientAccounts] ${clientId}: マスタから初期コピーを作成`)
      }
      cache.initialized = true
    })
  }

  const cache = clientCacheMap.get(clientId)!
  const overrides = cache.overrides
  const subAccounts = cache.subAccounts

  /** overridesからフル科目リストを再構成 */
  function buildFullAccountList(ov: ClientOverrides, master: Account[]): Account[] {
    const defaultAccounts = master.map(a => ({
      ...a,
      deprecated: ov.hiddenIds.includes(a.id) ? true : a.deprecated,
    }))
    return [...defaultAccounts, ...ov.customAccounts]
  }

  /** マスタから新規追加された科目を検出（ルール8） */
  const newMasterAccounts = computed<Account[]>(() => {
    const copiedIds = new Set(overrides.value.copiedMasterIds)
    return masterAccounts.value.filter(a => !copiedIds.has(a.id) && !a.isCustom)
  })

  /** 全科目リスト（マスタデフォルト+マスタカスタム+顧問先カスタム） */
  const clientAccounts = computed<ClientAccount[]>(() => {
    // マスタの全科目をベースにする
    const baseAccounts: ClientAccount[] = masterAccounts.value.map(a => ({
      ...a,
      hiddenInClient: overrides.value.hiddenIds.includes(a.id),
      isCustom: a.isCustom ?? false,
      hiddenInMaster: a.hiddenInMaster,
      isMasterCustom: a.isCustom ?? false,
    }))

    // 顧問先固有のカスタム科目
    const masterIds = new Set(masterAccounts.value.map(a => a.id))
    const clientCustom: ClientAccount[] = overrides.value.customAccounts
      .filter(a => !masterIds.has(a.id))
      .map(a => ({
        ...a,
        hiddenInClient: overrides.value.hiddenIds.includes(a.id),
        isCustom: true,
        hiddenInMaster: false,
        isMasterCustom: false,
      }))

    return [...baseAccounts, ...clientCustom]
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
  }

  /** マスタから新規追加された科目を同期（ルール8） */
  function syncFromMaster(): number {
    const newAccounts = newMasterAccounts.value
    if (newAccounts.length === 0) return 0

    for (const a of newAccounts) {
      overrides.value.copiedMasterIds.push(a.id)
    }
    return newAccounts.length
  }

  /** デフォルト設定にリセット（マスタから再コピー） */
  function resetToDefault(): void {
    overrides.value = createInitialCopy()
  }

  /** ページから全行データを受け取り、composableの保存形式に分解して保存 */
  function saveAll(allRows: Account[], subAccountsInput?: Record<string, string>): void {
    const masterIds = new Set(masterAccounts.value.map(a => a.id))
    const hiddenIds = allRows.filter(r => r.deprecated).map(r => r.id)
    const customAccounts = allRows.filter(r => r.isCustom && !masterIds.has(r.id))
    const copiedMasterIds = allRows.filter(r => !r.isCustom).map(r => r.id)
    overrides.value = {
      hiddenIds,
      customAccounts,
      copiedMasterIds,
    }
    if (subAccountsInput) {
      subAccounts.value = subAccountsInput
    }
    // autoSaveで自動的にサーバーへ保存される
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
    saveAll,
    /** 補助科目マップ（科目ID → 補助科目名） */
    subAccounts,
  }
}
