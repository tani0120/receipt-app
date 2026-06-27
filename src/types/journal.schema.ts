/**
 * journal.schema.ts — Journal統一仕訳型のzodスキーマ定義
 *
 * Phase 2.5（品質保証）で追加。
 * Journal型（journal.type.ts）と1対1で対応するバリデーションスキーマ。
 *
 * 用途:
 *   - updateJournal()のPATCH入口でのバリデーション
 *   - getJournals()でJSON読み込み時の構造検証
 *   - journalRoutes.tsのAPI入口（zValidator）
 *
 * 設計方針:
 *   - 既存データとの互換性を最優先（.passthrough()で未知フィールドを許容）
 *   - optionalフィールドは全てoptional()で定義（旧データに存在しない可能性がある）
 *   - JournalEntryLineは別スキーマとして定義し、再利用
 */

import { z } from 'zod'

// ============================================================
// § JournalEntryLine スキーマ（借方/貸方明細行）
// ============================================================

export const journalEntryLineSchema = z.object({
  /** 行ID（PK。レガシーデータはnull） */
  entryId: z.string().nullable(),
  /** 勘定科目（nullable: AIが判定できない場合） */
  account: z.string().nullable(),
  /** 勘定科目の項目存在フラグ */
  account_on_document: z.boolean(),
  /** 補助科目 */
  sub_account: z.string().nullable(),
  /** 部門（MFインポートCSV対応） */
  department: z.string().nullable(),
  /** 金額（円。nullable: 証憑から読み取れない場合） */
  amount: z.number().nullable(),
  /** 金額の項目存在フラグ */
  amount_on_document: z.boolean(),
  /** 税区分ID（例: PURCHASE_TAXABLE_10） */
  tax_category_id: z.string().nullable(),
  /** 取引先名（MF CSV用。AI仕訳ではnull） */
  vendor_name: z.string().nullable().optional(),
  /** インボイス（MF CSV用） */
  invoice: z.string().nullable().optional(),
  /** 税額（MF CSV用） */
  tax_amount: z.number().nullable().optional(),
}).passthrough()

// ============================================================
// § JournalSource（データ経路）
// ============================================================

export const journalSourceSchema = z.enum([
  'ai_pipeline',
  'manual',
  'mf_import',
  'system',
  'legacy',
])

// ============================================================
// § JournalStatus（ステータス）
// ============================================================

export const journalStatusSchema = z.union([
  z.literal('exported'),
  z.literal('historical'),
  z.null(),
])

// ============================================================
// § Journal スキーマ（統一仕訳型）
// ============================================================

export const journalSchema = z.object({
  // ── 基本情報 ──
  journalId: z.string(),
  client_id: z.string(),
  display_order: z.number(),
  voucher_date: z.string().nullable(),
  date_on_document: z.boolean(),
  description: z.string(),
  voucher_type: z.string().nullable(),

  // ── データ経路 ──
  source: journalSourceSchema,

  // ── パイプライン3フィールド ──
  source_type: z.string().nullable(),
  direction: z.string().nullable(),
  vendor_vector: z.string().nullable(),

  // ── 取引先特定結果 ──
  vendor_id: z.string().nullable(),
  vendor_name: z.string().nullable(),

  // ── 照合キー ──
  match_key: z.string().nullable().optional(),

  // ── 証票紐付け ──
  document_id: z.string().nullable(),
  line_id: z.string().nullable(),

  // ── 複合仕訳（借方/貸方明細） ──
  debit_entries: z.array(journalEntryLineSchema),
  credit_entries: z.array(journalEntryLineSchema),

  // ── ステータス ──
  status: journalStatusSchema,
  is_read: z.boolean(),
  read_by: z.string().nullable().optional(),
  read_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable(),
  deleted_by: z.string().nullable().optional(),

  // ── ラベル ──
  labels: z.array(z.string()),
  warning_dismissals: z.array(z.string()),
  warning_details: z.record(z.string(), z.string()),

  // ── 出力関連 ──
  export_batch_id: z.string().nullable(),
  is_credit_card_payment: z.boolean(),

  // ── ルール関連 ──
  rule_id: z.string().nullable(),

  // ── インボイス関連 ──
  invoice_status: z.union([
    z.literal('qualified'),
    z.literal('not_qualified'),
    z.null(),
  ]),
  invoice_number: z.string().nullable(),

  // ── メモ関連 ──
  memo: z.string().nullable(),
  memo_author: z.string().nullable(),
  memo_target: z.string().nullable(),
  memo_created_at: z.string().nullable(),

  // ── スタッフノート ──
  staff_notes: z.record(z.string(), z.object({
    enabled: z.boolean(),
    text: z.string(),
    chatworkUrl: z.string(),
  })).nullable().optional(),
  staff_notes_author: z.string().nullable().optional(),

  // ── MF送信結果 ──
  mf_journal_id: z.string().nullable().optional(),
  mf_journal_number: z.number().nullable().optional(),
  mf_sent_at: z.string().nullable().optional(),

  // ── 出力関連（監査） ──
  exported_at: z.string().nullable().optional(),
  exported_by: z.string().nullable().optional(),

  // ── 監査用 ──
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),

  // ── AI推定関連 ──
  ai_completed_at: z.string().nullable().optional(),
  determination_method: z.string().nullable().optional(),
  prediction_score: z.number().nullable().optional(),
  model_version: z.string().nullable().optional(),

  // ── MF専用メタデータ ──
  mf_journal_type: z.string().nullable().optional(),
  is_closing_entry: z.boolean().optional(),
  tags: z.string().nullable().optional(),
  mf_transaction_no: z.number().nullable().optional(),
  import_batch_id: z.string().nullable().optional(),
  imported_at: z.string().nullable().optional(),
  mf_raw: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough()

/**
 * PATCH更新用スキーマ（部分更新）
 *
 * journalSchemaの全フィールドをoptionalにしたもの。
 * updateJournal()のpatchバリデーションに使用。
 */
export const journalPatchSchema = journalSchema.partial()

/** 型推論用（zodスキーマからTypeScript型を導出） */
export type JournalParsed = z.infer<typeof journalSchema>
