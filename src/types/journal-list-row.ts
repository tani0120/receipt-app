import type { Journal } from './journal.type'
import type { UiJournal, NormalizedConfirmedJournal } from './journal-ui.types'

/**
 * 仕訳一覧行
 *
 * Phase 2完了: JournalPhase5Mock / ConfirmedJournal を廃止。
 * JournalListRow = Journal に単純化。
 *
 * 将来的にこの型エイリアスも不要になるが、後方互換のため当面残す。
 */
export type JournalListRow = Journal

/**
 * 過去仕訳（MFインポート/CSV取込）判定（型ガード）
 *
 * source が 'mf_import' or 'system' のものを判定。
 */
export function isMfJournal(row: JournalListRow): row is Journal {
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
