import { supabase } from '../supabase/client';
import type { Document, DocumentStatus } from '../types/document.types';

export const documentRepository = {
    /**
     * ステータスでDocument一覧取得
     */
    async getByStatus(status: DocumentStatus): Promise<Document[]> {
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('status', status);

        if (error) throw error;
        return data;
    },

    /**
     * 🔴 修正② Document更新（SQL function使用でトランザクション保証）
     * race condition 完全防止、状態変更＋監査を原子的に実行
     */
    async updateStatus(
        id: string,
        newStatus: DocumentStatus,
        actor: string
    ): Promise<void> {
        const { error } = await supabase.rpc('update_receipt_status', {
            p_id: id,
            p_new_status: newStatus,
            p_actor: actor
        });

        if (error) throw error;
    },

    /**
     * Document確定（confirmed_journal必須チェック付き）
     */
    async confirmDocument(
        id: string,
        journal: unknown,
        actor: string
    ): Promise<void> {
        // 1. confirmed_journal を設定
        const { error: updateError } = await supabase
            .from('receipts')
            .update({ confirmed_journal: journal })
            .eq('id', id);

        if (updateError) throw updateError;

        // 2. status を confirmed に変更（CHECK制約が自動検証）
        await this.updateStatus(id, 'confirmed', actor);
    }
};
