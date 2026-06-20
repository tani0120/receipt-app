/**
 * accountMasterStore — 勘定科目マスタ Piniaストア
 *
 * 【設計原則】バックエンドSSOT
 * - APIから EnrichedAccount[] をそのまま保持（enrichフィールド含む）
 * - SWRパターン: キャッシュがあれば即時表示 → 裏でfetchFresh
 * - 楽観的更新: Store即時更新 → API保存（デバウンス300ms）
 *
 * 準拠: plan_account_ssot.md Step 3
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account, EnrichedAccount } from '@/types/shared-account'
import type { TaxCategory } from '@/types/shared-tax-category'
import { enrichAccountRow } from '@/shared/enrichAccount'
import { createRepositories } from '@/repositories'
import { isCacheExpired } from '@/utils/cacheUtils'

/**
 * マスタレベルの科目拡張（hiddenInMaster + isCustom）
 *
 * EnrichedAccountを拡張し、マスタ画面固有のフラグを追加。
 * EnrichedAccountのenrichフィールド（accountGroupLabel等）は
 * APIレスポンスに含まれるため、実行時には存在する。
 */
export interface MasterAccount extends EnrichedAccount {
  /** マスタレベルで非表示か */
  hiddenInMaster: boolean
  /** カスタム科目か */
  isCustom: boolean
}

const repos = createRepositories()


export const useAccountMasterStore = defineStore('accountMaster', () => {
  // APIからはEnrichedAccount[]が返るが、Repositoryの型定義はAccount[]のまま。
  // 実行時にはenrichフィールドが存在するため、EnrichedAccount[]として保持する。
  const allAccounts = ref<EnrichedAccount[]>([])
  const cachedAt = ref<number | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function load() {
    if (allAccounts.value.length && !isCacheExpired(cachedAt.value)) {
      // キャッシュ有効 → 即時表示。裏でAPI取得（fire-and-forget）
      fetchFresh()
      return
    }
    // キャッシュなし or 期限切れ → APIを待つ
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const data = await repos.accountMaster.getMaster()
      // Repository型はAccount[]だが、APIは実際にはEnrichedAccount[]を返す
      // TODO: Repository.getMaster()の戻り値型をEnrichedAccount[]に修正
      allAccounts.value = migrateLegacyFields(data as EnrichedAccount[])
      cachedAt.value = Date.now()
      console.log(`[accountMasterStore] ${data.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[accountMasterStore] サーバー取得失敗:', err)
      cachedAt.value = null // 次回load()でawaitに戻す
    }
  }

  /** Piniaキャッシュ互換性: 旧deprecatedをhiddenに変換 */
  function migrateLegacyFields(items: EnrichedAccount[]): EnrichedAccount[] {
    return items.map(a => {
      // Piniaキャッシュには旧バージョンデータが残存する可能性がある。
      // hidden が必須化される前のデータも扱うため、ここでは
      // EnrichedAccount として扱わず Record<string, unknown> として検査する。
      const raw = a as unknown as Record<string, unknown>
      if ('deprecated' in raw && !('hidden' in raw)) {
        return { ...a, hidden: Boolean(raw['deprecated']) }
      }
      if (!('hidden' in raw)) {
        return { ...a, hidden: false }
      }
      return a
    })
  }

  function debounceSave(): void {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      // 保存時はenrichフィールドを含んだまま送信しても、バックエンドがAccount部分のみ永続化する
      repos.accountMaster.saveMaster(allAccounts.value)
        .catch(err => console.error('[accountMasterStore] サーバー保存失敗:', err))
    }, 300)
  }

  const masterAccounts = computed<MasterAccount[]>(() => {
    return allAccounts.value
      .map(a => ({
        ...a,
        hiddenInMaster: a.hidden === true,
        isCustom: a.isCustom ?? false,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const visibleMasterAccounts = computed<MasterAccount[]>(() =>
    masterAccounts.value.filter(a => !a.hiddenInMaster)
  )

  const overrides = computed(() => ({
    hiddenIds: allAccounts.value.filter(a => a.hidden).map(a => a.accountId),
    customAccounts: allAccounts.value.filter(a => a.isCustom),
  }))

  function toggleVisibility(accountId: string): void {
    const idx = allAccounts.value.findIndex(a => a.accountId === accountId)
    if (idx >= 0) {
      const current = allAccounts.value[idx]!
      allAccounts.value[idx] = { ...current, hidden: !current.hidden }
      debounceSave()
    }
  }

  function addCustomAccount(account: Account, taxCategories: TaxCategory[]): void {
    // enrichAccountRow() を通過させてから push（不変条件: 全要素が EnrichedAccount）
    const enriched = enrichAccountRow({ ...account, isCustom: true }, taxCategories)
    allAccounts.value.push(enriched)
    debounceSave()
  }

  function removeCustomAccount(accountId: string): boolean {
    const idx = allAccounts.value.findIndex(a => a.accountId === accountId && a.isCustom)
    if (idx < 0) return false
    allAccounts.value.splice(idx, 1)
    debounceSave()
    return true
  }

  function resetToDefault(): void {
    allAccounts.value = allAccounts.value
      .filter(a => !a.isCustom)
      .map(a => ({ ...a, hidden: false }))
    debounceSave()
  }

  function isHidden(accountId: string): boolean {
    return allAccounts.value.find(a => a.accountId === accountId)?.hidden === true
  }

  load()

  return {
    allAccounts, cachedAt,
    masterAccounts, visibleMasterAccounts, overrides,
    load, fetchFresh,
    toggleVisibility, addCustomAccount, removeCustomAccount, resetToDefault, isHidden,
  }
}, {
  persist: {
    key: 'sugu-suru:account-master-cache',
    pick: ['allAccounts', 'cachedAt'],
  },
})
