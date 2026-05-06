/**
 * MF CSV日付フォーマット変換ユーティリティ
 *
 * 目的: 内部ISO 8601（YYYY-MM-DD）→ MF CSVフォーマット（yyyy/MM/dd）変換
 * 準拠: MFクラウド会計 仕訳CSVインポート仕様
 *
 * MF許容フォーマット:
 *   - yyyy/MM/dd（推奨。最も安定）
 *   - yyyy年MM月dd日（日本語表記、認識可能）
 *   - 令和yy年MM月dd日（和暦、認識可能）
 *
 * 本システムの方針:
 *   - 内部: ISO 8601（YYYY-MM-DD）で保持
 *   - CSV出力時: yyyy/MM/dd に変換
 *   - nullの場合: 空文字を出力（MF側でエラーになる。事前警告で対応）
 *
 * 更新日: 2026-03-04
 */

/**
 * ISO 8601日付文字列をMF CSV形式に変換
 *
 * @param isoDate ISO 8601形式の日付（例: '2025-01-20'）またはnull
 * @returns MF CSV形式の日付（例: '2025/01/20'）。nullの場合は空文字
 *
 * @example
 * toMfCsvDate('2025-01-20')  // '2025/01/20'
 * toMfCsvDate(null)           // ''
 * toMfCsvDate('2025-12-31')  // '2025/12/31'
 */
export function toMfCsvDate(isoDate: string | null): string {
    if (isoDate === null || isoDate === '') {
        return '';
    }

    // ISO 8601: YYYY-MM-DD → yyyy/MM/dd
    return isoDate.replace(/-/g, '/');
}

/**
 * MF CSV形式の日付をISO 8601に変換（インポート時用・将来用）
 *
 * @param mfDate MF CSV形式の日付（例: '2025/01/20'）
 * @returns ISO 8601形式の日付（例: '2025-01-20'）。空文字の場合はnull
 */
export function fromMfCsvDate(mfDate: string): string | null {
    if (mfDate === '') {
        return null;
    }

    return mfDate.replace(/\//g, '-');
}

/**
 * 日付文字列のフォーマット検証（ISO 8601）
 *
 * @param dateStr 検証する日付文字列
 * @returns 有効なISO 8601日付であればtrue
 */
export function isValidIsoDate(dateStr: string | null): boolean {
    if (dateStr === null) return true; // nullは許可（nullable）
    // YYYY-MM-DD 形式チェック
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    // 実在する日付かチェック
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}
