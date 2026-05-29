/**
 * MF勘定科目 → 全社マスタ 差分マージスクリプト
 *
 * 処理:
 * 1. MF生データ（mf_accounts_raw_TSK.json）を読み込む
 * 2. 全社マスタ（account-master.json）を読み込む
 * 3. 名前一致した科目 → 既存マスタの属性を維持し、mfAccountId等のMFフィールドを付与
 * 4. 名前不一致の科目 → マッピングテーブルで新規Account生成
 * 5. 差分レポートを出力
 * 6. マージ結果をaccount-master.jsonに上書き保存
 *
 * 対象: 個人事業・不動産所得あり（target='individual' or 'both'）
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Account } from '../types/shared-account'
import {
  MF_CATEGORY_MAP,
  deriveMfAccountGroup,
  deriveTaxDetermination,
  deriveTarget,
} from '../data/master/mf-account-category-mapping'

const DATA_DIR = join(process.cwd(), 'data')
const MF_PATH = join(process.cwd(), 'docs/genzai/mf_accounts_raw_TSK.json')
const MASTER_PATH = join(DATA_DIR, 'account-master.json')
const TAX_MASTER_PATH = join(DATA_DIR, 'tax-category-master.json')

// ========================================
// データ読み込み
// ========================================

interface MfAccount {
  id: string
  name: string
  account_group: string
  category: string
  financial_statement_type: string
  available: boolean
  tax_id: string
  sub_accounts: Array<{ id: string; name: string; tax_id: string }>
}

interface TaxMaster {
  id: string
  name: string
  mfId?: string
}

const mfAccounts: MfAccount[] = JSON.parse(readFileSync(MF_PATH, 'utf-8'))
const masterAccounts: Account[] = JSON.parse(readFileSync(MASTER_PATH, 'utf-8'))
const taxMaster: TaxMaster[] = JSON.parse(readFileSync(TAX_MASTER_PATH, 'utf-8'))

console.log(`[マージ] MF科目: ${mfAccounts.length}件 / 全社マスタ: ${masterAccounts.length}件`)

// ========================================
// tax_id変換テーブル構築（MFのtax_id → 全社マスタ税区分ID）
// ========================================

const mfTaxIdToMasterId = new Map<string, string>()
for (const t of taxMaster) {
  if (t.mfId) {
    mfTaxIdToMasterId.set(t.mfId, t.id)
  }
}

function resolveTaxId(mfTaxId: string): string | undefined {
  return mfTaxIdToMasterId.get(mfTaxId)
}

// ========================================
// 名前照合
// ========================================

const masterByName = new Map<string, Account>()
for (const a of masterAccounts) {
  masterByName.set(a.name, a)
}

// ========================================
// 差分検知と変換
// ========================================

interface DiffReport {
  /** 名前一致 → MFフィールド付与 */
  updated: Array<{ name: string; masterId: string; mfId: string }>
  /** 名前不一致 → 新規追加 */
  added: Array<{ name: string; newId: string; mfId: string; category: string }>
  /** MFのtax_id変換失敗 */
  taxIdFailed: Array<{ name: string; mfTaxId: string }>
  /** MFのcategory変換失敗 */
  categoryFailed: Array<{ name: string; mfCategory: string }>
}

const diff: DiffReport = {
  updated: [],
  added: [],
  taxIdFailed: [],
  categoryFailed: [],
}

// マスタの最大sortOrderを取得（新規追加時の起点）
let maxSortOrder = Math.max(...masterAccounts.map(a => a.sortOrder), 0)

for (const mf of mfAccounts) {
  const existing = masterByName.get(mf.name)

  // tax_id変換
  const masterTaxId = resolveTaxId(mf.tax_id)
  if (!masterTaxId) {
    diff.taxIdFailed.push({ name: mf.name, mfTaxId: mf.tax_id })
  }

  // category変換
  const masterCategory = MF_CATEGORY_MAP[mf.category]
  if (!masterCategory) {
    diff.categoryFailed.push({ name: mf.name, mfCategory: mf.category })
  }

  if (existing) {
    // ── 名前一致: 既存マスタにMFフィールドを付与 ──
    existing.mfAccountId = mf.id
    existing.mfAccountGroup = mf.account_group
    existing.mfFinancialStatementType = mf.financial_statement_type
    existing.mfDefaultTaxId = mf.tax_id

    // デフォルト税区分がマスタで未設定の場合のみMFから補完
    if (!existing.defaultTaxCategoryId && masterTaxId) {
      existing.defaultTaxCategoryId = masterTaxId
    }

    diff.updated.push({ name: mf.name, masterId: existing.id, mfId: mf.id })
  } else {
    // ── 名前不一致: 新規Account生成 ──
    const category = masterCategory ?? '経費' // フォールバック
    const accountGroup = deriveMfAccountGroup(mf.account_group, mf.category)
    const taxDetermination = deriveTaxDetermination(category)
    const target = deriveTarget(category, mf.financial_statement_type)

    maxSortOrder++
    const newAccount: Account = {
      id: `MF_${mf.name.replace(/[^a-zA-Z0-9\u3000-\u9FFF]/g, '_')}`,
      name: mf.name,
      target,
      accountGroup,
      category,
      defaultTaxCategoryId: masterTaxId,
      taxDetermination,
      deprecated: false,
      effectiveFrom: '2019-10-01',
      effectiveTo: null,
      sortOrder: maxSortOrder,
      isCustom: false,
      mfAccountId: mf.id,
      mfAccountGroup: mf.account_group,
      mfFinancialStatementType: mf.financial_statement_type,
      mfDefaultTaxId: mf.tax_id,
    }

    masterAccounts.push(newAccount)
    diff.added.push({ name: mf.name, newId: newAccount.id, mfId: mf.id, category })
  }
}

// ========================================
// 差分レポート出力
// ========================================

console.log('\n========== 差分レポート ==========')
console.log(`\n✅ 名前一致（MFフィールド付与）: ${diff.updated.length}件`)
for (const u of diff.updated.slice(0, 10)) {
  console.log(`  ${u.name} [${u.masterId}] ← mfId=${u.mfId.substring(0, 10)}...`)
}
if (diff.updated.length > 10) console.log(`  …他${diff.updated.length - 10}件`)

console.log(`\n➕ 新規追加: ${diff.added.length}件`)
for (const a of diff.added) {
  console.log(`  ${a.name} → id=${a.newId}, category=${a.category}`)
}

if (diff.taxIdFailed.length > 0) {
  console.log(`\n❌ tax_id変換失敗: ${diff.taxIdFailed.length}件`)
  for (const f of diff.taxIdFailed) {
    console.log(`  ${f.name}: ${f.mfTaxId}`)
  }
}

if (diff.categoryFailed.length > 0) {
  console.log(`\n❌ category変換失敗: ${diff.categoryFailed.length}件`)
  for (const f of diff.categoryFailed) {
    console.log(`  ${f.name}: ${f.mfCategory}`)
  }
}

console.log(`\n合計: マスタ ${masterAccounts.length}件（変更前 ${masterAccounts.length - diff.added.length}件 + 新規 ${diff.added.length}件）`)

// ========================================
// 保存
// ========================================

writeFileSync(MASTER_PATH, JSON.stringify(masterAccounts, null, 2), 'utf-8')
console.log(`\n💾 保存完了: ${MASTER_PATH}`)

// 差分レポートも保存
const reportPath = join(process.cwd(), 'docs/genzai/mf_account_merge_report.json')
writeFileSync(reportPath, JSON.stringify(diff, null, 2), 'utf-8')
console.log(`📋 差分レポート保存: ${reportPath}`)

process.exit(0)
