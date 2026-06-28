/**
 * client.repository.mock.ts — ClientRepositoryモック実装
 *
 * 【責務】
 * - clientsApi.ts（共通データアクセス層）をClientRepositoryインターフェースでラップ
 * - 全メソッドはPromise<T>で統一（Supabase移行時にシグネチャ変更不要）
 *
 * 【依存方向】
 * ClientRepository → clientsApi（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  getByStaffId,
  getActiveClients,
  create,
  updateClient,
  generateClientId as genClientId,
  getByThreeCode as getByThreeCodeStore,
  getByStatus as getByStatusStore,
} from '../../api/services/clientsApi'
import { getClientList } from '../../api/services/clientListService'
import type { ClientRepository } from '../types'
import type { Client } from '../types'

export const mockClientRepo: ClientRepository = {
  getAll: async () => getAll(),
  getById: async (clientId) => getById(clientId),
  getByStaffId: async (staffId) => getByStaffId(staffId),
  getActiveClients: async () => getActiveClients(),
  create: async (client) => create(client),
  update: async (clientId, partial) => { updateClient(clientId, partial) },
  list: async (query) => getClientList(query),
  getByThreeCode: async (code) => getByThreeCodeStore(code),
  getByStatus: async (status) => getByStatusStore(status),
  generateClientId: async () => genClientId(),
  bulkCreate: async (items) => {
    const results: { index: number; ok: boolean; clientId?: string; threeCode?: string; companyName?: string; error?: string }[] = []
    for (let i = 0; i < items.length; i++) {
      try {
        const item = { ...items[i]!, clientId: genClientId() }
        const saved = create(item as unknown as Client)
        results.push({ index: i, ok: true, clientId: saved.clientId, threeCode: saved.threeCode, companyName: saved.companyName })
      } catch (err) {
        results.push({ index: i, ok: false, error: String(err) })
      }
    }
    return { ok: true, results, total: items.length }
  },
}
