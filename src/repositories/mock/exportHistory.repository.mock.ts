/**
 * exportHistory.repository.mock.ts — ExportHistoryRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * ExportHistoryRepository → exportHistoryStore（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getExportHistory,
  addExportHistory,
  getCsvSnapshot,
  saveCsvSnapshot,
  summarizeCsvLines,
} from '../../api/services/exportHistoryStore'
import type { ExportHistoryRepository } from '../types'

export const mockExportHistoryRepo: ExportHistoryRepository = {
  getByClientId: async (clientId) => getExportHistory(clientId),
  add: async (clientId, entry) => addExportHistory(clientId, entry),
  getCsvSnapshot: async (clientId, historyId) => getCsvSnapshot(clientId, historyId),
  saveCsvSnapshot: async (clientId, snapshot) => saveCsvSnapshot(clientId, snapshot),
  summarizeCsvLines: async () => summarizeCsvLines(),
}
