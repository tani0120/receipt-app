/**
 * MF仕訳帳CSVパーサー
 *
 * MFクラウド会計「仕訳帳」→「エクスポート」で取得したCSVを
 * ConfirmedJournal[] に変換する。
 *
 * 設計根拠: docs/genzai/25_past_journal.md §3, §5
 *
 * 【列アクセス方式】
 * ヘッダー名マッピング方式を採用。
 * ヘッダー行から列名→位置のマップを構築し、列名で値を取得する。
 * これにより列順序の変更・列の追加に対して堅牢。
 *
 * パースフロー:
 *   1. テキスト読み込み（UTF-8、BOM除去）
 *   2. 行分割 → ヘッダー解析 → 列名マップ構築
 *   3. 取引Noでグループ化
 *   4. グループ毎にConfirmedJournal生成
 *      - 1行目: voucher_date, description, memo, tags, mf_journal_type, direction推定
 *      - 全行: debit_entries[], credit_entries[] に展開
 *      - match_key: normalizeVendorName(description) で生成
 */

import type { ConfirmedJournal, ConfirmedJournalEntry } from '../../types/confirmed_journal.type'
import { normalizeVendorName } from './vendorIdentification'
import crypto from 'crypto'

// ID生成ヘルパー（サーバー側。prefix_XXXXXXXX形式統一）
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function generateId(prefix: string): string {
  const bytes = crypto.randomBytes(8)
  let id = prefix
  for (let i = 0; i < 8; i++) {
    id += ID_CHARS[bytes[i]! % ID_CHARS.length]
  }
  return id
}

// ============================================================
// § MF CSV 必須ヘッダー定義
// ============================================================

/** パースに必須な列名一覧 */
const REQUIRED_HEADERS = [
  '取引No',
  '取引日',
  '借方勘定科目',
  '借方補助科目',
  '借方部門',
  '借方取引先',
  '借方税区分',
  '借方インボイス',
  '借方金額(円)',
  '借方税額',
  '貸方勘定科目',
  '貸方補助科目',
  '貸方部門',
  '貸方取引先',
  '貸方税区分',
  '貸方インボイス',
  '貸方金額(円)',
  '貸方税額',
  '摘要',
  '仕訳メモ',
  'タグ',
  'MF仕訳タイプ',
  '決算整理仕訳',
] as const

/** ヘッダー名 → 列インデックスのマップ型 */
type HeaderMap = Map<string, number>

/** パース結果 */
export interface MfCsvParseResult {
  /** 正常にパースされた仕訳 */
  journals: ConfirmedJournal[]
  /** パース時の警告（スキップされた行等） */
  warnings: string[]
  /** 元CSVの総行数（ヘッダー除く） */
  total_rows: number
}

// ============================================================
// § メイン関数
// ============================================================

/**
 * MF仕訳帳CSVテキストをConfirmedJournal[]に変換
 *
 * @param csv_text - CSVファイルの全テキスト（UTF-8）
 * @param client_id - 顧問先ID（例: LDI-00008）
 * @param import_batch_id - インポートバッチID（UUID。呼び出し元で生成）
 */
