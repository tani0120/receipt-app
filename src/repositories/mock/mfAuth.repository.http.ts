/**
 * mfAuth.repository.http.ts — MfAuthRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-4
 * Hono RPC (hc) 経由で型安全なAPI呼び出しを実現
 */

import { honoClient } from '../../utils/honoClient'
import type { MfAuthRepository } from '../types'

export const httpMfAuthRepo: MfAuthRepository = {
  getAuthStatus: async (clientId) => {
    const res = await honoClient.api.mf.auth.status.$get({
      query: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/mf/auth/status failed: ${res.status}`)
    return await res.json()
  },

  getAuthStatusBulk: async (clientIds) => {
    const res = await honoClient.api.mf.auth.status.bulk.$post({
      json: { clientIds }
    })
    if (!res.ok) throw new Error(`API POST /api/mf/auth/status/bulk failed: ${res.status}`)
    return await res.json()
  },

  getAuthUrl: async (clientId) => {
    const res = await honoClient.api.mf.auth.url.$get({
      query: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/mf/auth/url failed: ${res.status}`)
    return await res.json()
  },

  importMasterAccounts: async (clientId) => {
    const res = await honoClient.api.mf['import-master-accounts'].$post({
      json: { clientId }
    })
    if (!res.ok) throw new Error(`API POST /api/mf/import-master-accounts failed: ${res.status}`)
    return await res.json()
  },

  importClientAccounts: async (clientId) => {
    const res = await honoClient.api.mf['import-client-accounts'].$post({
      query: { clientId }
    })
    if (!res.ok) throw new Error(`API POST /api/mf/import-client-accounts failed: ${res.status}`)
    return await res.json()
  },

  fiscalCheck: async (clientId) => {
    const res = await honoClient.api.mf['fiscal-check'].$get({
      query: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/mf/fiscal-check failed: ${res.status}`)
    return await res.json()
  },

  importOffices: async (data) => {
    const res = await honoClient.api.mf['import-offices'].$post({
      json: data as { clientIds: string[] }
    })
    if (!res.ok) throw new Error(`API POST /api/mf/import-offices failed: ${res.status}`)
    return await res.json()
  },

  sendJournals: async (clientId, data) => {
    const res = await honoClient.api.mf['send-journals'][':clientId'].$post({
      param: { clientId },
      json: data
    })
    if (!res.ok) throw new Error(`API POST /api/mf/send-journals/${clientId} failed: ${res.status}`)
    return await res.json()
  },

  getTermSettings: async (clientId) => {
    const res = await honoClient.api.mf['term-settings'].$get({
      query: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/mf/term-settings failed: ${res.status}`)
    return await res.json()
  },

  importJournals: async (data) => {
    const res = await honoClient.api.mf['import-journals'].$post({
      json: data as { clientId: string; periodCount?: number }
    })
    if (!res.ok) throw new Error(`API POST /api/mf/import-journals failed: ${res.status}`)
    return await res.json()
  },
}
