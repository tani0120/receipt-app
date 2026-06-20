import type { JournalPhase5Mock } from './journal_phase5_mock.type'
import type { ConfirmedJournal } from './confirmed_journal.type'

/**
 * 仕訳一覧行（判別共用体）
 *
 * 通常仕訳（JournalPhase5Mock）と過去仕訳（ConfirmedJournal）を
 * 同一の一覧で扱うための型。UIはsource判別で描画を切り替える。
 *
 * 同一一覧に混在させる目的:
 * - 未出力仕訳を確定する作業中に、過去の類似仕訳を隣に並べて参照
 * - ソート・検索で科目・取引先が一致する過去仕訳を素早く発見
 * - 過去仕訳の値を未出力仕訳にドラッグコピーして再利用
 */
export type JournalListRow = JournalPhase5Mock | ConfirmedJournal

/**
 * 過去仕訳（MFインポート/CSV取込）判定（型ガード）
 *
 * ConfirmedJournalにはsource（データ元）フィールドが存在する。
 * JournalPhase5Mockにはsourceが存在しない。
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
