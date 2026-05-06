/**
 * Supabaseクライアント初期化（遅延方式）
 *
 * 環境変数から接続情報を読む。
 * .envにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定する。
 *
 * 【重要】モック運用時（VITE_USE_MOCK=true）は呼ばれないが、
 * importチェーン（repositories/index.ts → supabase/index.ts → supabase.ts）で
 * モジュールレベルのcreateClientが即実行されるためエラーになる。
 * → 遅延初期化で回避。実際に使う時だけcreateClientを呼ぶ。
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

/**
 * Supabaseクライアント取得（遅延初期化・シングルトン）
 *
 * VITE_SUPABASE_URL が未設定の場合はエラーを投げる。
 * モック運用時はこの関数が呼ばれないので安全。
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error(
        '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。' +
        '.env.local に設定してください。モック運用なら VITE_USE_MOCK=true を確認してください。'
      )
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

