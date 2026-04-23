/**
 * handleApiError.ts — 共通エラーハンドラー本体
 *
 * このファイルはSupabase移行前後で変更不要。
 * 差し替えるのは normalizeHttpError.ts / errorRole.ts の中身のみ。
 */

import type { Router } from 'vue-router';
import { normalizeHttpError, type AppError } from '@/utils/normalizeHttpError';

/**
 * fetchレスポンスのエラーを処理して /404 ページに遷移する。
 *
 * @param router - Vue Router インスタンス（useRouter()から取得）
 * @param res - fetchのResponseオブジェクト（res.ok === false のもの）
 *
 * 使い方（各画面のsetup内）:
 *   const router = useRouter();
 *   const res = await fetch('/api/xxx');
 *   if (!res.ok) return handleApiError(router, res);
 */
export async function handleApiError(router: Router, res: Response): Promise<void> {
  const エラー = await normalizeHttpError(res);
  エラーページへ遷移(router, エラー);
}

/**
 * 任意のAppErrorオブジェクトから /404 ページに遷移する。
 * Supabase移行後に normalizeSupabaseError() と組み合わせて使う。
 */
export function handleAppError(router: Router, エラー: AppError): void {
  エラーページへ遷移(router, エラー);
}

/**
 * 内部: /404 にquery params付きで遷移。
 * ロール判定はMockNotFoundPage.vue側でgetErrorRole()が行う。
 */
function エラーページへ遷移(router: Router, エラー: AppError): void {
  router.push({
    path: '/404',
    query: {
      code: String(エラー.コード),
      message: エラー.メッセージ,
      path: エラー.パス,
      requestId: エラー.リクエストID,
    },
  });
}
