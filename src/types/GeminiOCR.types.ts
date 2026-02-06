/**
 * Gemini OCR 型定義（改善反映版）
 *
 * Phase 6.2対象: レシート（RECEIPT）のみ
 * Phase 6.3以降: 通帳（PASSBOOK）、クレカ（CARD）
 *
 * 改善ポイント:
 * ① confidence フィールド追加（Phase 6.2-Bで使用）
 * ② errors のコード化（型安全性向上）
 */

// ========================================
// AI中間出力スキーマ（Geminiから直接返されるJSON）
// ========================================

/**
 * 税率別アイテム
 */
export interface TaxItem {
    /** 税率（10 or 8） */
    rate: 10 | 8;
    /** 税抜金額 */
    net: number;
    /** 消費税額 */
    tax: number;
}

/**
 * 監査結果
 */
export interface AuditResults {
    /** 重複チェック結果 */
    duplicate: boolean;
    /** 会計期間外チェック結果 */
    out_of_period: boolean;
    /** 貸借一致確認結果 */
    balance_check: 'OK' | 'NG';
}

/**
 * OCRエラーコード（改善②：型安全性向上）
 *
 * 文字列自由は将来破綻するため、コード化
 * - UI分岐での使用
 * - ログ集計での使用
 * - 再試行条件での使用
 */
export type OCRErrorCode =
    | 'PASSBOOK_NOT_SUPPORTED_YET'
    | 'CARD_NOT_SUPPORTED_YET'
    | 'DATE_OUT_OF_PERIOD'
    | 'DUPLICATE_DETECTED'
    | 'BALANCE_MISMATCH'
    | 'T_NUMBER_NOT_FOUND'
    | 'INVALID_IMAGE_FORMAT';

/**
 * AI中間出力スキーマ（レシート専用 - Phase 6.2）
 *
 * Gemini Flash OCRが返すJSON構造
 */
export interface AIIntermediateOutput {
    /** カテゴリ */
    category: 'RECEIPT' | 'PASSBOOK' | 'CARD' | 'EXCLUDED';
    /** 店名 */
    vendor: string;
    /** 日付（YYYY-MM-DD形式） */
    date: string;
    /** 総額 */
    total_amount: number;
    /** T番号（インボイス登録番号） */
    t_number?: string;
    /** 監査結果 */
    audit_results: AuditResults;
    /** エラーメッセージ配列（改善②：コード化） */
    errors: OCRErrorCode[];
    /** 税率別アイテム */
    tax_items: TaxItem[];
    /** 説明文（日本語） */
    explanation: string;
    /** 推論された科目名（T番号がない場合のみ） */
    inferred_category?: string;

    /** 各項目の信頼度（改善①：Phase 6.2-Bで使用） */
    confidence?: {
        total_amount?: number;
        date?: number;
        tax_items?: number;
        vendor?: number;
        t_number?: number;
    };
}

// ========================================
// 将来対応予定（Phase 6.3以降）
// ========================================

/*
 * 通帳行データ（Phase 6.3以降）
 *
interface PassbookRow {
  date: string;
  description: string;
  deposit: number | null;
  withdrawal: number | null;
  balance: number;
}
*/

/*
 * クレジットカード取引（Phase 6.3以降）
 *
interface CardTransaction {
  use_date: string;
  posting_date: string;
  merchant: string;
  amount: number;
}
*/

// ========================================
// Context Cache関連
// ========================================

/**
 * Context Cache情報
 */
export interface CachedContentInfo {
    /** Cache ID */
    cache_name: string;
    /** 有効期限 */
    expire_time: Date;
}

/**
 * Cache設定
 */
export interface CacheConfig {
    /** 顧問先ID */
    client_id: string;
    /** マスタファイルパス */
    master_file_path: string;
    /** TTL（秒単位） */
    ttl_seconds: number;
}
