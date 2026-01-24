/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【型安全性ルール - AI必須遵守事項】
 *
 * ❌ 禁止事項（6項目）- NEVER DO THESE:
 * 1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
 * 2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
 * 3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
 * 4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
 * 5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
 * 6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT
 *
 * ✅ 許可事項（3項目）- ALLOWED:
 * 1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
 * 2. unknown型の使用（型ガードと組み合わせて）
 * 3. 必要最小限の型定義（Pick<T>, Omit<T>等）
 *
 * 詳細: complete_evidence_no_cover_up.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * JournalEntry と JournalLine の型定義
 *
 * 重要: これらの型は JournalEntrySchema.ts の Zod スキーマから自動推論されます。
 * 型の定義を変更する場合は、JournalEntrySchema.ts を変更してください。
 *
 * ADR-011: 型定義の一元化（Single Source of Truth）
 * - Zodスキーマが唯一の真実（SSOT）
 * - TypeScript型はZodスキーマから推論
 * - 型定義の二重管理を防ぐ
 *
 * 修正履歴:
 * - 2026-01-24: TD-001対応 - Zodスキーマからの推論に完全移行
 *   独自のinterface定義を削除し、JournalEntrySchema.tsからの再エクスポートに変更
 */

// JournalEntrySchema.ts からの型推論（再エクスポート）
export type {
    JournalEntry,
    JournalEntryDraft,
    JournalLine,
    JournalLineDraft,
    AISourceType,
    TaxType,
    TaxCode,
    InvoiceDeduction,
    TaxAmountSource,
    TaxDiscrepancySeverity,
    FileType,
} from '@/features/journal';

// JobStatus はFirestore型定義から取得
export type { JobStatus } from './firestore';

/**
 * バリデーション結果の型定義
 *
 * 注意: この型はZodスキーマには含まれません（UI専用の型）
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    balanceDiff: number;
}
