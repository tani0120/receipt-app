/**
 * #7 CATEGORY_CONFLICT 複合仕訳テスト
 *
 * 検証ケース:
 * 1. 借方[sales(非isContra), bs_al] × 貸方[bs_al] → salesの行で警告が出るか
 * 2. 借方[sales(isContra), bs_al] × 貸方[bs_al] → 警告なし（返品科目なのでOK）
 * 3. 借方[expense, bs_al] × 貸方[sales, bs_al] → 偽陽性なし（旧方式では expense×sales で誤検知）
 * 4. 借方[expense] × 貸方[expense] → 警告あり（正しい検知）
 */

import {
  getMegaGroup,
  validateDebitCreditCombination,
} from '../src/shared/validation/journalValidationCore'
import type { AccountForValidation } from '../src/shared/validation/journalValidationCore'

// テスト用科目マスタ（最小限）
const テスト科目: AccountForValidation[] = [
  { accountId: 'SALES', accountGroup: 'PL_REVENUE', category: 'SALES_REVENUE', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: false },
  { accountId: 'SALES_RETURNS', accountGroup: 'PL_REVENUE', category: 'SALES_REVENUE', defaultTaxCategoryId: null, isContraRevenue: true, isContraExpense: false },
  { accountId: 'TRAVEL', accountGroup: 'PL_EXPENSE', category: 'TRAVEL_EXPENSES', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: false },
  { accountId: 'PURCHASE_RETURNS', accountGroup: 'PL_EXPENSE', category: 'COST_OF_GOODS_SOLD', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: true },
  { accountId: 'ORDINARY_DEPOSIT', accountGroup: 'BS_ASSET', category: 'CASH_AND_DEPOSITS', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: false },
  { accountId: 'ACCOUNTS_RECEIVABLE', accountGroup: 'BS_ASSET', category: 'TRADE_RECEIVABLES', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: false },
  { accountId: 'CASH', accountGroup: 'BS_ASSET', category: 'CASH_AND_DEPOSITS', defaultTaxCategoryId: null, isContraRevenue: false, isContraExpense: false },
]

// ────────────────────────────
// ヘルパー: 新方式の#7チェックをシミュレート
// ────────────────────────────
function テスト実行(
  テスト名: string,
  借方科目: string[],
  貸方科目: string[],
  期待警告: boolean,
) {
  const 借方Megas = 借方科目.map(id => ({
    account: id,
    mega: getMegaGroup(id, テスト科目),
  }))
  const 貸方Megas = 貸方科目.map(id => ({
    account: id,
    mega: getMegaGroup(id, テスト科目),
  }))

  const 矛盾借方 = new Set<string>()
  const 矛盾貸方 = new Set<string>()

  // 各借方行: 貸方に正常ペア相手が1つでもあるか
  for (const d of 借方Megas) {
    if (!d.mega || !d.account) continue
    const 正常ペアあり = 貸方Megas.some(c => {
      if (!c.mega || !c.account) return false
      return validateDebitCreditCombination(d.mega, c.mega, d.account, c.account, テスト科目) === null
    })
    if (!正常ペアあり) {
      矛盾借方.add(d.account)
    }
  }

  // 各貸方行: 借方に正常ペア相手が1つでもあるか
  for (const c of 貸方Megas) {
    if (!c.mega || !c.account) continue
    const 正常ペアあり = 借方Megas.some(d => {
      if (!d.mega || !d.account) return false
      return validateDebitCreditCombination(d.mega, c.mega, d.account, c.account, テスト科目) === null
    })
    if (!正常ペアあり) {
      矛盾貸方.add(c.account)
    }
  }

  const 警告あり = 矛盾借方.size > 0 || 矛盾貸方.size > 0
  const 判定 = 警告あり === 期待警告 ? '✅ PASS' : '❌ FAIL'

  console.log(`\n${判定} ${テスト名}`)
  console.log(`  借方: [${借方科目.join(', ')}] → MegaGroup: [${借方Megas.map(m => m.mega).join(', ')}]`)
  console.log(`  貸方: [${貸方科目.join(', ')}] → MegaGroup: [${貸方Megas.map(m => m.mega).join(', ')}]`)
  console.log(`  結果: 警告${警告あり ? 'あり' : 'なし'}（期待: 警告${期待警告 ? 'あり' : 'なし'}）`)
  if (矛盾借方.size > 0) console.log(`  矛盾借方: ${[...矛盾借方].join(', ')}`)
  if (矛盾貸方.size > 0) console.log(`  矛盾貸方: ${[...矛盾貸方].join(', ')}`)
}

// ────────────────────────────
// テスト実行
// ────────────────────────────

console.log('━━━ #7 CATEGORY_CONFLICT 複合仕訳テスト ━━━')

// ケース1: 借方[sales(非isContra), bs_al] × 貸方[bs_al] → salesで警告あり
テスト実行(
  'ケース1: 借方にsales(非isContra) → 警告すべき',
  ['SALES', 'ORDINARY_DEPOSIT'],
  ['CASH'],
  true, // sales×bs_al は isContra=false なので警告
)

// ケース2: 借方[sales(isContra=true), bs_al] × 貸方[bs_al] → 警告なし
テスト実行(
  'ケース2: 借方にsales(isContra=true) → 返品なので警告なし',
  ['SALES_RETURNS', 'ORDINARY_DEPOSIT'],
  ['CASH'],
  false, // SALES_RETURNS は isContraRevenue=true → 正常
)

// ケース3: 借方[expense, bs_al] × 貸方[sales, bs_al]（旧方式で偽陽性が出ていたケース）
テスト実行(
  'ケース3: 複合仕訳（旧方式で偽陽性） → 警告なし',
  ['TRAVEL', 'ACCOUNTS_RECEIVABLE'],
  ['SALES', 'CASH'],
  false, // TRAVEL→CASH=正常、ACCOUNTS_RECEIVABLE→SALES=正常 → 全行に正常ペアあり
)

// ケース4: 借方[expense] × 貸方[expense] → 警告あり
テスト実行(
  'ケース4: 費用×費用 → 異常（正しい検知）',
  ['TRAVEL'],
  ['TRAVEL'],
  true,
)

// ケース5: 借方[expense] × 貸方[bs_al] → 警告なし（正常パターン）
テスト実行(
  'ケース5: 費用×資産 → 正常（基本パターン）',
  ['TRAVEL'],
  ['CASH'],
  false,
)

// ケース6: 借方[sales, expense] × 貸方[bs_al] → salesで警告あり
テスト実行(
  'ケース6: 借方にsales+expense、貸方にbs_al → salesのみ警告',
  ['SALES', 'TRAVEL'],
  ['ORDINARY_DEPOSIT'],
  true, // SALES(非isContra)×bs_al → 警告
)

// ケース7: 借方[bs_al] × 貸方[expense] → expenseで警告あり（貸方に費用）
テスト実行(
  'ケース7: 貸方にexpense(非isContra) → 警告すべき',
  ['ORDINARY_DEPOSIT'],
  ['TRAVEL'],
  true,
)

// ケース8: 借方[bs_al] × 貸方[expense(isContra)] → 警告なし（仕入返品）
テスト実行(
  'ケース8: 貸方にexpense(isContra=true) → 仕入返品なので警告なし',
  ['ORDINARY_DEPOSIT'],
  ['PURCHASE_RETURNS'],
  false,
)

console.log('\n━━━ テスト完了 ━━━')
