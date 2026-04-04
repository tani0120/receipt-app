/**
 * non_vendor.type.ts — 取引先外取引型定義 + 科目候補辞書型
 *
 * vendor.type.ts の対応ファイル。
 * 取引先特定できない行（NonVendorType）と税金納付行（TaxPaymentType）を定義する。
 *
 * 全科目ID: ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 * 全税区分ID: TAX_CATEGORY_MASTER（src/shared/data/tax-category-master.ts）準拠
 *
 * 【NonVendorType（24種）】
 *   取引先特定できない行の分類。vendor_vector と相互排他。
 *   銀行明細自動確定 9種 + クレカ明細自動確定 7種 + 人間判断 8種 = 24種。
 *
 * 【TaxPaymentType（5種）】
 *   税金納付行の分類。non_vendor_type とは独立した別カテゴリ。
 *   line_item.type.ts からここに移動（2026-04-05）。
 *
 * 【NonVendorAccountEntry / FlatNonVendorAccountRow】
 *   科目候補辞書の型定義（Step 4 将来実装用）。
 *   INDUSTRY_VECTOR_CORPORATE / INDUSTRY_VECTOR_SOLE と同じ位置づけ（辞書定義のみ）。
 *   実際の仕訳生成時は useClientAccounts(clientId) から動的に科目を取得すること。
 *
 * 【データファイル分離（vendor.type.ts 設計と対称）】
 *   法人用マップ: src/mocks/data/pipeline/non_vendor_account_corporate.ts
 *   個人事業主用: src/mocks/data/pipeline/non_vendor_account_sole.ts
 *
 * 変更履歴:
 *   2026-04-05: 新規作成（line_item.type.ts から NonVendorType・TaxPaymentType を移動。
 *               NonVendorType を 8種 → 24種に拡張。DL-017確定）
 */

// ============================================================
// § NonVendorType — 取引先外取引の種別（24種）
// ============================================================

/**
 * 取引先外取引の種別（24種）
 *
 * 取引先特定できない行（ATM・利息・手数料・口座間移動等）で使用。
 * vendor_vector との相互排他制約:
 *   取引先あり → vendor_vector のみ設定。non_vendor_type は必ず null。
 *   取引先外   → non_vendor_type または tax_type のどちらか一方。vendor_vector は null。
 *
 * level定義:
 *   'A'          = 科目自動確定（借方・貸方・税区分が一意に決まる）
 *   'insufficient' = 人間判断必要（科目が事業形態・状況により変わる）
 *
 * 根拠: DL-016（2026-04-04）/ DL-017（2026-04-05）
 */
export type NonVendorType =
  // ── 🏦 銀行明細（自動確定 9種）───────────────────────────
  | 'ATM'                    // ATM入出金（現金↔普通預金）
  | 'INTEREST_INCOME'        // 受取利息（普通預金 ← 受取利息）
  | 'INTEREST_EXPENSE'       // 支払利息（支払利息 → 普通預金）
  | 'BANK_FEE'               // 銀行振込手数料（支払手数料 → 普通預金）
  | 'ACCOUNT_FEE'            // 口座維持手数料（支払手数料 → 普通預金）
  | 'FOREIGN_EXCHANGE_FEE'   // 外国為替手数料（支払手数料 → 普通預金）
  | 'INTERNAL_TRANSFER'      // 自社口座間移動（普通預金 ↔ 普通預金）
  | 'LOAN_RECEIPT'           // 借入金入金（普通預金 ← 短期借入金）
  | 'LOAN_REPAYMENT'         // 借入金返済（短期借入金 → 普通預金）

  // ── 💳 クレカ明細（自動確定 7種）────────────────────────
  | 'CREDIT_CARD_ANNUAL_FEE'      // 年会費（支払手数料 → 未払金）
  | 'CREDIT_CARD_STATEMENT_FEE'   // 利用明細手数料（支払手数料 → 未払金）
  | 'CREDIT_CARD_LATE_FEE'        // 遅延損害金（法人: 雑損失 → 普通預金 / 個人: insufficient）
  | 'REVOLVING_FEE'               // リボ払い手数料（支払利息 → 未払金）
  | 'CARD_CASH_ADVANCE_FEE'       // キャッシング手数料（支払手数料 → 未払金）
  | 'CARD_CASH_ADVANCE_INTEREST'  // キャッシング利息（支払利息 → 未払金）
  | 'FOREIGN_TRANSACTION_FEE'     // 海外利用手数料（支払手数料 → 未払金）

  // ── ❓ 人間判断（8種）────────────────────────────────────
  | 'CASHBACK'              // キャッシュバック（雑収入か費用控除か事業者判断）
  | 'UNIDENTIFIED_SALARY'   // 給与振込（支払元不明。法人: 給料手当 / 個人: 事業主貸）
  | 'UNIDENTIFIED_INFLOW'   // 突合不能入金（入金元不明。最終フォールバック）
  | 'UNIDENTIFIED_OUTFLOW'  // 突合不能出金（出金先不明。最終フォールバック）
  | 'PETTY_CASH_ADJUSTMENT' // 現金過不足調整（現金過不足 ↔ 現金）
  | 'SUBSIDY_RECEIVED'      // 補助金・助成金受取（科目は顧問先設定による）
  | 'INSURANCE_RECEIVED'    // 保険金受取（科目は保険種類・目的による）
  | 'OTHER_NON_VENDOR';     // その他取引先外（上記以外。人間が判断）

