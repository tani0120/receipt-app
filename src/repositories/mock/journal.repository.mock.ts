/**
 * journal.repository.mock.ts — JournalRepository モック実装
 *
 * journalStore.ts の既存関数をラップして JournalRepository インターフェースを実装する。
 * Supabase移行時はこのファイルをsupabase版に差し替える。
 *
 * 【設計方針】
 * - Repository は純粋CRUD のみ。業務ロジック（重複排除・MF-ID反映等）は含まない
 * - ID発番は Repository 外部で行う（パイプライン/Service層の責務）
 * - delete は ソフトデリート（deleted_at を設定。物理削除はしない）
 * - updateMany / deleteMany はメモリ上で更新し最後に1回 save() する（N回I/O回避）
 *
 * 準拠: Phase 2.5 実装計画 §確定Interface
 */

import type { JournalRepository } from '../types'
import type { Journal } from '../../types/journal.type'
import {
  getJournals,
  addJournals,
  updateJournal,
  deleteJournal,
  saveJournals,
} from '../../api/services/journalStore'

export const mockJournalRepo: JournalRepository = {
  // ── get: 全件取得 → find ──
  async get(clientId, journalId) {
    const all = getJournals<Journal>(clientId)
    return all.find(j => j.journalId === journalId) ?? null
  },

  // ── list: 全件取得 ──
  async list(clientId) {
    return getJournals<Journal>(clientId)
  },

  // ── create: 1件追加。発番後のJournalを返す ──
  // addJournals() はサーバーがID上書き発番する（副作用で引数配列を変更）。
  // 発番後のjournalを返す。
  async create(clientId, journal) {
    const wrapped = [journal as unknown as Record<string, unknown>]
    addJournals(clientId, wrapped)
    return wrapped[0] as unknown as Journal
  },

  // ── createMany: 複数件追加。追加件数とID一覧を返す ──
  async createMany(clientId, journals) {
    const records = journals as unknown as Record<string, unknown>[]
    const added = addJournals(clientId, records)
    const ids = records.map(j => String(j.journalId ?? ''))
    return { added, ids }
  },

  // ── update: 1件部分更新。見つからなければnull ──
  async update(clientId, journalId, patch) {
    const result = updateJournal(clientId, journalId, patch as Record<string, unknown>)
    return result as Journal | null
  },

  // ── updateMany: 複数件部分更新（メモリ更新→最後に1回save()） ──
  async updateMany(clientId, patches) {
    const all = getJournals<Record<string, unknown>>(clientId)
    let updated = 0
    for (const { journalId, patch } of patches) {
      const journal = all.find(j => j.journalId === journalId)
      if (!journal) continue
      for (const [key, value] of Object.entries(patch)) {
        journal[key] = value
      }
      updated++
    }
    saveJournals(clientId, all)
    return { updated }
  },

  // ── delete: 1件ソフトデリート。見つからなければnull ──
  async delete(clientId, journalId) {
    const result = deleteJournal(clientId, journalId)
    return result as Journal | null
  },

  // ── deleteMany: 複数件ソフトデリート。削除件数を返す ──
  async deleteMany(clientId, journalIds) {
    const all = getJournals<Record<string, unknown>>(clientId)
    const idSet = new Set(journalIds)
    const now = new Date().toISOString()
    let deleted = 0
    for (const journal of all) {
      if (idSet.has(journal.journalId as string)) {
        journal.deleted_at = now
        deleted++
      }
    }
    saveJournals(clientId, all)
    return { deleted }
  },
}
