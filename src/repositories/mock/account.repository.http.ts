/**
 * account.repository.http.ts — AccountRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { Account } from '../../types/shared-account'
import type { AccountRepository } from '../types'

const api = createApiClient('/api/account-master')

export const httpAccountRepo: AccountRepository = {
  getAll: async () => {
    const res = await api.get<{ accounts: Account[] }>('')
    return res.accounts
  },

  findById: async (id) => {
    try {
      const res = await api.get<{ account: Account }>(`/${id}`)
      return res.account
    } catch {
      return undefined
    }
  },

  getAllForClient: async (clientId) => {
    const res = await api.get<{ accounts: Account[] }>(`/client/${clientId}`)
    return res.accounts
  },
}
