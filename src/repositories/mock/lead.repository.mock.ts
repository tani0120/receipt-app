/**
 * lead.repository.mock.ts — LeadRepositoryモック実装（サーバー用）
 *
 * 【依存方向】
 * LeadRepository → leadStore（サーバー側）/ leadListService
 *
 * 準拠: DL-030, DL-042
 */

import {
  getAll,
  getById,
  create,
  updateLead,
  updateSharedFolderId,
  getActiveLeads,
  getByStatus,
  updateStaffAssignment,
  updateSharedEmail,
  generateLeadId,
  getByStaffId,
} from '../../api/services/leadStore'
import { getLeadList } from '../../api/services/leadListService'
import type { LeadRepository } from '../types'

export const mockLeadRepo: LeadRepository = {
  getAll: async () => getAll(),
  getById: async (leadId) => getById(leadId),
  create: async (lead) => create(lead),
  update: async (leadId, partial) => { updateLead(leadId, partial) },
  updateSharedFolderId: async (leadId, folderId) => updateSharedFolderId(leadId, folderId),
  list: async (query) => await getLeadList(query),
  getActiveLeads: async () => getActiveLeads(),
  getByStatus: async (status) => getByStatus(status as Parameters<typeof getByStatus>[0]),
  updateStaffAssignment: async (leadId, staffId) => updateStaffAssignment(leadId, staffId),
  updateSharedEmail: async (leadId, email) => updateSharedEmail(leadId, email),
  generateLeadId: async () => generateLeadId(),
  getByStaffId: async (staffId) => getByStaffId(staffId),
}
