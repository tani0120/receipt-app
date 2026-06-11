/**
 * account.repository.mock.ts — AccountRepositoryモック実装（サーバー用）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAllAccounts,
  getAccountById,
  getClientAccounts,
} from '../../api/services/accountMasterApi'
import type { AccountRepository } from '../types'

export const mockAccountRepo: AccountRepository = {
  getAll: async () => [...getAllAccounts()],
  findById: async (id) => getAccountById(id),
  getAllForClient: async (clientId) => getClientAccounts(clientId).accounts,
}
