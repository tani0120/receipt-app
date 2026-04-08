/**
 * ShareStatusRepository Supabase実装（DL-031）
 *
 * share_statusテーブルへのCRUD + Realtimeサブスクリプション。
 * データアクセスのみ。ロジックなし。
 *
 * 【フェーズ5で有効化】
 * index.ts のfactory関数でモック→Supabaseに切り替えるだけで動作。
 *
 * 準拠: pipeline_design_master.md DL-030, DL-031
 */

import { getSupabase } from '@/lib/supabase'
import type { ShareStatusRecord, ShareStatusRepository } from '@/repositories/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const supabaseShareStatusRepo: ShareStatusRepository = {
  async getAll(): Promise<ShareStatusRecord[]> {
    const { data, error } = await getSupabase()
      .from('share_status')
      .select('client_id, status, invite_code, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw new Error(`[ShareStatusRepository] getAll失敗: ${error.message}`)

    return (data ?? []).map(row => ({
      clientId: row.client_id,
      status: row.status,
      inviteCode: row.invite_code,
      updatedAt: row.updated_at,
    }))
  },

  async getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    const { data, error } = await getSupabase()
      .from('share_status')
      .select('client_id, status, invite_code, updated_at')
      .eq('client_id', clientId)
      .maybeSingle()

    if (error) throw new Error(`[ShareStatusRepository] getByClientId失敗: ${error.message}`)
    if (!data) return undefined

    return {
      clientId: data.client_id,
      status: data.status,
      inviteCode: data.invite_code,
      updatedAt: data.updated_at,
    }
  },

  async updateStatus(clientId: string, status): Promise<void> {
    const { error } = await getSupabase()
      .from('share_status')
      .upsert({
        client_id: clientId,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' })

    if (error) throw new Error(`[ShareStatusRepository] updateStatus失敗: ${error.message}`)
  },

  async saveInviteCode(clientId: string, code: string): Promise<void> {
    // 1. invitationsテーブルにコードを保存
    const { error: invError } = await getSupabase()
      .from('invitations')
      .upsert({
        code,
        client_id: clientId,
        created_by: (await getSupabase().auth.getUser()).data.user?.id,
        is_active: true,
      }, { onConflict: 'code' })

    if (invError) throw new Error(`[ShareStatusRepository] saveInviteCode(invitations)失敗: ${invError.message}`)

    // 2. share_statusテーブルに招待コードを紐付
    const { error: ssError } = await getSupabase()
      .from('share_status')
      .upsert({
        client_id: clientId,
        status: 'pending',
        invite_code: code,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' })

    if (ssError) throw new Error(`[ShareStatusRepository] saveInviteCode(share_status)失敗: ${ssError.message}`)
  },
}

// ============================================================
// Realtimeサブスクリプション（composableから呼ぶ用）
// ============================================================

/**
 * share_statusテーブルのリアルタイム変更を監視
 *
 * 使い方（composable側）:
 * ```ts
 * const channel = subscribeShareStatus((payload) => {
 *   // payload.new.client_id, payload.new.status でキャッシュ更新
 *   refreshStatus()
 * })
 * // アンマウント時
 * unsubscribeShareStatus(channel)
 * ```
 */
export function subscribeShareStatus(
  onChange: (payload: { new: { client_id: string; status: string } }) => void
): RealtimeChannel {
  return getSupabase()
    .channel('share_status_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'share_status' },
      (payload) => onChange(payload as unknown as { new: { client_id: string; status: string } })
    )
    .subscribe()
}

export function unsubscribeShareStatus(channel: RealtimeChannel): void {
  getSupabase().removeChannel(channel)
}
