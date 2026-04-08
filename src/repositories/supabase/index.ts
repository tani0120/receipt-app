/**
 * Supabase版Repository集約（DL-030, DL-032）
 *
 * Supabase接続時に使用する。モック版と同じインターフェース。
 * index.ts のfactory関数から呼ばれる。
 *
 * 【現在の実装状況】
 * - ShareStatusRepository:      ✅ 実装済み
 * - VendorRepository:           ✅ 実装済み
 * - ClientVendorRepository:     ✅ 実装済み
 * - IndustryVectorRepository:   ✅ 実装済み
 * - AccountRepository:          ✅ 実装済み
 * - ConfirmedJournalRepository: ❌ 未実装（T-03で型確定後）
 */

import type { Repositories } from '@/repositories/types'
import { supabaseShareStatusRepo } from './shareStatus.repository.supabase'
import { supabaseVendorRepo } from './vendor.repository.supabase'
import { supabaseClientVendorRepo } from './clientVendor.repository.supabase'
import { supabaseIndustryVectorRepo } from './industryVector.repository.supabase'
import { supabaseAccountRepo } from './account.repository.supabase'

/**
 * Supabase版Repositories生成
 *
 * ConfirmedJournalのみ未実装（T-03完了待ち）。
 * それ以外は全てSupabase版が動作可能。
 */
export function createSupabaseRepositories(): Repositories {
  return {
    shareStatus: supabaseShareStatusRepo,
    vendor: supabaseVendorRepo,
    clientVendor: supabaseClientVendorRepo,
    industryVector: supabaseIndustryVectorRepo,
    account: supabaseAccountRepo,

    // ── T-03完了後に実装 ──
    confirmedJournal: {
      getByClientId: async () => { throw new Error('[ConfirmedJournalRepository] Supabase版未実装（T-03完了後）') },
      findByMatchKey: async () => { throw new Error('[ConfirmedJournalRepository] Supabase版未実装（T-03完了後）') },
    },
  }
}
