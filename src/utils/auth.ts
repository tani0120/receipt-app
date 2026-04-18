/**
 * 認証ユーティリティ（Supabase Auth版）
 *
 * Firebase Auth から Supabase Auth に移行。
 * 関数シグネチャは既存と互換維持（LoginView.vue等の呼び出し側は変更不要）。
 *
 * 【移行履歴】
 * 2026-04-18: Firebase Auth → Supabase Auth に完全移行
 */

import { getSupabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * メール/パスワードでログイン
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('[auth] ログインエラー:', error.message)
        throw new Error(`ログインに失敗しました: ${error.message}`)
    }

    console.log('[auth] ログインしました:', data.user.email)
    return data.user
}

/**
 * Googleアカウントでログイン
 *
 * Supabase Auth の OAuth2 フロー（リダイレクト方式）を使用。
 * ダッシュボードで Google プロバイダーの設定が必要。
 */
export async function signInWithGoogle(): Promise<User> {
    const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    })

    if (error) {
        console.error('[auth] Googleログインエラー:', error.message)
        throw new Error(`Googleログインに失敗しました: ${error.message}`)
    }

    // OAuth はリダイレクト方式のため、この時点ではユーザー情報は取得できない。
    // リダイレクト後に onAuthStateChange で検知する。
    // 互換性のため、仮のUser objectを返す（リダイレクト前に呼び出し側に制御が戻らない）
    const { data } = await getSupabase().auth.getUser()
    return data.user as User
}

/**
 * Googleログイン後のスタッフマスタ照合
 *
 * onAuthStateChangeで呼び出す。
 * スタッフマスタに登録されていないメールはサインアウトさせる。
 *
 * @param email - ログインユーザーのメールアドレス
 * @param isEmailRegistered - useStaff().isEmailRegistered
 * @returns true: 許可, false: 拒否（サインアウト済み）
 */
export async function validateStaffAccess(
    email: string,
    isEmailRegistered: (email: string) => boolean
): Promise<boolean> {
    if (!email) {
        console.warn('[auth] メールアドレスが空です')
        await getSupabase().auth.signOut()
        return false
    }

    if (!isEmailRegistered(email)) {
        console.warn('[auth] 未登録ユーザー:', email)
        await getSupabase().auth.signOut()
        return false
    }

    console.log('[auth] スタッフマスタ照合OK:', email)
    return true
}

/**
 * テストユーザーでログイン（開発環境用）
 *
 * 環境変数 VITE_TEST_USER_EMAIL / VITE_TEST_USER_PASSWORD を使用。
 */
export async function signInTestUser(): Promise<User> {
    const email = import.meta.env.VITE_TEST_USER_EMAIL
    const password = import.meta.env.VITE_TEST_USER_PASSWORD

    if (!email || !password) {
        throw new Error(
            'テストユーザーの認証情報が設定されていません。\n' +
            '.env.local ファイルに以下を設定してください:\n' +
            'VITE_TEST_USER_EMAIL=test@example.com\n' +
            'VITE_TEST_USER_PASSWORD=your-password'
        )
    }

    return signInWithEmail(email, password)
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
    const { error } = await getSupabase().auth.signOut()
    if (error) {
        console.error('[auth] ログアウトエラー:', error.message)
    }
    console.log('[auth] ログアウトしました')
}

/**
 * 現在ログイン中のユーザーを取得
 */
export function getCurrentUser(): User | null {
    // Supabase の同期アクセス（セッションキャッシュから）
    // 注意: 初回ロード時はnullの場合あり。確実に取得するには getUser() を使用。
    return null // 同期版は非対応。onAuthStateChanged を使用すること。
}

/**
 * 現在ログイン中のユーザーを非同期で取得
 */
export async function getCurrentUserAsync(): Promise<User | null> {
    const { data } = await getSupabase().auth.getUser()
    return data.user
}

/**
 * 認証状態が変更されたときのコールバックを登録
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
        (_event, session) => {
            callback(session?.user ?? null)
        }
    )
    return () => subscription.unsubscribe()
}
