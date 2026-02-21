import { ref } from 'vue'

/**
 * 現在のユーザー情報を提供するComposable
 *
 * Phase A: ドロップダウン選択値を返す（固定リスト）
 * Phase B TODO: supabase.auth.getUser() に差し替え
 *
 * ```typescript
 * // Phase B: Supabase認証に差し替え
 * export function useCurrentUser() {
 *   const userName = ref("")
 *   onMounted(async () => {
 *     const { data: { user } } = await supabase.auth.getUser()
 *     userName.value = user?.user_metadata?.full_name ?? "不明"
 *   })
 *   return { userName, staffList }
 * }
 * ```
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
