/**
 * 復元期システム憲法に基づく「聖典」
 * 単一情報源 (Single Source of Truth)
 * @see current.md
 */

// #region COMMON_RULES

/**
 * 税区分スキーマ定義テキスト
 * Deep Dive Logic V2 準拠の税区分定義
 */
export const TAX_SCHEMA_TEXT = `
【売上区分】
TAX_SALES_10: 課税売上 10%
TAX_SALES_8_RED: 課税売上 8% (軽減)
TAX_SALES_EXPORT: 輸出免税売上
TAX_SALES_EXEMPT_OTHER: その他免税売上 (国際輸送等)
TAX_SALES_NON_TAXABLE: 非課税売上
TAX_SALES_NONE: 対象外/不課税売上

【仕入区分】
TAX_PURCHASE_10: 課税仕入 10%
TAX_PURCHASE_8_RED: 課税仕入 8% (軽減)
TAX_PURCHASE_NON_DEDUCTIBLE: 課税仕入 (控除対象外)
TAX_PURCHASE_FOR_NON_TAXABLE_SALES: 非課税売上対応仕入 (控除不可)
TAX_PURCHASE_FOR_EXEMPT_SALES: 免税売上対応仕入 (控除不可)
TAX_PURCHASE_NO_INVOICE: インボイスなし仕入 (控除不可)
TAX_PURCHASE_FROM_EXEMPT: 免税事業者からの仕入 (控除不可)
TAX_PURCHASE_NONE: 対象外/不課税仕入
`;

/**
 * 税区分オプション定義
 * UI選択肢として使用
 */
export const TAX_OPTIONS = [
    // 【売上区分】
    { code: 'TAX_SALES_10', label: '課税売上 10%', type: 'sales' },
    { code: 'TAX_SALES_8_RED', label: '課税売上 8% (軽減)', type: 'sales' },
    { code: 'TAX_SALES_EXPORT', label: '輸出免税売上', type: 'sales' },
    { code: 'TAX_SALES_EXEMPT_OTHER', label: 'その他免税売上', type: 'sales' },
    { code: 'TAX_SALES_NON_TAXABLE', label: '非課税売上', type: 'sales' },
    { code: 'TAX_SALES_NONE', label: '対象外/不課税売上', type: 'sales' },

    // 【簡易課税売上】(第1種〜第6種)
    { code: 'TAX_SIMPLIFIED_1', label: '簡易課税売上 (第1種)', type: 'sales' },
    { code: 'TAX_SIMPLIFIED_2', label: '簡易課税売上 (第2種)', type: 'sales' },
    { code: 'TAX_SIMPLIFIED_3', label: '簡易課税売上 (第3種)', type: 'sales' },
    { code: 'TAX_SIMPLIFIED_4', label: '簡易課税売上 (第4種)', type: 'sales' },
    { code: 'TAX_SIMPLIFIED_5', label: '簡易課税売上 (第5種)', type: 'sales' },
    { code: 'TAX_SIMPLIFIED_6', label: '簡易課税売上 (第6種)', type: 'sales' },

    // 【仕入区分】
    { code: 'TAX_PURCHASE_10', label: '課税仕入 10%', type: 'purchase' },
    { code: 'TAX_PURCHASE_8_RED', label: '課税仕入 8% (軽減)', type: 'purchase' },
    { code: 'TAX_PURCHASE_NON_DEDUCTIBLE', label: '課税仕入 (控除対象外)', type: 'purchase' },
    { code: 'TAX_PURCHASE_FOR_NON_TAXABLE_SALES', label: '非課税売上に対応する仕入 (控除不可)', type: 'purchase' },
    { code: 'TAX_PURCHASE_FOR_EXEMPT_SALES', label: '免税売上に対応する仕入 (控除不可)', type: 'purchase' },
    { code: 'TAX_PURCHASE_NO_INVOICE', label: 'インボイスなし仕入 (控除不可)', type: 'purchase' },
    { code: 'TAX_PURCHASE_FROM_EXEMPT', label: '免税事業者からの仕入 (経過措置)', type: 'purchase' },
    { code: 'TAX_PURCHASE_NONE', label: '対象外/不課税仕入', type: 'purchase' },
];

/**
 * 物理シートID定義
 * システムで使用するGoogle Sheetsのシート名マッピング
 */
export const SHEET_IDS = {
    COMMON_RULES: "00_共通",
    CLIENT_MASTER: "01_ClientMaster",
    TAX_MASTER: "03_TaxMaster",
    RULE_MASTER: "04_RuleMaster",
    AUDIT_LOGS: "05_AuditLogs",
    JOB_QUEUE: "06_JobQueue",
    WORKBENCH: "10_ワークベンチ"
};

/**
 * 物理フォルダID定義
 * Google Drive フォルダ構成とIDマッピング
 */
export const FOLDER_IDS = {
    PRE_VALIDATION: "98_検証前フォルダ",
    POST_VALIDATION: "99_検証後フォルダ",
    TRASH_ID: "除外保管ID"
};

/**
 * 共通ルール定義テキスト
 * Phase 1〜7 のロジック分岐マップ
 */
export const COMMON_RULES_TEXT = `
■第1章：論理地図（分岐ツリー）
[START] 全取引データ
   │
   ├─ phase1: 前処理 (重複チェック・期間外チェック)
   │
   ├─ phase2: BS取引判定 (Rule G)
   │    ├── 自社口座間移動 ──> [対象外] 資金移動
   │    └── クレカ引落/未払 ─> [対象外] 未払金消込
`;

// #endregion

// #region COMMON_CORE

/**
 * スタッフパフォーマンス指標 (StaffPerformance)
 * ダッシュボード表示用の個人の作業実績データ
 */
export interface StaffPerformance {
    name: string;
    backlogs: { draft: number; remand: number; approve: number; total: number; };
    velocity: { draftAvg: number; approveAvg: number; };
}

/**
 * システム全体KPI (SystemKPI)
 * ダッシュボード表示用のシステム稼働状況データ
 */
export interface SystemKPI {
    monthlyJournals: number;
    autoConversionRate: number;
    aiAccuracy: number;
    funnel: { received: number; processed: number; exported: number; };
    monthlyTrend: number[];
}

// #endregion
