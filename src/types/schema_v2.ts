// ここに用意した schema_v2.ts のコードを貼り付けてください

import { Timestamp } from 'firebase/firestore';

/**
 * ============================================================================
 * Schema V2.8 (Parallel Change Target)
 * ============================================================================
 * * このファイルは、既存の `src/types/firestore.ts` とは独立して管理される
 * 新しいデータ構造定義です。
 * * 方針:
 * 1. フラットな構造を避け、意味のある単位（management, financials等）でネストする
 * 2. Optional (?) を極力排除し、Union Typeで状態を厳格に管理する
 * 3. アプリケーション層（UI）とインフラ層（DB）の境界を明確にする
 */

// ============================================================================
// 0. Shared Kernel & Enums
// ============================================================================

export type DocumentId = string;
export type UserId = string;
export type ClientId = string;
export type CurrencyCode = 'JPY' | 'USD';

export interface BaseDocumentV2 {
    id: DocumentId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: number; // スキーマバージョン管理用
}

export type ProcessingStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'human_review_required';

// ============================================================================
// 1. User Aggregate
// ============================================================================

export type UserRole = 'admin' | 'standard' | 'viewer';

export interface UserDocument extends BaseDocumentV2 {
    profile: {
        displayName: string;
        email: string;
        avatarUrl?: string;
    };
    auth: {
        role: UserRole;
        permissions: string[];
        lastLoginAt: Timestamp;
    };
    config: {
        // レガシーではフラットだった設定値を集約
        hourly_charge_rate_jpy: number;
        theme_preference: 'light' | 'dark' | 'system';
        notification_enabled: boolean;
    };
}

// ============================================================================
// 2. Client Aggregate
// ============================================================================

export interface ClientDocument extends BaseDocumentV2 {
    name: string;

    // 営業・管理情報
    management: {
        is_active: boolean;
        person_in_charge_id: UserId;
        contract_start_date: Timestamp;
        tags: string[];
    };

    // 財務・請求設定
    financials: {
        currency: CurrencyCode;
        default_tax_rate: number; // e.g. 0.10
        closing_date_day: number; // 締め日 (1-31, 99=月末)
        payment_term_months: number; // 支払いサイト
    };

    // パフォーマンス指標（Batch計算用）
    current_month_stats: {
        sales_total: number;
        job_count: number;
        last_updated: Timestamp;
    };
}

// ============================================================================
// 3. WorkLog Aggregate (旧 Job)
// ============================================================================

export type WorkLogType = 'meeting' | 'development' | 'research' | 'documentation';

export interface WorkLogDocument extends BaseDocumentV2 {
    // References
    clientId: ClientId;
    workerId: UserId;

    // Core Data
    title: string;
    description: string;
    type: WorkLogType;

    // Time Tracking (厳格化)
    time_entry: {
        start: Timestamp;
        end: Timestamp | null; // 進行中はnull
        duration_minutes: number;
        is_billable: boolean;
    };

    // Financial Snapshot (作成時のレートを固定保存)
    snapshot: {
        applied_hourly_rate: number;
        calculated_cost: number;
    };

    status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

// ============================================================================
// 4. Receipt & AI Analysis Aggregate
// ============================================================================

export interface ReceiptDocument extends BaseDocumentV2 {
    uploaderId: UserId;

    // System Metadata
    system_meta: {
        original_filename: string;
        mime_type: string;
        file_size_bytes: number;
        storage_path: string; // S3 or Firebase Storage path
        hash: string; // 重複検知用
    };

    status: ProcessingStatus;

    // OCR Extraction Data (AIが見取った生データ)
    ocr_data: {
        provider: 'google_vision' | 'aws_textract' | 'azure_form';
        raw_text_dump: string;
        confidence_score: number;
        extracted_date?: string; // YYYY-MM-DD
        extracted_amount?: number;
        merchant_candidate?: string;
    };

    // Structured Accounting Data (人間またはAIが確定させたデータ)
    accounting_data: {
        confirmed_date: Timestamp;
        confirmed_amount: number;
        tax_amount: number;
        merchant_name: string;
        currency: CurrencyCode;

        // インボイス制度対応
        invoice_registration_number?: string;
        is_eligible_invoice: boolean;
    };

    // AI Analytics Metrics
    metrics: {
        processing_time_ms: number;
        retry_count: number;
    };

    // Human interaction logs
    human_analytics: {
        modified_by_user: boolean; // AIの結果を修正したか
        correction_distance: number; // 修正量（レーベンシュタイン距離など）
    };
}
