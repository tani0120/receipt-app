/**
 * ShareStatusRepository モック実装
 *
 * インメモリMapでデータを保持。同一プロセス内のどのコンポーネントからも
 * 同じデータを参照・更新できる（画面間連動の基盤）。
 *
 * Supabase移行時: このファイルを shareStatus.repository.supabase.ts に差し替えるだけ。
 *
 * 【注意】ロジックなし。データの読み書きのみ。
 */

import type { ShareStatusRecord, ShareStatusRepository } from '@/repositories/types'
import {
  getAllShareStatus,
  getByClientId as getByClientIdFromStore,
  updateStatus as updateStatusInStore,
  saveInviteCode as saveInviteCodeInStore,
  getClientIdByInviteCode,
} from '../../api/services/shareStatusStore'

export const mockShareStatusRepo: ShareStatusRepository = {
  async getAll(): Promise<ShareStatusRecord[]> {
    return getAllShareStatus()
  },

  async getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    return getByClientIdFromStore(clientId)
  },

  async updateStatus(clientId: string, status): Promise<void> {
    updateStatusInStore(clientId, status)
  },

  async saveInviteCode(clientId: string, code: string): Promise<void> {
    saveInviteCodeInStore(clientId, code)
  },

  async generateInviteCode(clientId: string): Promise<{ code: string }> {
    const code = Math.random().toString(36).substring(2, 10)
    saveInviteCodeInStore(clientId, code)
    return { code }
  },

  async resolveInviteCode(code: string): Promise<string | null> {
    return getClientIdByInviteCode(code)
  },
}
