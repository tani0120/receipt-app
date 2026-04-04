/**
 * Phase A-2 v2: 証票分類 Gemini実験 — JSON Schema定義
 *
 * 目的: Gemini 1 API callで証票から抽出すべき情報の構造定義
 * 依存: @google-cloud/vertexai の SchemaType のみ
 * スコープ: 実験用。既存の src/mocks/ src/shared/ には依存しない
 *
 * 変更履歴:
 *   v1: 初回実験用（22フィールド）
 *   v2: 全面再設計（層A 29フィールド + 層B コード側8項目）
 *       - classification_status / date_anomaly / date_anomaly_reason をGeminiから削除
 *       - 読取不可フラグ3種追加
 *       - journal_entry_suggestions 配列化
 *       - receipt_items / payment_method / issuer_branch / bank_name_evidence 追加
 *       - has_multiple_vouchers / is_composite_transaction / handwritten_memo_content 追加
 *   v3.1: 確定スキーマ完全対応
 *       - A30: is_credit_card_payment 追加
 *       - G1: sub_account（補助科目）追加
 *       - G2: tax_category（税区分 8値enum）追加
 *       - PostProcessResult に labels[] 追加
 */

import { SchemaType } from '@google-cloud/vertexai';

// ============================================================
// TypeScript型定義
// ============================================================

// ============================================================
// domain層からの再export（型の出自はdomain層）
// ============================================================
import {
  type VoucherType,
  type PaymentMethod,
  type TaxCategory,
  type AccountCode,
  HandwrittenFlag,
} from '../domain/types/journal';
export type { VoucherType, PaymentMethod, TaxCategory, AccountCode };
export { HandwrittenFlag };

/** 分類ステータス（コード側で判定。Geminiには出力させない） */
export type ClassificationStatus =
  | 'auto_confirmed'    // 高信頼度で自動確定
  | 'needs_review'      // 人間確認必要
  | 'excluded';         // 仕訳対象外

/** 税率明細 */
export interface TaxEntry {
  rate: number;           // 8 or 10
  taxable_amount: number; // 税抜額
  tax_amount: number;     // 消費税額
}

/** 仕訳候補エントリ（配列の1要素） */
export interface JournalSuggestionEntry {
  entry_type: 'debit' | 'credit';
  account: AccountCode;       // 勘定科目（30科目enum）
  sub_account: string | null; // 補助科目（G1: 銀行名等。不明ならnull）
  tax_category: TaxCategory;  // 税区分（G2: 8値enum）
  amount: number;
  description: string;        // 摘要
}

/** 商品明細（レシート用） */
export interface ReceiptItem {
  name: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  tax_rate: number | null;  // 8 or 10
}

/**
 * 明細行（カード明細・通帳の各行）
 *
 * @deprecated Phase A-2 旧世代。debit_account/credit_accountは新設計と乖離。
 *   新設計: src/mocks/types/pipeline/line_item.type.ts の LineItem を使用すること。
 *   direction（'expense'|'income'）と balance（残高）で代替済み（T-P4実測根拠）。
 *   本インターフェースは document_filter_test.ts 専用に残す。将来削除予定。
 */
export interface LineItem {
  date: string | null;
  description: string;
  amount: number;
  debit_account: string | null;
  credit_account: string | null;
}

// ============================================================
// 層A: Geminiに出力させるレスポンス型（29フィールド）
// ============================================================

/** Gemini 1 callのレスポンス型（層A） */
export interface GeminiClassifyResponse {
  // === A1-A2: 証票分類 ===
  voucher_type: VoucherType;
  voucher_type_confidence: number;  // 0.0〜1.0

  // === A3-A8: OCR抽出（3状態: 値あり / null=欄なし / unreadable=読めない） ===
  date: string | null;              // YYYY-MM-DD
  date_unreadable: boolean;
  total_amount: number | null;      // 税込合計
  amount_unreadable: boolean;
  issuer_name: string | null;       // 発行者名
  issuer_unreadable: boolean;

