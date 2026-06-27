import type { Journal } from './journal.type'

/**
 * 仕訳一覧行
 *
 * Phase 2完了: JournalPhase5Mock / ConfirmedJournal / UiJournal を廃止。
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
 * 取込仕訳判定（型ガード）
 *
 * source が 'mf_import' or 'system' の仕訳を判定する。
 * Phase 2: UiJournal/NormalizedConfirmedJournal廃止。引数・返り値ともにJournal。
 */
export function isImportedJournal(journal: Journal): boolean {
  return 'source' in journal && (journal.source === 'mf_import' || journal.source === 'system')
}
