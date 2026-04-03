/**
 * vendorIdentification.ts — T-N1a/T-N1b: 取引先特定ユーティリティ
 *
 * 取引先特定4層のうち Layer 1〜3 の TS ロジック。
 *   Layer 1: T番号マッチ（T+13桁完全一致）
 *   Layer 2: 電話番号マッチ（正規化+バリデーション+前方一致）
 *   Layer 3: 取引先名マッチ（正規化後一致）← T-N1c で後日実装
 *   Layer 4: Geminiフォールバック ← パイプラインロジック側
 *
 * T-P3 round2 実測結果:
 *   T番号: 32/32 = 100%
 *   電話:  23/32 = 72% ← バリデーションで改善対象
 *   名称:  30/32 = 94%
 *   VV:    28/32 = 88%
 *
 * 電話番号の問題（T-P3実測）:
 *   1. レシート折れで1桁欠損 → Geminiがそのまま返す → 桁数バリデーションで弾く
 *   2. 自社電話番号を読んでしまう → パイプライン側で自社電話を除外（別ロジック）
 */

// ============================================================
// § T-N1a: T番号（インボイス番号）の抽出・検証
// ============================================================

/** T番号の正規パターン: T + 数字13桁 */
const T_NUMBER_PATTERN = /^T\d{13}$/;

/**
 * T番号をバリデーションする。
 * 正規パターン（T+13桁）に合致すればそのまま返し、不正ならnullを返す。
 *
 * @example
 * validateTNumber('T3010403065640') // → 'T3010403065640'
 * validateTNumber('T301040306564')  // → null（12桁しかない）
 * validateTNumber('3010403065640')  // → null（Tプレフィックスなし）
 * validateTNumber(null)             // → null
 */
export function validateTNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return T_NUMBER_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * OCR/Gemini出力からT番号を抽出する。
 * 文字列中に T+13桁 のパターンがあれば抽出して返す。
 *
 * @example
 * extractTNumber('登録番号 T3010403065640') // → 'T3010403065640'
 * extractTNumber('T番号なし')                // → null
 */
export function extractTNumber(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/T\d{13}/);
  return match ? match[0] : null;
}

// ============================================================
// § T-N1b: 電話番号の正規化・バリデーション
// ============================================================

/**
 * 電話番号を正規化する。
 * ハイフン・スペース・括弧を除去し、全角数字を半角に変換する。
 *
 * @example
 * normalizePhone('03-1234-5678')   // → '0312345678'
 * normalizePhone('０３１２３４５６７８') // → '0312345678'
 * normalizePhone('(072) 222-1234') // → '0722221234'
 * normalizePhone(null)              // → null
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const phone = raw
    // 全角数字 → 半角数字
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // ハイフン・スペース・括弧・ドットを除去
    .replace(/[-\s().・　]/g, '')
    // 先頭の +81 を 0 に置換（国際番号対応）
    .replace(/^\+81/, '0');

  // 数字以外が含まれていたらnull
  if (!/^\d+$/.test(phone)) return null;

  return phone;
}

/**
 * 正規化済み電話番号をバリデーションする。
 * 日本の電話番号は10桁（固定電話）または11桁（携帯電話）。
 * それ以外はnullを返す。
 *
 * T-P3 round2 で発見: レシート折れで9桁の電話番号を Gemini が返すケース。
 * このバリデーションで弾く。
 *
 * @example
 * validatePhone('0312345678')  // → '0312345678'（10桁 → OK）
 * validatePhone('09012345678') // → '09012345678'（11桁 → OK）
 * validatePhone('031234567')   // → null（9桁 → NG）
 * validatePhone('031234567890')// → null（12桁 → NG）
 * validatePhone(null)          // → null
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  if (normalized.length !== 10 && normalized.length !== 11) return null;
  return normalized;
}

/**
 * 電話番号の前方一致マッチ。
 * 過去仕訳DBの電話番号リストに対して前方一致で候補を返す。
 *
 * 用途: 市外局番の一部が一致 → 同一地域の取引先候補の絞り込み。
 * 現時点では仕組みだけ。DB接続は過去仕訳DB完成後。
 *
 * @param phone - 正規化済み電話番号（10桁/11桁）
 * @param knownPhones - 既知の電話番号リスト（vendors_masterから取得）
 * @param minPrefixLength - 最小一致桁数（デフォルト6桁 = 市外局番+局番）
 * @returns マッチした電話番号の配列（完全一致を優先、前方一致は候補として返す）
 *
 * @example
 * matchPhonePrefix('0722221234', ['0722221234', '0722225678', '0312345678'])
 * // → { exact: '0722221234', prefixMatches: ['0722225678'] }
 */
export function matchPhonePrefix(
  phone: string | null,
  knownPhones: string[],
  minPrefixLength: number = 6,
): { exact: string | null; prefixMatches: string[] } {
  if (!phone) return { exact: null, prefixMatches: [] };

  const validated = validatePhone(phone);
  if (!validated) return { exact: null, prefixMatches: [] };

  // 完全一致を優先
  const exact = knownPhones.find(p => p === validated) ?? null;
  if (exact) return { exact, prefixMatches: [] };

  // 前方一致（市外局番+局番レベル）
  const prefix = validated.substring(0, minPrefixLength);
  const prefixMatches = knownPhones.filter(
    p => p.startsWith(prefix) && p !== validated,
  );

  return { exact: null, prefixMatches };
}

// ============================================================
// § T-N1c: 取引先名の正規化（スケルトン。T-P3結果確定後に実装）
// ============================================================

/**
 * 取引先名を正規化する。
 * 全角→半角、法人格除去、空白除去。
 *
 * TODO: T-P3結果を踏まえて詳細ルールを実装。
 *
 * @example
 * normalizeVendorName('株式会社 ＬＤＩデジタル') // → 'ldiデジタル'
 * normalizeVendorName('（有）田中商事')          // → '田中商事'
 */
export function normalizeVendorName(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const name = raw
    // 全角英数 → 半角
    .replace(/[Ａ-Ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // 法人格を除去
    .replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '')
    .replace(/[（(]株[)）]|[（(]有[)）]|[（(]合[)）]/g, '')
    // 空白・全角スペースを除去
    .replace(/[\s　]+/g, '')
    // 小文字化
    .toLowerCase()
    .trim();

  return name || null;
}
