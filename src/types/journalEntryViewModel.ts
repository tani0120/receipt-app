import type { JournalEntryStatus } from '@/shared/journalEntryStatus'
import type { JournalLineVM } from './journalLineVM'

/**
 * JournalEntryViewModel
 *
 * UI表示用のJournal Entry構造:
 * - id: 識別子
 * - status: 5つの状態（Draft, Submitted, Approved, READY_FOR_WORK, REMANDED）
 * - clientId: 顧問先ID
 * - lines: 仕訳明細行（JournalLineVMの配列）
 */

export interface JournalEntryViewModel {
    id: string
    status: JournalEntryStatus
    clientId: string
    lines: JournalLineVM[]
}
