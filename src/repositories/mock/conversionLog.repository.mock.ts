/**
 * CSV変換ログ Repository モック実装
 *
 * conversionStore をラップして ConversionLogRepository interface を実装。
 * Supabase移行時にDB版に差し替え。
 *
 * 準拠: DL-030, DL-050
 */

import type { ConversionLogRepository } from '@/repositories/types'
import * as store from '@/api/services/conversionStore'

export const mockConversionLogRepo: ConversionLogRepository = {
  async getAllLogs() {
    return store.getAllLogs()
  },
  async addLog(clientName, sourceSoftware, targetSoftware, csvContent, fileName) {
    return store.addLog(clientName, sourceSoftware, targetSoftware, csvContent, fileName)
  },
  async markAsDownloaded(id) {
    return store.markAsDownloaded(id)
  },
  async deleteLog(id) {
    return store.deleteLog(id)
  },
  async getCsvFilePath(id) {
    return store.getCsvFilePath(id)
  },
}
