/**
 * non_vendor_account_sole.ts — 個人事業主用 取引先外科目候補マップ
 *
 * 対応ファイル: industry_vector_sole.ts（同じ位置づけ。辞書定義のみ。Step4未接続）
 * 型定義:       src/mocks/types/pipeline/non_vendor.type.ts
 *
 * 【全ID根拠】
 *   勘定科目ID : ACCOUNT_MASTER（src/shared/data/account-master.ts）に存在するIDのみ使用
 *   税区分ID   : TAX_CATEGORY_MASTER（src/shared/data/tax-category-master.ts）に存在するIDのみ使用
 *   存在しないID のハードコード禁止。存在しない場合は null（insufficient）
 *
 * 【法人用（corporate）との差異点】
 *   法人専用科目（target: "corp"）は使用不可。個人向け代替科目に置き換える:
 *
 *   | 種別                    | 法人                   | 個人（本ファイル）           |
 *   |-------------------------|------------------------|------------------------------|
 *   | 受取利息 credit          | INTEREST_INCOME（corp）| MISC_INCOME（individual）    |
 *   | 支払利息 debit           | INTEREST_EXPENSE（corp）| INTEREST_DISCOUNT（individual）|
 *   | リボ/キャッシング debit  | INTEREST_EXPENSE（corp）| INTEREST_DISCOUNT（individual）|
 *   | 短期借入金 credit        | SHORT_TERM_BORROWINGS（corp）| null（insufficient）     |
 *   | 短期借入金 debit         | SHORT_TERM_BORROWINGS（corp）| null（insufficient）     |
 *   | 遅延損害金 debit         | MISC_LOSS（corp）      | null（insufficient）         |
 *   | 給与振込 debit           | SALARIES（corp）       | WAGES（individual）          |
 *
 * 変更履歴:
 *   2026-04-05: 新規作成（DL-017確定。26エントリ）
 */

import type { NonVendorAccountEntry } from '@/mocks/types/pipeline/non_vendor.type'

/**
 * 個人事業主用 取引先外科目候補マップ（Step4 将来実装用辞書）
 *
 * ATM / INTERNAL_TRANSFER は入金・出金で勘定が逆転するため2エントリとする。
 * insufficient エントリは debit / credit / tax_category がすべて null。
 */
