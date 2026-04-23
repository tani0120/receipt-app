/**
 * apiError.ts — サーバー側共通エラーレスポンスヘルパー（Hono）
 *
 * ★設計方針★
 *
 * レスポンスJSON:
 *   { error: "安全な定型文", requestId: "f7e2d9a4" }
 *
 * - error:     安全な文面のみ（apiMessages.tsのマスターから取得）
 * - requestId: サーバーログ検索キー
 *
 * 生エラー（APIキー・スタックトレース等）はサーバーログにのみ出力。
 * フロントには一切返さない。
 *
 * スタッフの役割:
 *   エラーコード + パス + リクエストID + 発生日時 + 安全な文面をコピーして管理者に通知
 *
 * 管理者の役割:
 *   リクエストIDでサーバーログを検索 → 生エラー・スタックトレースを確認して修復
 *
 * apiError():      バリデーション・404用（安全な文面を開発者が指定）
 * apiCatchError(): catch節用（生エラーはサーバーログのみ。フロントには定型文）
 */

import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ステータスから文面 } from './apiMessages'

/**
 * 統一エラーレスポンスを返す（バリデーション・404等）。
 *
 * @param c - Honoのコンテキスト
 * @param status - HTTPステータスコード
 * @param message - エラーメッセージ（安全な文言。apiMessages.tsから取得）
 */
export function apiError(c: Context, status: number, message: string) {
  const requestId = c.get('requestId') || '-'
  console.error(`[${requestId}] ERROR ${status}: ${message}`)
  return c.json({ error: message, requestId }, status as ContentfulStatusCode)
}

/**
 * catch節専用エラーレスポンス。
 *
 * 生エラーはサーバーログにのみ出力し、フロントにはステータスコードに
 * 紐づいた定型文を返す。管理者はリクエストIDでサーバーログを検索して
 * エラーを特定する。
 *
 * @param c - Honoのコンテキスト
 * @param err - catchしたエラーオブジェクト
 * @param status - HTTPステータスコード（デフォルト500）
 */
export function apiCatchError(c: Context, err: unknown, status: number = 500) {
  const requestId = c.get('requestId') || '-'
  const raw = err instanceof Error ? err.message : String(err)
  // 生エラーはサーバーログにのみ出力（フロントには返さない）
  console.error(`[${requestId}] CATCH ${status}: ${raw}`)
  if (err instanceof Error && err.stack) {
    console.error(`[${requestId}] STACK: ${err.stack}`)
  }
  // フロントにはステータスコードに紐づいた定型文のみ
  const message = ステータスから文面(status)
  return c.json({ error: message, requestId }, status as ContentfulStatusCode)
}

