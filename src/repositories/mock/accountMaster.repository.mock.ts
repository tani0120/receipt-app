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
  getFilteredAccounts,
  getFilteredClientAccounts,
  getClientSubAccounts,
  getClientDepartments,
  hasClientAccounts,
  saveMfAccounts,
  persistSubAccounts,
  persistDepartments,
  getClientAccountsForValidation,
  getAccountNameMap,
  detectOrphanedOverrides,
  renameAccountId,
} from '../../api/services/accountMasterApi'
import type { AccountMasterRepository } from '../types'

export const mockAccountMasterRepo: AccountMasterRepository = {
  getMaster: async () => [...getAllAccounts()],
  saveMaster: async (accounts) => saveAllAccounts(accounts),
  getClient: async (clientId) => {
    const data = getClientAccounts(clientId)
    return { accounts: data.accounts }
  },
  saveClient: async (clientId, data) => saveClientAccounts(clientId, data.accounts),
  getClientAccountsFull: async (clientId) => getClientAccounts(clientId),
  getFilteredMaster: async (params) => getFilteredAccounts(params),
  getFilteredClient: async (clientId, params) => getFilteredClientAccounts(clientId, params),
  getClientSubAccounts: async (clientId) => getClientSubAccounts(clientId),
  getClientDepartments: async (clientId) => getClientDepartments(clientId),
  hasClientAccounts: async (clientId) => hasClientAccounts(clientId),
  saveMfAccounts: async (clientId, accounts) => saveMfAccounts(clientId, accounts),
  persistSubAccounts: async (clientId, data) => persistSubAccounts(clientId, data),
  persistDepartments: async (clientId, data) => persistDepartments(clientId, data),
  getClientAccountsForValidation: async (clientId) => getClientAccountsForValidation(clientId),
  getAccountNameMap: async (clientId) => getAccountNameMap(clientId),
  detectOrphanedOverrides: async (clientId) => detectOrphanedOverrides(clientId),
  renameAccountId: async (oldId, newId) => renameAccountId(oldId, newId),
}
