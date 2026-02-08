/**
 * JournalLineVM (Journal Line View Model)
 *
 * UI表示用の最小構成:
 * - id: 識別子
 * - accountCode: 勘定科目コード（必須）
 * - accountName: 勘定科目名（オプショナル、UI表示用）
 * - debit: 借方金額
 * - credit: 貸方金額
 *
 * Phase 5送り:
 * - subAccount（補助科目）
 * - taxType, taxRate（税区分・税率）
 * - memo（メモ）
 */

export interface JournalLineVM {
    id: string
    accountCode: string
    accountName?: string
    debit: number
    credit: number
}
