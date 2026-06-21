/**
 * export.repository.http.ts — ExportRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-3
 */

import { createApiClient } from '@/utils/apiClient'
import type { ExportRepository } from '../types'

const exportApi = createApiClient('/api/export')
const historyApi = createApiClient('/api/export-history')
const journalApi = createApiClient('/api/journals')

export const httpExportRepo: ExportRepository = {
  getExportList: async (data) => {
    return exportApi.post('/list', data)
  },

  getExportDetail: async (data) => {
    return exportApi.post('/detail', data)
  },

  getHistory: async (clientId) => {
    return historyApi.get(`/${encodeURIComponent(clientId)}`)
  },

  saveHistory: async (clientId, data) => {
    return historyApi.post(`/${encodeURIComponent(clientId)}`, data)
  },

  getCsvSnapshot: async (clientId, historyId) => {
    return historyApi.get(`/${encodeURIComponent(clientId)}/csv/${encodeURIComponent(historyId)}`)
  },

  saveCsvSnapshot: async (clientId, data) => {
    return historyApi.post(`/${encodeURIComponent(clientId)}/csv`, data)
  },

  patchJournalStatus: async (clientId, journalId, data) => {
    return journalApi.patch(`/${encodeURIComponent(clientId)}/${encodeURIComponent(journalId)}`, data)
  },
}
