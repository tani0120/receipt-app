/**
 * seed.cjs — Supabase seedスクリプト
 *
 * 【概要】
 * JSON/TSデータファイルからマスタデータを読み込み、
 * Supabaseのテーブルに INSERT する SQL文を生成・実行する。
 *
 * 【対象テーブル（5種）】
 * 1. staff（7件）         ← data/staff.json
 * 2. vendors（250件）     ← data/vendors.json（scope='global'のみ）
 * 3. accounts（241件）    ← data/account-master.json
 * 4. tax_categories（151件）← data/tax-category-master.json
 * 5. industry_vectors（68+68件）← data/industry-vectors-corporate.json + sole.json
 *
 * 【使い方】
 * node supabase/seed.cjs
 *   → supabase/seed.sql を生成
 *   → supabase db reset 時に自動適用
 *
 * 【設計判断】
 * - SQL直書きではなくスクリプトで生成する理由:
 *   データ件数が多い（合計700件超）ため手書きは非現実的
 * - ON CONFLICT DO NOTHING で冪等性を保証
 * - エスケープ: シングルクォートを二重化（SQLインジェクション防止）
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'data')
const outFile = path.join(__dirname, 'seed.sql')

/** SQLエスケープ（シングルクォート二重化 + NULL対応） */
function esc(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return String(val)
  return `'${String(val).replace(/'/g, "''")}'`
}

/** JSONB値のエスケープ */
function escJsonb(val) {
  if (val === null || val === undefined) return 'NULL'
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
}

/** TEXT[]値のエスケープ */
function escTextArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'::text[]"
  const items = arr.map(v => `"${String(v).replace(/"/g, '\\"')}"`)
  return `'{${items.join(',')}}'::text[]`
}

const lines = []
lines.push('-- ============================================================')
lines.push('-- Supabase seedデータ（自動生成）')
lines.push(`-- 生成日時: ${new Date().toISOString()}`)
lines.push('-- 生成元: supabase/seed.cjs')
lines.push('-- ============================================================')
lines.push('')

// ──────────────────────────────────────────────
// 1. staff（7件）
// ──────────────────────────────────────────────
const staffData = JSON.parse(fs.readFileSync(path.join(dataDir, 'staff.json'), 'utf8'))
lines.push('-- § 1. staff（' + staffData.length + '件）')
lines.push('-- 元データ: data/staff.json')
lines.push('')

for (const s of staffData) {
  lines.push(`INSERT INTO staff (uuid, name, email, role, status, name_romaji)`)
  lines.push(`VALUES (${esc(s.uuid)}, ${esc(s.name)}, ${esc(s.email)}, ${esc(s.role)}, ${esc(s.status)}, ${esc(s.nameRomaji)})`)
  lines.push(`ON CONFLICT (uuid) DO NOTHING;`)
  lines.push('')
}

// ──────────────────────────────────────────────
// 2. vendors（scope='global'のみ）
// ──────────────────────────────────────────────
const vendorsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'vendors.json'), 'utf8'))
const globalVendors = vendorsData.filter(v => v.scope === 'global')
lines.push('-- § 2. vendors / scope=global（' + globalVendors.length + '件）')
lines.push('-- 元データ: data/vendors.json')
lines.push('')

for (const v of globalVendors) {
  lines.push(`INSERT INTO vendors (`)
  lines.push(`  vendor_id, company_name, match_key, display_name,`)
  lines.push(`  aliases, t_numbers, phone_numbers, address,`)
  lines.push(`  vendor_vector, non_vendor_type, source_category,`)
  lines.push(`  level, direction, amount_threshold,`)
  lines.push(`  debit_account, debit_account_over, debit_sub_account,`)
  lines.push(`  debit_tax_category, debit_department,`)
  lines.push(`  credit_account, credit_sub_account, credit_tax_category,`)
  lines.push(`  credit_department, scope, client_id`)
  lines.push(`) VALUES (`)
  lines.push(`  ${esc(v.vendor_id)}, ${esc(v.company_name)}, ${esc(v.match_key)}, ${esc(v.display_name)},`)
  lines.push(`  ${escTextArray(v.aliases)}, ${escTextArray(v.t_numbers)}, ${escTextArray(v.phone_numbers)}, ${esc(v.address)},`)
  lines.push(`  ${esc(v.vendor_vector)}, ${esc(v.non_vendor_type)}, ${esc(v.source_category)},`)
  lines.push(`  ${esc(v.level)}, ${esc(v.direction)}, ${v.amount_threshold === null ? 'NULL' : v.amount_threshold},`)
  lines.push(`  ${esc(v.debit_account)}, ${esc(v.debit_account_over)}, ${esc(v.debit_sub_account)},`)
  lines.push(`  ${esc(v.debit_tax_category)}, ${esc(v.debit_department)},`)
  lines.push(`  ${esc(v.credit_account)}, ${esc(v.credit_sub_account)}, ${esc(v.credit_tax_category)},`)
  lines.push(`  ${esc(v.credit_department)}, ${esc(v.scope)}, ${esc(v.client_id)}`)
  lines.push(`) ON CONFLICT (vendor_id) DO NOTHING;`)
  lines.push('')
}

