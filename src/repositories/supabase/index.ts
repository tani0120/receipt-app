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
 * - StaffRepository:            ❌ 未実装（フェーズ4: DL-042）
 * - ClientRepository:           ❌ 未実装（フェーズ4: DL-042）
 * - DocumentRepository:         ❌ 未実装（フェーズ4: DL-039）
 */

import type { Repositories } from '@/repositories/types'
import { supabaseShareStatusRepo } from './shareStatus.repository.supabase'
import { supabaseVendorRepo } from './vendor.repository.supabase'
import { supabaseClientVendorRepo } from './clientVendor.repository.supabase'
import { supabaseIndustryVectorRepo } from './industryVector.repository.supabase'
import { supabaseAccountRepo } from './account.repository.supabase'
import { UI_MSG } from '@/constants/uiMessages'

/**
 * Supabase版Repositories生成
 *
 * ConfirmedJournalのみ未実装（T-03完了待ち）。
 * それ以外は全てSupabase版が動作可能。
 */
export function createSupabaseRepositories(): Repositories {
  return {
    // ── 実装済み ──
    shareStatus: supabaseShareStatusRepo,
    vendor: supabaseVendorRepo,
    clientVendor: supabaseClientVendorRepo,
    industryVector: supabaseIndustryVectorRepo,
    account: supabaseAccountRepo,

    // ── 以下はフェーズ4で実装予定。呼び出すとエラーを投げる（モック版と同一パターン） ──

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
