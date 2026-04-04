/**
 * validation.ts — T番号・電話番号バリデーション・正規化ユーティリティ
 *
 * 目的: パイプライン全体で使用する入力値検証・正規化関数を集約する
 * 配置根拠: ユーティリティ関数のためtypes/ではなくutils/pipeline/に配置
 *
 * 【既存実装との関係】
 *   vendorIdentification.ts に Layer 1〜2 の取引先特定ロジックが実装済み。
 *   本ファイルは以下の責務を担う:
 *     - 既存関数の boolean ラッパー（E-1）
 *     - 既存関数の alias re-export（E-2）
 *     - 未実装のT番号正規化（E-3: Tプレフィックス付与）
 *
 * 変更履歴:
 *   2026-04-05: E-1〜E-3 新規作成
 */

import {
  validateTNumber,
  normalizePhone,
  validatePhone,
} from './vendorIdentification'

// 再エクスポート: vendorIdentification.ts の主要関数を validation.ts 経由でも使えるようにする
export { validateTNumber, normalizePhone, validatePhone }

// ============================================================
// § E-1: isValidTNumber — T番号バリデーション boolean ラッパー
// ============================================================

/** T番号の正規パターン内部定数（T + 数字13桁 = 合計14文字） */
const T_NUMBER_RE = /^T\d{13}$/

/**
 * E-1: T番号（適格請求書発行事業者登録番号）の形式検証（boolean版）
 *
 * vendorIdentification.ts の validateTNumber() の boolean ラッパー。
 * パイプライン内の条件分岐用に boolean 型で返す。
 *
 * @param s - 検証対象の文字列
 * @returns true: 正規パターン（T+13桁）に合致 / false: 不正
 *
 * @example
 * isValidTNumber('T1234567890123')  // → true
 * isValidTNumber('T12345')          // → false（桁数不足）
 * isValidTNumber('1234567890123')   // → false（Tプレフィックスなし）
 * isValidTNumber('')                // → false
 */
export function isValidTNumber(s: string): boolean {
  return T_NUMBER_RE.test(s.trim())
}

// ============================================================
// § E-2: normalizePhoneNumber — 電話番号正規化（alias）
// ============================================================

/**
 * E-2: 電話番号の正規化と桁数バリデーション
 *
 * vendorIdentification.ts の normalizePhone() + validatePhone() の統合版。
 * 正規化後に10桁/11桁でなければ null を返す。
 *
 * 処理内容:
 *   - 全角数字 → 半角数字
 *   - ハイフン・スペース・括弧・ドットを除去
 *   - +81 → 0 に置換（国際番号対応）
 *   - 10桁（固定電話）または11桁（携帯電話）以外は null
 *
 * @param s - 入力電話番号（生文字列）
 * @returns 正規化済み10/11桁数字文字列 | null（不正な場合）
 *
 * @example
 * normalizePhoneNumber('03-1234-5678')   // → '0312345678'
 * normalizePhoneNumber('090-1234-5678')  // → '09012345678'
 * normalizePhoneNumber('031234567')      // → null（9桁 → NG）
 * normalizePhoneNumber(null)             // → null
 */
export function normalizePhoneNumber(s: string | null | undefined): string | null {
  return validatePhone(s)
}

// ============================================================
// § E-3: normalizeTNumber — T番号正規化（Tプレフィックス補完）
// ============================================================

/** T番号抽出・正規化用パターン（Tあり・なし両方） */
const T_NUMBER_EXTRACT_RE = /T?(\d{13})/

/**
 * E-3: T番号の正規化（Tプレフィックス補完）
 *
 * スペース・ハイフンを除去し、Tプレフィックスがなければ補完する。
 * 13桁の数字が存在しない場合は null を返す。
 *
 * vendorIdentification.ts の validateTNumber() とは異なり、
 * Tプレフィックスなしの入力（Gemini出力などで欠落する場合がある）を補完する。
 *
 * @param s - 入力T番号（Tあり・なし両方を受け入れる）
 * @returns 正規化済みT番号（T+13桁） | null（13桁の数字が存在しない場合）
 *
 * @example
 * normalizeTNumber('T1234567890123')  // → 'T1234567890123'（そのまま返す）
 * normalizeTNumber('1234567890123')   // → 'T1234567890123'（Tを補完）
 * normalizeTNumber('T-1234567890123') // → 'T1234567890123'（ハイフン除去）
 * normalizeTNumber(' T 1234567890123') // → 'T1234567890123'（スペース除去）
 * normalizeTNumber('T12345')          // → null（13桁ない）
 * normalizeTNumber('')                // → null
 */
export function normalizeTNumber(s: string | null | undefined): string | null {
  if (!s) return null

  // スペース・ハイフン・その他区切り文字を除去
  const cleaned = s.replace(/[\s\-\u30FB・　]/g, '')

  // T+13桁 または 13桁 のパターンを抽出
  const match = cleaned.match(T_NUMBER_EXTRACT_RE)
  if (!match) return null

  // 13桁の数字部分を取得してTプレフィックスを付与
  const digits = match[1]
  if (digits.length !== 13) return null

  return `T${digits}`
}
