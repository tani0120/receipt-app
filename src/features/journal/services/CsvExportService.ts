import type { JournalEntry } from '../JournalEntrySchema';
import type { Client } from '@/features/client';
import { TaxCodeMapper } from './TaxCodeMapper';
import { CsvValidator } from './CsvValidator';

/**
 * CSV出力サービス
 *
 * Phase 1: MF クラウドのみ実装
 * Phase 2: Freee、弥生を追加
 */
export class CsvExportService {

  /**
   * MF クラウド用CSV出力
   *
   * @param journalEntries 仕訳エントリの配列
   * @param client 顧問先情報
   * @returns CSV Blob（Shift-JIS）
   */
  static async exportToMF(
    journalEntries: JournalEntry[],
    client: Client
  ): Promise<Blob> {

    // 1. 制約チェック
    journalEntries.forEach(entry => {
      CsvValidator.validateMF(entry);
    });

    // 2. CSV行データを生成
    const rows = journalEntries.flatMap(entry => {
      // 複合仕訳の場合、借方×貸方の組み合わせでCSV行を生成
      const debitLines = entry.lines.filter(l => l.debit > 0);
      const creditLines = entry.lines.filter(l => l.credit > 0);

      return debitLines.flatMap(debitLine => {
        return creditLines.map(creditLine => {
          // 税区分変換
          const { taxCode: debitTax, invoiceFlag: debitInvoice } =
            TaxCodeMapper.toMF(debitLine.taxCode, debitLine.invoiceDeduction);
          const { taxCode: creditTax, invoiceFlag: creditInvoice } =
            TaxCodeMapper.toMF(creditLine.taxCode, creditLine.invoiceDeduction);

          return {
            '取引No': entry.id,
            '取引日': entry.date.replace(/-/g, '/'),  // YYYY-MM-DD → YYYY/MM/DD
            '借方勘定科目': debitLine.accountName,
            '借方補助科目': debitLine.subAccount || '',
            '借方部門': '',
            '借方取引先': debitLine.vendorName || '',  // 正規化済み
            '借方税区分': debitTax,
            '借方インボイス': debitInvoice,
            '借方金額(円)': debitLine.debit,
            '借方税額': 0,  // 税込経理なので0
            '貸方勘定科目': creditLine.accountName,
            '貸方補助科目': creditLine.subAccount || '',
            '貸方部門': '',
            '貸方取引先': creditLine.vendorName || '',
            '貸方税区分': creditTax,
            '貸方インボイス': creditInvoice,
            '貸方金額(円)': creditLine.credit,
            '貸方税額': 0,
            '摘要': CsvValidator.truncateDescription(entry.description, 200),
            '仕訳メモ': 'AI Accounting System',
            'タグ': '',
            'MF仕訳タイプ': 'インポート',
            '決算整理仕訳': '',
            '作成日時': new Date().toISOString(),
            '作成者': 'System_Core',
            '最終更新日時': new Date().toISOString(),
            '最終更新者': 'System_Core',
          };
        });
      });
    });

    // 3. CSV文字列に変換
    const csvContent = this.convertToCsv(rows);

    // 4. Shift-JIS変換（MF必須）
    // Node.js環境: iconv-liteを使用
    const iconv = await import('iconv-lite');
    const buffer = iconv.encode(csvContent, 'Shift_JIS');
    // Buffer → Uint8Array に変換（Blob互換性）
    const csvBuffer = new Uint8Array(buffer);

    return new Blob([csvBuffer], {
      type: 'text/csv; charset=Shift-JIS'
    });
  }

  /**
   * オブジェクト配列をCSV文字列に変換
   */
  private static convertToCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';

    // ヘッダー行
    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');

    // データ行
    const dataLines = rows.map(row => {
      return headers.map(header => {
        const value = row[header];

        // 文字列の場合、ダブルクォートで囲む
        if (typeof value === 'string') {
          // CSVエスケープ: " → ""
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        }

        return value;
      }).join(',');
    });

    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Phase 2: Freee形式CSV出力
   */
  static async exportToFreee(
    _journalEntries: JournalEntry[],
    _client: Client
  ): Promise<Blob> {
    throw new Error('exportToFreee() はPhase 2で実装予定');
  }

  /**
   * Phase 2: 弥生形式CSV出力
   */
  static async exportToYayoi(
    _journalEntries: JournalEntry[],
    _client: Client
  ): Promise<Blob> {
    throw new Error('exportToYayoi() はPhase 2で実装予定');
  }
}
