/**
 * ClientVendorRepository Supabase実装（DL-032）
 *
 * vendorsテーブル（scope='client'）へのCRUD。
 * データアクセスのみ。ロジックなし。
 *
 * 準拠: pipeline_design_master.md DL-030, DL-032
 */

import { getSupabase } from '@/lib/supabase'
import type { ClientVendorRepository } from '@/repositories/types'
import type { Vendor } from '@/types/pipeline/vendor.type'
import { toVendor, fromVendor } from './helpers'

export const supabaseClientVendorRepo: ClientVendorRepository = {
  async getByClientId(clientId: string): Promise<Vendor[]> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .eq('scope', 'client')
      .eq('client_id', clientId)

    if (error) throw new Error(`[ClientVendorRepository] getByClientId失敗: ${error.message}`)
    return (data ?? []).map(toVendor)
  },

  async findByMatchKey(clientId: string, key: string): Promise<Vendor | undefined> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .eq('scope', 'client')
      .eq('client_id', clientId)
      .eq('match_key', key)
      .maybeSingle()

    if (error) throw new Error(`[ClientVendorRepository] findByMatchKey失敗: ${error.message}`)
    return data ? toVendor(data) : undefined
  },

  async save(clientId: string, vendor: Vendor): Promise<void> {
    const row = fromVendor({ ...vendor, scope: 'client', client_id: clientId })

    const { error } = await getSupabase()
      .from('vendors')
      .upsert(row, { onConflict: 'vendor_id' })

    if (error) throw new Error(`[ClientVendorRepository] save失敗: ${error.message}`)
  },
}
