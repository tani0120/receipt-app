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
// ============================================================

export type JournalLabelPhase5 =
  // 証憑種類（5個）
  | 'TRANSPORT'              // 領収書
  | 'RECEIPT'                // レシート
  | 'INVOICE'                // 請求書
  | 'CREDIT_CARD'            // クレジットカード明細
  | 'BANK_STATEMENT'         // 銀行明細

  // ルール（2個）
  | 'RULE_APPLIED'           // ルール適用済み
  | 'RULE_AVAILABLE'         // ルール適用可能

  // インボイス（3個）
  | 'INVOICE_QUALIFIED'      // 適格請求書
  | 'INVOICE_NOT_QUALIFIED'  // 不適格請求書
  | 'MULTI_TAX_RATE'         // 複数税率

  // 事故フラグ（6個）
  | 'DEBIT_CREDIT_MISMATCH'  // 貸借不一致
  | 'TAX_CALCULATION_ERROR'  // 税計算誤差
  | 'DUPLICATE_SUSPECT'      // 重複疑い
  | 'DATE_ANOMALY'           // 日付異常
  | 'AMOUNT_ANOMALY'         // 金額異常
  | 'MISSING_RECEIPT'        // 証憑欠落

  // OCR（2個）
  | 'OCR_LOW_CONFIDENCE'     // OCR信頼度低
  | 'OCR_FAILED'             // OCR完全失敗

  // 要対応（3個）
  | 'NEED_DOCUMENT'          // 資料が必要
  | 'NEED_CONFIRM'           // 確認が必要
  | 'NEED_CONSULT'           // 相談が必要

  // 出力制御（1個）
  | 'EXPORT_EXCLUDE'         // 出力対象外

  // その他（1個）
  | 'HAS_MEMO';              // メモあり

// ============================================================
// 仕訳行定義（N対N複合仕訳対応）
// ============================================================

export interface JournalEntryLine {
  account: string;              // 勘定科目
  sub_account: string | null;   // 補助科目
  amount: number;               // 金額
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

  // ラベル（17種類、非排他的）
  labels: JournalLabelPhase5[];

  // ルール関連（オプション）
  rule_id: string | null;                // ルールID
  rule_confidence: number | null;        // ルール信頼度（0.0-1.0）

  // インボイス関連（オプション）
  invoice_status: 'qualified' | 'not_qualified' | null;  // インボイスステータス
  invoice_number: string | null;         // インボイス番号（T + 13桁）

  // メモ関連（オプション）
  memo: string | null;                   // メモ内容
  memo_author: string | null;            // メモ作成者
  memo_target: string | null;            // メモ宛先
  memo_created_at: string | null;        // メモ作成日時（ISO 8601）
}
