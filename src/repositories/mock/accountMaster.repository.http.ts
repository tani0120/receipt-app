/**
 * accountMaster.repository.http.ts — AccountMasterRepository HTTP実装（フロントエンド用）
 *
 * 責務: マスタ管理画面での科目編集・保存（HTTP API経由）
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { Account } from '../../types/shared-account'
import type { AccountMasterRepository } from '../types'

export const httpAccountMasterRepo: AccountMasterRepository = {
  getMaster: async () => {
    const res = await honoClient.api.accounts.master.$get({ query: { pageSize: '500' } })
    const data = await res.json() as { items: Account[] }
    return data.items
  },

  saveMaster: async (accounts) => {
    const res = await honoClient.api.accounts.master.$put({ json: { accounts } })
    return await res.json() as { ok: true; count: number }
  },

  getClient: async (clientId) => {
    const res = await honoClient.api.accounts.client[':clientId'].$get({ param: { clientId } })
    const data = await res.json() as { items: Account[]; subAccountsMap?: Record<string, unknown[]>; departments?: unknown[] }
    return { accounts: data.items }
  },

  saveClient: async (clientId, data) => {
    const res = await honoClient.api.accounts.client[':clientId'].$put({
      param: { clientId },
      json: { accounts: data.accounts },
    })
    return await res.json() as { ok: true; count: number }
  },

  // --- 以下はサーバー専用メソッド（mock版で実装済み。HTTP版はフロント用のため未実装） ---
  // 呼び出し元は全てサーバー側（routes/services）のみ。フロントからは呼ばれない。
  // TODO(Supabase): Phase B でSupabase版に統合時に実装

  getClientAccountsFull: async () => {
    throw new Error('AccountMasterRepository.getClientAccountsFull: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getFilteredMaster: async () => {
    throw new Error('AccountMasterRepository.getFilteredMaster: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getFilteredClient: async () => {
    throw new Error('AccountMasterRepository.getFilteredClient: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getClientSubAccounts: async () => {
    throw new Error('AccountMasterRepository.getClientSubAccounts: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getClientDepartments: async () => {
    throw new Error('AccountMasterRepository.getClientDepartments: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  hasClientAccounts: async () => {
    throw new Error('AccountMasterRepository.hasClientAccounts: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  saveMfAccounts: async () => {
    throw new Error('AccountMasterRepository.saveMfAccounts: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  persistSubAccounts: async () => {
    throw new Error('AccountMasterRepository.persistSubAccounts: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  persistDepartments: async () => {
    throw new Error('AccountMasterRepository.persistDepartments: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getClientAccountsForValidation: async () => {
    throw new Error('AccountMasterRepository.getClientAccountsForValidation: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  getAccountNameMap: async () => {
    throw new Error('AccountMasterRepository.getAccountNameMap: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  detectOrphanedOverrides: async () => {
    throw new Error('AccountMasterRepository.detectOrphanedOverrides: HTTP版では未実装（サーバー側はmock版を使用）')
  },

  renameAccountId: async () => {
    throw new Error('AccountMasterRepository.renameAccountId: HTTP版では未実装（サーバー側はmock版を使用）')
  },
}


