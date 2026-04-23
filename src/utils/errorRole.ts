/**
 * errorRole.ts — ロール別エラー表示の判定関数
 *
 * Supabase移行後: getErrorRole() の中身を app_metadata.role に差し替えるだけ。
 * 呼び出し元（エラーページコンポーネント）は変更不要。
 */

export type ErrorRole = 'third_party' | 'client' | 'staff';

/**
 * 現在のユーザーのエラー表示用ロールを判定する。
 *
 * 暫定判定ロジック:
 *   1. Supabase Auth JWT有り → staff
 *   2. localStorage guest_google_* 有り → client
 *   3. どちらもなし → third_party
 *
 * Supabase移行後:
 *   app_metadata.role === 'staff' | 'client' | null で判定に置換。
 */
export async function getErrorRole(): Promise<ErrorRole> {
  // 1. スタッフJWTチェック
  try {
    const { getCurrentUserAsync } = await import('@/utils/auth');
    const user = await getCurrentUserAsync();
    if (user) return 'staff';
  } catch {
    // auth未初期化の場合は続行
  }

  // 2. ゲスト認証チェック（localStorage）
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('guest_google_')) return 'client';
  }

  // 3. どちらもなし → 第三者
  return 'third_party';
}
