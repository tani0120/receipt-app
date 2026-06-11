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
 * - IndustryVectorRepository:   ❌ 未実装（フェーズ4: R-3）
 * - AccountRepository:          ✅ 実装済み（account.repository.mock.ts）
 * - AccountMasterRepository:    ✅ 実装済み（accountMaster.repository.mock.ts）
 * - TaxMasterRepository:        ✅ 実装済み（taxMaster.repository.mock.ts）
 * - ConfirmedJournalRepository: ✅ 実装済み（confirmedJournal.repository.mock.ts）
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

    // ── 以下はフェーズ4で実装予定。呼び出すとエラーを投げる ──

    clientVendor: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      findByMatchKey: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      save: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
    },

    industryVector: {
      getAll: async () => { throw new Error(UI_MSG.未実装接頭_IndustryVector) },
      findByVector: async () => { throw new Error(UI_MSG.未実装接頭_IndustryVector) },
    },

    account: mockAccountRepo,

    accountMaster: mockAccountMasterRepo,

    taxMaster: mockTaxMasterRepo,

    lead: mockLeadRepo,

    confirmedJournal: mockConfirmedJournalRepo,

    staff: mockStaffRepo,

    client: mockClientRepo,

    document: mockDocumentRepo,
  }
}
