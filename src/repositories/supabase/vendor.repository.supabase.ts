/**
 * VendorRepository Supabase実装（DL-032）
 *
 * vendorsテーブルへのCRUD。
 * データアクセスのみ。ロジックなし。
 *
 * 準拠: pipeline_design_master.md DL-030, DL-032
 */

import { getSupabase } from '@/lib/supabase'
import type { VendorRepository } from '@/repositories/types'
import type { Vendor } from '@/types/pipeline/vendor.type'
import { toVendor } from './helpers'

export const supabaseVendorRepo: VendorRepository = {
  async getAll(): Promise<Vendor[]> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .eq('scope', 'global')

    if (error) throw new Error(`[VendorRepository] getAll失敗: ${error.message}`)
    return (data ?? []).map(toVendor)
  },

  async findByMatchKey(key: string): Promise<Vendor | undefined> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .eq('match_key', key)
      .eq('scope', 'global')
      .maybeSingle()

    if (error) throw new Error(`[VendorRepository] findByMatchKey失敗: ${error.message}`)
    return data ? toVendor(data) : undefined
  },

  async findByTNumber(tNumber: string): Promise<Vendor | undefined> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .contains('t_numbers', [tNumber])
      .maybeSingle()

    if (error) throw new Error(`[VendorRepository] findByTNumber失敗: ${error.message}`)
    return data ? toVendor(data) : undefined
  },

  async findByPhoneNumber(phone: string): Promise<Vendor | undefined> {
    const { data, error } = await getSupabase()
      .from('vendors')
      .select('*')
      .contains('phone_numbers', [phone])
      .maybeSingle()

    if (error) throw new Error(`[VendorRepository] findByPhoneNumber失敗: ${error.message}`)
    return data ? toVendor(data) : undefined
  },
}
