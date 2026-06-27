/**
 * UI表示用仕訳型（journal-ui.types.ts）
 *
 * 仕訳一覧画面で使用するUI専用アダプタ型。
 * normalizeJournalForUI() 通過後のデータ型として使用。
 *
 * 配置理由:
 *   journal-list-row.ts は「表示行の判別共用体」を定義する責務。
 *   本ファイルは「MF取込仕訳をUI向けに加工した結果」の型を定義する責務。
 *   UI専用アダプタ型はドメイン型（domain-journal.ts）には置かない。
 *
 * Phase 2完了: ConfirmedJournal → Journal に統一。
 *   NormalizedConfirmedJournal は Journal の上位互換として残存（レガシーJSON互換用）。
 *   将来的に不要になる。
 */

import type { Journal, JournalLabelMock } from './journal.type'
import type { StaffNotes } from './staff_notes'

// Journal（統一仕訳型）の再export（他ファイルがjournal-ui.types.tsから参照できるようにする）
export type { Journal }

// ============================================================
// § NormalizedConfirmedJournal
//   normalizeJournalForUI() で Journal（MF取込仕訳） に
//   UI互換デフォルト値を付与した結果の型。
//   MF取込固有フィールド（imported_at等）を保持しつつ、
//   テンプレートが期待するフィールド（labels, status等）も持つ。
//
//   @deprecated Phase 2で廃止予定。Journal（統一仕訳型）に統合。
// ============================================================

export interface NormalizedConfirmedJournal extends Journal {
  /** 仕訳ラベル（MF取込仕訳にはデフォルト空配列） */
  labels: JournalLabelMock[]
  /** 出力ステータス（MF取込仕訳はデフォルトnull） */
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
//
//   Phase 2完了: UiJournal = Journal に単純化予定（NormalizedConfirmedJournal廃止後）。
// ============================================================

export type UiJournal = NormalizedConfirmedJournal | Journal