  // === A9-A11: 追加OCR ===
  issuer_branch: string | null;     // 支店名/店舗名
  description: string | null;       // 摘要
  payment_method: PaymentMethod | null;

  // === A12-A13: 適格請求書 ===
  invoice_registration_number: string | null;  // T + 13桁
  is_invoice_qualified: boolean;

  // === A14-A16: 税率 ===
  tax_entries: TaxEntry[];
  has_multiple_tax_rates: boolean;
  has_reduced_tax_rate: boolean;

  // === A17-A19: 口座推定 ===
  bank_name_guess: string | null;
  bank_name_confidence: number | null;  // 0.0〜1.0
  bank_name_evidence: string | null;    // 推定理由

  // === A20-A21: 仕訳候補 ===
  journal_entry_suggestions: JournalSuggestionEntry[];
  is_composite_transaction: boolean;

  // === A22-A23: 手書き判定 ===
  handwritten_flag: HandwrittenFlag;
  handwritten_memo_content: string | null;

  // === A24: 医療費 ===
  is_medical_expense: boolean;

  // === A25-A26: 除外判定 ===
  is_not_applicable: boolean;
  not_applicable_reason: string | null;

  // === A27: 証票枚数 ===
  has_multiple_vouchers: boolean;

  // === A28: 商品明細 ===
  receipt_items: ReceiptItem[] | null;

  // === A29: 通帳/カード明細行 ===
  line_items: LineItem[] | null;

  // === A30: クレジットカード払い（v3.1追加）===
  is_credit_card_payment: boolean;
}

// ============================================================
// 層B: コード側post-processの結果型
// ============================================================

export interface PostProcessResult {
  classification_status: ClassificationStatus;
  tax_calculation_mismatch: boolean;
  tax_calculation_detail: string;       // 検算式
  date_anomaly: boolean;
  date_anomaly_reason: string;
  duplicate_suspect: boolean;
  duplicate_suspect_detail: string;
  debit_credit_mismatch: boolean;
  debit_credit_detail: string;          // 検算式
  estimated_cost_usd: number;
  labels: string[];                     // 自動生成ラベル（22種から該当分）
}

/** 最終結果（層A + 層B統合） */
export interface ClassifyResult {
  gemini: GeminiClassifyResponse;
  postprocess: PostProcessResult;
  metadata: {
    file: string;
    duration_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    preprocessed: boolean;            // A/Bテスト識別用
    cost_breakdown: {
      prompt_cost_usd: number;
      completion_cost_usd: number;
      thinking_cost_usd: number;
      total_cost_usd: number;
    };
  };
}

// ============================================================
// Vertex AI SchemaType定義（structured output用）
// ============================================================

