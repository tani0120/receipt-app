/**
 * leadStore — 見込先管理Piniaストア
 *
 * useLeads.tsのモジュールスコープをPinia + persistedstateに移行。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Lead } from '@/repositories/types'
import type { FilterOperator } from '@/api/helpers/applyFilterConditions'
import { createRepositories } from '@/repositories'

// Repository経由でデータアクセス
const repos = createRepositories()


export const useLeadStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const cachedAt = ref<number | null>(null)
  const lastError = ref<string | null>(null)

  async function load() {
    if (leads.value.length) {
      // キャッシュあり → 即時表示。裏でAPI取得（fire-and-forget）
      fetchFresh()
      return
    }
    // キャッシュなし → APIを待つ
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const list = await repos.lead.getAll()
      leads.value = list
      cachedAt.value = Date.now()
      console.log(`[leadStore] ${list.length}件をサーバーから取得`)
    } catch (err) {
      console.error('[leadStore] サーバー取得失敗:', err)
    }
  }

  function updateSharedFolderId(leadId: string, folderId: string) {
    const idx = leads.value.findIndex(l => l.leadId === leadId)
    if (idx >= 0) {
      leads.value[idx] = { ...leads.value[idx]!, sharedFolderId: folderId }
      repos.lead.updateSharedFolderId(leadId, folderId)
        .catch(err => console.error('[leadStore] sharedFolderId更新エラー:', err))
    }
  }

  async function addLead(lead: Omit<Lead, 'leadId'> & { leadId?: string }): Promise<Lead> {
    lastError.value = null
    try {
      const saved = await repos.lead.create(lead as Lead)
      leads.value.push(saved)
      return saved
    } catch (err) {
      const msg = `見込先の追加に失敗しました: ${err}`
      console.error('[leadStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  async function updateLead(leadId: string, data: Partial<Lead>): Promise<void> {
    lastError.value = null
    try {
      await repos.lead.update(leadId, data)
      const idx = leads.value.findIndex(l => l.leadId === leadId)
      if (idx >= 0) {
        leads.value[idx] = { ...leads.value[idx]!, ...data, leadId }
      }
    } catch (err) {
      const msg = `見込先の更新に失敗しました: ${err}`
      console.error('[leadStore]', msg)
      lastError.value = msg
      throw err
    }
  }

  async function listLeads(query: {
    filters?: { field: string; operator: FilterOperator; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    return repos.lead.list(query)
  }

  load()

  return {
    leads, cachedAt, lastError,
    load, fetchFresh,
    updateSharedFolderId, addLead, updateLead, listLeads,
  }
}, {
  persist: {
    key: 'sugu-suru:leads-cache',
    pick: ['leads', 'cachedAt'],
  },
})
