/**
 * 活動ログ Repository モック実装
 *
 * activityLogStore をラップして ActivityLogRepository interface を実装。
 * Supabase移行時にDB版に差し替え。
 *
 * 準拠: DL-030, DL-050
 */

import type { ActivityLogRepository } from '@/repositories/types'
import * as store from '@/api/services/activityLogStore'

export const mockActivityLogRepo: ActivityLogRepository = {
  async addLog(entry) {
    return store.addLog(entry)
  },
  async getAll() {
    return store.getAll()
  },
  async getByStaff(staffId) {
    return store.getByStaff(staffId)
  },
  async getByClient(clientId) {
    return store.getByClient(clientId)
  },
  async summarizeByStaff() {
    return store.summarizeByStaff()
  },
  async summarizeByClient() {
    return store.summarizeByClient()
  },
  async summarizeCross() {
    return store.summarizeCross()
  },
}
