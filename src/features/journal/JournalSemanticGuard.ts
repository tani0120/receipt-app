/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【型安全性ルール - AI必須遵守事項】
 *
 * ❌ 禁止事項（6項目）- NEVER DO THESE:
 * 1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
 * 2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
 * 3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
 * 4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
 * 5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
 * 6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT
 *
 * ✅ 許可事項（3項目）- ALLOWED:
 * 1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
 * 2. unknown型の使用（型ガードと組み合わせて）
 * 3. 必要最小限の型定義（Pick<T>, Omit<T>等）
 *
 * 詳細: complete_evidence_no_cover_up.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { JournalEntry } from './JournalEntrySchema';

/**
 * 仕訳データのビジネスルール検証
 *
 * 【検証項目】
 * 1. 二重記帳（借方合計 = 貸方合計）
 * 2. 各行のdebit/credit相互排他性
 * 3. 税額の最終値確定チェック
 */
export class JournalSemanticGuard {

  /**
   * 二重記帳の検証
   * 借方合計 = 貸方合計
   */
  static validateDoubleEntry(entry: JournalEntry): void {
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(
        `二重記帳が成立していません。借方合計: ${totalDebit}, 貸方合計: ${totalCredit}`
      );
    }
  }

  /**
   * 各行の debit/credit 相互排他性チェック
   *
   * ルール:
   * - debit と credit は同時に値を持てない
   * - debit または credit のいずれかに値が必要
   */
  static validateLineMutualExclusivity(entry: JournalEntry): void {
    for (const line of entry.lines) {
      if (line.debit !== 0 && line.credit !== 0) {
        throw new Error(
          `行 "${line.accountName}": debit と credit は同時に値を持てません`
        );
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new Error(
          `行 "${line.accountName}": debit または credit のいずれかに値が必要です`
        );
      }
    }
  }

  /**
   * 税額の最終値チェック
   *
   * ルール:
   * - taxType が 'none' 以外であれば、taxAmountFinal が確定している必要がある
   */
  static validateTaxAmountFinal(entry: JournalEntry): void {
    for (const line of entry.lines) {
      if (line.taxType !== 'none' && (line.taxAmountFinal === undefined || line.taxAmountFinal === null)) {
        throw new Error(
          `行 "${line.accountName}": taxAmountFinal が確定していません`
        );
      }
    }
  }

  /**
   * 総合検証
   * すべてのビジネスルールを実行
   */
  static validate(entry: JournalEntry): void {
    this.validateLineMutualExclusivity(entry);
    this.validateDoubleEntry(entry);
    this.validateTaxAmountFinal(entry);
  }

  /**
   * 重複検知用ハッシュを生成
   *
   * @param entry 仕訳エントリ
   * @returns ハッシュ文字列（日付+金額+摘要+顧問先コード）
   */
  static generateDuplicateHash(entry: JournalEntry): string {
    const hashSource = `${entry.date}_${entry.totalAmount}_${entry.description}_${entry.clientCode}`;
    // 簡易ハッシュ（実装時は crypto.createHash() 等を使用）
    return hashSource;
  }

  /**
   * 会計期間外チェック
   *
   * @param entryDate 仕訳日付（YYYY-MM-DD）
   * @param fiscalMonth 決算月（1-12）
   * @returns 期間外かどうか
   */
  static validateAccountingPeriod(
    entryDate: string,
    fiscalMonth: number
  ): {
    isOutOfPeriod: boolean;
    reason?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  } {
    const date = new Date(entryDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;  // 0-indexed → 1-indexed

    // 会計期間を計算
    // 例: 決算月=3月 → 2025/04/01 - 2026/03/31
    let periodStartYear = year;
    let periodStartMonth = fiscalMonth + 1;

    if (periodStartMonth > 12) {
      periodStartMonth = 1;
      periodStartYear--;
    }

    // 仕訳日付が会計期間内かチェック
    if (month < periodStartMonth && month <= fiscalMonth) {
      // 例: 決算月=3月、仕訳日=2026/02/01 → 当期
      return { isOutOfPeriod: false };
    } else if (month >= periodStartMonth || month <= fiscalMonth) {
      // 例: 決算月=3月、仕訳日=2026/04/01 → 当期
      return { isOutOfPeriod: false };
    } else {
      // 期間外
      const periodStart = `${periodStartYear}-${String(periodStartMonth).padStart(2, '0')}-01`;
      const periodEnd = `${year}-${String(fiscalMonth).padStart(2, '0')}-31`;

      return {
        isOutOfPeriod: true,
        reason: month > fiscalMonth ? '次期の日付' : '前期の日付',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd
      };
    }
  }
}
