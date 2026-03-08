/**
 * 進捗管理 — 型定義
 * Phase B TODO: Supabase APIレスポンス型と統合
 */

/** 月カラム（動的列ヘッダー用） */
export interface MonthColumn {
    /** キー: "2025-04" 形式 */
    key: string;
    /** 表示ラベル: "4月" */
    label: string;
    /** 年 */
    year: number;
    /** 月 (1-12) */
    month: number;
}

/** 進捗一覧行 */
export interface ProgressRow {
    id: string;
    uuid: string;
    code: string;
    status: 'active' | 'inactive' | 'suspension';
    type: 'corp' | 'individual';
    fiscalMonth: number;
    companyName: string;
    staffName: string;
    receivedDate: string;
    unexported: number;
    /** 月別仕訳数 キー: "2025-04" 形式 */
    monthlyJournals: Record<string, number>;
    currentYearJournals: number;
    lastYearJournals: number;
    /** ソート用の動的プロパティアクセス */
    [key: string]: unknown;
}
