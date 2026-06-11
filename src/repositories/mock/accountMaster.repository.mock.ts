/**
 * accountMaster.repository.mock.ts — AccountMasterRepositoryモック実装（サーバー用）
 *
 * 責務: マスタ管理画面での科目編集・保存
 * AccountRepositoryとは責務が異なる（参照系 vs 管理系）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAllAccounts,
  saveAllAccounts,
  getClientAccounts,
  saveClientAccounts,
} from '../../api/services/accountMasterApi'
import type { AccountMasterRepository } from '../types'

export const mockAccountMasterRepo: AccountMasterRepository = {
  getMaster: async () => [...getAllAccounts()],
  saveMaster: async (accounts) => { saveAllAccounts(accounts) },
  getClient: async (clientId) => {
    const data = getClientAccounts(clientId)
    return { accounts: data.accounts }
  },
  saveClient: async (clientId, data) => {
    saveClientAccounts(clientId, data.accounts, data.subAccounts)
  },
}
