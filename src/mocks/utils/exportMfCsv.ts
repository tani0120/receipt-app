/**
 * MFクラウド会計 仕訳帳CSVエクスポート
 *
 * 準拠: docs/genzai/09_streamed/streamed_mf_csv_spec.md
 *
 * 設計方針:
 *   - 内部IDベースのJournalPhase5Mock → MF CSV 21列に変換
 *   - ID→MF名称変換はコールバックで受け取る（UIの名前解決関数を再利用）
 *   - UTF-8 BOM付き出力（MFはUTF-8 BOMを受け付ける）
 *   - 複合仕訳（N対N）はmax(debit, credit)行に展開
 */

import type { JournalPhase5Mock } from '@/mocks/types/journal_phase5_mock.type';
import type { JournalEntryLine } from '@/domain/types/journal';
import { toMfCsvDate } from '@/shared/utils/mf-csv-date';

// ============================================================
// 型定義
// ============================================================

/** MF CSV 1行分のデータ */
export interface MfCsvRow {
  取引No: string;
  取引日: string;
  借方勘定科目: string;
  借方補助科目: string;
  借方部門: string;
  借方税区分: string;
  借方金額: string;
  借方税額: string;
  貸方勘定科目: string;
  貸方補助科目: string;
  貸方部門: string;
  貸方税区分: string;
  貸方金額: string;
  貸方税額: string;
  摘要: string;
  仕訳メモ: string;
  タグ: string;
  MF仕訳タイプ: string;
  決算整理仕訳: string;
  '借方インボイス': string;
  '貸方インボイス': string;
}

/** ID→MF名称変換コールバック */
export type NameResolver = (id: string | null | undefined) => string;

/** CSV出力前バリデーション結果 */
export interface CsvValidationResult {
  valid: JournalPhase5Mock[];
  excluded: { journal: JournalPhase5Mock; reasons: string[] }[];
}

// ============================================================
// CSV出力前バリデーション
// ============================================================

/** 出力対象外のラベル（全警告 + EXPORT_EXCLUDE）
 *  このリストに含まれるラベルを持つ仕訳はCSV出力から除外される。
 *  定義は必ずこの1箇所のみで管理する。
 */
export const EXCLUDE_LABELS = [
  // domain層 警告（赤6種）
  'DEBIT_CREDIT_MISMATCH',
  'DATE_UNKNOWN',
  'ACCOUNT_UNKNOWN',
  'AMOUNT_UNCLEAR',
  'DUPLICATE_CONFIRMED',
  'MULTIPLE_VOUCHERS',
  // domain層 警告（黄4種）
  'DUPLICATE_SUSPECT',
  'FUTURE_DATE',
  'UNREADABLE_ESTIMATED',
  'MEMO_DETECTED',
  // mock層 警告（5種）
  'CATEGORY_CONFLICT',
  'TAX_UNKNOWN',
  'DESCRIPTION_UNKNOWN',
  'VOUCHER_TYPE_CONFLICT',
  'TAX_ACCOUNT_MISMATCH',
  // 要対応（4種）
  'NEED_DOCUMENT',
  'NEED_INFO',
  'REMINDER',
  'NEED_CONSULT',
  // 出力制御
  'EXPORT_EXCLUDE',
] as const;

/**
 * CSV出力前バリデーション
 * 警告ラベル付き仕訳を除外し、出力可能な仕訳のみ返す
 */
export function validateForCsvExport(
  journals: JournalPhase5Mock[],
): CsvValidationResult {
  const valid: JournalPhase5Mock[] = [];
  const excluded: { journal: JournalPhase5Mock; reasons: string[] }[] = [];

  for (const j of journals) {
    const reasons: string[] = [];
    const labels = j.labels as string[];

    for (const label of EXCLUDE_LABELS) {
      if (labels.includes(label)) {
        reasons.push(label);
      }
    }

    // deleted_at が設定されている仕訳は除外
    if (j.deleted_at) {
      reasons.push('DELETED');
    }


    if (reasons.length === 0) {
      valid.push(j);
    } else {
      excluded.push({ journal: j, reasons });
    }
  }

  return { valid, excluded };
}

// ============================================================
// 複合仕訳展開（Step D）
// ============================================================

/**
 * 1仕訳 → CSV行配列に展開（複合仕訳対応）
 *
 * 展開ルール:
 *   1:1  → 1行
 *   1:N  → N行（1行目に借方全額、2行目以降の借方は空）
 *   N:1  → N行（1行目に貸方全額、2行目以降の貸方は空）
 *   N:N  → N行（インデックスで対応付け）
 *   N:M  → max(N,M)行（短い側をパディング）
 */
