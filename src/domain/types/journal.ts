/**
 * 会計ドメイン型定義
 *
 * 純粋な会計概念のみ。UI/API/DB固有の構造を含めない。
 * 全層（scripts, mocks, UI, 将来のbackend）がこの型を参照する。
 *
 * ルール:
 *   - この層は何もimportしない（Yen型のみ例外: 金額の基盤型）
 *   - Gemini, API, UI, Phase, Mockという語を含めない
 *   - 変更契機は「業務ルールの変更」のみ
 */

import type { Yen } from '@/shared/types/yen';

// ============================================================
// 手書き判定（3値enum）
// ============================================================

export const HandwrittenFlag = {
    NONE: 'NONE',
    NON_MEANINGFUL: 'NON_MEANINGFUL',
    MEANINGFUL: 'MEANINGFUL',
} as const;

export type HandwrittenFlag = typeof HandwrittenFlag[keyof typeof HandwrittenFlag];

// ============================================================
// 証票種類（7種）
// ============================================================

export const VoucherType = {
    RECEIPT: 'RECEIPT',
    INVOICE: 'INVOICE',
    TRANSPORT: 'TRANSPORT',
    CREDIT_CARD: 'CREDIT_CARD',
    BANK_STATEMENT: 'BANK_STATEMENT',
    MEDICAL: 'MEDICAL',
    NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

export type VoucherType = typeof VoucherType[keyof typeof VoucherType];

// ============================================================
// 支払方法（6種）
// ============================================================

export const PaymentMethod = {
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    E_MONEY: 'E_MONEY',
    QR_PAY: 'QR_PAY',
    OTHER: 'OTHER',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// ============================================================
// 税区分（マネーフォワード互換8値）
// @deprecated 新規コードでは shared/types/tax-category.ts の TaxCategory 型と
//             shared/data/tax-category-master.ts の概念IDを使用すること。
//             旧ID → 新IDの対応は TaxCodeMapper.ts で管理。
// ============================================================

export const LegacyTaxCategory = {
    TAXABLE_PURCHASE_10: 'TAXABLE_PURCHASE_10',
    TAXABLE_PURCHASE_8: 'TAXABLE_PURCHASE_8',
    NON_TAXABLE_PURCHASE: 'NON_TAXABLE_PURCHASE',
    OUT_OF_SCOPE_PURCHASE: 'OUT_OF_SCOPE_PURCHASE',
    TAXABLE_SALES_10: 'TAXABLE_SALES_10',
    TAXABLE_SALES_8: 'TAXABLE_SALES_8',
    NON_TAXABLE_SALES: 'NON_TAXABLE_SALES',
    OUT_OF_SCOPE_SALES: 'OUT_OF_SCOPE_SALES',
} as const;

export type LegacyTaxCategory = typeof LegacyTaxCategory[keyof typeof LegacyTaxCategory];

/** @deprecated LegacyTaxCategory を使用してください */
export const TaxCategory = LegacyTaxCategory;
/** @deprecated LegacyTaxCategory を使用してください */
export type TaxCategory = LegacyTaxCategory;

// ============================================================
// 勘定科目コード（30科目）
// ============================================================

export const AccountCode = {
    // 経費（17科目）
    TRAVEL: 'TRAVEL',
    SUPPLIES: 'SUPPLIES',
    COMMUNICATION: 'COMMUNICATION',
    MEETING: 'MEETING',
    ENTERTAINMENT: 'ENTERTAINMENT',
    ADVERTISING: 'ADVERTISING',
    FEES: 'FEES',
    RENT: 'RENT',
    UTILITIES: 'UTILITIES',
    INSURANCE: 'INSURANCE',
    REPAIRS: 'REPAIRS',
    MISCELLANEOUS: 'MISCELLANEOUS',
    WELFARE: 'WELFARE',
    OUTSOURCING: 'OUTSOURCING',
    PACKING_SHIPPING: 'PACKING_SHIPPING',
    TAXES_DUES: 'TAXES_DUES',
    DEPRECIATION: 'DEPRECIATION',
    // 売上・収入（3科目）
    SALES: 'SALES',
    RENTAL_INCOME: 'RENTAL_INCOME',
    INTEREST_INCOME: 'INTEREST_INCOME',
    // 資産（3科目）
    CASH: 'CASH',
    BANK_DEPOSIT: 'BANK_DEPOSIT',
    ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
    // 負債（2科目）
    ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
    ACCRUED_EXPENSES: 'ACCRUED_EXPENSES',
    // 税金（2科目）
    TAX_RECEIVED: 'TAX_RECEIVED',
    TAX_PAID: 'TAX_PAID',
    // 個人事業主専用（2科目）
    OWNER_DRAWING: 'OWNER_DRAWING',
    OWNER_INVESTMENT: 'OWNER_INVESTMENT',
    // 参照用
    MEDICAL_EXPENSE: 'MEDICAL_EXPENSE',
} as const;

export type AccountCode = typeof AccountCode[keyof typeof AccountCode];

// ============================================================
// 仕訳ラベル（22種）
// 準拠: journal_v2_20260214.md §2
// ============================================================

export type JournalLabel =
    // 証憑種類（7個）
    | 'RECEIPT'
    | 'INVOICE'
    | 'TRANSPORT'
    | 'CREDIT_CARD'
    | 'BANK_STATEMENT'
    | 'MEDICAL'
    | 'NOT_APPLICABLE'

    // 警告ラベル（10個）
    | 'DEBIT_CREDIT_MISMATCH'
    | 'TAX_CALCULATION_ERROR'
    | 'MISSING_FIELD'
    | 'UNREADABLE_FAILED'
    | 'DUPLICATE_CONFIRMED'
    | 'MULTIPLE_VOUCHERS'
    | 'DUPLICATE_SUSPECT'
    | 'DATE_OUT_OF_RANGE'
    | 'UNREADABLE_ESTIMATED'
    | 'MEMO_DETECTED'

    // 制度系（3個）
    | 'MULTI_TAX_RATE'
    | 'INVOICE_QUALIFIED'
    | 'INVOICE_NOT_QUALIFIED'

    // ルール（2個）
    | 'RULE_APPLIED'
    | 'RULE_AVAILABLE';

// ============================================================
// 仕訳行（N対N複合仕訳対応）
// ============================================================

export interface JournalEntryLine {
    /**
     * 勘定科目
     * nullable（null許容）: AIが勘定科目を判定できない場合null
     * CSV必須: MF（マネーフォワード）インポートで必須。nullならCSV出力前に警告
     */
    account: string | null;
    /**
     * 勘定科目の項目存在フラグ
     * false（項目なし）+ null → MISSING_FIELD（必須項目なし）
     * true（項目あり）+ null → UNREADABLE_FAILED（判読不能）
     */
    account_field_present: boolean;
    /** 補助科目（なしは正常） */
    sub_account: string | null;
    /**
     * 金額
     * nullable（null許容）: 証憑から金額が読み取れない場合null
     * CSV必須: MF（マネーフォワード）インポートで必須。nullならCSV出力前に警告
     */
    amount: Yen | null;
    /**
     * 金額の項目存在フラグ
     * false（項目なし）+ null → MISSING_FIELD（必須項目なし）
     * true（項目あり）+ null → UNREADABLE_FAILED（判読不能）
     */
    amount_field_present: boolean;
    /** 税区分の概念ID（例: PURCHASE_TAXABLE_10）。表示時はマスタからnameを取得 */
    tax_category_id: string | null;
}