export const NON_VENDOR_ACCOUNT_SOLE: NonVendorAccountEntry[] = [

  // ================================================================
  // 🏦 銀行明細（bank）— 自動確定
  // ================================================================

  {
    non_vendor_type: 'ATM',
    source_category: 'bank',
    direction: 'expense',
    debit: 'CASH',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: 'ATM出金',
  },
  {
    non_vendor_type: 'ATM',
    source_category: 'bank',
    direction: 'income',
    debit: 'ORDINARY_DEPOSIT',
    credit: 'CASH',
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: 'ATM入金',
  },
  {
    // 個人: INTEREST_INCOME（corp）→ MISC_INCOME（individual）で代替
    non_vendor_type: 'INTEREST_INCOME',
    source_category: 'bank',
    direction: 'income',
    debit: 'ORDINARY_DEPOSIT',
    credit: 'MISC_INCOME',          // target: individual ✅（法人: INTEREST_INCOME）
    tax_category: 'SALES_NON_TAXABLE',
    level: 'A',
    label: '受取利息',
  },
  {
    // 個人: INTEREST_EXPENSE（corp）→ INTEREST_DISCOUNT（利子割引料, individual）で代替
    non_vendor_type: 'INTEREST_EXPENSE',
    source_category: 'bank',
    direction: 'expense',
    debit: 'INTEREST_DISCOUNT',     // target: individual ✅（法人: INTEREST_EXPENSE）
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'PURCHASE_NON_TAXABLE',
    level: 'A',
    label: '支払利息（銀行）',
  },
  {
    non_vendor_type: 'BANK_FEE',
    source_category: 'bank',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: '銀行振込手数料',
  },
  {
    non_vendor_type: 'ACCOUNT_FEE',
    source_category: 'bank',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: '口座維持手数料',
  },
  {
    non_vendor_type: 'FOREIGN_EXCHANGE_FEE',
    source_category: 'bank',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: '外国為替手数料',
  },
  {
    non_vendor_type: 'INTERNAL_TRANSFER',
    source_category: 'bank',
    direction: 'expense',
    debit: 'ORDINARY_DEPOSIT',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: '自社口座間移動（出）',
  },
  {
    non_vendor_type: 'INTERNAL_TRANSFER',
    source_category: 'bank',
    direction: 'income',
    debit: 'ORDINARY_DEPOSIT',
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: '自社口座間移動（入）',
  },
  {
    // 個人: BORROWINGS（借入金, individual）で代替
    non_vendor_type: 'LOAN_RECEIPT',
    source_category: 'bank',
    direction: 'income',
    debit: 'ORDINARY_DEPOSIT',
    credit: 'BORROWINGS',           // 借入金（target: individual ✅）（法人: SHORT_TERM_BORROWINGS 短期借入金）
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: '借入金入金',
  },
  {
    // 個人: BORROWINGS（借入金, individual）で代替
    non_vendor_type: 'LOAN_REPAYMENT',
    source_category: 'bank',
    direction: 'expense',
    debit: 'BORROWINGS',            // 借入金（target: individual ✅）（法人: SHORT_TERM_BORROWINGS 短期借入金）
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'COMMON_EXEMPT',
    level: 'A',
    label: '借入金返済',
  },

  // ================================================================
  // 💳 クレカ明細（credit）— 自動確定（一部insufficient）
  // ================================================================

  {
    non_vendor_type: 'CREDIT_CARD_ANNUAL_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: 'クレカ年会費',
  },
  {
    non_vendor_type: 'CREDIT_CARD_STATEMENT_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: 'クレカ利用明細手数料',
  },
  {
    // 個人: MISC_LOSS（corp専用）が使えない。個人向け雑損失科目なし → insufficient
    non_vendor_type: 'CREDIT_CARD_LATE_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: null,                    // MISC_LOSS は corp 専用。個人向け代替なし
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: 'クレカ遅延損害金',
  },
  {
    // 個人: INTEREST_EXPENSE（corp）→ INTEREST_DISCOUNT（individual）で代替
    non_vendor_type: 'REVOLVING_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: 'INTEREST_DISCOUNT',     // target: individual ✅（法人: INTEREST_EXPENSE）
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_NON_TAXABLE',
    level: 'A',
    label: 'リボ払い手数料',
  },
  {
    non_vendor_type: 'CARD_CASH_ADVANCE_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: 'キャッシング手数料',
  },
  {
    // 個人: INTEREST_EXPENSE（corp）→ INTEREST_DISCOUNT（individual）で代替
    non_vendor_type: 'CARD_CASH_ADVANCE_INTEREST',
    source_category: 'credit',
    direction: 'expense',
    debit: 'INTEREST_DISCOUNT',     // target: individual ✅（法人: INTEREST_EXPENSE）
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_NON_TAXABLE',
    level: 'A',
    label: 'キャッシング利息',
  },
  {
    non_vendor_type: 'FOREIGN_TRANSACTION_FEE',
    source_category: 'credit',
    direction: 'expense',
    debit: 'FEES',
    credit: 'ACCRUED_EXPENSES',
    tax_category: 'PURCHASE_TAXABLE_10',
    level: 'A',
    label: '海外利用手数料',
  },

  // ================================================================
  // ❓ 人間判断（insufficient）
  // ================================================================

  {
    non_vendor_type: 'CASHBACK',
    source_category: 'all',
    direction: 'income',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: 'キャッシュバック',
  },
  {
    // 個人: SALARIES（corp）→ WAGES（給料賃金, individual）で代替
    non_vendor_type: 'UNIDENTIFIED_SALARY',
    source_category: 'all',
    direction: 'expense',
    debit: 'WAGES',                 // target: individual ✅（法人: SALARIES）
    credit: 'ORDINARY_DEPOSIT',
    tax_category: 'COMMON_EXEMPT',
    level: 'insufficient',
    label: '給与振込（支払元不明）',
  },
  {
    non_vendor_type: 'UNIDENTIFIED_INFLOW',
    source_category: 'all',
    direction: 'income',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: '突合不能入金',
  },
  {
    non_vendor_type: 'UNIDENTIFIED_OUTFLOW',
    source_category: 'all',
    direction: 'expense',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: '突合不能出金',
  },
  {
    non_vendor_type: 'PETTY_CASH_ADJUSTMENT',
    source_category: 'all',
    direction: 'expense',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: '現金過不足調整',
  },
  {
    non_vendor_type: 'SUBSIDY_RECEIVED',
    source_category: 'all',
    direction: 'income',
    debit: null,
    credit: null,                   // SUBSIDY_INCOMEはACCOUNT_MASTERに存在しないためnull
    tax_category: null,
    level: 'insufficient',
    label: '補助金・助成金受取',
  },
  {
    non_vendor_type: 'INSURANCE_RECEIVED',
    source_category: 'all',
    direction: 'income',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: '保険金受取',
  },
  {
    non_vendor_type: 'OTHER_NON_VENDOR',
    source_category: 'all',
    direction: 'expense',
    debit: null,
    credit: null,
    tax_category: null,
    level: 'insufficient',
    label: 'その他取引先外',
  },
]
