import type { JournalPhase5Mock } from './journal_phase5_mock.type'
import type { ConfirmedJournal } from './confirmed_journal.type'
import type { Journal } from './journal.type'
import type { UiJournal, NormalizedConfirmedJournal } from './journal-ui.types'

/**
 * 仕訳一覧行（判別共用体）
 *
 * 通常仕訳（JournalPhase5Mock）と過去仕訳（ConfirmedJournal）と
 * 統一仕訳（Journal）を同一の一覧で扱うための型。
 * UIはsource判別で描画を切り替える。
 *
 * 同一一覧に混在させる目的:
 * - 未出力仕訳を確定する作業中に、過去の類似仕訳を隣に並べて参照
 * - ソート・検索で科目・取引先が一致する過去仕訳を素早く発見
 * - 過去仕訳の値を未出力仕訳にドラッグコピーして再利用
 *
 * Phase 1: Journal（統一仕訳型）を追加。
 * Phase 2完了後: JournalListRow = Journal に単純化予定。
 */
export type JournalListRow = JournalPhase5Mock | ConfirmedJournal | Journal

/**
 * 過去仕訳（MFインポート/CSV取込）判定（型ガード）
 *
 * ConfirmedJournal / Journal のうち source が 'mf_import' or 'system' のものを判定。
 * JournalPhase5Mock には source が optional なため、'source' in row でガード。
 *
 * Phase 2完了後: 全仕訳が Journal 型になるため 'source' in row ガードは不要になる。
 */
export function isMfJournal(row: JournalListRow): row is ConfirmedJournal {
  return 'source' in row && (row.source === 'mf_import' || row.source === 'system')
}

/**
 * 通常仕訳（未出力/出力済み/対象外/ゴミ箱）判定（型ガード）
 */
export function isAiJournal(row: JournalListRow): row is JournalPhase5Mock {
  return !isMfJournal(row)
}

/**
 * 取込仕訳判定（UI用型ガード）
 *
 * UiJournal（normalizeJournalForUI通過後）で使用。
 * trueの場合、NormalizedConfirmedJournal にnarrowされる。
 * テンプレートで journal.imported_at 等にアクセス可能になる。
 *
 * JournalListRow / JournalPhase5Mock / Journal との後方互換あり（オーバーロード）。
 */
export function isImportedJournal(journal: UiJournal): journal is NormalizedConfirmedJournal
export function isImportedJournal(journal: JournalListRow | JournalPhase5Mock | Journal): boolean
export function isImportedJournal(journal: UiJournal | JournalListRow | JournalPhase5Mock | Journal): boolean {
  return 'source' in journal && (journal.source === 'mf_import' || journal.source === 'system')
}

