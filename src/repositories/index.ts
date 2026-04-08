/**
 * Repository DIポイント（DL-030: データアクセス抽象化）
 *
 * 環境変数 VITE_USE_MOCK でモック/Supabase実装を切り替える。
 * パイプラインロジック層はこのfactory関数経由でRepositoryを取得する。
 *
 * 【使い方】
 * ```ts
 * import { createRepositories } from '@/repositories'
 * const repos = createRepositories()
 * const vendor = await repos.vendor.findByMatchKey('マクドナルド')
 * ```
 *
 * 【切り替え方式】
 * - VITE_USE_MOCK=true（デフォルト）: TSファイルからデータ取得
 * - VITE_USE_MOCK=false: Supabaseからデータ取得
 */

import type { Repositories } from '@/repositories/types'
import { createMockRepositories } from './mock'
import { createSupabaseRepositories } from './supabase'

/**
 * Repository群を生成するfactory関数
 *
 * newしない・関数で返す。テスト時はmockReposを直接渡せる。
 * Supabase実装追加時はelse分岐に createSupabaseRepositories() を追加するだけ。
 */
export function createRepositories(): Repositories {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

  if (useMock) {
    return createMockRepositories()
  }

  // フェーズ5: Supabase実装（.envでVITE_USE_MOCK=falseに設定で有効化）
  return createSupabaseRepositories()
}

