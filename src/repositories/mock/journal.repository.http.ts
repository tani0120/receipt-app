/**
 * journal.repository.http.ts — JournalRepository HTTP実装（フロントエンド用）
 *
 * 各メソッドが既存APIエンドポイント（journalRoutes.ts）にHTTPリクエストを送信する。
 * Supabase移行時はSupabase JS Client版に差し替え。
 *
 * 準拠: DL-030, P3-8, Phase 2.5
 * Hono RPC (hc) 経由で型安全なAPI呼び出しを実現
 */

import { honoClient } from '../../utils/honoClient'
import type { JournalRepository } from '../types'
import type { Journal } from '../../types/journal.type'

export const httpJournalRepo: JournalRepository = {
  async get(clientId, journalId) {
    const res = await honoClient.api.journals[':clientId'].$get({
      param: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/journals/${clientId} failed: ${res.status}`)
    const data = await res.json()
    return (data as { journals: Journal[] }).journals.find(j => j.journalId === journalId) ?? null
  },

  async list(clientId) {
    const res = await honoClient.api.journals[':clientId'].$get({
      param: { clientId }
    })
    if (!res.ok) throw new Error(`API GET /api/journals/${clientId} failed: ${res.status}`)
    const data = await res.json()
    return (data as { journals: Journal[] }).journals
  },

  async create(clientId, journal) {
    const res = await honoClient.api.journals[':clientId'].$post({
      param: { clientId },
      json: { journals: [journal as unknown as Record<string, unknown>] }
    })
    if (!res.ok) throw new Error(`API POST /api/journals/${clientId} failed: ${res.status}`)
    const data = await res.json()
    const serverIds = (data as { serverIds: string[] }).serverIds
    return { ...journal, journalId: serverIds[0] ?? journal.journalId }
  },

  async createMany(clientId, journals) {
    const res = await honoClient.api.journals[':clientId'].$post({
      param: { clientId },
      json: { journals: journals as unknown as Record<string, unknown>[] }
    })
    if (!res.ok) throw new Error(`API POST /api/journals/${clientId} failed: ${res.status}`)
    const data = await res.json()
    const result = data as { added: number; serverIds: string[] }
    return { added: result.added, ids: result.serverIds }
  },

  async update(clientId, journalId, patch) {
    const res = await honoClient.api.journals[':clientId'][':journalId'].$patch({
      param: { clientId, journalId },
      json: patch as Record<string, unknown>
    })
    if (!res.ok) return null
    return this.get(clientId, journalId)
  },

  async updateMany(clientId, patches) {
    let updated = 0
    for (const { journalId, patch } of patches) {
      await honoClient.api.journals[':clientId'][':journalId'].$patch({
        param: { clientId, journalId },
        json: patch as Record<string, unknown>
      })
      updated++
    }
    return { updated }
  },

  async delete(clientId, journalId) {
    const journal = await this.get(clientId, journalId)
    if (!journal) return null
    const res = await honoClient.api.journals[':clientId'][':journalId'].$delete({
      param: { clientId, journalId }
    })
    if (!res.ok) throw new Error(`API DELETE /api/journals/${clientId}/${journalId} failed: ${res.status}`)
    return journal
  },

  async deleteMany(clientId, journalIds) {
    let deleted = 0
    for (const journalId of journalIds) {
      await honoClient.api.journals[':clientId'][':journalId'].$delete({
        param: { clientId, journalId }
      })
      deleted++
    }
    return { deleted }
  },
}
