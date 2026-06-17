/**
 * admin.repository.http.ts — AdminRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-6
 */

import { createApiClient } from '@/utils/apiClient'
import type { AdminRepository } from '../types'

const api = createApiClient('/api')

export const httpAdminRepo: AdminRepository = {
  getAiCostConfig: async () => {
    return api.get('/ai-command/cost/config')
  },

  getActivitySummary: async () => {
    return api.get('/activity-log/summary')
  },

  getTaskSummary: async () => {
    return api.get('/admin/task-summary')
  },

  getProgressList: async (data) => {
    return api.post('/progress/list', data)
  },

  getMigrateJobs: async (clientId) => {
    return api.get(`/drive/migrate/jobs/${encodeURIComponent(clientId)}`)
  },
}
