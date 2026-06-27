import type { ConfirmedJournal } from './confirmed_journal.type'
import type { Journal } from './journal.type'
import type { UiJournal, NormalizedConfirmedJournal } from './journal-ui.types'

/**
 * 仕訳一覧行（判別共用体）
 *
 * 統一仕訳（Journal）と過去仕訳（ConfirmedJournal）を同一の一覧で扱うための型。
 * UIはsource判別で描画を切り替える。
 *
 * 同一一覧に混在させる目的:
 * - 未出力仕訳を確定する作業中に、過去の類似仕訳を隣に並べて参照
 * - ソート・検索で科目・取引先が一致する過去仕訳を素早く発見
 * - 過去仕訳の値を未出力仕訳にドラッグコピーして再利用
 *
 * Phase 2: JournalPhase5Mock を廃止。ConfirmedJournal は後続で廃止予定。
 */
export type JournalListRow = ConfirmedJournal | Journal

/**
 * 過去仕訳（MFインポート/CSV取込）判定（型ガード）
 *
 * ConfirmedJournal / Journal のうち source が 'mf_import' or 'system' のものを判定。
 */
export function isMfJournal(row: JournalListRow): row is ConfirmedJournal {
  return 'source' in row && (row.source === 'mf_import' || row.source === 'system')
}

/**
 * 通常仕訳（未出力/出力済み/対象外/ゴミ箱）判定（型ガード）
 */
export function isAiJournal(row: JournalListRow): row is Journal {
  return !isMfJournal(row)
}

/**
 * 取込仕訳判定（UI用型ガード）
 *
 * UiJournal（normalizeJournalForUI通過後）で使用。
 * trueの場合、NormalizedConfirmedJournal にnarrowされる。
 * テンプレートで journal.imported_at 等にアクセス可能になる。
 *
 * JournalListRow / Journal との後方互換あり（オーバーロード）。
 */
export function isImportedJournal(journal: UiJournal): journal is NormalizedConfirmedJournal
export function isImportedJournal(journal: JournalListRow | Journal): boolean
export function isImportedJournal(journal: UiJournal | JournalListRow | Journal): boolean {
  return 'source' in journal && (journal.source === 'mf_import' || journal.source === 'system')
}
