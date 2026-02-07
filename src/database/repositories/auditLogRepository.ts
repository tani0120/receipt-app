import { supabase } from '../supabase/client';
import type { AuditLog } from '../types/receipt.types';

export const auditLogRepository = {
    /**
     * エンティティの監査ログ取得
     */
    async getByEntity(
        entityType: string,
        entityId: string
    ): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * 監査ログ手動記録（通常はSQL functionが自動記録）
     */
    async create(
        entityType: string,
        entityId: string,
        action: string,
        actor: string,
        beforeJson: unknown = null,
        afterJson: unknown = null
    ): Promise<void> {
        const { error } = await supabase.from('audit_logs').insert({
            entity_type: entityType,
            entity_id: entityId,
            action,
            actor,
            before_json: beforeJson,
            after_json: afterJson
        });

        if (error) throw error;
    }
};
