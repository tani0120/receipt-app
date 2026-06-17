/**
 * listView.repository.http.ts — ListViewRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-1
 */

import { createApiClient } from '@/utils/apiClient'
import type { ListViewRepository } from '../types'

const api = createApiClient('/api/list-views')

export const httpListViewRepo: ListViewRepository = {
  getViews: async (entityType) => {
    return api.get<{ views: unknown[] }>(`/${entityType}`)
  },

  saveViews: async (entityType, data) => {
    const res = await fetch(`/api/list-views/${entityType}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },
}
