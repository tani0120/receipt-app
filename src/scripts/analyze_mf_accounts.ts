/**
 * MF勘定科目と全社マスタの照合・マッピング分析スクリプト
 * 
 * 出力:
 * 1. MF account_group/category → 全社マスタ accountGroup/category のマッピングテーブル
 * 2. 名前一致/不一致リスト
 * 3. tax_id → 全社マスタ税区分IDの変換テーブル
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const MF_PATH = join(process.cwd(), 'docs/genzai/mf_accounts_raw_TSK.json')
const OUT_PATH = join(process.cwd(), 'docs/genzai/mf_account_mapping_analysis.json')

// MF科目データ読み込み
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

// 全社マスタ読み込み
interface MasterAccount {
  id: string
  name: string
  target: string
  accountGroup: string
  category: string
  defaultTaxCategoryId?: string
  taxDetermination: string
}

interface MasterTaxCategory {
  id: string
  name: string
  mfId?: string
}

const mfAccounts: MfAccount[] = JSON.parse(readFileSync(MF_PATH, 'utf-8'))
const masterAccounts: MasterAccount[] = JSON.parse(readFileSync(join(DATA_DIR, 'account-master.json'), 'utf-8'))
const masterTaxes: MasterTaxCategory[] = JSON.parse(readFileSync(join(DATA_DIR, 'tax-category-master.json'), 'utf-8'))

// ========== 1. MFカテゴリ → 全社マスタカテゴリ マッピング ==========
console.log('\n========== MFカテゴリ → 全社マスタカテゴリ マッピング ==========')

// MFのaccount_group値一覧
const mfGroups = new Set(mfAccounts.map(a => a.account_group))
const mfCategories = new Set(mfAccounts.map(a => a.category))
console.log('\nMF account_group一覧:', [...mfGroups].sort())
console.log('MF category一覧:', [...mfCategories].sort())

// ========== 2. 名前照合 ==========
console.log('\n========== 名前照合 ==========')

const masterNameMap = new Map<string, MasterAccount>()
for (const a of masterAccounts) {
  masterNameMap.set(a.name, a)
}

const matched: Array<{ mfName: string; mfId: string; mfGroup: string; mfCategory: string; mfFsType: string; mfTaxId: string; masterId: string; masterGroup: string; masterCategory: string; masterTaxId?: string }> = []
const unmatched: Array<{ mfName: string; mfId: string; mfGroup: string; mfCategory: string; mfFsType: string; mfTaxId: string }> = []

for (const mf of mfAccounts) {
  const master = masterNameMap.get(mf.name)
  if (master) {
    matched.push({
      mfName: mf.name,
      mfId: mf.id,
      mfGroup: mf.account_group,
      mfCategory: mf.category,
      mfFsType: mf.financial_statement_type,
      mfTaxId: mf.tax_id,
      masterId: master.id,
      masterGroup: master.accountGroup,
      masterCategory: master.category,
      masterTaxId: master.defaultTaxCategoryId,
    })
  } else {
    unmatched.push({
      mfName: mf.name,
      mfId: mf.id,
      mfGroup: mf.account_group,
      mfCategory: mf.category,
      mfFsType: mf.financial_statement_type,
      mfTaxId: mf.tax_id,
    })
  }
}

console.log(`\n一致: ${matched.length}件 / 不一致: ${unmatched.length}件`)
console.log('\n--- 不一致リスト ---')
for (const u of unmatched) {
  console.log(`  ${u.mfName} [${u.mfGroup}/${u.mfCategory}/${u.mfFsType}]`)
}

// ========== 3. MFカテゴリ → 全社マスタカテゴリ 自動推定 ==========
console.log('\n========== カテゴリマッピング（一致した科目からの推定） ==========')

const categoryMapping = new Map<string, Map<string, number>>()
for (const m of matched) {
  const mfKey = `${m.mfGroup}/${m.mfCategory}`
  if (!categoryMapping.has(mfKey)) categoryMapping.set(mfKey, new Map())
  const masterKey = `${m.masterGroup}/${m.masterCategory}`
  const counts = categoryMapping.get(mfKey)!
  counts.set(masterKey, (counts.get(masterKey) ?? 0) + 1)
}

const mappingTable: Array<{ mfGroup: string; mfCategory: string; masterGroup: string; masterCategory: string; count: number }> = []

for (const [mfKey, counts] of [...categoryMapping.entries()].sort()) {
  for (const [masterKey, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const [mg, mc] = mfKey.split('/')
    const [mmg, mmc] = masterKey.split('/')
    console.log(`  ${mfKey} → ${masterKey} (${count}件)`)
    mappingTable.push({ mfGroup: mg, mfCategory: mc, masterGroup: mmg, masterCategory: mmc, count })
  }
}

// ========== 4. tax_id変換テーブル ==========
console.log('\n========== tax_id変換テーブル ==========')

const mfTaxIdToMasterId = new Map<string, string>()
for (const t of masterTaxes) {
  if (t.mfId) {
    mfTaxIdToMasterId.set(t.mfId, t.id)
  }
}

const mfTaxIds = new Set(mfAccounts.map(a => a.tax_id))
console.log(`\nMF tax_id ユニーク数: ${mfTaxIds.size}`)
for (const tid of [...mfTaxIds].sort()) {
  const masterId = mfTaxIdToMasterId.get(tid)
  const masterTax = masterId ? masterTaxes.find(t => t.id === masterId) : undefined
  console.log(`  ${tid} → ${masterId ?? '❌未マッチ'} ${masterTax ? `(${masterTax.name})` : ''}`)
}

// ========== 出力 ==========
const result = {
  summary: {
    mfTotal: mfAccounts.length,
    matched: matched.length,
    unmatched: unmatched.length,
    mfAccountGroups: [...mfGroups].sort(),
    mfCategories: [...mfCategories].sort(),
  },
  categoryMapping: mappingTable,
  matched,
  unmatched,
  taxIdMapping: [...mfTaxIds].sort().map(tid => ({
    mfTaxId: tid,
    masterTaxId: mfTaxIdToMasterId.get(tid) ?? null,
    masterTaxName: mfTaxIdToMasterId.get(tid) ? masterTaxes.find(t => t.id === mfTaxIdToMasterId.get(tid))?.name : null,
  })),
}

writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf-8')
console.log(`\n分析結果保存: ${OUT_PATH}`)

process.exit(0)
