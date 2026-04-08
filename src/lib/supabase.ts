/**
 * Supabaseクライアント初期化
 *
 * 環境変数から接続情報を読む。
 * .envにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定する。
 *
 * 【フェーズ5で有効化】
 * 現在はモック運用のため実際には使用されない。
 * Supabase接続時に .env の値を設定するだけで即接続可能。
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * Supabaseクライアント（シングルトン）
 *
 * ⚠️ VITE_SUPABASE_URL が未設定の場合、createClientは空URLで生成される。
 *    モック運用時は呼ばれないので問題ない。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
