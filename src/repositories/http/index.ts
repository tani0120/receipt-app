/**
 * HTTP版Repository集約（フロントエンド用）
 *
 * フロントエンド（Vite環境）で使用するRepository実装。
 * Node.js fsに依存せず、HTTP API経由でデータにアクセスする。
 *
 * 【使い分け】
 * - フロント: createHttpRepositories()（このファイル）
 * - サーバー: createMockRepositories()（mock/index.ts）
 *
 * 準拠: DL-030, DL-042
 */

import type { Repositories } from '@/repositories/types'
import { httpVendorRepo } from '../mock/vendor.repository.http'
import { httpShareStatusRepo } from '../mock/shareStatus.repository.http'
import { httpClientRepo } from '../mock/client.repository.http'
import { httpStaffRepo } from '../mock/staff.repository.http'
import { httpDocumentRepo } from '../mock/document.repository.http'
import { httpConfirmedJournalRepo } from '../mock/confirmedJournal.repository.http'
import { httpAccountRepo } from '../mock/account.repository.http'
import { httpAccountMasterRepo } from '../mock/accountMaster.repository.http'
import { httpTaxMasterRepo } from '../mock/taxMaster.repository.http'
import { httpLeadRepo } from '../mock/lead.repository.http'
import { httpLearningRuleRepo } from '../mock/learningRule.repository.http'
import { httpIndustryVectorRepo } from '../mock/industryVector.repository.http'
import { UI_MSG } from '@/constants/uiMessages'

/**
 * HTTP版Repositories生成（フロントエンド用）
 *
 * clientVendor以外は全てHTTP実装済み。
 * clientVendorのみスタブ（呼び出すとエラー）。
 */
export function createHttpRepositories(): Repositories {
  return {
    vendor: httpVendorRepo,
    shareStatus: httpShareStatusRepo,

    // ── clientVendorのみ未実装。呼び出すとエラーを投げる ──

    clientVendor: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      findByMatchKey: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
      save: async () => { throw new Error(UI_MSG.未実装接頭_ClientVendor) },
    },

    industryVector: httpIndustryVectorRepo,

    account: httpAccountRepo,

    accountMaster: httpAccountMasterRepo,

    taxMaster: httpTaxMasterRepo,

    lead: httpLeadRepo,

    confirmedJournal: httpConfirmedJournalRepo,

    staff: httpStaffRepo,

    client: httpClientRepo,

    document: httpDocumentRepo,

    learningRule: httpLearningRuleRepo,
  }
}