/** NonVendorType全値の定数配列（網羅性チェック用） */
export const NON_VENDOR_TYPES = [
  // 銀行明細（自動確定）
  'ATM', 'INTEREST_INCOME', 'INTEREST_EXPENSE', 'BANK_FEE', 'ACCOUNT_FEE',
  'FOREIGN_EXCHANGE_FEE', 'INTERNAL_TRANSFER', 'LOAN_RECEIPT', 'LOAN_REPAYMENT',
  // クレカ明細（自動確定）
  'CREDIT_CARD_ANNUAL_FEE', 'CREDIT_CARD_STATEMENT_FEE', 'CREDIT_CARD_LATE_FEE',
  'REVOLVING_FEE', 'CARD_CASH_ADVANCE_FEE', 'CARD_CASH_ADVANCE_INTEREST',
  'FOREIGN_TRANSACTION_FEE',
  // 人間判断
  'CASHBACK', 'UNIDENTIFIED_SALARY', 'UNIDENTIFIED_INFLOW', 'UNIDENTIFIED_OUTFLOW',
  'PETTY_CASH_ADJUSTMENT', 'SUBSIDY_RECEIVED', 'INSURANCE_RECEIVED', 'OTHER_NON_VENDOR',
] as const satisfies readonly NonVendorType[];

/** NonVendorType 日本語ラベル（UI表示用） */
export const NON_VENDOR_TYPE_LABELS: Record<NonVendorType, string> = {
  ATM:                      'ATM入出金',
  INTEREST_INCOME:          '受取利息',
  INTEREST_EXPENSE:         '支払利息',
  BANK_FEE:                 '銀行振込手数料',
  ACCOUNT_FEE:              '口座維持手数料',
  FOREIGN_EXCHANGE_FEE:     '外国為替手数料',
  INTERNAL_TRANSFER:        '自社口座間移動',
  LOAN_RECEIPT:             '借入金入金',
  LOAN_REPAYMENT:           '借入金返済',
  CREDIT_CARD_ANNUAL_FEE:      'クレカ年会費',
  CREDIT_CARD_STATEMENT_FEE:   'クレカ利用明細手数料',
  CREDIT_CARD_LATE_FEE:        'クレカ遅延損害金',
  REVOLVING_FEE:               'リボ払い手数料',
  CARD_CASH_ADVANCE_FEE:       'キャッシング手数料',
  CARD_CASH_ADVANCE_INTEREST:  'キャッシング利息',
  FOREIGN_TRANSACTION_FEE:     '海外利用手数料',
  CASHBACK:              'キャッシュバック',
  UNIDENTIFIED_SALARY:   '給与振込（支払元不明）',
  UNIDENTIFIED_INFLOW:   '突合不能入金',
  UNIDENTIFIED_OUTFLOW:  '突合不能出金',
  PETTY_CASH_ADJUSTMENT: '現金過不足調整',
  SUBSIDY_RECEIVED:      '補助金・助成金受取',
  INSURANCE_RECEIVED:    '保険金受取',
  OTHER_NON_VENDOR:      'その他取引先外',
};

// ============================================================
// § TaxPaymentType — 税金（納付）の種別（5種）
// ============================================================

/**
 * 税金の種別（5種）
 *
 * 使用範囲:
 *   - 納付書（source_type: 'tax_payment'）の全行
 *   - 通帳・銀行明細（bank_statement）内の税金振替行
 *
 * non_vendor_type と tax_type は相互排他（両方同時に設定しない）。
 *
 * level定義:
 *   'A'          = 自動確定
 *   'insufficient' = 人間判断（事業形態により科目が変わる）
 *
 * 根拠: DL-016（2026-04-04）
 */
export type TaxPaymentType =
  // ✅ 自動確定（level: 'A'）
  | 'CORPORATE_TAX'    // 法人税等     （法人税等 → 普通預金）
  | 'CONSUMPTION_TAX'  // 消費税       （未払消費税 → 普通預金）
  | 'BUSINESS_TAX'     // 事業税       （租税公課 → 普通預金）
  | 'WITHHOLDING_TAX'  // 源泉所得税   （預り金 → 普通預金）
  // ❌ 人間判断（level: 'insufficient'）
  | 'RESIDENT_TAX';    // 住民税（法人: 法人税等 / 個人: 事業主貸 — 事業形態で変わる）