export function parseMfCsv(
  csv_text: string,
  client_id: string,
  import_batch_id: string,
): MfCsvParseResult {
  const warnings: string[] = []
  // BOM除去（UTF-8 BOM: U+FEFF）
  const clean_text = csv_text.replace(/^\uFEFF/, '')
  const lines = clean_text.split(/\r?\n/).filter(l => l.trim())

  if (lines.length < 2) {
    return { journals: [], warnings: ['CSVが空です（ヘッダーのみ or 0行）'], total_rows: 0 }
  }

  // ── ヘッダー解析 → 列名マップ構築 ──
  const header_line = lines[0]!
  const headers = parseCsvLine(header_line)
  const header_map = buildHeaderMap(headers)

  const validation_error = validateHeaderMap(header_map)
  if (validation_error) {
    return { journals: [], warnings: [validation_error], total_rows: 0 }
  }

  // ── データ行をパース ──
  const data_lines = lines.slice(1)
  const total_rows = data_lines.length

  // 取引Noでグループ化
  const col_transaction_no = header_map.get('取引No')!
  const groups = new Map<number, string[][]>()

  for (let i = 0; i < data_lines.length; i++) {
    const line = data_lines[i]!
    const fields = parseCsvLine(line)

    const transaction_no_raw = (fields[col_transaction_no] ?? '').trim()
    if (!transaction_no_raw) continue // 空行（フッター等）はスキップ

    const transaction_no = parseInt(transaction_no_raw, 10)
    if (isNaN(transaction_no)) {
      warnings.push(`行${i + 2}: 取引Noが数値ではありません（"${fields[col_transaction_no]}"）`)
      continue
    }

    if (!groups.has(transaction_no)) {
      groups.set(transaction_no, [])
    }
    groups.get(transaction_no)!.push(fields)
  }

  // ── グループ毎にConfirmedJournal生成 ──
  const journals: ConfirmedJournal[] = []
  const now = new Date().toISOString()

  for (const [transaction_no, rows] of groups) {
    const journal = buildJournal(rows, transaction_no, client_id, import_batch_id, now, header_map, warnings)
    if (journal) {
      journals.push(journal)
    }
  }

  return { journals, warnings, total_rows }
}

// ============================================================
// § 仕訳ビルダー
// ============================================================

/** ヘッダーマップから列の値を取得するヘルパー */
function col(row: string[], header_map: HeaderMap, name: string): string {
  const idx = header_map.get(name)
  if (idx === undefined) return ''
  return row[idx]?.trim() ?? ''
}

function buildJournal(
  rows: string[][],
  transaction_no: number,
  client_id: string,
  import_batch_id: string,
  imported_at: string,
  header_map: HeaderMap,
  warnings: string[],
): ConfirmedJournal | null {
  const first_row = rows[0]!

  // 取引日（YYYY/MM/DD → YYYY-MM-DD、ゼロパディング）
  const raw_date = col(first_row, header_map, '取引日')
  const voucher_date = normalizeDate(raw_date)
  if (!voucher_date) {
    warnings.push(`取引No=${transaction_no}: 取引日が空です`)
    return null
  }

  // 摘要
  const description = col(first_row, header_map, '摘要')

  // 照合キー
  const match_key = normalizeVendorName(description) ?? ''

  // 取引先名（借方取引先 or 貸方取引先の最初に見つかった値）
  let vendor_name: string | null = null
  for (const row of rows) {
    const debit_vendor = col(row, header_map, '借方取引先')
    const credit_vendor = col(row, header_map, '貸方取引先')
    if (debit_vendor) { vendor_name = debit_vendor; break }
    if (credit_vendor) { vendor_name = credit_vendor; break }
  }

  // MFメタデータ
  const memo = col(first_row, header_map, '仕訳メモ') || null
  const tags = col(first_row, header_map, 'タグ') || null
  const mf_journal_type = col(first_row, header_map, 'MF仕訳タイプ') || null
  const is_closing_entry = col(first_row, header_map, '決算整理仕訳') !== ''

  // 仕訳行を展開
  const debit_entries: ConfirmedJournalEntry[] = []
  const credit_entries: ConfirmedJournalEntry[] = []

  for (const row of rows) {
    // 借方
    const debit_account = col(row, header_map, '借方勘定科目')
    if (debit_account) {
      debit_entries.push({
        id: generateId('cje_'),
        account: debit_account,
        sub_account: col(row, header_map, '借方補助科目') || null,
        department: col(row, header_map, '借方部門') || null,
        vendor_name: col(row, header_map, '借方取引先') || null,
        tax_category_id: col(row, header_map, '借方税区分') || null,
        invoice: col(row, header_map, '借方インボイス') || null,
        amount: parseInt(col(row, header_map, '借方金額(円)') || '0', 10) || 0,
        tax_amount: col(row, header_map, '借方税額') ? parseInt(col(row, header_map, '借方税額'), 10) : null,
      })
    }

    // 貸方
    const credit_account = col(row, header_map, '貸方勘定科目')
    if (credit_account) {
      credit_entries.push({
        id: generateId('cje_'),
        account: credit_account,
        sub_account: col(row, header_map, '貸方補助科目') || null,
        department: col(row, header_map, '貸方部門') || null,
        vendor_name: col(row, header_map, '貸方取引先') || null,
        tax_category_id: col(row, header_map, '貸方税区分') || null,
        invoice: col(row, header_map, '貸方インボイス') || null,
        amount: parseInt(col(row, header_map, '貸方金額(円)') || '0', 10) || 0,
        tax_amount: col(row, header_map, '貸方税額') ? parseInt(col(row, header_map, '貸方税額'), 10) : null,
      })
    }
  }

  // 入出金方向を推定（借方の最初の科目から）
  const direction = estimateDirection(debit_entries, credit_entries)

  return {
    id: generateId('cj_'),
    client_id,
    voucher_date,
    description,
    match_key,
    vendor_id: null,  // パース時は未照合。後続処理で設定
    vendor_name,
    direction,
    debit_entries,
    credit_entries,
    source: 'mf_import',
    mf_journal_type,
    is_closing_entry,
    memo,
    tags,
    import_batch_id,
    imported_at,
    mf_transaction_no: transaction_no,
  }
}

