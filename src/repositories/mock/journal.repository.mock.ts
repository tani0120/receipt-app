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

import type { JournalRepository } from '@/repositories/types'
import type { Journal } from '@/types/journal.type'
import {
  getJournals,
  addJournals,
  updateJournal,
  deleteJournal,
  saveJournals,
} from '@/api/services/journalStore'

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

  // ── create: 1件追加（IDは呼び出し側で発番済み） ──
  // addJournals() はサーバーがID上書き発番するが、
  // Repository は「IDが発番済み」の前提。
  // → addJournals() を使い、IDの上書きは journalStore 側の既存挙動に委ねる。
  // Supabase 移行時は INSERT ... で置換。
  async create(clientId, journal) {
    addJournals(clientId, [journal as unknown as Record<string, unknown>])
  },

  // ── createMany: 複数件追加 ──
  async createMany(clientId, journals) {
    addJournals(clientId, journals as unknown as Record<string, unknown>[])
  },

  // ── update: 1件部分更新 ──
  async update(clientId, journalId, patch) {
    updateJournal(clientId, journalId, patch as Record<string, unknown>)
  },

  // ── updateMany: 複数件部分更新（メモリ更新→最後に1回save()） ──
  // 現在の updateJournal() は毎回 save() が走る（N回I/O）。
  // Many版では getJournals → メモリ上でpatch → 1回 saveJournals で対策。
  async updateMany(clientId, patches) {
    const all = getJournals<Record<string, unknown>>(clientId)
    for (const { journalId, patch } of patches) {
      const journal = all.find(j => j.journalId === journalId)
      if (!journal) continue
      for (const [key, value] of Object.entries(patch)) {
        journal[key] = value
      }
    }
    saveJournals(clientId, all)
  },

  // ── delete: 1件ソフトデリート ──
  async delete(clientId, journalId) {
    deleteJournal(clientId, journalId)
  },

  // ── deleteMany: 複数件ソフトデリート（メモリ更新→最後に1回save()） ──
  async deleteMany(clientId, journalIds) {
    const all = getJournals<Record<string, unknown>>(clientId)
    const idSet = new Set(journalIds)
    const now = new Date().toISOString()
    for (const journal of all) {
      if (idSet.has(journal.journalId as string)) {
        journal.deleted_at = now
      }
    }
    saveJournals(clientId, all)
  },
}
