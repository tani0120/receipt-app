/**
 * clientStore — 顧問先管理Piniaストア
 *
 * 【依存方向】
 * clientStore(Pinia) → ClientRepository(HTTP) → /api/clients → clientsApi.ts
 *
 * useClients.tsのモジュールスコープ（localStorage手動管理 + stale-while-revalidate）を
 * Pinia + persistedstateに移行。composableのreturnインターフェースは維持。
 *
 * 準拠: DL-042, DL-030, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Client } from '@/repositories/types'
import { createRepositories } from '@/repositories'
import { createApiClient } from '@/utils/apiClient'

// Repository経由でデータアクセス
const repos = createRepositories()

// listClients専用（ClientRepositoryにlistメソッドがないため）
const listApi = createApiClient('/api/clients')

export const useClientStore = defineStore('clients', () => {
  // --- state ---
  const clients = ref<Client[]>([])
  const cachedAt = ref<number | null>(null)
  const lastError = ref<string | null>(null)

  // --- stale-while-revalidate ---
  async function load() {
    if (clients.value.length) {
      // キャッシュあり → 即時表示。裏でAPI取得（fire-and-forget）
      fetchFresh()
      return
    }
    // キャッシュなし（初回起動 or localStorage消去後）→ APIを待つ
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const list = await repos.client.getAll()
      clients.value = list
      cachedAt.value = Date.now()
      console.log(`[clientStore] ${list.length}件をサーバーから取得`)

      // consumptionTaxMode旧値→新値マイグレーション
      migrateConsumptionTaxMode()

      // DL-042マイグレーション: localStorageのsharedFolderIdをサーバーデータにマージ
      migrateSharedFolderIds()
    } catch (err) {
      console.error('[clientStore] サーバー取得失敗:', err)
    }
  }

  /**
   * consumptionTaxModeの旧値（individual_allocation / proportional_allocation）を
   * 新値（individual / proportional）に自動変換する。
   * 変換したらサーバーにも保存。
   */
  function migrateConsumptionTaxMode(): void {
    const migrationMap: Record<string, Client['consumptionTaxMode']> = {
      'individual_allocation': 'individual',
      'proportional_allocation': 'proportional',
    }
    let migrated = 0
    for (const client of clients.value) {
      const newValue = migrationMap[client.consumptionTaxMode as string]
      if (newValue) {
        client.consumptionTaxMode = newValue
        repos.client.update(client.clientId, { consumptionTaxMode: newValue })
          .catch(err => console.error(`[clientStore] consumptionTaxMode移行エラー (${client.clientId}):`, err))
        migrated++
      }
    }
    if (migrated > 0) {
      console.log(`[clientStore] ${migrated}件のconsumptionTaxModeを新値に移行`)
    }
  }

  /**
   * localStorageに残っている旧sharedFolderIdをサーバーに移行する。
   * マージ完了後にlocalStorageから削除する。
   */
  function migrateSharedFolderIds(): void {
    const raw = localStorage.getItem('sugu-suru:shared-folder-ids')
    if (!raw) return

    try {
      const stored = JSON.parse(raw) as Record<string, string>
      let migrated = 0
      for (const [clientId, folderId] of Object.entries(stored)) {
        if (!folderId) continue
        const client = clients.value.find(c => c.clientId === clientId)
        if (client && !client.sharedFolderId) {
          client.sharedFolderId = folderId
          repos.client.update(clientId, { sharedFolderId: folderId })
            .catch(err => console.error(`[clientStore] sharedFolderId移行エラー (${clientId}):`, err))
          migrated++
        }
      }
      if (migrated > 0) {
        console.log(`[clientStore] ${migrated}件のsharedFolderIdをlocalStorageからサーバーに移行`)
      }
    } catch (err) {
      console.error('[clientStore] sharedFolderIdマイグレーションエラー:', err)
    }

    localStorage.removeItem('sugu-suru:shared-folder-ids')
    localStorage.removeItem('sugu-suru:staff-assignments')
  }

  function updateSharedFolderId(clientId: string, folderId: string) {
    const idx = clients.value.findIndex(c => c.clientId === clientId)
    if (idx >= 0) {
      clients.value[idx] = { ...clients.value[idx]!, sharedFolderId: folderId }
      repos.client.update(clientId, { sharedFolderId: folderId })
        .catch(err => console.error('[clientStore] sharedFolderId更新エラー:', err))
    }
  }

  async function addClient(client: Omit<Client, 'clientId'> & { clientId?: string }): Promise<Client> {
    lastError.value = null
    try {
      // createはサーバー側でclientIdを発番するため、HTTP API経由で呼ぶ
      const res = await listApi.post<{ ok: boolean; client: Client }>('', client)
      const saved = res.client
      clients.value.push(saved)
      return saved
    } catch (err) {
      const msg = `顧問先の追加に失敗しました: ${err}`
      console.error('[clientStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  async function updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    lastError.value = null
    try {
      await repos.client.update(clientId, data)
      const idx = clients.value.findIndex(c => c.clientId === clientId)
      if (idx >= 0) {
        clients.value[idx] = { ...clients.value[idx]!, ...data, clientId }
      }
    } catch (err) {
      const msg = `顧問先の更新に失敗しました: ${err}`
      console.error('[clientStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  async function listClients(query: {
    filters?: { field: string; operator: string; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Client[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    // listClientsはClientRepositoryに定義がないため、API直結を維持
    return listApi.post<{ rows: Client[]; totalCount: number; page: number; pageSize: number; totalPages: number }>('/list', query)
  }

  // 初回自動ロード（fire-and-forget）
  load()

  return {
    clients, cachedAt, lastError,
    load, fetchFresh,
    updateSharedFolderId, addClient, updateClient, listClients,
  }
}, {
  persist: {
    key: 'sugu-suru:clients-cache',
    pick: ['clients', 'cachedAt'],
  },
})
