/**
 * 認証ユーティリティ（統合版）
 *
 * 開発環境と本番環境の両方で使用できる認証機能を提供します。
 * - 開発環境: 自動ログイン（testAuth.ts の機能を統合）
 * - 本番環境: メール/パスワード、Google認証
 */

import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    type User
} from 'firebase/auth';

/**
 * メール/パスワードでログイン
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
    const auth = getAuth();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[auth] ログインしました:', userCredential.user.email);
        return userCredential.user;
    } catch (error: any) {
        console.error('[auth] ログインエラー:', error);
        throw new Error(`ログインに失敗しました: ${error.message}`);
    }
}

/**
 * Googleアカウントでログイン
 */
export async function signInWithGoogle(): Promise<User> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
        const userCredential = await signInWithPopup(auth, provider);
        console.log('[auth] Googleログインしました:', userCredential.user.email);
        return userCredential.user;
    } catch (error: any) {
        console.error('[auth] Googleログインエラー:', error);
        throw new Error(`Googleログインに失敗しました: ${error.message}`);
    }
}

/**
 * テストユーザーでログイン（開発環境用）
 *
 * 環境変数 VITE_TEST_USER_EMAIL / VITE_TEST_USER_PASSWORD を使用します。
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
export async function signOut(): Promise<void> {
    const auth = getAuth();
    await firebaseSignOut(auth);
    console.log('[auth] ログアウトしました');
}

/**
 * 現在ログイン中のユーザーを取得
 */
export function getCurrentUser(): User | null {
    const auth = getAuth();
    return auth.currentUser;
}

/**
 * 認証状態が変更されたときのコールバックを登録
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const auth = getAuth();
    return firebaseOnAuthStateChanged(auth, callback);
}