export function expandJournalToMfRows(
  journal: JournalPhase5Mock,
  resolveAccountName: NameResolver,
  resolveTaxCategoryName: NameResolver,
  txNoOverride?: number,
): MfCsvRow[] {
  const debits = journal.debit_entries;
  const credits = journal.credit_entries;
  const rowCount = Math.max(debits.length, credits.length);

  if (rowCount === 0) return [];

  const rows: MfCsvRow[] = [];
  // 取引No: 連番を優先（display_orderは仕訳間で重複しうるため）
  const txNo = txNoOverride != null ? txNoOverride.toString() : journal.display_order.toString();
  const txDate = toMfCsvDate(journal.voucher_date);
  const description = truncateDescription(journal.description, 200);

  // インボイス区分の決定
  const invoiceDebit = resolveInvoiceCategory(journal, 'debit');
  const invoiceCredit = resolveInvoiceCategory(journal, 'credit');

  for (let i = 0; i < rowCount; i++) {
    const debit: JournalEntryLine | undefined = debits[i];
    const credit: JournalEntryLine | undefined = credits[i];

    rows.push({
      取引No: txNo,
      取引日: txDate,
      借方勘定科目: debit ? resolveAccountName(debit.account) : '',
      借方補助科目: debit?.sub_account ?? '',
      借方部門: '',
      借方税区分: debit ? resolveTaxCategoryName(debit.tax_category_id) : '',
      借方金額: debit?.amount != null ? String(debit.amount) : '',
      借方税額: '',
      貸方勘定科目: credit ? resolveAccountName(credit.account) : '',
      貸方補助科目: credit?.sub_account ?? '',
      貸方部門: '',
      貸方税区分: credit ? resolveTaxCategoryName(credit.tax_category_id) : '',
      貸方金額: credit?.amount != null ? String(credit.amount) : '',
      貸方税額: '',
      摘要: description,
      仕訳メモ: '',
      タグ: '',
      MF仕訳タイプ: 'インポート',
      決算整理仕訳: '',
      '借方インボイス': i === 0 ? invoiceDebit : '',
      '貸方インボイス': i === 0 ? invoiceCredit : '',
    });
  }

  return rows;
}

// ============================================================
// CSV文字列生成
// ============================================================

/** MF CSV 21列のヘッダー順序 */
const MF_CSV_HEADERS: (keyof MfCsvRow)[] = [
  '取引No', '取引日',
  '借方勘定科目', '借方補助科目', '借方部門', '借方税区分', '借方金額', '借方税額',
  '貸方勘定科目', '貸方補助科目', '貸方部門', '貸方税区分', '貸方金額', '貸方税額',
  '摘要', '仕訳メモ', 'タグ', 'MF仕訳タイプ', '決算整理仕訳',
  '借方インボイス', '貸方インボイス',
];

/**
 * 全仕訳をMF CSV文字列に変換
 */
export function buildMfCsvContent(
  journals: JournalPhase5Mock[],
  resolveAccountName: NameResolver,
  resolveTaxCategoryName: NameResolver,
): string {
  // 全仕訳を行展開（取引Noは1始まりの連番で出力）
  const allRows: MfCsvRow[] = [];
  let txCounter = 0;
  for (const j of journals) {
    txCounter++;
    const rows = expandJournalToMfRows(j, resolveAccountName, resolveTaxCategoryName, txCounter);
    allRows.push(...rows);
  }

  // ヘッダー行
  const headerLine = MF_CSV_HEADERS.join(',');

  // データ行
  const dataLines = allRows.map(row => {
    return MF_CSV_HEADERS.map(key => {
      const value = row[key];
      if (typeof value === 'string' && value !== '') {
        // CSVエスケープ: " → ""
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return value;
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

// ============================================================
// ダウンロード
// ============================================================

/**
 * CSV文字列をUTF-8 BOM付きBlobとしてダウンロード
 */
export function downloadMfCsv(csvContent: string, filename: string): void {
  // UTF-8 BOM
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv; charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 摘要を指定文字数に切り詰め
 */
function truncateDescription(desc: string, maxLength: number): string {
  // MF仕様: 改行含有で読み込み失敗するため除去
  const sanitized = desc.replace(/[\r\n]+/g, ' ').trim();
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength);
}

/**
 * インボイス区分を決定
 * invoice_status: 'qualified' → '適格', 'not_qualified' → '区分記載', null → ''
 */
function resolveInvoiceCategory(
  journal: JournalPhase5Mock,
  _side: 'debit' | 'credit',
): string {
  if (journal.invoice_status === 'qualified') return '適格';
  if (journal.invoice_status === 'not_qualified') return '区分記載';
  return '';
}
