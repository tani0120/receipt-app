/**
 * clientAccountStore — 顧問先勘定科目 Piniaストア
 *
 * 【設計原則】バックエンドSSOT
 * - APIから EnrichedAccount[] をそのまま保持（overrides分解・再構成は行わない）
 * - SWRパターン: キャッシュがあれば即時表示 → 裏でfetchFresh
 * - 楽観的更新: Store即時更新 → API保存（デバウンス300ms）
 * - 保存: モック段階では全件PUT。本番ではPATCH移行予定
 *
 * 責務:
 *   - 顧問先別の EnrichedAccount[] データ保持
 *   - API通信（GET/PUT）
 *   - キャッシュ管理（clientId別）
 *
 * 準拠: plan_account_ssot.md Step 2
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account, EnrichedAccount } from '@/types/shared-account'
import { isCacheExpired } from '@/utils/cacheUtils'

const API_BASE = '/api/accounts'

export const useClientAccountStore = defineStore('clientAccounts', () => {
  // =============================================
  // 状態（clientId別Map）
  // =============================================

  /** clientId → EnrichedAccount[] */
  const accountsMap = ref<Record<string, EnrichedAccount[]>>({})
  /** clientId → キャッシュ取得時刻 */
  const cachedAtMap = ref<Record<string, number>>({})
  /** clientId → 補助科目マップ（スグスル科目ID → MF補助科目配列）バックエンドから取得したキャッシュ */
  const subAccountsMap = ref<Record<string, Record<string, Array<{ mfSubId: string; name: string; mfTaxId: string }>>>>({})
  /** clientId → 部門配列。バックエンドから取得したキャッシュ */
  const departmentsMap = ref<Record<string, Array<{ mfDeptId: string; name: string; parentId: string | null }>>>({})

  // =============================================
  // API通信
  // =============================================

  /** サーバーからEnrichedAccount[]+補助科目+部門を取得 */
  async function fetchFromServer(clientId: string): Promise<EnrichedAccount[] | null> {
    try {
      const res = await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}?pageSize=500`)
      if (!res.ok) return null
      const data = await res.json() as {
        items: EnrichedAccount[]
        subAccountsMap?: Record<string, Array<{ mfSubId: string; name: string; mfTaxId: string }>>
        departments?: Array<{ mfDeptId: string; name: string; parentId: string | null }>
      }
      // 補助科目・部門をストアに保存（バックエンドが返したデータをそのまま保持）
      if (data.subAccountsMap) {
        subAccountsMap.value[clientId] = data.subAccountsMap
      }
      if (data.departments) {
        departmentsMap.value[clientId] = data.departments
      }
      return data.items
    } catch (err) {
      console.error(`[clientAccountStore] サーバー取得失敗 (${clientId}):`, err)
      return null
    }
  }

  /** サーバーへ全件PUT保存（科目Overrideのみ。補助科目・部門はバックエンドが管理） */
  async function saveToServer(clientId: string): Promise<void> {
    const accounts = accountsMap.value[clientId]
    if (!accounts) return
    try {
      await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounts: stripEnrichFields(accounts),
        }),
      })
      console.log(`[clientAccountStore] ${clientId}: ${accounts.length}件を保存`)
    } catch (err) {
      console.error(`[clientAccountStore] サーバー保存失敗 (${clientId}):`, err)
    }
  }

  /**
   * EnrichedAccountからenrichフィールドを除去してAccount型に戻す
   * 永続化時にenrichフィールドがJSONに混入するのを防止
   */
  function stripEnrichFields(enriched: EnrichedAccount[]): Account[] {
    return enriched.map(e => {
      // enrichフィールドを明示的に除外（残りがAccount型）
      const {
        accountGroupLabel: _1,
        targetLabel: _2,
        directionLabel: _3,
        categoryLabel: _4,
        displayEffectiveFrom: _5,
        displayEffectiveTo: _6,
        displayAllowedVoucherTypes: _7,
        sourceLabel: _8,
        aiDetermination: _9,
        defaultTaxes: _10,
        ...account
      } = e
      return account
    })
  }

  // =============================================
  // SWRパターン
  // =============================================

  /** 顧問先科目をロード（SWRパターン） */
  async function load(clientId: string): Promise<void> {
    const cached = accountsMap.value[clientId]
    if (cached && cached.length > 0 && !isCacheExpired(cachedAtMap.value[clientId] ?? null)) {
      // キャッシュ有効 → 即時表示。裏でfetchFresh（fire-and-forget）
      fetchFresh(clientId)
      return
    }
    // キャッシュなし or 期限切れ → APIを待つ
    await fetchFresh(clientId)
  }

  /** サーバーから最新データを取得してStoreを更新 */
  async function fetchFresh(clientId: string): Promise<void> {
    const items = await fetchFromServer(clientId)
    if (items && items.length > 0) {
      accountsMap.value[clientId] = items
      cachedAtMap.value[clientId] = Date.now()
      console.log(`[clientAccountStore] ${clientId}: サーバーから${items.length}件を取得`)
    }
  }

  // =============================================
  // 楽観的更新
  // =============================================

  /** デバウンス保存用タイマー（clientId別） */
  const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {}

  /** デバウンス保存（300ms） */
  function debounceSave(clientId: string): void {
    if (saveTimers[clientId]) clearTimeout(saveTimers[clientId])
    saveTimers[clientId] = setTimeout(() => {
      saveToServer(clientId)
    }, 300)
  }

  /** 非表示トグル（楽観的更新） */
  function toggleHidden(clientId: string, accountId: string): void {
    const accounts = accountsMap.value[clientId]
    if (!accounts) return
    const idx = accounts.findIndex(a => a.accountId === accountId)
    if (idx >= 0) {
      const current = accounts[idx]!
      accounts[idx] = { ...current, hidden: !current.hidden }
      debounceSave(clientId)
    }
  }

  /** 科目データ取得（リアクティブ参照用） */
  function getAccounts(clientId: string): EnrichedAccount[] {
    return accountsMap.value[clientId] ?? []
  }

  /** 全件データを受け取ってStoreを更新 + 保存（科目Overrideのみ） */
  function saveAll(clientId: string, allRows: EnrichedAccount[]): void {
    accountsMap.value[clientId] = [...allRows]
    debounceSave(clientId)
  }

  return {
    accountsMap,
    cachedAtMap,
    subAccountsMap,
    departmentsMap,
    load,
    fetchFresh,
    toggleHidden,
    getAccounts,
    saveAll,
  }
}, {
  persist: {
    key: 'sugu-suru:client-accounts-cache',
    pick: ['accountsMap', 'cachedAtMap'],
  },
})
