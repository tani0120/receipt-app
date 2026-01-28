/**
 * テストユーザー認証ユーティリティ
 *
 * Firebase Authenticationを使用して、開発・テスト環境でのログインを実現します。
 * 環境変数からテストユーザーの認証情報を読み込み、自動ログインを行います。
 *
 * 【使用方法】
 * ```typescript
 * import { signInTestUser, signOutTestUser, getCurrentUser } from '@/utils/testAuth';
 *
 * // アプリ起動時に自動ログイン
 * await signInTestUser();
 *
 * // 現在のユーザーを取得
 * const user = getCurrentUser();
 *
 * // ログアウト
 * await signOutTestUser();
 * ```
 */

import { getAuth, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';

/**
 * テストユーザーでログイン
 *
 * 環境変数 VITE_TEST_USER_EMAIL / VITE_TEST_USER_PASSWORD を使用します。
 *
 * @throws {Error} 環境変数が設定されていない場合
 * @throws {Error} ログインに失敗した場合
 * @returns {Promise<User>} ログインしたユーザー
 */
export async function signInTestUser(): Promise<User> {
    const auth = getAuth();

    const email = import.meta.env.VITE_TEST_USER_EMAIL;
    const password = import.meta.env.VITE_TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'テストユーザーの認証情報が設定されていません。\n' +
            '.env.local ファイルに以下を設定してください:\n' +
            'VITE_TEST_USER_EMAIL=test@example.com\n' +
            'VITE_TEST_USER_PASSWORD=your-password'
        );
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[testAuth] テストユーザーでログインしました:', userCredential.user.email);
        return userCredential.user;
    } catch (error: any) {
        console.error('[testAuth] ログインエラー:', error);
        throw new Error(`テストユーザーのログインに失敗しました: ${error.message}`);
    }
}

/**
 * ログアウト
 */
export async function signOutTestUser(): Promise<void> {
    const auth = getAuth();
    await signOut(auth);
    console.log('[testAuth] ログアウトしました');
}

/**
 * 現在ログイン中のユーザーを取得
 *
 * @returns {User | null} ログイン中のユーザー、またはnull
 */
export function getCurrentUser(): User | null {
    const auth = getAuth();
    return auth.currentUser;
}

/**
 * 認証状態が変更されたときのコールバックを登録
 *
 * @param callback 認証状態変更時に呼ばれる関数
 * @returns {Function} 登録解除用の関数
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const auth = getAuth();
    return auth.onAuthStateChanged(callback);
}
