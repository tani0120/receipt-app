import type { Job, JournalLine as FirestoreJournalLine } from './aaa_firestore';
import type { JobStatus } from './aaa_job';

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