// ──────────────────────────────────────────────
// 3. accounts（241件）
// ──────────────────────────────────────────────
const accountsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'account-master.json'), 'utf8'))
lines.push('-- § 3. accounts（' + accountsData.length + '件）')
lines.push('-- 元データ: data/account-master.json')
lines.push('')

for (const a of accountsData) {
  lines.push(`INSERT INTO accounts (`)
  lines.push(`  id, name, target, account_group, category,`)
  lines.push(`  default_tax_category_id, effective_from, effective_to,`)
  lines.push(`  sort_order, hidden_in_master, is_custom, hidden,`)
  lines.push(`  is_master_custom, is_client_custom, source`)
  lines.push(`) VALUES (`)
  lines.push(`  ${esc(a.accountId)}, ${esc(a.name)}, ${esc(a.target)}, ${esc(a.accountGroup)}, ${esc(a.category)},`)
  lines.push(`  ${esc(a.defaultTaxCategoryId)}, ${esc(a.effectiveFrom)}, ${esc(a.effectiveTo)},`)
  lines.push(`  ${a.sortOrder}, ${a.hiddenInMaster}, ${a.isCustom}, ${a.hidden},`)
  lines.push(`  ${a.isMasterCustom}, ${a.isClientCustom}, ${esc(a.source)}`)
  lines.push(`) ON CONFLICT (id) DO NOTHING;`)
  lines.push('')
}

// ──────────────────────────────────────────────
// 4. tax_categories（151件）
// ──────────────────────────────────────────────
const taxRaw = JSON.parse(fs.readFileSync(path.join(dataDir, 'tax-category-master.json'), 'utf8'))
const taxItems = Object.values(taxRaw)
lines.push('-- § 4. tax_categories（' + taxItems.length + '件）')
lines.push('-- 元データ: data/tax-category-master.json')
lines.push('-- 注: テーブルが002_core_tables.sqlに未定義の場合は先にCREATE TABLEが必要')
lines.push('')

// tax_categoriesテーブルが002に存在するか確認が必要
// 002を確認した結果、accountsテーブルは存在するがtax_categoriesテーブルは
// 002_core_tables.sqlには存在しない。別途CREATE TABLEが必要。
// ここではCREATE TABLE IF NOT EXISTSを含める。
lines.push(`CREATE TABLE IF NOT EXISTS tax_categories (`)
lines.push(`  tax_category_id  TEXT PRIMARY KEY,`)
lines.push(`  name             TEXT NOT NULL,`)
lines.push(`  short_name       TEXT NOT NULL DEFAULT '',`)
lines.push(`  direction        TEXT NOT NULL DEFAULT 'common',`)
lines.push(`  qualified        BOOLEAN NOT NULL DEFAULT false,`)
lines.push(`  ai_selectable    BOOLEAN NOT NULL DEFAULT true,`)
lines.push(`  active           BOOLEAN NOT NULL DEFAULT true,`)
lines.push(`  deprecated       BOOLEAN NOT NULL DEFAULT false,`)
lines.push(`  effective_from   TEXT,`)
lines.push(`  effective_to     TEXT,`)
lines.push(`  default_visible  BOOLEAN NOT NULL DEFAULT true,`)
lines.push(`  display_order    INTEGER NOT NULL DEFAULT 0,`)
lines.push(`  is_custom        BOOLEAN NOT NULL DEFAULT false,`)
lines.push(`  tax_rate         NUMERIC NOT NULL DEFAULT 0,`)
lines.push(`  source           TEXT NOT NULL DEFAULT 'mcp',`)
lines.push(`  is_unknown_default BOOLEAN NOT NULL DEFAULT false,`)
lines.push(`  enabled_from     TEXT,`)
lines.push(`  enabled_to       TEXT,`)
lines.push(`  visible_in       JSONB,`)
lines.push(`  display_rate     TEXT`)
lines.push(`);`)
lines.push('')

