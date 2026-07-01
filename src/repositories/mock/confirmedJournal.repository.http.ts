/**
 * confirmedJournal.repository.http.ts — ConfirmedJournalRepository HTTP実装（フロントエンド用）
 *
 * 返却型はJournal（統一仕訳型）。
 */

import { honoClient } from '../../utils/honoClient'
import type { ConfirmedJournalRepository } from '../types'
import type { Journal } from '../../types/journal.type'

export const httpConfirmedJournalRepo: ConfirmedJournalRepository = {
  getByClientId: async (clientId) => {
    const res = await honoClient.api['confirmed-journals'][':clientId'].$get({ param: { clientId } })
    const data = await res.json() as { journals: Journal[] }
    return data.journals
  },

  findByMatchKey: async (clientId, matchKey) => {
    const res = await honoClient.api['confirmed-journals'][':clientId'].search.$get({
      param: { clientId },
      query: { match_key: matchKey },
    })
    const data = await res.json() as { journals: Journal[] }
    return data.journals
  },

  listBatches: async (clientId) => {
    const res = await honoClient.api['confirmed-journals'][':clientId'].batches.$get({ param: { clientId } })
    return await res.json() as { batches: { import_batch_id: string; client_id?: string; count: number; imported_at: string; min_voucher_date?: string; max_voucher_date?: string }[] }
  },

  importCsv: async (clientId, csvText) => {
    const res = await honoClient.api['confirmed-journals'][':clientId'].import.$post({
      param: { clientId },
      json: { csv_text: csvText },
    })
    return await res.json() as { ok: boolean; added: number; skipped: number; total_in_db: number; warnings?: string[]; message?: string }
  },

  deleteBatch: async (batchId) => {
    const res = await honoClient.api['confirmed-journals'].batch[':batchId'].$delete({ param: { batchId } })
    return await res.json() as { removed: number }
  },

  getJournalsByBatch: async (batchId) => {
    const res = await honoClient.api['confirmed-journals'].batch[':batchId'].journals.$get({ param: { batchId } })
    return await res.json() as { journals: Journal[] }
  },

  // --- 以下はサーバー専用メソッド（mock版で実装済み。HTTP版はフロント用のため未実装） ---
  // 呼び出し元: importBatch → confirmedJournalService.ts（サーバー側のみ）
  // 呼び出し元: deleteByClientId → confirmedJournalService.ts（サーバー側のみ）
  // 呼び出し元: countByClientId → confirmedJournalService.ts（サーバー側のみ）
  // 呼び出し元: replaceByClientId → normalizeConfirmedJournalsService.ts（サーバー側のみ）
  // 呼び出し元: reload → confirmedJournalRoutes.ts（サーバー側のみ）
  // TODO(Supabase): Phase B でSupabase版に統合時に実装

  importBatch: async () => {
    throw new Error('ConfirmedJournalRepository.importBatch: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  deleteByClientId: async () => {
    throw new Error('ConfirmedJournalRepository.deleteByClientId: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  countByClientId: async () => {
    throw new Error('ConfirmedJournalRepository.countByClientId: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  replaceByClientId: async () => {
    throw new Error('ConfirmedJournalRepository.replaceByClientId: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  reload: async () => {
    throw new Error('ConfirmedJournalRepository.reload: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}

