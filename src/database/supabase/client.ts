import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase環境変数が設定されていません。.env.localを確認してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
