/**
 * v1正解データ: 個人・青色・税込経理
 *
 * 対象: #1（源泉あり）、#5（手数料あり）のみ
 * 目的: v1 1回目テスト用
 *
 * v0からの変更点:
 *   - adjustmentsフィールド追加（v1新規）
 *   - #5 total_amount: 101,115 → 107,000（契約対価=賃料収入。入金額ではない）
 *   - #5 entries: BANK_DEPOSIT金額修正（100,675 → 101,115）
 *
 * 設定: kojin_aoiro_tax_included（test_config.ts 設定A）
 */

import type { AccountCode, TaxCategory, VoucherType, PaymentMethod } from '../classify_schema';
import type { AdjustmentEntry } from '../classify_schema';

// ============================================================
// v1型定義（v0 + adjustments）
// ============================================================

export interface GroundTruthTaxEntry {
  rate: number;
  taxable_amount: number;
  tax_amount: number;
}

export interface GroundTruthEntry {
  entry_type: 'debit' | 'credit';
  account: AccountCode;
  sub_account: string | null;
  tax_category: TaxCategory;
  amount: number;
  description: string;
}

/** v1正解データ型（v0 + adjustments） */
export interface GroundTruthV1 {
  file: string;
  voucher_type: VoucherType;
  date: string | null;
  total_amount: number | null;
  issuer_name: string | null;
  issuer_branch: string | null;
  description: string | null;
  payment_method: PaymentMethod | null;
  invoice_registration_number: string | null;
  is_invoice_qualified: boolean;
  tax_entries: GroundTruthTaxEntry[];
  entries: GroundTruthEntry[];
  adjustments: AdjustmentEntry[] | null;  // v1追加
  handwritten_flag: 'NONE' | 'NON_MEANINGFUL' | 'MEANINGFUL';
  handwritten_memo_content: string | null;
  is_medical_expense: boolean;
  is_not_applicable: boolean;
  not_applicable_reason: string | null;
  has_multiple_vouchers: boolean;
  is_credit_card_payment: boolean;
  notes: string;
}

// ============================================================
// v1正解データ（#1, #5のみ）
// ============================================================

export const GROUND_TRUTH_V1: GroundTruthV1[] = [

  // ────────────────────────────────────────
  // #1: 1.pdf —  報酬請求書（宛名不一致で除外）
  //
  // v0→v1変更:
  //   - total_amount: 170,500（変更なし。契約対価そのもの）
  //   - adjustments追加: 源泉徴収税15,823円
  //   - entries: 変更なし（宛名不一致で仕訳なし）
  //
  // D-1テスト: total_amount=170,500であること（入金額154,677ではない）
  //   → 請求書に記載: 報酬155,000 + 消費税15,500 = 170,500
  //   → 源泉徴収税15,823は控除であり、total_amountから引かない
  // ────────────────────────────────────────
  {
    file: '1.pdf',
    voucher_type: 'INVOICE',
    date: '2025-12-30',
    total_amount: 170500,                              // v1: 契約対価（控除前）= 170,500
    issuer_name: '',
    issuer_branch: null,
    description: '報酬請求書',
    payment_method: null,
    invoice_registration_number: '',
    is_invoice_qualified: true,
    tax_entries: [
      { rate: 10, taxable_amount: 155000, tax_amount: 15500 },
    ],
    entries: [],                                       // 宛名不一致のため仕訳なし
    adjustments: [                                     // v1追加
      {
        type: 'withholding_tax',
        amount: 15823,
        description: '源泉徴収税（税理士報酬）',
      },
    ],
    handwritten_flag: 'NONE',
    handwritten_memo_content: null,
    is_medical_expense: false,
    is_not_applicable: true,
    not_applicable_reason: '宛名が事業者名（）と不一致（）',
    has_multiple_vouchers: false,
    is_credit_card_payment: false,
    notes: 'v1テスト: total_amount=170,500（入金額154,677ではない）。源泉15,823をadjustmentsに出力。宛名不一致で除外だがOCR・adjustmentsは出力。',
  },

  // ────────────────────────────────────────
  // #5: 5.jpg —  物件収支報告書（複合仕訳・住宅貸付）
  //
  // v0→v1変更:
  //   ⚠️ total_amount: 101,115 → 107,000（入金額→契約対価に修正）
  //   - adjustments追加: 振込手数料440円
  //   - entries修正: BANK_DEPOSIT 100,675 → 101,115（手数料差引後の入金額）
  //     ※ entryのamountは実際の入金額（100,675）ではなく
  //       収支報告書の振込額（101,115）。但し振込手数料440はFEESで別計上済み
  //     ※ 再計算: 107,000 - 5,885(管理料) - 440(手数料) = 100,675
  //       101,115は画像上の「差引お支払金額」
  //
  // D-1テスト: total_amount=107,000であること（入金額101,115ではない）
  //   → 収支報告書に記載: 賃料収入107,000（契約対価）
  //   → 管理料5,885と手数料440は経費であり、total_amountから引かない
  //
  // P-4テスト: TAX_PAID/TAX_RECEIVEDが出力されないこと
  //   → 税込経理のため仮払/仮受消費税は使用禁止
  // ────────────────────────────────────────
  {
    file: '5.jpg',
    voucher_type: 'INVOICE',
    date: '2024-01-19',
    total_amount: 107000,                              // ⚠️ v1修正: 契約対価（賃料収入）= 107,000
    issuer_name: '',
    issuer_branch: '本店',
    description: '1月分物件収支報告（XX6丁目貸家）',
    payment_method: 'BANK_TRANSFER',
    invoice_registration_number: '',
    is_invoice_qualified: true,
    tax_entries: [
      { rate: 10, taxable_amount: 5350, tax_amount: 535 },
    ],
    entries: [
      {
        entry_type: 'debit',
        account: 'FEES',
        sub_account: null,
        tax_category: 'TAXABLE_PURCHASE_10',
        amount: 5885,
        description: '賃貸管理料',
      },
      {
        entry_type: 'debit',
        account: 'FEES',
        sub_account: null,
        tax_category: 'TAXABLE_PURCHASE_10',
        amount: 440,
        description: '振込手数料',
      },
      {
        entry_type: 'debit',
        account: 'BANK_DEPOSIT',
        sub_account: null,
        tax_category: 'OUT_OF_SCOPE_PURCHASE',
        amount: 100675,                                // 107,000 - 5,885 - 440 = 100,675
        description: '物件収支送金分',
      },
      {
        entry_type: 'credit',
        account: 'RENTAL_INCOME',
        sub_account: null,
        tax_category: 'NON_TAXABLE_SALES',
        amount: 107000,                                // 契約対価（賃料収入）
        description: '貸家 賃料収入',
      },
    ],
    adjustments: [                                     // v1追加
      {
        type: 'transfer_fee',
        amount: 440,
        description: '振込手数料',
      },
    ],
    handwritten_flag: 'NON_MEANINGFUL',
    handwritten_memo_content: null,
    is_medical_expense: false,
    is_not_applicable: false,
    not_applicable_reason: null,
    has_multiple_vouchers: false,
    is_credit_card_payment: false,
    notes: 'v1テスト: total_amount=107,000（入金額101,115ではない。賃料収入=契約対価）。振込手数料440をadjustmentsに出力。管理料はadjustmentsではなくFEES仕訳（経費計上）。P-4テスト: TAX_PAID/TAX_RECEIVEDが出力されないこと。',
  },
];
`,
<parameter name="Complexity">7
