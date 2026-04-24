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
    clientId: string;
    code: string;
    status: 'active' | 'inactive' | 'suspension';
    type: 'corp' | 'individual';
    fiscalMonth: number;
    companyName: string;
    repName?: string;
    receivedDate: string;
    /** 未選別（送信確定前のトータル書類枚数。migrate後に0になる） */
    unsorted: number;
    /** 未出力（仕訳残の件数） */
    unexported: number;
    /** 月別仕訳数 キー: "2025-04" 形式 */
    monthlyJournals: Record<string, number>;
    currentYearJournals: number;
    lastYearJournals: number;
    /** ソート用の動的プロパティアクセス */
    [key: string]: unknown;
}
