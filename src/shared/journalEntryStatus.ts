/**
 * Journal Entry Status定義
 *
 * 5つの状態:
 * - Draft: OCR直後（編集中）
 * - Submitted: 提出済み
 * - Approved: 承認済み
 * - READY_FOR_WORK: 1次作業待ち
 * - REMANDED: 差戻し状態
 *
 * 参照元: JournalEntrySchema.ts L271-276
 */

export const JOURNAL_ENTRY_STATUSES = [
    'Draft',
    'Submitted',
    'Approved',
    'READY_FOR_WORK',
    'REMANDED',
] as const

export type JournalEntryStatus = typeof JOURNAL_ENTRY_STATUSES[number]

export function isJournalEntryStatus(value: unknown): value is JournalEntryStatus {
    return typeof value === 'string' && JOURNAL_ENTRY_STATUSES.includes(value as JournalEntryStatus)
}
