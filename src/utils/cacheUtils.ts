/**
 * cacheUtils — Piniaストア共通キャッシュユーティリティ
 *
 * 全persistストアで共通のキャッシュ有効期限判定を提供。
 * 各ストアにコピペしない。
 *
 * 準拠: master_accounts_analysis Phase 0-3
 */

/** キャッシュ有効期限のデフォルト値（5分） */
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000

/**
 * キャッシュが期限切れかどうかを判定する
 *
 * @param cachedAt キャッシュ取得時刻（Date.now()値）。nullの場合は常にtrue
 * @param maxAgeMs キャッシュ有効期限（ミリ秒）。デフォルト5分
 * @returns 期限切れならtrue
 */
export function isCacheExpired(cachedAt: number | null, maxAgeMs = DEFAULT_MAX_AGE_MS): boolean {
  return !cachedAt || (Date.now() - cachedAt) > maxAgeMs
}
