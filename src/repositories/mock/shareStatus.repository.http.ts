/**
 * shareStatus.repository.http.ts — ShareStatusRepository HTTP実装
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { ShareStatusRecord } from '../types'
import type { ShareStatusRepository } from '../types'

const api = createApiClient('/api/share-status')

export const httpShareStatusRepo: ShareStatusRepository = {
  getAll: async () => {
    const res = await api.get<{ records: ShareStatusRecord[] }>('')
    return res.records ?? []
  },

  getByClientId: async (clientId) => {
    const res = await api.get<{ records: ShareStatusRecord[] }>('')
    return (res.records ?? []).find(r => r.clientId === clientId)
  },

  updateStatus: async (clientId, status) => {
    await api.put(`/${clientId}`, { status })
  },

  saveInviteCode: async (clientId, code) => {
    await api.post('/invite', { clientId, code })
  },

  generateInviteCode: async (clientId) => {
    return api.post<{ code: string }>('/invite', { clientId })
  },

  resolveInviteCode: async (code) => {
    try {
      const res = await api.get<{ clientId: string | null }>(`/invite/${code}`)
      return res.clientId ?? null
    } catch {
      return null
    }
  },
}
