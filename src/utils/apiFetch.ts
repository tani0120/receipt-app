/**
 * apiFetch.ts — 共通fetchラッパー（エラー種別で分岐）
 *
 * 使い方:
 *   import { useApiFetch } from '@/utils/apiFetch'
 *
 *   const { apiFetch } = useApiFetch()
 *
 *   // パターン1: 成功時のみ処理（400系エラーも自動遷移でOKな場合）
 *   const data = await apiFetch('/api/clients')
 *   if (!data) return  // エラーページに遷移済み
 *
 *   // パターン2: 400系バリデーションエラーをUIに表示する場合
 *   const { data, error } = await apiFetch.withError('/api/staff', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name, email }),
 *   })
 *   if (error) {
 *     // 400系: ページ遷移しない。呼び出し元でインライン表示
 *     toastMessage.value = error.メッセージ  // ← 「名前は必須です」
 *     return
 *   }
 *
 * Supabase移行時もこのファイルは変更不要。
 */

import { useRouter } from 'vue-router'
import { normalizeHttpError, type AppError } from '@/utils/normalizeHttpError'

/**
 * composable: Vueコンポーネントのsetup()内で呼び出す。
 * routerを自動取得して内部で保持する。
 */
export function useApiFetch() {
  const router = useRouter()

  /**
   * fetchのラッパー（シンプル版）。
   * 全エラーでエラーページに自動遷移する。バリデーション表示不要な場合に使う。
   *
   * @returns JSON解析結果。エラー時は null（遷移済み）。
   */
  async function apiFetch<T = unknown>(url: string, opts?: RequestInit): Promise<T | null> {
    const { data, error } = await apiFetchWithError<T>(url, opts)
    if (error) {
      // 400系含め全エラーでエラーページに遷移
      エラーページへ遷移(error)
      return null
    }
    return data
  }

  /**
   * fetchのラッパー（エラー分岐版）。
   * - 401 → /loginに自動遷移。{ data: null, error } を返す
   * - 404/500/502/503 → /404エラーページに自動遷移。{ data: null, error } を返す
   * - 400系 → ページ遷移しない。{ data: null, error } を返す（呼び出し元でUI表示）
   * - 成功 → { data, error: null } を返す
   */
  async function apiFetchWithError<T = unknown>(
    url: string,
    opts?: RequestInit,
  ): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const res = await fetch(url, opts)

      if (!res.ok) {
        const appError = await normalizeHttpError(res)

        // 401: ログインページに遷移
        if (res.status === 401) {
          router.push({ path: '/login', query: { redirect: url } })
          return { data: null, error: appError }
        }

        // 404/500/502/503: エラーページに遷移
        if (res.status >= 500 || res.status === 404) {
          エラーページへ遷移(appError)
          return { data: null, error: appError }
        }

        // 400系（バリデーション等）: ページ遷移しない。呼び出し元に返す
        return { data: null, error: appError }
      }

      return { data: await res.json() as T, error: null }
    } catch (err) {
      // ネットワークエラー等（サーバー到達不能）
      console.error('[apiFetch] ネットワークエラー:', err)
      const ネットワークエラー: AppError = {
        コード: 0,
        メッセージ: 'サーバーに接続できません',
        パス: url,
        リクエストID: '-',
      }
      エラーページへ遷移(ネットワークエラー)
      return { data: null, error: ネットワークエラー }
    }
  }

  /**
   * 内部: /404 にquery params付きで遷移。
   */
  function エラーページへ遷移(エラー: AppError): void {
    router.push({
      path: '/404',
      query: {
        code: String(エラー.コード),
        message: エラー.メッセージ,
        path: エラー.パス,
        requestId: エラー.リクエストID,
      },
    })
  }

  // apiFetch にwithErrorメソッドを付与
  apiFetch.withError = apiFetchWithError

  return { apiFetch }
}
