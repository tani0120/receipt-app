/**
 * AccountRepository Supabase実装（DL-032）
 *
 * accounts + client_accounts テーブルへのCRUD。
 * データアクセスのみ。ロジックなし。
 *
 * 準拠: pipeline_design_master.md DL-030, DL-032
 */

import { getSupabase } from '@/lib/supabase'
import type { AccountRepository } from '@/repositories/types'
import type { Account } from '@/shared/types/account'
import { toAccount } from './helpers'

export const supabaseAccountRepo: AccountRepository = {
  async getAll(): Promise<Account[]> {
    const { data, error } = await getSupabase()
      .from('accounts')
      .select('*')
      .order('sort_order')

    if (error) throw new Error(`[AccountRepository] getAll失敗: ${error.message}`)
    return (data ?? []).map(toAccount)
  },

  async findById(id: string): Promise<Account | undefined> {
    const { data, error } = await getSupabase()
      .from('accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`[AccountRepository] findById失敗: ${error.message}`)
    return data ? toAccount(data) : undefined
  },

  async getAllForClient(clientId: string): Promise<Account[]> {
    // 1. 全科目取得
    const { data: allAccounts, error: accErr } = await getSupabase()
      .from('accounts')
      .select('*')
      .order('sort_order')

    if (accErr) throw new Error(`[AccountRepository] getAllForClient(accounts)失敗: ${accErr.message}`)

    // 2. 顧問先カスタム設定取得
    const { data: overrides, error: ovErr } = await getSupabase()
      .from('client_accounts')
      .select('*')
      .eq('client_id', clientId)

    if (ovErr) throw new Error(`[AccountRepository] getAllForClient(client_accounts)失敗: ${ovErr.message}`)

    // 3. マージ（カスタム名称・独自税区分の上書き）
    const overrideMap = new Map(
      (overrides ?? []).map((o: Record<string, unknown>) => [o.account_id as string, o])
    )

    return (allAccounts ?? []).map(row => {
      const base = toAccount(row)
      const ov = overrideMap.get(base.id)
      if (!ov) return base
      return {
        ...base,
        name: (ov.custom_name as string) ?? base.name,
        sub: (ov.custom_sub as string) ?? base.sub,
        defaultTaxCategoryId: (ov.custom_tax_category_id as string) ?? base.defaultTaxCategoryId,
        sortOrder: (ov.sort_order_override as number) ?? base.sortOrder,
        isCustom: true,
      }
    })
  },
}
