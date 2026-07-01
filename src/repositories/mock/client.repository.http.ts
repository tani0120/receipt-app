/**
 * client.repository.http.ts — ClientRepository HTTP実装（フロントエンド用）
 *
 * 【責務】
 * - HTTP API経由でClientRepositoryインターフェースを実装
 * - フロントエンド（Vite環境）から使用可能（Node.js fs非依存）
 *
 * 【依存方向】
 * clientStore(Pinia) → ClientRepository(http) → /api/clients
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { Client } from '../types'
import type { ClientRepository } from '../types'

export const httpClientRepo: ClientRepository = {
  getAll: async () => {
    const res = await honoClient.api.clients.$get()
    const raw = await res.json() as { clients: Client[] } | Client[]
    return Array.isArray(raw) ? raw : raw.clients
  },

  getById: async (clientId) => {
    try {
      const res = await honoClient.api.clients[':clientId'].$get({ param: { clientId } })
      const data = await res.json() as { client: Client }
      return data.client
    } catch {
      return undefined
    }
  },

  getByStaffId: async (staffId) => {
    const res = await honoClient.api.clients.$get({ query: { staffId } })
    const raw = await res.json() as { clients: Client[] }
    return raw.clients
  },

  getActiveClients: async () => {
    const res = await honoClient.api.clients.$get({ query: { status: 'active' } })
    const raw = await res.json() as { clients: Client[] }
    return raw.clients
  },

  create: async (client) => {
    const res = await honoClient.api.clients.$post({ json: client })
    const data = await res.json() as { ok: boolean; client: Client }
    return data.client
  },

  update: async (clientId, partial) => {
    await honoClient.api.clients[':clientId'].$put({ param: { clientId }, json: partial })
  },

  list: async (query) => {
    const res = await honoClient.api.clients.list.$post({ json: query })
    return await res.json() as { rows: Client[]; totalCount: number; page: number; pageSize: number; totalPages: number }
  },

  bulkCreate: async (items) => {
    const res = await honoClient.api.clients.bulk.$post({ json: { items } })
    return await res.json() as {
      ok: boolean
      results: { index: number; ok: boolean; clientId?: string; threeCode?: string; companyName?: string; error?: string }[]
      total: number
    }
  },

  // --- 以下はサーバー専用メソッド（mock版で実装済み。HTTP版はフロント用のため未実装） ---
  // 呼び出し元: getByThreeCode → aiCommandRoutes.ts（サーバー側のみ）
  // 呼び出し元: getByStatus → clientRoutes.ts（サーバー側のみ）
  // 呼び出し元: generateClientId → clientRoutes.ts, leadRoutes.ts（サーバー側のみ）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装
  getByThreeCode: async () => {
    throw new Error('ClientRepository.getByThreeCode: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getByStatus: async () => {
    throw new Error('ClientRepository.getByStatus: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  generateClientId: async () => {
    throw new Error('ClientRepository.generateClientId: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}

