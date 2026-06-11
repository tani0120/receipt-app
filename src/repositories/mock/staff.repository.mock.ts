/**
 * staff.repository.mock.ts — StaffRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * StaffRepository → staffsApi（正しい方向）
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  getByEmail,
  getActiveStaff,
  create,
  update,
} from '../../api/services/staffsApi'
import type { StaffRepository } from '../types'

export const mockStaffRepo: StaffRepository = {
  getAll: async () => getAll(),
  getById: async (uuid) => getById(uuid),
  getByEmail: async (email) => getByEmail(email),
  getActiveStaff: async () => getActiveStaff(),
  create: async (staff) => { create(staff) },
  update: async (uuid, partial) => { update(uuid, partial) },
}
