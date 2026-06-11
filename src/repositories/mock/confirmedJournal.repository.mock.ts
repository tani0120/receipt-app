/**
 * confirmedJournal.repository.mock.ts — ConfirmedJournalRepositoryモック実装（サーバー用）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getByClientId,
  findByMatchKey,
  getImportBatches,
  importJournals,
  deleteByBatchId,
  getByBatchId,
} from '../../api/services/confirmedJournalsApi'
import { parseMfCsv } from '../../utils/pipeline/mfCsvParser'
import type { ConfirmedJournalRepository } from '../types'

export const mockConfirmedJournalRepo: ConfirmedJournalRepository = {
  getByClientId: async (clientId) => getByClientId(clientId),

  findByMatchKey: async (clientId, matchKey) => findByMatchKey(clientId, matchKey),

  listBatches: async (clientId) => {
    const batches = getImportBatches(clientId)
    return { batches }
  },

  importCsv: async (clientId, csvText) => {
    // バッチID生成
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let batchId = 'batch_'
    for (let i = 0; i < 8; i++) {
      batchId += chars[Math.floor(Math.random() * chars.length)]
    }

    const parseResult = parseMfCsv(csvText, clientId, batchId)

    if (!parseResult.ok || parseResult.journals.length === 0) {
      return {
        ok: false,
        added: 0,
        skipped: 0,
        total_in_db: getByClientId(clientId).length,
        warnings: parseResult.warnings,
        message: parseResult.warnings?.join('; ') || 'パース失敗',
      }
    }

    const importResult = importJournals(parseResult.journals)
    return {
      ok: true,
      added: importResult.added,
      skipped: importResult.skipped,
      total_in_db: getByClientId(clientId).length,
      warnings: parseResult.warnings,
    }
  },

  deleteBatch: async (batchId) => {
    const removed = deleteByBatchId(batchId)
    return { removed }
  },

  getJournalsByBatch: async (batchId) => {
    const journals = getByBatchId(batchId)
    return { journals }
  },
}