export const CLASSIFY_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    // --- A1-A2: 証票分類 ---
    voucher_type: {
      type: SchemaType.STRING,
      enum: ['RECEIPT', 'INVOICE', 'TRANSPORT', 'CREDIT_CARD', 'BANK_STATEMENT', 'MEDICAL', 'NOT_APPLICABLE'],
      description: '証票の種類'
    },
    voucher_type_confidence: {
      type: SchemaType.NUMBER,
      description: '証票分類の信頼度（0.0〜1.0）'
    },

    // --- A3-A8: OCR抽出（3状態） ---
    date: {
      type: SchemaType.STRING,
      nullable: true,
      description: '取引日（YYYY-MM-DD）。欄自体が存在しない場合はnull'
    },
    date_unreadable: {
      type: SchemaType.BOOLEAN,
      description: '日付欄はあるが文字が潰れて読めない場合true'
    },
    total_amount: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: '合計金額（税込）。欄自体が存在しない場合はnull'
    },
    amount_unreadable: {
      type: SchemaType.BOOLEAN,
      description: '金額欄はあるが文字が潰れて読めない場合true'
    },
    issuer_name: {
      type: SchemaType.STRING,
      nullable: true,
      description: '発行者名（会社名・店舗名）。欄自体が存在しない場合はnull'
    },
    issuer_unreadable: {
      type: SchemaType.BOOLEAN,
      description: '発行者名欄はあるが読めない場合true'
    },

    // --- A9-A11: 追加OCR ---
    issuer_branch: {
      type: SchemaType.STRING,
      nullable: true,
      description: '支店名・店舗名（例: 谷町四丁目店）'
    },
    description: {
      type: SchemaType.STRING,
      nullable: true,
      description: '摘要（取引内容の要約）'
    },
    payment_method: {
      type: SchemaType.STRING,
      nullable: true,
      enum: ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'E_MONEY', 'QR_PAY', 'OTHER'],
      description: '支払方法。判別不能な場合はnull'
    },

    // --- A12-A13: 適格請求書 ---
    invoice_registration_number: {
      type: SchemaType.STRING,
      nullable: true,
      description: 'インボイス登録番号（T + 13桁、ハイフンなし）。存在しない場合はnull'
    },
    is_invoice_qualified: {
      type: SchemaType.BOOLEAN,
      description: '適格請求書か。T番号が存在する場合true'
    },

    // --- A14-A16: 税率 ---
    tax_entries: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rate: { type: SchemaType.NUMBER, description: '税率（8 or 10）' },
          taxable_amount: { type: SchemaType.NUMBER, description: '税抜額' },
          tax_amount: { type: SchemaType.NUMBER, description: '消費税額' }
        },
        required: ['rate', 'taxable_amount', 'tax_amount']
      },
      description: '税率別内訳。税情報がない場合は空配列'
    },
    has_multiple_tax_rates: {
      type: SchemaType.BOOLEAN,
      description: '8%と10%が混在しているか'
    },
    has_reduced_tax_rate: {
      type: SchemaType.BOOLEAN,
      description: '軽減税率（8%）の取引が含まれるか'
    },

    // --- A17-A19: 口座推定 ---
    bank_name_guess: {
      type: SchemaType.STRING,
      nullable: true,
      description: '推定銀行名（口座明細の場合）'
    },
    bank_name_confidence: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: '銀行名推定の信頼度（0.0〜1.0）'
    },
    bank_name_evidence: {
      type: SchemaType.STRING,
      nullable: true,
      description: '銀行名推定の根拠（ロゴ形状、フォーマット特徴、固有キーワード等）'
    },

    // --- A20-A21: 仕訳候補 ---
    journal_entry_suggestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          entry_type: {
            type: SchemaType.STRING,
            enum: ['debit', 'credit'],
            description: '借方(debit)または貸方(credit)'
          },
          account: {
            type: SchemaType.STRING,
            enum: [
              'TRAVEL', 'SUPPLIES', 'COMMUNICATION', 'MEETING', 'ENTERTAINMENT',
              'ADVERTISING', 'FEES', 'RENT', 'UTILITIES', 'INSURANCE',
              'REPAIRS', 'MISCELLANEOUS', 'WELFARE', 'OUTSOURCING', 'PACKING_SHIPPING',
              'TAXES_DUES', 'DEPRECIATION',
              'SALES', 'RENTAL_INCOME', 'INTEREST_INCOME',
              'CASH', 'BANK_DEPOSIT', 'ACCOUNTS_RECEIVABLE',
              'ACCOUNTS_PAYABLE', 'ACCRUED_EXPENSES',
              'TAX_RECEIVED', 'TAX_PAID',
              'OWNER_DRAWING', 'OWNER_INVESTMENT',
              'MEDICAL_EXPENSE'
            ],
            description: '勘定科目（30科目enum）'
          },
          sub_account: {
            type: SchemaType.STRING,
            nullable: true,
            description: '補助科目（銀行名、カード名等。不明ならnull）'
          },
          tax_category: {
            type: SchemaType.STRING,
            enum: [
              'TAXABLE_PURCHASE_10', 'TAXABLE_PURCHASE_8',
              'NON_TAXABLE_PURCHASE', 'OUT_OF_SCOPE_PURCHASE',
              'TAXABLE_SALES_10', 'TAXABLE_SALES_8',
              'NON_TAXABLE_SALES', 'OUT_OF_SCOPE_SALES'
            ],
            description: '税区分（課税仕入10%/8%、非課税仕入、対象外等）'
          },
          amount: { type: SchemaType.NUMBER, description: '金額' },
          description: { type: SchemaType.STRING, description: '摘要' }
        },
        required: ['entry_type', 'account', 'tax_category', 'amount', 'description']
      },
      description: '仕訳候補。借方・貸方を各エントリで表現。対象外の場合は空配列'
    },
    is_composite_transaction: {
      type: SchemaType.BOOLEAN,
      description: '複合仕訳か（複数の勘定科目が必要、または貸借が2行以上）'
    },

    // --- A22-A23: 手書き判定 ---
    handwritten_flag: {
      type: SchemaType.STRING,
      enum: ['NONE', 'NON_MEANINGFUL', 'MEANINGFUL'],
      description: '手書き判定。NONE=手書きなし、NON_MEANINGFUL=チェックマーク・走り書き等、MEANINGFUL=金額修正・用途追記等の会計的に意味のある手書き。角印・受領印・スタンプは手書きに含めない'
    },
    handwritten_memo_content: {
      type: SchemaType.STRING,
      nullable: true,
      description: '手書きの内容（読み取れた場合。optional）'
    },

    // --- A24: 医療費 ---
    is_medical_expense: {
      type: SchemaType.BOOLEAN,
      description: '医療費の取引か（薬局・クリニック・病院等）'
    },

    // --- A25-A26: 除外判定 ---
    is_not_applicable: {
      type: SchemaType.BOOLEAN,
      description: '仕訳対象外か（謄本・名刺・メモ・風景写真等）'
    },
    not_applicable_reason: {
      type: SchemaType.STRING,
      nullable: true,
      description: '対象外の理由'
    },

    // --- A27: 証票枚数 ---
    has_multiple_vouchers: {
      type: SchemaType.BOOLEAN,
      description: '1画像に2枚以上の証票が写っているか'
    },

    // --- A28: 商品明細 ---
    receipt_items: {
      type: SchemaType.ARRAY,
      nullable: true,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: '商品名' },
          quantity: { type: SchemaType.NUMBER, nullable: true, description: '数量' },
          unit_price: { type: SchemaType.NUMBER, nullable: true, description: '単価' },
          amount: { type: SchemaType.NUMBER, description: '金額' },
          tax_rate: { type: SchemaType.NUMBER, nullable: true, description: '税率（8 or 10）' }
        },
        required: ['name', 'amount']
      },
      description: '商品明細（レシートの場合）。該当しない場合はnull'
    },

    // --- A29: 通帳/カード明細行 ---
    line_items: {
      type: SchemaType.ARRAY,
      nullable: true,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING, nullable: true, description: '取引日（YYYY-MM-DD）' },
          description: { type: SchemaType.STRING, description: '取引内容' },
          amount: { type: SchemaType.NUMBER, description: '金額' },
          debit_account: { type: SchemaType.STRING, nullable: true, description: '借方勘定科目（推定）' },
          credit_account: { type: SchemaType.STRING, nullable: true, description: '貸方勘定科目（推定）' }
        },
        required: ['description', 'amount']
      },
      description: '明細行（通帳・カード明細の場合）。該当しない場合はnull'
    },

    // --- A30: クレジットカード払い（v3.1追加） ---
    is_credit_card_payment: {
      type: SchemaType.BOOLEAN,
      description: 'クレジットカード払いか。カード会社ロゴ、「カード」テキスト、下4桁番号等を検出した場合true。voucher_typeとは独立'
    }
  },
  required: [
    'voucher_type',
    'voucher_type_confidence',
    'date_unreadable',
    'amount_unreadable',
    'issuer_unreadable',
    'is_invoice_qualified',
    'tax_entries',
    'has_multiple_tax_rates',
    'has_reduced_tax_rate',
    'journal_entry_suggestions',
    'is_composite_transaction',
    'handwritten_flag',
    'is_medical_expense',
    'is_not_applicable',
    'has_multiple_vouchers',
    'is_credit_card_payment'
  ]
};
