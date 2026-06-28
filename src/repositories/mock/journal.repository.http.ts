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
    const res = await api.get<{ journals: Journal[] }>(`/${encodeURIComponent(clientId)}`)
    return res.journals.find(j => j.journalId === journalId) ?? null
  },

  async list(clientId) {
    const res = await api.get<{ journals: Journal[] }>(`/${encodeURIComponent(clientId)}`)
    return res.journals
  },

  async create(clientId, journal) {
    const res = await api.post<{ ok: boolean; serverIds: string[] }>(
      `/${encodeURIComponent(clientId)}`, { journals: [journal] }
    )
    // サーバーがID上書き発番。発番後のIDでjournalを更新して返す
    return { ...journal, journalId: res.serverIds[0] ?? journal.journalId }
  },

  async createMany(clientId, journals) {
    const res = await api.post<{ ok: boolean; added: number; serverIds: string[] }>(
      `/${encodeURIComponent(clientId)}`, { journals }
    )
    return { added: res.added, ids: res.serverIds }
  },

  async update(clientId, journalId, patch) {
    const res = await api.patch<{ ok: boolean; journalId: string }>(
      `/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`, patch
    )
    // HTTP実装では更新後のJournalを取得できない。nullでない（成功）を伝えるためgetで取得
    if (!res.ok) return null
    return this.get(clientId, journalId)
  },

  async updateMany(clientId, patches) {
    let updated = 0
    for (const { journalId, patch } of patches) {
      await api.patch(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`, patch)
      updated++
    }
    return { updated }
  },

  async delete(clientId, journalId) {
    // 削除前にデータを取得（削除後は取得できないため）
    const journal = await this.get(clientId, journalId)
    if (!journal) return null
    await api.del(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`)
    return journal
  },

  async deleteMany(clientId, journalIds) {
    let deleted = 0
    for (const journalId of journalIds) {
      await api.del(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`)
      deleted++
    }
    return { deleted }
  },
}
