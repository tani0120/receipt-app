/**
 * PostgreSQL (Supabase) 型定義
 * Streamed互換設計
 */

import type { ReceiptStatus } from '@/shared/receiptStatus'


export interface Receipt {
    id: string;
    client_id: string;
    drive_file_id: string;
    status: ReceiptStatus;
    current_version: number;
    confirmed_journal: unknown | null;
    display_snapshot: unknown | null;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
    id: number;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string;
    before_json: unknown | null;
    after_json: unknown | null;
    created_at: string;
}
