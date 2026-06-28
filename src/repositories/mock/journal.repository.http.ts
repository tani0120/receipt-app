/**
 * journal.repository.http.ts — JournalRepository HTTP実装（フロントエンド用）
 *
 * 各メソッドが既存APIエンドポイント（journalRoutes.ts）にHTTPリクエストを送信する。
 * Supabase移行時はSupabase JS Client版に差し替え。
 *
 * 準拠: DL-030, P3-8, Phase 2.5
 */

import { createApiClient } from '@/utils/apiClient'
import type { JournalRepository } from '../types'
import type { Journal } from '@/types/journal.type'

const api = createApiClient('/api/journals')

export const httpJournalRepo: JournalRepository = {
  async get(clientId, journalId) {
    const all = await api.get<Journal[]>(`/${encodeURIComponent(clientId)}`)
    return all.find(j => j.journalId === journalId) ?? null
  },

  async list(clientId) {
    return api.get<Journal[]>(`/${encodeURIComponent(clientId)}`)
  },

  async create(clientId, journal) {
    await api.post(`/${encodeURIComponent(clientId)}`, { journals: [journal] })
  },

  async createMany(clientId, journals) {
    await api.post(`/${encodeURIComponent(clientId)}`, { journals })
  },

  async update(clientId, journalId, patch) {
    await api.patch(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`, patch)
  },

  async updateMany(clientId, patches) {
    for (const { journalId, patch } of patches) {
      await api.patch(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`, patch)
    }
  },

  async delete(clientId, journalId) {
    await api.del(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`)
  },

  async deleteMany(clientId, journalIds) {
    for (const journalId of journalIds) {
      await api.del(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`)
    }
  },
}
