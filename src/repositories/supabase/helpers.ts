/**
 * Supabase版Repository共通ヘルパー
 *
 * DB行 ↔ TS型の変換関数を集約。
 * Repository間で共有し、DRY違反を防止。
 *
 * 【注意】変換関数はロジックではない（データマッピングのみ）。
 */

import type { Vendor } from '@/types/pipeline/vendor.type'
import type { Account } from '@/shared/types/account'

/** DB行 → Vendor型への変換 */
export function toVendor(row: Record<string, unknown>): Vendor {
  return {
    vendor_id: row.vendor_id as string,
    company_name: row.company_name as string,
    match_key: row.match_key as string,
    display_name: (row.display_name as string) ?? null,
    aliases: (row.aliases as string[]) ?? [],
    t_numbers: (row.t_numbers as string[]) ?? [],
    phone_numbers: (row.phone_numbers as string[]) ?? [],
    brand_id: (row.brand_id as string) ?? undefined,
    address: (row.address as string) ?? null,
    vendor_vector: (row.vendor_vector as Vendor['vendor_vector']) ?? null,
    non_vendor_type: (row.non_vendor_type as Vendor['non_vendor_type']) ?? null,
    source_category: (row.source_category as Vendor['source_category']) ?? null,
    level: (row.level as Vendor['level']) ?? null,
    direction: (row.direction as Vendor['direction']) ?? null,
    amount_threshold: (row.amount_threshold as number) ?? null,
    debit_account: (row.debit_account as string) ?? null,
    debit_account_over: (row.debit_account_over as string) ?? null,
    debit_sub_account: (row.debit_sub_account as string) ?? null,
    debit_tax_category: (row.debit_tax_category as string) ?? null,
    debit_department: (row.debit_department as string) ?? null,
    credit_account: (row.credit_account as string) ?? null,
    credit_sub_account: (row.credit_sub_account as string) ?? null,
    credit_tax_category: (row.credit_tax_category as string) ?? null,
    credit_department: (row.credit_department as string) ?? null,
    scope: (row.scope as Vendor['scope']) ?? 'global',
    client_id: (row.client_id as string) ?? null,
  }
}

/** Vendor型 → DB行への変換 */
export function fromVendor(vendor: Vendor): Record<string, unknown> {
  return {
    vendor_id: vendor.vendor_id,
    company_name: vendor.company_name,
    match_key: vendor.match_key,
    display_name: vendor.display_name,
    aliases: vendor.aliases,
    t_numbers: vendor.t_numbers,
    phone_numbers: vendor.phone_numbers,
    brand_id: vendor.brand_id ?? null,
    address: vendor.address,
    vendor_vector: vendor.vendor_vector,
    non_vendor_type: vendor.non_vendor_type,
    source_category: vendor.source_category,
    level: vendor.level,
    direction: vendor.direction,
    amount_threshold: vendor.amount_threshold,
    debit_account: vendor.debit_account,
    debit_account_over: vendor.debit_account_over,
    debit_sub_account: vendor.debit_sub_account,
    debit_tax_category: vendor.debit_tax_category,
    debit_department: vendor.debit_department,
    credit_account: vendor.credit_account,
    credit_sub_account: vendor.credit_sub_account,
    credit_tax_category: vendor.credit_tax_category,
    credit_department: vendor.credit_department,
    scope: vendor.scope,
    client_id: vendor.client_id,
  }
}

/** DB行 → Account型への変換 */
export function toAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    sub: (row.sub as string) ?? undefined,
    target: (row.target as Account['target']) ?? 'both',
    accountGroup: (row.account_group as Account['accountGroup']) ?? 'PL_EXPENSE',
    category: (row.category as string) ?? '',
    defaultTaxCategoryId: (row.default_tax_category_id as string) ?? undefined,
    taxDetermination: (row.tax_determination as Account['taxDetermination']) ?? 'auto_purchase',
    deprecated: (row.deprecated as boolean) ?? false,
    effectiveFrom: (row.effective_from as string) ?? '2019-10-01',
    effectiveTo: (row.effective_to as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    isCustom: (row.is_custom as boolean) ?? false,
    insertAfter: (row.insert_after as string) ?? undefined,
  }
}
