/**
 * accountMasterStore — 勘定科目マスタ Piniaストア
 *
 * useAccountMaster.tsのモジュールスコープをPinia + persistedstateに移行。
 * AccountMasterRepository経由でデータアクセス（API直結を排除）。
 *
 * 準拠: DL-042, DL-030, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account } from '@/types/shared-account'
import { createRepositories } from '@/repositories'
import { isCacheExpired } from '@/utils/cacheUtils'

/** マスタレベルの科目拡張（非表示フラグ＋カスタム識別） */
export interface MasterAccount extends Account {
  hiddenInMaster: boolean
  isCustom: boolean
}

const repos = createRepositories()


export const useAccountMasterStore = defineStore('accountMaster', () => {
  const allAccounts = ref<Account[]>([])
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
      allAccounts.value = migrateLegacyFields(data)
      cachedAt.value = Date.now()
      console.log(`[accountMasterStore] ${data.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[accountMasterStore] サーバー取得失敗:', err)
      cachedAt.value = null // 次回load()でawaitに戻す
    }
  }

  /** Piniaキャッシュ互換性: 旧deprecatedをhiddenに変換 */
  function migrateLegacyFields(items: Account[]): Account[] {
    return items.map(a => {
      const row = a as Record<string, unknown>
      if ('deprecated' in row && !('hidden' in row)) {
        row.hidden = row.deprecated
        delete row.deprecated
      }
      if (!('hidden' in row)) {
        row.hidden = false
      }
      return a
    })
  }

  function debounceSave(): void {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      repos.accountMaster.saveMaster(allAccounts.value)
        .catch(err => console.error('[accountMasterStore] サーバー保存失敗:', err))
    }, 300)
  }

  const masterAccounts = computed<MasterAccount[]>(() => {
    return allAccounts.value
      .map(a => ({
        ...a,
        hiddenInMaster: a.hidden === true,
        isCustom: (a as MasterAccount).isCustom ?? false,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const visibleMasterAccounts = computed<MasterAccount[]>(() =>
    masterAccounts.value.filter(a => !a.hiddenInMaster)
  )

  const overrides = computed(() => ({
    hiddenIds: allAccounts.value.filter(a => a.hidden).map(a => a.accountId),
    customAccounts: allAccounts.value.filter(a => (a as MasterAccount).isCustom),
  }))

  function toggleVisibility(accountId: string): void {
    const idx = allAccounts.value.findIndex(a => a.accountId === accountId)
    if (idx >= 0) {
      const current = allAccounts.value[idx]!
      allAccounts.value[idx] = { ...current, hidden: !current.hidden }
      debounceSave()
    }
  }

  function addCustomAccount(account: Account): void {
    allAccounts.value.push({ ...account, isCustom: true } as Account)
    debounceSave()
  }

  function removeCustomAccount(accountId: string): boolean {
    const idx = allAccounts.value.findIndex(a => a.accountId === accountId && (a as MasterAccount).isCustom)
    if (idx < 0) return false
    allAccounts.value.splice(idx, 1)
    debounceSave()
    return true
  }

  function resetToDefault(): void {
    allAccounts.value = allAccounts.value
      .filter(a => !(a as MasterAccount).isCustom)
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
