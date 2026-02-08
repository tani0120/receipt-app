/**
 * journalStore
 *
 * 責務:
 * - unknown / 外部入力を UI-safe な ViewModel に正規化する
 * - domain ↔ UI の型安全な変換は adapters 層の責務
 *
 * Pattern:
 * - Phase 2 の receiptStore.ts と同じパターン
 * - Phase 5 で state管理を追加する場合もこのファイルに追加
 */

import type { JournalEntryViewModel } from '@/types/journalEntryViewModel'
import type { JournalLineVM } from '@/types/journalLineVM'
import { isJournalEntryStatus } from '@/shared/journalEntryStatus'

/**
 * unknown を JournalEntryViewModel に正規化
 *
 * 防御的な実装:
 * - 型が不正な場合はデフォルト値を使用
 * - UIが壊れないことを最優先
 */
export function normalizeJournalEntry(raw: unknown): JournalEntryViewModel {
    const rawObj = raw as Record<string, unknown>

    return {
        id: String(rawObj.id ?? ''),
        status: isJournalEntryStatus(rawObj.status) ? rawObj.status : 'Draft',
        clientId: String(rawObj.clientId ?? ''),
        lines: Array.isArray(rawObj.lines) ? rawObj.lines.map(normalizeJournalLine) : [],
    }
}

/**
 * unknown を JournalLineVM に正規化
 *
 * 鉄のルール:
 * ❌ 税判定しない
 * ❌ 補助科目触らない
 * ✅ UIが壊れないことだけ保証
 */
export function normalizeJournalLine(raw: unknown): JournalLineVM {
    const rawObj = raw as Record<string, unknown>

    return {
        id: String(rawObj.id ?? ''),
        accountCode: String(rawObj.accountCode ?? ''),
        accountName: rawObj.accountName ? String(rawObj.accountName) : undefined,
        debit: typeof rawObj.debit === 'number' ? rawObj.debit : 0,
        credit: typeof rawObj.credit === 'number' ? rawObj.credit : 0,
    }
}

// NOTE: Phase 5以降で useJournalStore() を追加予定
