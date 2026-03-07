import type { JournalEntry, JournalLine } from '@/types/journal';

/**
 * CSV物理制約検証サービス
 *
 * Phase 1: MFのみ実装
 *
 * 目的:
 * - CSV出力前に物理制約（文字数、形式等）をチェック
 * - エラーを事前に検出し、インポート失敗を防ぐ
 */
export class CsvValidator {

  /**
   * MF クラウドの制約チェック
   *
   * 制約:
   * - 摘要欄: 全角200文字以内
   * - 取引先: 全角50文字以内
   * - 日付: YYYY/MM/DD形式
   * - 文字コード: Shift-JIS（後続処理で変換）
   */
  static validateMF(entry: JournalEntry): void {
    // 1. 摘要欄: 全角200文字以内
    if (entry.description && entry.description.length > 200) {
      throw new Error(
        `[MF制約] 摘要欄は全角200文字以内（現在: ${entry.description.length}文字）`
      );
    }

    // 2. 取引先: 全角50文字以内
    if (entry.lines) {
      entry.lines.forEach((line: JournalLine, index: number) => {
        if (line.vendorName && line.vendorName.length > 50) {
          throw new Error(
            `[MF制約] 行${index + 1}の取引先は全角50文字以内（現在: ${line.vendorName.length}文字）`
          );
        }
      });
    }

    // 3. 日付: YYYY-MM-DD または YYYY/MM/DD形式
    if (entry.date) {
      const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
      if (!datePattern.test(entry.date)) {
        throw new Error(
          `[MF制約] 日付形式が不正: ${entry.date}（正しい形式: YYYY-MM-DD または YYYY/MM/DD）`
        );
      }
    }
  }

  /**
   * 摘要欄を指定文字数に切り詰め
   *
   * @param description 摘要文字列
   * @param maxLength 最大文字数
   * @returns 切り詰められた摘要
   */
  static truncateDescription(description: string, maxLength: number): string {
    if (!description) return '';

    if (description.length <= maxLength) {
      return description;
    }

    // 3文字分を省略記号用に確保
    return description.substring(0, maxLength - 3) + '...';
  }

  /**
   * Shift-JIS変換可能かチェック
   *
   * 一部の文字（①②③等）はShift-JISで表現できないため警告
   */
  static checkShiftJISCompatibility(text: string): { compatible: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Shift-JISで表現できない可能性がある文字パターン
    const problematicPatterns = [
      { pattern: /[①②③④⑤⑥⑦⑧⑨⑩]/g, name: '丸数字' },
      { pattern: /[㈱㈲㈻]/g, name: '丸括弧付き漢字' },
      { pattern: /[♠♣♥♦]/g, name: '記号' },
    ];

    problematicPatterns.forEach(({ pattern, name }) => {
      const matches = text.match(pattern);
      if (matches) {
        warnings.push(`${name}が含まれています: ${matches.join(', ')}`);
      }
    });

    return {
      compatible: warnings.length === 0,
      warnings
    };
  }

  /**
   * Phase 2: Freee形式の制約チェック
   */
  static validateFreee(_entry: any): void {  // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    // Phase 2で実装予定
    throw new Error('validateFreee() はPhase 2で実装予定');
  }

  /**
   * Phase 2: 弥生形式の制約チェック
   */
  static validateYayoi(_entry: any): void {  // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    // Phase 2で実装予定

    // 参考: 弥生の制約
    // - 摘要欄: 全角32文字（CSV取込時は80文字可）
    // - 勘定科目名: 全角12文字

    throw new Error('validateYayoi() はPhase 2で実装予定');
  }
}
