import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase環境変数が設定されていません。.env.localを確認してください。');
}

// 遅延初期化: Supabase不要なルート（pipeline等）でもサーバー起動を可能にする
let _client: SupabaseClient | null = null;

/**
 * Supabaseクライアントを取得する（遅延初期化）。
 * SUPABASE_URL未設定の場合はErrorをthrow。
 */
export function getSupabase(): SupabaseClient {
    if (!_client) {
        if (!supabaseUrl) {
            throw new Error('SUPABASE_URL が未設定です。Supabase機能は利用できません。');
        }
        _client = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _client;
}

// 後方互換: 既存コードが import { supabase } している箇所用
// ※ 初回アクセス時に初期化。URL未設定なら即エラー。
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return Reflect.get(getSupabase(), prop);
    },
});