// ============================================================
// § NonVendorAccountEntry型（辞書エントリ）
// ============================================================

/**
 * 取引先外科目候補辞書エントリ（Step 4 将来実装用）
 *
 * vendor.type.ts の IndustryVectorEntry に対応する型。
 * データファイル（non_vendor_account_corporate.ts / non_vendor_account_sole.ts）で使用。
 *
 * 【重要制約】
 * debit / credit / tax_category は ACCOUNT_MASTER / TAX_CATEGORY_MASTER に存在するIDのみ設定すること。
 * 存在しないIDのハードコードは禁止。存在しない場合は null（insufficient）にする。
 *
 * 【source_category について】
 * 'bank'   = 銀行明細（bank_statement）専用
 * 'credit' = クレカ明細（credit_card）専用
 * 'all'    = 全source_type共通
 *
 * 【ATMの入出金分離について】
 * 入金（income）と出金（expense）で借方・貸方が逆転する場合、
 * direction を分けて2エントリとして定義する。
 */
export interface NonVendorAccountEntry {
  /** 取引先外種別 */
  non_vendor_type: NonVendorType;
  /** 証票種類カテゴリ */
  source_category: 'bank' | 'credit' | 'all';
  /** 仕訳方向（行レベル） */
  direction: 'expense' | 'income';
  /** 借方科目（ACCOUNT_MASTER ID）。null = insufficient（人間判断） */
  debit: string | null;
  /** 貸方科目（ACCOUNT_MASTER ID）。null = insufficient（人間判断） */
  credit: string | null;
  /** 税区分（TAX_CATEGORY_MASTER ID）。null = insufficient */
  tax_category: string | null;
  /** 確定レベル */
  level: 'A' | 'insufficient';
  /** 日本語ラベル（UI表示・ログ用） */
  label: string;
}

// ============================================================
// § FlatNonVendorAccountRow型（DB層用フラット行）
// ============================================================

/**
 * DB層用フラット行（Supabase移行時に使用）
 *
 * vendor.type.ts の FlatIndustryVectorRow に対応する型。
 * Supabase テーブル non_vendor_account_map の1行に相当。
 */
export interface FlatNonVendorAccountRow {
  non_vendor_type: NonVendorType;
  source_category: 'bank' | 'credit' | 'all';
  direction: 'expense' | 'income';
  account_role: 'debit' | 'credit';
  account: string;
  tax_category: string | null;
  level: 'A' | 'insufficient';
}

// ============================================================
// § flattenNonVendorAccount() — TS層→DB層変換関数
// ============================================================

/**
 * TS層（プロパティ方式）→ DB層（列方式）への変換関数
 *
 * vendor.type.ts の flattenIndustryVector() に対応する関数。
 * debit / credit それぞれを独立した行に展開する。
 * null（insufficient）は行を生成しない。
 *
 * @example
 * ```ts
 * const rows = flattenNonVendorAccount({
 *   non_vendor_type: 'BANK_FEE',
 *   source_category: 'bank',
 *   direction: 'expense',
 *   debit: 'FEES',
 *   credit: 'ORDINARY_DEPOSIT',
 *   tax_category: 'PURCHASE_TAXABLE_10',
 *   level: 'A',
 *   label: '銀行振込手数料',
 * });
 * // → [
 * //   { non_vendor_type: 'BANK_FEE', source_category: 'bank', direction: 'expense', account_role: 'debit',  account: 'FEES',              tax_category: 'PURCHASE_TAXABLE_10', level: 'A' },
 * //   { non_vendor_type: 'BANK_FEE', source_category: 'bank', direction: 'expense', account_role: 'credit', account: 'ORDINARY_DEPOSIT',  tax_category: 'PURCHASE_TAXABLE_10', level: 'A' },
 * // ]
 * ```
 */
export function flattenNonVendorAccount(entry: NonVendorAccountEntry): FlatNonVendorAccountRow[] {
  const rows: FlatNonVendorAccountRow[] = [];

  if (entry.debit !== null) {
    rows.push({
      non_vendor_type: entry.non_vendor_type,
      source_category: entry.source_category,
      direction: entry.direction,
      account_role: 'debit',
      account: entry.debit,
      tax_category: entry.tax_category,
      level: entry.level,
    });
  }

  if (entry.credit !== null) {
    rows.push({
      non_vendor_type: entry.non_vendor_type,
      source_category: entry.source_category,
      direction: entry.direction,
      account_role: 'credit',
      account: entry.credit,
      tax_category: entry.tax_category,
      level: entry.level,
    });
  }

  return rows;
}
