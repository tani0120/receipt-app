/**
 * 全社マスタ（account-master.json）とMFスナップショット（法人TST）を
 * 名前照合し、MFのcategory → すぐするのcategoryの正解マッピングを導出する。
 * 
 * 推論ではなく、既存データから機械的に導出する。
 */
import * as fs from 'fs'
import * as path from 'path'

// 全社マスタ読み込み
const masterPath = path.resolve('data/account-master.json')
const master: any[] = JSON.parse(fs.readFileSync(masterPath, 'utf8'))

// MFスナップショット（法人TST・免税）読み込み
const snapshotPath = path.resolve('data/mf-snapshot-c_rODnkCDN-exempt.json')
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
const mfAccounts: any[] = snapshot.accounts || snapshot

// 名前→全社マスタの科目を引く
const masterByName = new Map<string, any>()
for (const a of master) {
  masterByName.set(a.name, a)
}

// MF科目を全社マスタと名前照合
console.log('=== MF法人科目 → 全社マスタ 名前照合 ===\n')

// MFのcategory → すぐするcategoryのマッピングを集計
const mapping: Record<string, Set<string>> = {}
const unmatchedMf: any[] = []
let matchCount = 0

for (const mf of mfAccounts) {
  const masterAccount = masterByName.get(mf.name)
  const mfCat = mf.category || '(なし)'
  
  if (masterAccount) {
    matchCount++
    const sugusuruCat = masterAccount.category || '(なし)'
    if (!mapping[mfCat]) mapping[mfCat] = new Set()
    mapping[mfCat].add(sugusuruCat)
  } else {
    unmatchedMf.push({ name: mf.name, mfCategory: mfCat, mfGroup: mf.account_group })
  }
}

console.log(`名前一致: ${matchCount}件 / MF ${mfAccounts.length}件\n`)

console.log('--- MF category → すぐする category マッピング（実データ） ---\n')
for (const [mfCat, sugusuruCats] of Object.entries(mapping).sort()) {
  const cats = [...sugusuruCats].sort()
  const marker = cats.length > 1 ? ' ⚠️ 複数マッピング' : ''
  console.log(`  ${mfCat} → ${cats.join(', ')}${marker}`)
}

console.log(`\n--- 名前不一致（全社マスタにない法人科目）: ${unmatchedMf.length}件 ---\n`)
for (const u of unmatchedMf) {
  console.log(`  ${u.name} (${u.mfGroup} / ${u.mfCategory})`)
}

// 既存 MF_CATEGORY_MAP との差分
console.log('\n--- 既存 MF_CATEGORY_MAP にあるか確認 ---\n')
// MF_CATEGORY_MAPを手動で定義（import不可のため）
const existingMap: Record<string, string> = {
  CASH_AND_DEPOSITS: '現金及び預金',
  TRADE_RECEIVABLES: '売上債権',
  MARKETABLE_SECURITIES: '有価証券',
  OTHER_CURRENT_ASSETS: 'その他流動資産',
  INVENTORIES: '棚卸資産',
  PROPERTY_PLANT_AND_EQUIPMENT: '有形固定資産',
  INTANGIBLE_ASSETS: '無形固定資産',
  INVESTMENTS_AND_OTHER_ASSETS: '投資その他',
  DEFERRED_ASSETS: '繰延資産',
  OWNERS_DRAWINGS: '事業主貸',
  SUNDRIES: '諸口',
  EQUITY: '資本の部',
  OWNERS_CAPITAL: '事業主借',
  TRADE_PAYABLES: '仕入債務',
  OTHER_CURRENT_LIABILITIES: 'その他流動負債',
  NON_CURRENT_LIABILITIES: '固定負債',
  COST_OF_PURCHASED_GOODS: '売上原価',
  BEGINNING_MERCHANDISE_INVENTORY: '売上原価',
  ENDING_MERCHANDISE_INVENTORY: '売上原価',
  EXPENSES: '経費',
  PROVISIONS: '繰入額等',
  REAL_ESTATE_EXPENSES: '不動産経費',
  REAL_ESTATE_EMPLOYEE_SALARY: '不動産経費',
  SALES_REVENUE: '売上',
  REAL_ESTATE_INCOME: '不動産収入',
  REVERSALS: '繰戻額等',
}

// 法人MFデータに出現した全categoryのうち、既存マップにないもの
const allMfCategories = new Set<string>()
for (const mf of mfAccounts) {
  if (mf.category) allMfCategories.add(mf.category)
}

console.log('法人MFに出現するが既存MAPにないcategory:')
for (const c of [...allMfCategories].sort()) {
  if (!existingMap[c]) {
    // 実データから導出されたマッピングがあるか
    const derived = mapping[c] ? [...mapping[c]].join(', ') : '(名前一致科目なし)'
    console.log(`  ❌ ${c} → 実データ導出: ${derived}`)
  }
}

console.log('\n法人MFに出現し既存MAPにもあるcategory:')
for (const c of [...allMfCategories].sort()) {
  if (existingMap[c]) {
    const derived = mapping[c] ? [...mapping[c]].join(', ') : '(名前一致科目なし)'
    const match = derived === existingMap[c] ? '✅' : `⚠️ MAP=${existingMap[c]}`
    console.log(`  ${match} ${c} → 実データ: ${derived}`)
  }
}

process.exit(0)
