/**
 * typeGuards.ts — 共通型ガード関数
 *
 * unknown → 具体型へのナロウイングを型安全に行うための型ガード集。
 * `as Record<string, unknown>` キャストの代替として使用する。
 *
 * 準拠: as キャスト監査方針
 */

/**
 * unknown を Record<string, unknown> に安全にナロウイングする型ガード。
 *
 * `typeof v === 'object' && v !== null` と等価だが、
 * TypeScript が `Record<string, unknown>` として認識するため
 * `as Record<string, unknown>` キャストが不要になる。
 *
 * @example
 * ```ts
 * // ❌ キャスト（危険）
 * const obj = value as Record<string, unknown>
 *
 * // ✅ 型ガード（安全）
 * if (isRecord(value)) {
 *   value.someKey // Record<string, unknown> として使える
 * }
 * ```
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