// ============================================================
// § ヘルパー関数
// ============================================================

/** 日付正規化: YYYY/M/D or YYYY/MM/DD → YYYY-MM-DD（ゼロパディング） */
function normalizeDate(raw: string): string {
  if (!raw) return ''
  const parts = raw.split('/')
  if (parts.length !== 3) return raw.replace(/\//g, '-')
  const y = parts[0]!
  const m = parts[1]!.padStart(2, '0')
  const d = parts[2]!.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** ヘッダー行から列名→インデックスのマップを構築 */
function buildHeaderMap(headers: string[]): HeaderMap {
  const map: HeaderMap = new Map()
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i]!.trim()
    if (name) {
      map.set(name, i)
    }
  }
  return map
}

/** 必須ヘッダーがすべて存在するか検証 */
function validateHeaderMap(header_map: HeaderMap): string | null {
  const missing: string[] = []
  for (const name of REQUIRED_HEADERS) {
    if (!header_map.has(name)) {
      missing.push(name)
    }
  }
  if (missing.length > 0) {
    return `必須列が不足: [${missing.join(', ')}]。MF仕訳帳CSVか確認してください。`
  }
  return null
}

/** CSVの1行をフィールド配列に分割（ダブルクォート対応） */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let in_quotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!

    if (in_quotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // エスケープされたダブルクォート
        } else {
          in_quotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        in_quotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

/**
 * 入出金方向を推定
 *
 * 単純ルール:
 * - 借方が「現金」「普通預金」等の資産科目 → income
 * - 貸方が「現金」「普通預金」等の資産科目 → expense
 * - それ以外 → transfer
 */
const ASSET_ACCOUNTS = ['現金', '普通預金', '当座預金', '定期預金', '小口現金']

function estimateDirection(
  debit_entries: ConfirmedJournalEntry[],
  credit_entries: ConfirmedJournalEntry[],
): 'expense' | 'income' | 'transfer' {
  const debit_is_asset = debit_entries.some(e => ASSET_ACCOUNTS.includes(e.account))
  const credit_is_asset = credit_entries.some(e => ASSET_ACCOUNTS.includes(e.account))

  if (credit_is_asset && !debit_is_asset) return 'expense'
  if (debit_is_asset && !credit_is_asset) return 'income'
  return 'transfer'
}
