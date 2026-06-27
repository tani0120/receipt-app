/**
 * UI表示用仕訳型（journal-ui.types.ts）
 *
 * Phase 2完了: UiJournal / NormalizedConfirmedJournal を廃止。
 * Journal（統一仕訳型）のみ使用。
 *
 * 本ファイルはJournalの再exportのみ。
 * 他ファイルが journal-ui.types.ts からJournalを参照している箇所の
 * 後方互換のために残す。将来的に不要になれば削除。
 */

import type { Journal } from './journal.type'

// Journal（統一仕訳型）の再export
export type { Journal }
