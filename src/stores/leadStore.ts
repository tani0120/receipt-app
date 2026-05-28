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

const API_BASE = '/api/leads'
const STALE_MS = 5 * 60 * 1000

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API PUT ${path} failed: ${res.status}`)
}

export const useLeadStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const cachedAt = ref<number | null>(null)
  const lastError = ref<string | null>(null)

  async function load() {
    if (leads.value.length && cachedAt.value && Date.now() - cachedAt.value < STALE_MS) {
      fetchFresh()
      return
    }
    await fetchFresh()
  }

  async function fetchFresh() {
    try {
      const raw = await apiGet<{ leads: Lead[] } | Lead[]>('')
      const list = Array.isArray(raw) ? raw : raw.leads
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
      apiPut(`/${leadId}/shared-folder`, { folderId })
        .catch(err => console.error('[leadStore] sharedFolderId更新エラー:', err))
    }
  }

  async function addLead(lead: Omit<Lead, 'leadId'> & { leadId?: string }): Promise<Lead> {
    lastError.value = null
    try {
      const res = await apiPost<{ ok: boolean; lead: Lead }>('', lead)
      const saved = res.lead
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
      await apiPut(`/${leadId}`, data)
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
    filters?: { field: string; operator: string; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    return apiPost<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }>('/list', query)
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
