import type { Yen } from '@/shared/types/yen'
import type { StaffNotes } from './staff_notes'

/**
 * Phase 5 仕訳モック型定義
 *
 * 目的: UIモック検証用の型定義（Supabase実装前）
 * 準拠: journal_v2_20260214.md（Definition B）
 */

// ============================================================
// ステータス定義（1種類 + null）
// ============================================================

export type JournalStatusPhase5 =
  | 'exported'  // 出力済み（CSV出力完了、編集不可）
  | null;       // 未出力（デフォルト）

// ============================================================
// ラベル定義（21種類）
// 準拠: journal_v2_20260214.md §2（2026-02-23更新）
// ============================================================

export type JournalLabelPhase5 =
  // 証憑種類（7個）
  | 'RECEIPT'                // レシート・領収証
  | 'INVOICE'                // 請求書
  | 'TRANSPORT'              // 交通費
  | 'CREDIT_CARD'            // クレジットカード明細
  | 'BANK_STATEMENT'         // 銀行明細
  | 'MEDICAL'                // 医療費
  | 'NOT_APPLICABLE'         // 仕訳対象外

  // 警告ラベル（9個）
  | 'DEBIT_CREDIT_MISMATCH'  // 借方貸方の合計額不一致
  | 'TAX_CALCULATION_ERROR'  // 税抜と消費税額の合計不一致
  | 'MISSING_FIELD'          // 必須項目なし（証憑不備）← 旧MISSING_RECEIPT
  | 'UNREADABLE_FAILED'      // 判読不能（読取失敗）← 旧OCR_FAILED
  | 'DUPLICATE_CONFIRMED'    // 完全重複（同一画像）
  | 'MULTIPLE_VOUCHERS'      // 複数の証票あり（1画像に2枚以上）
  | 'DUPLICATE_SUSPECT'      // 重複疑い（定期支払等の可能性有）
  | 'DATE_OUT_OF_RANGE'      // 会計期間外または未来日付 ← 旧DATE_ANOMALY
  | 'UNREADABLE_ESTIMATED'   // 判読困難（AI推測値）← 旧OCR_LOW_CONFIDENCE
  | 'MEMO_DETECTED'          // 証票に手書きメモあり ← 旧HAS_MEMO昇格

  // 制度系（3個）
  | 'MULTI_TAX_RATE'         // 軽減税率対象の有無
  | 'INVOICE_QUALIFIED'      // 適格請求書
  | 'INVOICE_NOT_QUALIFIED'  // 非適格請求書

  // ルール（2個）
  | 'RULE_APPLIED'           // 学習ルール適用済み
  | 'RULE_AVAILABLE'         // 学習ルール適用可能

  // --- 以下はPhase B/Cで除去予定（現在のモックで使用中） ---

  // 要対応（4個）— staff_notesに移行済み。syncLabelsFromStaffNotes()が書き戻し中（B4で廃止）
  | 'NEED_DOCUMENT'          // 書類が不足
  | 'NEED_INFO'              // 情報が不足
  | 'REMINDER'               // 備忘メモ
  | 'NEED_CONSULT'           // 社内相談する

  // 出力制御（1個）— Phase Cでexport_excludeカラムに移行予定
  | 'EXPORT_EXCLUDE';        // 出力対象外

// ============================================================
// 仕訳行定義（N対N複合仕訳対応）
// ============================================================

export interface JournalEntryLine {
  account: string;              // 勘定科目
  sub_account: string | null;   // 補助科目
  amount: Yen;          // 金額
  tax_category: string | null;  // 税区分
}

// ============================================================
// Phase 5 仕訳モック定義
// ============================================================

export interface JournalPhase5Mock {
  // 基本情報
  id: string;                           // UUID
  display_order: number;                 // 表示順
  transaction_date: string;              // 取引日（ISO 8601: YYYY-MM-DD）
  description: string;                   // 摘要

  // 領収書紐付け（スキーマ準拠）
  receipt_id: string | null;             // 領収書ID（receiptsテーブル参照）

  // N対N複合仕訳（無制限、UI上限15行）
  debit_entries: JournalEntryLine[];     // 借方明細（配列）
  credit_entries: JournalEntryLine[];    // 貸方明細（配列）

  // ステータス（並列遷移、exported戻し可）
  status: JournalStatusPhase5;

  // 未読/既読（背景色管理）
  is_read: boolean;

  // ゴミ箱（論理削除・ワークフロー終了状態）
  // null = 有効、non-null = ゴミ箱（削除日時）
  // 制約: exported && deleted_at は禁止（外部出力済みの仕訳はゴミ箱不可）
  // 許可: export_exclude && deleted_at は許可（外部未出力のため）
  deleted_at: string | null;

  // ラベル（21種類、非排他的）
  labels: JournalLabelPhase5[];

  // クレジットカード払い判定（Gemini層A、独立カラム）
  is_credit_card_payment: boolean;

  // ルール関連（オプション）
  rule_id: string | null;                // ルールID
  rule_confidence: number | null;        // ルール信頼度（0.0-1.0）

  // インボイス関連（オプション）
  invoice_status: 'qualified' | 'not_qualified' | null;  // インボイスステータス
  invoice_number: string | null;         // インボイス番号（T + 13桁）

  // メモ関連（証票メモ: 顧問先が証票に記載したメモ）
  memo: string | null;                   // メモ内容
  memo_author: string | null;            // メモ作成者
  memo_target: string | null;            // メモ宛先
  memo_created_at: string | null;        // メモ作成日時（ISO 8601）

  // スタッフノート（スタッフが自発的に記入するコメント）
  // Phase B TODO: journal_staff_notesテーブルに分離
  staff_notes?: StaffNotes | null;       // 4カテゴリの対応情報
  staff_notes_author?: string | null;    // 担当者名
}
