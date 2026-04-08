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

/** インメモリストア（同一プロセス内でシングルトン） */
const store = new Map<string, ShareStatusRecord>()

export const mockShareStatusRepo: ShareStatusRepository = {
  async getAll(): Promise<ShareStatusRecord[]> {
    return Array.from(store.values())
  },

  async getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    return store.get(clientId)
  },

  async updateStatus(clientId: string, status): Promise<void> {
    const existing = store.get(clientId)
    if (existing) {
      existing.status = status
      existing.updatedAt = new Date().toISOString()
    } else {
      store.set(clientId, {
        clientId,
        status,
        inviteCode: null,
        updatedAt: new Date().toISOString(),
      })
    }
  },

  async saveInviteCode(clientId: string, code: string): Promise<void> {
    const existing = store.get(clientId)
    if (existing) {
      existing.inviteCode = code
      existing.updatedAt = new Date().toISOString()
    } else {
      store.set(clientId, {
        clientId,
        status: 'pending',
        inviteCode: code,
        updatedAt: new Date().toISOString(),
      })
    }
  },
}
