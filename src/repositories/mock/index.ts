/**
 * モックRepository集約（DL-030）
 *
 * 全モックRepository実装をまとめてexportする。
 * フェーズ4で R-3〜R-6 を追加したらここにもexportを追加する。
 *
 * 【現在の実装状況】
 * - VendorRepository:           ✅ 実装済み（vendor.repository.mock.ts）
 * - ShareStatusRepository:      ✅ 実装済み（shareStatus.repository.mock.ts）
 * - ClientVendorRepository:     ❌ 未実装（フェーズ4: R-6）
 * - IndustryVectorRepository:   ❌ 未実装（フェーズ4: R-3）
 * - AccountRepository:          ❌ 未実装（フェーズ4: R-4）
 * - ConfirmedJournalRepository: ❌ 未実装（フェーズ4: R-5。T-03完了後）
 */

import type { Repositories } from '@/repositories/types'
import { mockVendorRepo } from './vendor.repository.mock'
import { mockShareStatusRepo } from './shareStatus.repository.mock'
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

    account: {
      getAll: async () => { throw new Error(UI_MSG.未実装接頭_Account) },
      findById: async () => { throw new Error(UI_MSG.未実装接頭_Account) },
      getAllForClient: async () => { throw new Error(UI_MSG.未実装接頭_Account) },
    },

    confirmedJournal: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_ConfirmedJournal) },
      findByMatchKey: async () => { throw new Error(UI_MSG.未実装接頭_ConfirmedJournal) },
    },

    staff: {
      getAll: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
      getById: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
      getByEmail: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
      getActiveStaff: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
      create: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
      update: async () => { throw new Error(UI_MSG.未実装接頭_Staff) },
    },

    client: {
      getAll: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
      getById: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
      getByStaffId: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
      getActiveClients: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
      create: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
      update: async () => { throw new Error(UI_MSG.未実装接頭_Client) },
    },

    document: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      updateStatus: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      save: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      saveBatch: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
    },
  }
}
