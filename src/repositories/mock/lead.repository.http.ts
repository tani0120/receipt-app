/**
 * lead.repository.http.ts — LeadRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * leadStore(Pinia) → LeadRepository(HTTP) → /api/leads
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '@/utils/apiClient'
import type { Lead } from '@/repositories/types'
import type { LeadRepository } from '../types'

const api = createApiClient('/api/leads')

export const httpLeadRepo: LeadRepository = {
  getAll: async () => {
    const raw = await api.get<{ leads: Lead[] } | Lead[]>('')
    return Array.isArray(raw) ? raw : raw.leads
  },

  getById: async (leadId) => {
    try {
      const res = await api.get<{ lead: Lead }>(`/${leadId}`)
      return res.lead
    } catch {
      return undefined
    }
  },

  create: async (lead) => {
    const res = await api.post<{ ok: boolean; lead: Lead }>('', lead)
    return res.lead
  },

  update: async (leadId, partial) => {
    await api.put(`/${leadId}`, partial)
  },

  updateSharedFolderId: async (leadId, folderId) => {
    await api.put(`/${leadId}/shared-folder`, { folderId })
  },

  list: async (query) => {
    return api.post<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }>('/list', query)
  },
}
