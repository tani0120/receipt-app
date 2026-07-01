/**
 * lead.repository.http.ts — LeadRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * leadStore(Pinia) → LeadRepository(HTTP) → /api/leads
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { Lead } from '../types'
import type { LeadRepository } from '../types'

export const httpLeadRepo: LeadRepository = {
  getAll: async () => {
    const res = await honoClient.api.leads.$get()
    const data = await res.json() as { leads: Lead[] }
    return data.leads
  },

  getById: async (leadId) => {
    try {
      const res = await honoClient.api.leads[':leadId'].$get({ param: { leadId } })
      const data = await res.json() as { lead: Lead }
      return data.lead
    } catch {
      return undefined
    }
  },

  create: async (lead) => {
    const res = await honoClient.api.leads.$post({ json: lead as Record<string, unknown> })
    const data = await res.json() as { ok: boolean; lead: Lead }
    return data.lead
  },

  update: async (leadId, partial) => {
    await honoClient.api.leads[':leadId'].$put({
      param: { leadId },
      json: partial as Record<string, unknown>,
    })
  },

  updateSharedFolderId: async (leadId, folderId) => {
    const res = await honoClient.api.leads[':leadId']['shared-folder'].$put({
      param: { leadId },
      json: { folderId },
    })
    const data = await res.json() as { ok: boolean }
    return data.ok
  },

  list: async (query) => {
    const res = await honoClient.api.leads.list.$post({ json: query as Record<string, unknown> })
    return await res.json() as { rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }
  },

  getActiveLeads: async () => {
    const res = await honoClient.api.leads.$get({ query: { status: 'active' } })
    const data = await res.json() as { leads: Lead[] }
    return data.leads
  },

  getByStatus: async (status) => {
    const res = await honoClient.api.leads.$get({ query: { status } })
    const data = await res.json() as { leads: Lead[] }
    return data.leads
  },

  getByStaffId: async (staffId) => {
    const res = await honoClient.api.leads.$get({ query: { staffId } })
    const data = await res.json() as { leads: Lead[] }
    return data.leads
  },

  updateStaffAssignment: async (leadId, staffId) => {
    const res = await honoClient.api.leads[':leadId'].staff.$put({
      param: { leadId },
      json: { staffId },
    })
    const data = await res.json() as { ok: boolean }
    return data.ok
  },

  updateSharedEmail: async (leadId, email) => {
    const res = await honoClient.api.leads[':leadId']['shared-email'].$put({
      param: { leadId },
      json: { email },
    })
    const data = await res.json() as { ok: boolean }
    return data.ok
  },

  // generateLeadId: サーバー専用（leadRoutes.tsのPOST /でサーバーが発番）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装
  generateLeadId: async () => {
    throw new Error('LeadRepository.generateLeadId: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}
