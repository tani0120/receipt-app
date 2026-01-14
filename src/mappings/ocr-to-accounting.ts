/**
 * OCR to Accounting Mappings - 型安全なマッピング定義
 *
 * OCR出力（Gemini, Anthropic等）から会計ソフト形式（弥生, Freee, MF）への
 * フィールドマッピングを定義する
 *
 * 設計原則：
 * - 全てのマッピングは型安全（IDEの補完が効く）
 * - 存在しないフィールド名はコンパイルエラー
 * - マッピング定義が一箇所に集約
 */

import { z } from 'zod';

/**
 * 会計ソフト共通のフィールド定義
 *
 * 注：実際のZodスキーマは今後定義する
 * ここでは型定義のみ先行して作成
 */

// 弥生形式（仮定義）
export const YayoiSchema = z.object({
  vendor_name: z.string(),
  amount: z.number(),
  transaction_date: z.string(),
  tax_rate: z.number().optional(),
  account_code: z.string().optional(),
});

// Freee形式（仮定義）
export const FreeeSchema = z.object({
  partner_name: z.string(),
  total_amount: z.number(),
  issue_date: z.string(),
  tax_category: z.string().optional(),
});

// MF（マネーフォワード）形式（仮定義）
export const MFSchema = z.object({
  supplier: z.string(),
  price: z.number(),
  date: z.string(),
  tax_type: z.string().optional(),
});

/**
 * OCR出力形式（仮定義）
 *
 * 注：実際のOCR出力スキーマは src/api/lib/ai/strategies/ に存在する可能性
 * ここでは簡易版を定義
 */

// Gemini OCR出力（仮定義）
export const GeminiOutputSchema = z.object({
  vendor: z.string(),
  totalAmount: z.number(),
  date: z.string(),
  taxRate: z.number().optional(),
});

// Anthropic OCR出力（仮定義）
export const AnthropicOutputSchema = z.object({
  supplier: z.string(),
  sum: z.number(),
  issueDate: z.string(),
  taxCategory: z.string().optional(),
});

/**
 * 型安全なマッピング定義
 */

export const Mappings = {
  /**
   * Gemini → 弥生
   */
  GeminiToYayoi: {
    vendor: 'vendor_name',
    totalAmount: 'amount',
    date: 'transaction_date',
    taxRate: 'tax_rate',
  } as const,

  /**
   * Gemini → Freee
   */
  GeminiToFreee: {
    vendor: 'partner_name',
    totalAmount: 'total_amount',
    date: 'issue_date',
  } as const,

  /**
   * Gemini → MF
   */
  GeminiToMF: {
    vendor: 'supplier',
    totalAmount: 'price',
    date: 'date',
  } as const,

  /**
   * Anthropic → 弥生
   */
  AnthropicToYayoi: {
    supplier: 'vendor_name',
    sum: 'amount',
    issueDate: 'transaction_date',
  } as const,

  /**
   * Anthropic → Freee
   */
  AnthropicToFreee: {
    supplier: 'partner_name',
    sum: 'total_amount',
    issueDate: 'issue_date',
    taxCategory: 'tax_category',
  } as const,

  /**
   * Anthropic → MF
   */
  AnthropicToMF: {
    supplier: 'supplier',
    sum: 'price',
    issueDate: 'date',
    taxCategory: 'tax_type',
  } as const,
} as const;

/**
 * マッピング名の型定義
 */
export type MappingName = keyof typeof Mappings;

/**
 * OCRストラテジー名
 */
export const OCR_Strategies = ['gemini', 'anthropic'] as const;
export type OCRStrategy = typeof OCR_Strategies[number];

/**
 * 会計ソフト形式名
 */
export const ExportFormats = ['yayoi', 'freee', 'mf'] as const;
export type ExportFormat = typeof ExportFormats[number];

/**
 * ストラテジーとマッピングの対応表
 */
export const StrategyToSchema = {
  gemini: GeminiOutputSchema,
  anthropic: AnthropicOutputSchema,
} as const;

export const FormatToSchema = {
  yayoi: YayoiSchema,
  freee: FreeeSchema,
  mf: MFSchema,
} as const;
