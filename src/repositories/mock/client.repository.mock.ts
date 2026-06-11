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
} from '../../api/services/clientsApi'
import type { ClientRepository } from '../types'

export const mockClientRepo: ClientRepository = {
  getAll: async () => getAll(),
  getById: async (clientId) => getById(clientId),
  getByStaffId: async (staffId) => getByStaffId(staffId),
  getActiveClients: async () => getActiveClients(),
  create: async (client) => { create(client) },
  update: async (clientId, partial) => { updateClient(clientId, partial) },
}
