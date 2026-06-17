/**
 * モックRepository集約（DL-030）
 *
 * 全モックRepository実装をまとめてexportする。
 * フェーズ4で R-3〜R-6 を追加したらここにもexportを追加する。
 *
 * 【現在の実装状況】
 * - VendorRepository:           ✅ 実装済み（vendor.repository.mock.ts）
 * - ShareStatusRepository:      ✅ 実装済み（shareStatus.repository.mock.ts）
 * - ClientRepository:           ✅ 実装済み（client.repository.mock.ts）
 * - StaffRepository:            ✅ 実装済み（staff.repository.mock.ts）
 * - DocumentRepository:         ✅ 実装済み（document.repository.mock.ts）
 * - ClientVendorRepository:     ❌ 未実装（フェーズ4: R-6）
 * - IndustryVectorRepository:   ✅ 実装済み（industryVector.repository.mock.ts）
 * - AccountRepository:          ✅ 実装済み（account.repository.mock.ts）
 * - AccountMasterRepository:    ✅ 実装済み（accountMaster.repository.mock.ts）
 * - TaxMasterRepository:        ✅ 実装済み（taxMaster.repository.mock.ts）
 * - ConfirmedJournalRepository: ✅ 実装済み（confirmedJournal.repository.mock.ts）
 * - LeadRepository:             ✅ 実装済み（lead.repository.mock.ts）
 * - LearningRuleRepository:     ✅ 実装済み（learningRule.repository.mock.ts）
 */

import type { Repositories } from '@/repositories/types'
import { mockVendorRepo } from './vendor.repository.mock'
import { mockShareStatusRepo } from './shareStatus.repository.mock'
import { mockClientRepo } from './client.repository.mock'
import { mockStaffRepo } from './staff.repository.mock'
import { mockDocumentRepo } from './document.repository.mock'
import { mockConfirmedJournalRepo } from './confirmedJournal.repository.mock'
import { mockAccountRepo } from './account.repository.mock'
import { mockAccountMasterRepo } from './accountMaster.repository.mock'
import { mockTaxMasterRepo } from './taxMaster.repository.mock'
import { mockLeadRepo } from './lead.repository.mock'
import { mockLearningRuleRepo } from './learningRule.repository.mock'
import { mockIndustryVectorRepo } from './industryVector.repository.mock'
import { UI_MSG } from '@/constants/uiMessages'

/**
 * モック版Repositories生成
 *
 * 未実装のRepositoryはエラーを投げるスタブで仮実装。
 * 各Repositoryが実装されたら差し替える。
 */
