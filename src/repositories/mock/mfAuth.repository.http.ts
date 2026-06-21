/**
 * mfAuth.repository.http.ts — MfAuthRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-4
 */

import { createApiClient } from '@/utils/apiClient'
import type { MfAuthRepository } from '../types'

const api = createApiClient('/api/mf')

export const httpMfAuthRepo: MfAuthRepository = {
  getAuthStatus: async (clientId) => {
    return api.get(`/auth/status?clientId=${encodeURIComponent(clientId)}`)
  },

  getAuthStatusBulk: async (clientIds) => {
    return api.post('/auth/status/bulk', { clientIds })
  },

  getAuthUrl: async (clientId) => {
    return api.get(`/auth/url?clientId=${encodeURIComponent(clientId)}`)
  },

  importMasterAccounts: async () => {
    return api.post('/import-master-accounts', {})
  },

  importClientAccounts: async (clientId) => {
    return api.post(`/import-client-accounts?clientId=${encodeURIComponent(clientId)}`, {})
  },

  fiscalCheck: async (clientId) => {
    return api.get(`/fiscal-check?clientId=${encodeURIComponent(clientId)}`)
  },

  importOffices: async (data) => {
    return api.post('/import-offices', data)
  },

  sendJournals: async (clientId, data) => {
    return api.post(`/send-journals/${encodeURIComponent(clientId)}`, data)
  },

  getTermSettings: async (clientId) => {
    return api.get(`/term-settings?clientId=${encodeURIComponent(clientId)}`)
  },

  importJournals: async (data) => {
    return api.post('/import-journals', data)
  },
}
