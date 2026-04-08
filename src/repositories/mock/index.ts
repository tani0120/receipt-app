/**
 * モックRepository集約（DL-030）
 *
 * 全モックRepository実装をまとめてexportする。
 * フェーズ4で R-3〜R-6 を追加したらここにもexportを追加する。
 *
 * 【現在の実装状況】
 * - VendorRepository:           ✅ 実装済み（vendor.repository.mock.ts）
 * - ClientVendorRepository:     ❌ 未実装（フェーズ4: R-6）
 * - IndustryVectorRepository:   ❌ 未実装（フェーズ4: R-3）
 * - AccountRepository:          ❌ 未実装（フェーズ4: R-4）
 * - ConfirmedJournalRepository: ❌ 未実装（フェーズ4: R-5。T-03完了後）
 */

import type { Repositories } from '@/repositories/types'
import { mockVendorRepo } from './vendor.repository.mock'

/**
 * モック版Repositories生成
 *
 * 未実装のRepositoryはエラーを投げるスタブで仮実装。
 * 各Repositoryが実装されたら差し替える。
 */
export function createMockRepositories(): Repositories {
  return {
    vendor: mockVendorRepo,

    // ── 以下はフェーズ4で実装予定。呼び出すとエラーを投げる ──

    clientVendor: {
      getByClientId: async () => { throw new Error('[ClientVendorRepository] 未実装（フェーズ4: R-6）') },
      findByMatchKey: async () => { throw new Error('[ClientVendorRepository] 未実装（フェーズ4: R-6）') },
      save: async () => { throw new Error('[ClientVendorRepository] 未実装（フェーズ4: R-6）') },
    },

    industryVector: {
      getAll: async () => { throw new Error('[IndustryVectorRepository] 未実装（フェーズ4: R-3）') },
      findByVector: async () => { throw new Error('[IndustryVectorRepository] 未実装（フェーズ4: R-3）') },
    },

    account: {
      getAll: async () => { throw new Error('[AccountRepository] 未実装（フェーズ4: R-4）') },
      findById: async () => { throw new Error('[AccountRepository] 未実装（フェーズ4: R-4）') },
      getAllForClient: async () => { throw new Error('[AccountRepository] 未実装（フェーズ4: R-4）') },
    },

    confirmedJournal: {
      getByClientId: async () => { throw new Error('[ConfirmedJournalRepository] 未実装（フェーズ4: R-5。T-03完了後）') },
      findByMatchKey: async () => { throw new Error('[ConfirmedJournalRepository] 未実装（フェーズ4: R-5。T-03完了後）') },
    },
  }
}