export function createMockRepositories(): Repositories {
  return {
    vendor: mockVendorRepo,
    shareStatus: mockShareStatusRepo,

    // ── clientVendorのみ未実装。呼び出すとエラーを投げる ──

    clientVendor: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      findByMatchKey: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      save: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
    },

    industryVector: mockIndustryVectorRepo,

    account: mockAccountRepo,

    accountMaster: mockAccountMasterRepo,

    taxMaster: mockTaxMasterRepo,

    lead: mockLeadRepo,

    confirmedJournal: mockConfirmedJournalRepo,

    staff: mockStaffRepo,

    client: mockClientRepo,

    document: mockDocumentRepo,

    learningRule: mockLearningRuleRepo,

    // ── P3: フロント抽象化用Repository（サーバーサイドでは未使用。未実装スタブ） ──
    // 呼び出し時に即座にエラーを投げることで、未実装を検知可能にする
    listView: {
      getViews: async () => { throw new Error('mockListViewRepo.getViews not implemented') },
      saveViews: async () => { throw new Error('mockListViewRepo.saveViews not implemented') },
    },
    drive: {
      getFiles: async () => { throw new Error('mockDriveRepo.getFiles not implemented') },
      createFolder: async () => { throw new Error('mockDriveRepo.createFolder not implemented') },
      checkFolder: async () => { throw new Error('mockDriveRepo.checkFolder not implemented') },
      upload: async () => { throw new Error('mockDriveRepo.upload not implemented') },
      migrate: async () => { throw new Error('mockDriveRepo.migrate not implemented') },
      getMigrateStatus: async () => { throw new Error('mockDriveRepo.getMigrateStatus not implemented') },
      getMigrateJobs: async () => { throw new Error('mockDriveRepo.getMigrateJobs not implemented') },
      downloadSupporting: async () => { throw new Error('mockDriveRepo.downloadSupporting not implemented') },
      downloadExcluded: async () => { throw new Error('mockDriveRepo.downloadExcluded not implemented') },
      getSupportingHistory: async () => { throw new Error('mockDriveRepo.getSupportingHistory not implemented') },
      getExcludedHistory: async () => { throw new Error('mockDriveRepo.getExcludedHistory not implemented') },
      saveSupportingMeta: async () => { throw new Error('mockDriveRepo.saveSupportingMeta not implemented') },
      grantPermission: async () => { throw new Error('mockDriveRepo.grantPermission not implemented') },
      revokePermission: async () => { throw new Error('mockDriveRepo.revokePermission not implemented') },
      getExcludedCount: async () => { throw new Error('mockDriveRepo.getExcludedCount not implemented') },
    },
    export: {
      getExportList: async () => { throw new Error('mockExportRepo.getExportList not implemented') },
      getExportDetail: async () => { throw new Error('mockExportRepo.getExportDetail not implemented') },
      getHistory: async () => { throw new Error('mockExportRepo.getHistory not implemented') },
      saveHistory: async () => { throw new Error('mockExportRepo.saveHistory not implemented') },
      getCsvSnapshot: async () => { throw new Error('mockExportRepo.getCsvSnapshot not implemented') },
      saveCsvSnapshot: async () => { throw new Error('mockExportRepo.saveCsvSnapshot not implemented') },
    },
    mfAuth: {
      getAuthStatus: async () => { throw new Error('mockMfAuthRepo.getAuthStatus not implemented') },
      getAuthStatusBulk: async () => { throw new Error('mockMfAuthRepo.getAuthStatusBulk not implemented') },
      getAuthUrl: async () => { throw new Error('mockMfAuthRepo.getAuthUrl not implemented') },
      importMasterAccounts: async () => { throw new Error('mockMfAuthRepo.importMasterAccounts not implemented') },
      importClientAccounts: async () => { throw new Error('mockMfAuthRepo.importClientAccounts not implemented') },
      fiscalCheck: async () => { throw new Error('mockMfAuthRepo.fiscalCheck not implemented') },
      importOffices: async () => { throw new Error('mockMfAuthRepo.importOffices not implemented') },
    },
    attachment: {
      upload: async () => { throw new Error('mockAttachmentRepo.upload not implemented') },
      deleteFile: async () => { throw new Error('mockAttachmentRepo.deleteFile not implemented') },
    },
    comment: {
      getByEntity: async () => { throw new Error('mockCommentRepo.getByEntity not implemented') },
      create: async () => { throw new Error('mockCommentRepo.create not implemented') },
      deleteById: async () => { throw new Error('mockCommentRepo.deleteById not implemented') },
      update: async () => { throw new Error('mockCommentRepo.update not implemented') },
    },
    admin: {
      getAiCostConfig: async () => { throw new Error('mockAdminRepo.getAiCostConfig not implemented') },
      getActivitySummary: async () => { throw new Error('mockAdminRepo.getActivitySummary not implemented') },
      getTaskSummary: async () => { throw new Error('mockAdminRepo.getTaskSummary not implemented') },
      getProgressList: async () => { throw new Error('mockAdminRepo.getProgressList not implemented') },
      getMigrateJobs: async () => { throw new Error('mockAdminRepo.getMigrateJobs not implemented') },
    },
    clientTaxCategory: {
      getByClient: async () => { throw new Error('mockClientTaxCategoryRepo.getByClient not implemented') },
      saveByClient: async () => { throw new Error('mockClientTaxCategoryRepo.saveByClient not implemented') },
    },
    leadExtra: {
      bulkCreate: async () => { throw new Error('mockLeadExtraRepo.bulkCreate not implemented') },
      convert: async () => { throw new Error('mockLeadExtraRepo.convert not implemented') },
    },
  }
}
