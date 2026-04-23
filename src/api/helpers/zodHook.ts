/**
 * zodHook.ts — zValidator共通エラーフック
 *
 * 全ルートのzValidatorで共通使用する。
 * Zodバリデーションエラーを apiError() 経由で統一フォーマットに変換する。
 *
 * 使い方:
 *   import { zodHook } from '@/api/helpers/zodHook'
 *   app.post('/', zValidator('json', schema, zodHook), async (c) => { ... })
 *
 * 効果:
 *   - Zodのデフォルト英語エラーがフロントに漏れるのを防止
 *   - apiMessages.tsの日本語メッセージがZodスキーマに埋め込まれていれば、
 *     その日本語がそのままフロントに返る
 *   - requestIdが自動付与される（apiError経由）
 */

import type { Context } from 'hono'
import { apiError } from './apiError'

/**
 * zValidatorのhook関数。
 * バリデーション失敗時にapiError()で統一フォーマットのJSONを返す。
 *
 * @param result - Zodのparse結果（success: boolean）
 * @param c - Honoコンテキスト
 */
export function zodHook(
  result: { success: boolean; error?: { issues: { message: string }[] } },
  c: Context,
) {
  if (!result.success) {
    const messages = result.error?.issues.map((i) => i.message) ?? []
    const message = messages.join('\n') || '不正なリクエストです'
    return apiError(c, 400, message)
  }
}
