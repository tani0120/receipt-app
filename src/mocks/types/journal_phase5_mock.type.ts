
import type { StaffNotes } from './staff_notes'

// ============================================================
// domain層からの再export（型の出自はdomain層）
// ============================================================
import type { JournalLabel, JournalEntryLine } from '@/domain/types/journal';
export type { JournalLabel, JournalEntryLine };

/**
 * Phase 5 仕訳モック型定義
 *
 * 目的: UIモック検証用の型定義（Supabase実装前）
 * 準拠: journal_v2_20260214.md（Definition B）
 *
 * JournalLabel: domain層で定義（22種）
 * JournalLabelMock: mocks層専用（domain + Phase B/C用ラベル）
 */

// ============================================================
// ステータス定義（1種類 + null）
// ============================================================

export type JournalStatusPhase5 =
  | 'exported'  // 出力済み（CSV出力完了、編集不可）
  | null;       // 未出力（デフォルト）

// ============================================================
// モック専用ラベル（domain JournalLabel + Phase B/C用）
// Phase B/Cで除去予定の型はここに残す
// ============================================================



export type JournalLabelMock =
  | JournalLabel

  // --- 以下はPhase B/Cで除去予定（現在のモックで使用中） ---

  // 要対応（4個）— staff_notesに移行済み。syncLabelsFromStaffNotes()が書き戻し中（B4で廃止）
  | 'NEED_DOCUMENT'          // 書類が不足
  | 'NEED_INFO'              // 情報が不足
  | 'REMINDER'               // 備忘メモ
  | 'NEED_CONSULT'           // 社内相談する

  // 出力制御（1個）— Phase Cでexport_excludeカラムに移行予定
  | 'EXPORT_EXCLUDE';        // 出力対象外

// ============================================================
// Phase 5 仕訳モック定義
// ============================================================

export interface JournalPhase5Mock {
  // 基本情報
  id: string;                           // UUID
  display_order: number;                 // 表示順
  /**
   * 取引日（transaction_date）
   *
   * 【3つの日付概念と本システムの方針】
   *   取引日: 経済活動が実際に起きた日（物の引渡日、サービスの提供完了日）
   *   伝票日: 証憑（レシート・請求書等）に記載された日付
   *   計上日: 帳簿上の収益・費用とする日（決算整理で取引日とずれる場合がある）
   *
   * 【本システムの方針（C案）】
   *   - 初期値: 証憑に記載された日付（STREAMED/AIが読み取った伝票日）
   *   - ユーザーが取引実態に合わせて修正可能
   *   - 伝票日と取引日がずれるケース（月またぎ仕入等）はユーザー修正で対応
   *   - 計上日は管理しない（決算整理はMF側の責務）
   *   - nullable: 証憑から日付が読み取れない場合
   *   - 税区分の期間制御はUI側のみ（保存時バリデーションなし）
   *
   * 【根拠】
   *   - STREAMEDも証憑日付ベースで処理
   *   - MF CSV出力の「取引日」カラムと一致
   *   - 実務上99%は伝票日=取引日（中小企業）
   */
  transaction_date: string | null;
  /**
   * 日付の項目存在フラグ（date_on_document）
   * false（項目なし）+ null → MISSING_FIELD（必須項目なし）
   * true（項目あり）+ null → UNREADABLE_FAILED（判読不能）
   */
  date_on_document: boolean;
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
  labels: JournalLabelMock[];

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
