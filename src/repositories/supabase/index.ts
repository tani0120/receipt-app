/**
 * Supabase版Repository集約（DL-030, DL-032）
 *
 * Supabase接続時に使用する。モック版と同じインターフェース。
 * index.ts のfactory関数から呼ばれる。
 *
 * 【現在の実装状況】
 * - ShareStatusRepository:      ✅ 実装済み（Supabase）
 * - VendorRepository:           ✅ 実装済み（Supabase）
 * - ClientVendorRepository:     ✅ 実装済み（Supabase）
 * - IndustryVectorRepository:   ✅ 実装済み（Supabase）
 * - AccountRepository:          ✅ 実装済み（Supabase）
 * - AccountMasterRepository:    🔄 HTTP版フォールバック
 * - TaxMasterRepository:        🔄 HTTP版フォールバック
 * - LeadRepository:             🔄 HTTP版フォールバック
 * - LearningRuleRepository:     🔄 HTTP版フォールバック
 * - ConfirmedJournalRepository: 🔄 HTTP版フォールバック
 * - StaffRepository:            🔄 HTTP版フォールバック
 * - ClientRepository:           🔄 HTTP版フォールバック
 * - DocumentRepository:         🔄 HTTP版フォールバック
 */

import type { Repositories } from '@/repositories/types'
import { supabaseShareStatusRepo } from './shareStatus.repository.supabase'
import { supabaseVendorRepo } from './vendor.repository.supabase'
import { supabaseClientVendorRepo } from './clientVendor.repository.supabase'
import { supabaseIndustryVectorRepo } from './industryVector.repository.supabase'
import { supabaseAccountRepo } from './account.repository.supabase'

// Supabase未実装分はHTTP版をフォールバックとして使用
import { httpAccountMasterRepo } from '../mock/accountMaster.repository.http'
import { httpTaxMasterRepo } from '../mock/taxMaster.repository.http'
import { httpLeadRepo } from '../mock/lead.repository.http'
import { httpLearningRuleRepo } from '../mock/learningRule.repository.http'
import { httpConfirmedJournalRepo } from '../mock/confirmedJournal.repository.http'
import { httpStaffRepo } from '../mock/staff.repository.http'
import { httpClientRepo } from '../mock/client.repository.http'
import { httpDocumentRepo } from '../mock/document.repository.http'
import { httpListViewRepo } from '../mock/listView.repository.http'
import { httpDriveRepo } from '../mock/drive.repository.http'
import { httpExportRepo } from '../mock/export.repository.http'
import { httpMfAuthRepo } from '../mock/mfAuth.repository.http'
import { httpAttachmentRepo } from '../mock/attachment.repository.http'
import { httpCommentRepo } from '../mock/comment.repository.http'
import { httpAdminRepo } from '../mock/admin.repository.http'
import { httpClientTaxCategoryRepo } from '../mock/clientTaxCategory.repository.http'
import { httpLeadExtraRepo } from '../mock/leadExtra.repository.http'
import { httpJournalRepo } from '../mock/journal.repository.http'

/**
 * Supabase版Repositories生成
 *
 * Supabase実装済み分はSupabase版、未実装分はHTTP版にフォールバック。
 */
export function createSupabaseRepositories(): Repositories {
  return {
    // ── Supabase実装済み ──
    shareStatus: supabaseShareStatusRepo,
    vendor: supabaseVendorRepo,
    clientVendor: supabaseClientVendorRepo,
    industryVector: supabaseIndustryVectorRepo,
    account: supabaseAccountRepo,

    // ── HTTP版フォールバック（Supabase未実装） ──
    accountMaster: httpAccountMasterRepo,
    taxMaster: httpTaxMasterRepo,
    lead: httpLeadRepo,
    learningRule: httpLearningRuleRepo,
    confirmedJournal: httpConfirmedJournalRepo,
    staff: httpStaffRepo,
    client: httpClientRepo,
    document: httpDocumentRepo,

    // ── P3: フロント抽象化用Repository（HTTP版フォールバック） ──
    listView: httpListViewRepo,
    drive: httpDriveRepo,
    export: httpExportRepo,
    mfAuth: httpMfAuthRepo,
    attachment: httpAttachmentRepo,
    comment: httpCommentRepo,
    admin: httpAdminRepo,
    clientTaxCategory: httpClientTaxCategoryRepo,
    leadExtra: httpLeadExtraRepo,
    journal: httpJournalRepo,
  }
}
