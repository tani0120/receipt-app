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
import { mockVendorRepo } from '../mock/vendor.repository.mock'
import { mockShareStatusRepo } from '../mock/shareStatus.repository.mock'
import { httpClientRepo } from '../mock/client.repository.http'
import { httpStaffRepo } from '../mock/staff.repository.http'
import { UI_MSG } from '@/constants/uiMessages'

/**
 * HTTP版Repositories生成（フロントエンド用）
 *
 * clientのみHTTP実装。他はmock/スタブのまま。
 * 各Repositoryが実装されたら差し替える。
 */
export function createHttpRepositories(): Repositories {
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

    staff: httpStaffRepo,

    client: httpClientRepo,

    document: {
      getByClientId: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      updateStatus: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      save: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
      saveBatch: async () => { throw new Error(UI_MSG.未実装接頭_Document) },
    },
  }
}
