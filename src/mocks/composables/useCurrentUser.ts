import { ref } from 'vue'

/**
 * 現在のユーザー情報を提供するComposable
 *
 * Phase A: ドロップダウン選択値を返す（固定リスト）
 * Phase B: supabase.auth.getUser() に差し替え予定
 *   → 認証基盤はSupabase Authに移行済み（src/utils/auth.ts）
 *   → 画面仕様確定後に実装
 */

/** スタッフ一覧（Phase A: 固定リスト） */
export const STAFF_LIST = ['山田太郎', '佐藤花子', '鈴木一郎'] as const

export function useCurrentUser() {
    const userName = ref<string>(STAFF_LIST[0])

    return {
        userName,
        staffList: STAFF_LIST,
    }
}
