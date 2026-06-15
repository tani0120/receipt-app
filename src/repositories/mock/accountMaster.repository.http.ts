/**
 * accountMaster.repository.http.ts — AccountMasterRepository HTTP実装（フロントエンド用）
 *
 * 責務: マスタ管理画面での科目編集・保存（HTTP API経由）
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '@/utils/apiClient'
import type { Account } from '@/types/shared-account'
import type { AccountMasterRepository } from '../types'

const api = createApiClient('/api/accounts')

export const httpAccountMasterRepo: AccountMasterRepository = {
  getMaster: async () => {
    const res = await api.get<{ items: Account[] }>('/master?pageSize=500')
    return res.items
  },

  saveMaster: async (accounts) => {
    await api.put('/master', { accounts })
  },

  getClient: async (clientId) => {
    return api.get<{ accounts: Account[] }>(`/client/${clientId}`)
  },

  saveClient: async (clientId, data) => {
    await api.put(`/client/${clientId}`, data)
  },
}
