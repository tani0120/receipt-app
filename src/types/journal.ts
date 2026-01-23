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

import type { Job, JournalLine as FirestoreJournalLine } from './firestore';
import type { JobStatus } from './job';

// Re-export or extend Firestore Line definition if needed
export type JournalLine = FirestoreJournalLine;

/**
 * Journal Entry (Workbench Data Model)
 * 画面Eで扱う、仕訳編集用のアグリゲートオブジェクト
 */
export interface JournalEntry {
    id: string;

    // 証憑関連
    evidenceUrl?: string; // driveFileUrl
    evidenceId: string;   // driveFileId

    // 仕訳データ
    lines: JournalLine[];

    // 計算フィールド (UI用)
    totalAmount: number;
    balanceDiff: number; // 貸借差額 (0なら正常)

    // メタデータ (Jobとのリンク)
    clientCode: string;
    status: JobStatus;

    // Client Tax Settings (For Validations)
    consumptionTaxMode: 'general' | 'simplified' | 'exempt';
    simplifiedTaxCategory?: 1 | 2 | 3 | 4 | 5 | 6;

    transactionDate: Date; // TimestampをDateに変換して保持することを推奨

    // 差戻し対応
    remandReason?: string;
    remandCount: number; // 差戻し回数 (DBに追加が必要)

    updatedAt: Date;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    balanceDiff: number;
}