for (const t of taxItems) {
  lines.push(`INSERT INTO tax_categories (`)
  lines.push(`  tax_category_id, name, short_name, direction, qualified,`)
  lines.push(`  ai_selectable, active, deprecated, effective_from, effective_to,`)
  lines.push(`  default_visible, display_order, is_custom, tax_rate, source,`)
  lines.push(`  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate`)
  lines.push(`) VALUES (`)
  lines.push(`  ${esc(t.taxCategoryId)}, ${esc(t.name)}, ${esc(t.shortName)}, ${esc(t.direction)}, ${t.qualified},`)
  lines.push(`  ${t.aiSelectable}, ${t.active}, ${t.deprecated}, ${esc(t.effectiveFrom)}, ${esc(t.effectiveTo)},`)
  lines.push(`  ${t.defaultVisible}, ${t.displayOrder}, ${t.isCustom}, ${t.taxRate}, ${esc(t.source)},`)
  lines.push(`  ${t.isUnknownDefault}, ${esc(t.enabledFrom)}, ${esc(t.enabledTo)}, ${escJsonb(t.visibleIn)}, ${esc(t.displayRate)}`)
  lines.push(`) ON CONFLICT (tax_category_id) DO NOTHING;`)
  lines.push('')
}

// ──────────────────────────────────────────────
// 5. industry_vectors（法人68件 + 個人68件）
// ──────────────────────────────────────────────
const corpVectors = JSON.parse(fs.readFileSync(path.join(dataDir, 'industry-vectors-corporate.json'), 'utf8'))
const soleVectors = JSON.parse(fs.readFileSync(path.join(dataDir, 'industry-vectors-sole.json'), 'utf8'))
lines.push('-- § 5. industry_vectors（法人' + corpVectors.length + '件 + 個人' + soleVectors.length + '件）')
lines.push('-- 元データ: data/industry-vectors-corporate.json + industry-vectors-sole.json')
lines.push('-- 注: industry_vectorsテーブルは002_core_tables.sqlで定義済み')
lines.push('')

// 002のindustry_vectorsテーブル: vector, account(FK), direction
// だが実データは { vector, expense: string[], income: string[] } 構造
// → 1 vector × N account の展開が必要
for (const iv of corpVectors) {
  for (const acct of (iv.expense || [])) {
    lines.push(`INSERT INTO industry_vectors (vector, account, direction)`)
    lines.push(`VALUES (${esc(iv.vector)}, ${esc(acct)}, 'expense')`)
    lines.push(`ON CONFLICT DO NOTHING;`)
  }
  for (const acct of (iv.income || [])) {
    lines.push(`INSERT INTO industry_vectors (vector, account, direction)`)
    lines.push(`VALUES (${esc(iv.vector)}, ${esc(acct)}, 'income')`)
    lines.push(`ON CONFLICT DO NOTHING;`)
  }
}
lines.push('')

for (const iv of soleVectors) {
  for (const acct of (iv.expense || [])) {
    lines.push(`INSERT INTO industry_vectors (vector, account, direction)`)
    lines.push(`VALUES (${esc(iv.vector)}, ${esc(acct)}, 'expense')`)
    lines.push(`ON CONFLICT DO NOTHING;`)
  }
  for (const acct of (iv.income || [])) {
    lines.push(`INSERT INTO industry_vectors (vector, account, direction)`)
    lines.push(`VALUES (${esc(iv.vector)}, ${esc(acct)}, 'income')`)
    lines.push(`ON CONFLICT DO NOTHING;`)
  }
}

// ──────────────────────────────────────────────
// 出力
// ──────────────────────────────────────────────
const sql = lines.join('\n')
fs.writeFileSync(outFile, sql, 'utf8')
console.log(`✅ seed.sql 生成完了: ${outFile}`)
console.log(`   行数: ${lines.length}`)
console.log(`   サイズ: ${(Buffer.byteLength(sql, 'utf8') / 1024).toFixed(1)} KB`)
console.log('')
console.log('内訳:')
console.log(`  staff:            ${staffData.length}件`)
console.log(`  vendors(global):  ${globalVendors.length}件`)
console.log(`  accounts:         ${accountsData.length}件`)
console.log(`  tax_categories:   ${taxItems.length}件`)
console.log(`  industry_vectors: ${corpVectors.length}(法人) + ${soleVectors.length}(個人) ベクトル`)
