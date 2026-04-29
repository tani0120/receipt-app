/**
 * 確定済み仕訳型定義（T-03）
 *
 * 設計根拠: docs/genzai/25_past_journal.md §4
 * 命名規則: snake_case統一（DL-054）
 * 互換性: JournalPhase5Mock / JournalEntryLine と同じプロパティ名
 *
 * 利用用途（全8件。25_past_journal.md §2参照）:
 *   U-1: accountDetermination.ts Step 2（過去仕訳照合）
 *   U-2: 一意性判定（DL-028: 科目種類数カウント）
 *   U-3: 仕訳一覧 過去仕訳検索モーダル「会計ソフトから取り込んだ過去仕訳」タブ
 *   U-4: 仕訳一覧 ヒントモーダル「過去の類似仕訳」
 *   U-5: 学習ルール作成の参考材料
 *   U-6: 学習ルール自動提案（将来）
 *   U-7: 科目候補スコアリング（将来）
 *   U-8: MF CSVインポート（history-import画面）
 */

// ============================================================
// § ConfirmedJournal（確定済み仕訳ヘッダー）
// ============================================================

/**
 * 確定済み仕訳（過去仕訳照合・UI表示用）
 *
 * MF仕訳帳CSVの取引Noでグループ化した1仕訳単位。
 * debit_entries / credit_entries で複合仕訳に対応。
 *
 * JournalPhase5Mockと互換性があり、UIで直接使用可能:
 *   - voucher_date, description, debit_entries[].account 等
 */
export interface ConfirmedJournal {
  /** 仕訳ID（UUID） */
  id: string

  /** 顧問先ID（例: LDI-00008） */
  client_id: string

  /** 取引日（YYYY-MM-DD） */
  voucher_date: string

  /** 摘要（MF CSV 19列目） */
  description: string

  /**
   * 照合キー
   * normalizeVendorName(description) の出力。
   * ConfirmedJournalRepository.findByMatchKey() で使用。
   */
  match_key: string

  /** 取引先ID（vendors_global/client の vendor_id。照合成功時に付与） */
  vendor_id: string | null

  /** 取引先名（MF CSV 借方取引先 or 貸方取引先。表示用） */
  vendor_name: string | null

  /** 入出金方向（借方科目から推定） */
  direction: 'expense' | 'income' | 'transfer'

  // ── 仕訳行（複合仕訳対応: N行） ──

  /** 借方仕訳行 */
  debit_entries: ConfirmedJournalEntry[]

  /** 貸方仕訳行 */
  credit_entries: ConfirmedJournalEntry[]

  // ── MF CSV メタデータ ──

  /** データソース */
  source: 'mf_import' | 'system'

  /** MF仕訳タイプ（簡単入力 / 振替伝票 等。MF CSV 22列目） */
  mf_journal_type: string | null

  /** 決算整理仕訳フラグ（MF CSV 23列目） */
  is_closing_entry: boolean

  /** 仕訳メモ（MF CSV 20列目） */
  memo: string | null

  /** タグ（MF CSV 21列目） */
  tags: string | null

  // ── インポート管理 ──

  /** インポートバッチID（どのCSVインポートで入ったか） */
  import_batch_id: string

  /** インポート日時（ISO 8601） */
  imported_at: string

  /**
   * MF取引No（CSVの元行番号。重複排除に使用）
   * 同一 client_id + mf_transaction_no + voucher_date で UNIQUE
   */
  mf_transaction_no: number | null
}

// ============================================================
// § ConfirmedJournalEntry（確定済み仕訳行）
// ============================================================

/**
 * 確定済み仕訳の1行（借方 or 貸方）
 *
 * JournalEntryLine（domain/types/journal.ts）と互換性のあるプロパティ名:
 *   account, sub_account, department, amount, tax_category_id
 *
 * JournalEntryLineとの差分:
 *   - account: string（必須。MF CSVでは常に値あり）
 *     ※ JournalEntryLineは string | null（AI判定不能時null）
 *   - account_on_document: なし（MF CSVでは不要）
 *   - amount_on_document: なし（同上）
 *   - vendor_name: あり（MF CSV 借方/貸方取引先）
 *   - tax_amount: あり（MF CSV 借方/貸方税額）
 *   - invoice: あり（MF CSV 借方/貸方インボイス）
 */
export interface ConfirmedJournalEntry {
  /** 行ID（UUID） */
  id: string

  /** 勘定科目（MF科目名。必須） */
  account: string

  /** 補助科目 */
  sub_account: string | null

  /** 部門 */
  department: string | null

  /** 取引先（MF CSV 借方取引先 or 貸方取引先） */
  vendor_name: string | null

  /** 税区分（MF税区分名。例: 「課税仕入 10%」） */
  tax_category_id: string | null

  /** インボイス（MF CSV 借方/貸方インボイス） */
  invoice: string | null

  /** 金額（円） */
  amount: number

  /** 税額（円） */
  tax_amount: number | null
}
