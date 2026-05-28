/**
 * accountMasterStore — 勘定科目マスタ Piniaストア
 *
 * useAccountMaster.tsのモジュールスコープをPinia + persistedstateに移行。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Account } from '@/types/shared-account'

/** マスタレベルの科目拡張（非表示フラグ＋カスタム識別） */
export interface MasterAccount extends Account {
  hiddenInMaster: boolean
  isCustom: boolean
}

const API_BASE = '/api/accounts'
const STALE_MS = 5 * 60 * 1000

export const useAccountMasterStore = defineStore('accountMaster', () => {
  const allAccounts = ref<Account[]>([])
  const cachedAt = ref<number | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function load() {
    if (allAccounts.value.length && cachedAt.value && Date.now() - cachedAt.value < STALE_MS) {
      fetchFresh()
      return
    }
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const res = await fetch(`${API_BASE}/master?pageSize=200`)
      if (!res.ok) return
      const data = await res.json() as { items: Account[] }
      allAccounts.value = data.items
      cachedAt.value = Date.now()
      console.log(`[accountMasterStore] ${data.items.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[accountMasterStore] サーバー取得失敗:', err)
    }
  }

  function debounceSave(): void {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      fetch(`${API_BASE}/master`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: allAccounts.value }),
      }).catch(err => console.error('[accountMasterStore] サーバー保存失敗:', err))
    }, 300)
  }

  const masterAccounts = computed<MasterAccount[]>(() => {
    return allAccounts.value
      .map(a => ({
        ...a,
        hiddenInMaster: a.deprecated === true,
        isCustom: (a as MasterAccount).isCustom ?? false,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const visibleMasterAccounts = computed<MasterAccount[]>(() =>
    masterAccounts.value.filter(a => !a.hiddenInMaster)
  )

  const overrides = computed(() => ({
    hiddenIds: allAccounts.value.filter(a => a.deprecated).map(a => a.id),
    customAccounts: allAccounts.value.filter(a => (a as MasterAccount).isCustom),
  }))

  function toggleVisibility(accountId: string): void {
    const idx = allAccounts.value.findIndex(a => a.id === accountId)
    if (idx >= 0) {
      const current = allAccounts.value[idx]!
      allAccounts.value[idx] = { ...current, deprecated: !current.deprecated }
      debounceSave()
    }
  }

  function addCustomAccount(account: Account): void {
    allAccounts.value.push({ ...account, isCustom: true } as Account)
    debounceSave()
  }

  function removeCustomAccount(accountId: string): boolean {
    const idx = allAccounts.value.findIndex(a => a.id === accountId && (a as MasterAccount).isCustom)
    if (idx < 0) return false
    allAccounts.value.splice(idx, 1)
    debounceSave()
    return true
  }

  function resetToDefault(): void {
    allAccounts.value = allAccounts.value
      .filter(a => !(a as MasterAccount).isCustom)
      .map(a => ({ ...a, deprecated: false }))
    debounceSave()
  }

  function isHidden(accountId: string): boolean {
    return allAccounts.value.find(a => a.id === accountId)?.deprecated === true
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
