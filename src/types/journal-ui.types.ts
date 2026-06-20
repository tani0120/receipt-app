/**
 * UI表示用仕訳型（journal-ui.types.ts）
 *
 * 仕訳一覧画面で使用するUI専用アダプタ型。
 * normalizeJournalForUI() 通過後のデータ型として使用。
 *
 * 配置理由:
 *   journal-list-row.ts は「表示行の判別共用体」を定義する責務。
 *   本ファイルは「ConfirmedJournalをUI向けに加工した結果」の型を定義する責務。
 *   UI専用アダプタ型はドメイン型（domain-journal.ts）には置かない。
 */

import type { ConfirmedJournal } from './confirmed_journal.type'
import type { JournalPhase5Mock, JournalLabelMock } from './journal_phase5_mock.type'
import type { StaffNotes } from './staff_notes'

// ============================================================
// § NormalizedConfirmedJournal
//   normalizeJournalForUI() で ConfirmedJournal に
//   UI互換デフォルト値を付与した結果の型。
//   ConfirmedJournal固有フィールド（imported_at等）を保持しつつ、
//   テンプレートが期待するフィールド（labels, status等）も持つ。
// ============================================================

export interface NormalizedConfirmedJournal extends ConfirmedJournal {
  /** 仕訳ラベル（ConfirmedJournalには存在しないためデフォルト空配列） */
  labels: JournalLabelMock[]
  /** 出力ステータス（ConfirmedJournalには存在しないためデフォルトnull） */
  status: null
  /** 既読フラグ（過去仕訳は常に既読扱い） */
  is_read: true
  /** ゴミ箱日時（過去仕訳はゴミ箱なし） */
  deleted_at: null
  /** 警告非表示リスト */
  warning_dismissals: string[]
  /** 警告詳細 */
  warning_details: Record<string, string>
  /** クレジットカード決済フラグ */
  is_credit_card_payment: false
  /** 証票種類 */
  voucher_type: null
  /** 証票ID */
  document_id: null
  /** スタッフメモ */
  staff_notes: StaffNotes | null
  /** 表示順（90000 + mf_transaction_no） */
  display_order: number
  /** インボイスステータス */
  invoice_status: null
  /** ルールID */
  rule_id: null
  /** インボイス番号 */
  invoice_number: null
}

// ============================================================
// § UiJournal — 仕訳一覧表示用の判別共用体
//   journals shallowRef の型。
//   isImportedJournal() で NormalizedConfirmedJournal にnarrow可能。
// ============================================================

export type UiJournal = JournalPhase5Mock | NormalizedConfirmedJournal
