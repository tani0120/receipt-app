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

import { createApiClient } from '@/utils/apiClient'
import type { Client } from '@/repositories/types'
import type { ClientRepository } from '../types'

const api = createApiClient('/api/clients')

export const httpClientRepo: ClientRepository = {
  getAll: async () => {
    const raw = await api.get<{ clients: Client[] } | Client[]>('')
    return Array.isArray(raw) ? raw : raw.clients
  },

  getById: async (clientId) => {
    try {
      const res = await api.get<{ client: Client }>(`/${clientId}`)
      return res.client
    } catch {
      return undefined
    }
  },

  getByStaffId: async (staffId) => {
    const raw = await api.get<{ clients: Client[] }>(`?staffId=${staffId}`)
    return raw.clients
  },

  getActiveClients: async () => {
    const raw = await api.get<{ clients: Client[] }>('?status=active')
    return raw.clients
  },

  create: async (client) => {
    await api.post('', client)
  },

  update: async (clientId, partial) => {
    await api.put(`/${clientId}`, partial)
  },
}
