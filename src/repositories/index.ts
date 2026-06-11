/**
 * Repository DIポイント（DL-030: データアクセス抽象化）
 *
 * フロントエンド専用。HTTP API経由でデータにアクセスする。
 * サーバー側からは repositories/mock/index.ts を直接使用する。
 *
 * 【切り替え方式】
 * - VITE_USE_MOCK=true（デフォルト）: HTTP API経由でモックサーバーにアクセス
 * - VITE_USE_MOCK=false: Supabaseからデータ取得
 *
 * 【使い方（フロント）】
 * ```ts
 * import { createRepositories } from '@/repositories'
 * const repos = createRepositories()
 * const client = await repos.client.getById('c_abc12345')
 * ```
 *
 * 【使い方（サーバー）】
 * ```ts
 * import { createMockRepositories } from '@/repositories/mock'
 * const repos = createMockRepositories()
 * ```
 *
 * 準拠: DL-030, DL-042
 */

import type { Repositories } from '@/repositories/types'
import { createHttpRepositories } from './http'
import { createSupabaseRepositories } from './supabase'

/**
 * Repository群を生成するfactory関数（フロントエンド用）
 *
 * フロントからはHTTP API経由でアクセス。Node.js fsに依存しない。
 */
export function createRepositories(): Repositories {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return createHttpRepositories()
  }

  // フェーズ5: Supabase実装（.envでVITE_USE_MOCK=falseに設定で有効化）
  return createSupabaseRepositories()
}
