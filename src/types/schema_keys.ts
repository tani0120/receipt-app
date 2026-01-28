/**
 * Schema Keys - 型安全な鍵リスト
 *
 * 全Zodスキーマからkeyof().enumを抽出し、タイポを物理的に不可能にする
 *
 * Usage:
 * ```typescript
 * import { Keys } from '@/types/schema_keys';
 *
 * // UIで使用
 * <input :name="Keys.Receipt.totalPrice" />
 *
 * // マッピングで使用
 * const mapping = {
 *   [Keys.Gemini.vendor]: Keys.Yayoi.vendor_name,
 * };
 * ```
 */

import {
    // Core Schemas
    ReceiptSchema,
    ClientSchema,
    JobSchema,
    JournalLineSchema,
    SystemSettingsSchema,
    AuditLogSchema,
    LearningRuleSchema,

    // Enum Schemas
    AccountingSoftwareSchema,
    ClientStatusSchema,
    JobStatusSchema,
    TaxFilingTypeSchema,
    ConsumptionTaxModeSchema,
    SimplifiedTaxCategorySchema,

    // Timestamp
    TimestampSchema,
} from './zod_schema';

/**
 * 型安全な鍵リスト
 *
 * IDEの補完が効き、存在しないキー名はコンパイルエラーになる
 */
export const Keys = {
    // Core Entities
    Receipt: ReceiptSchema.keyof().enum,
    Client: ClientSchema.keyof().enum,
    Job: JobSchema.keyof().enum,
    JournalLine: JournalLineSchema.keyof().enum,
    SystemSettings: SystemSettingsSchema.keyof().enum,
    AuditLog: AuditLogSchema.keyof().enum,
    LearningRule: LearningRuleSchema.keyof().enum,
} as const;

/**
 * 型定義をエクスポート
 *
 * TypeScriptの型システムで使用可能
 */
export type ReceiptKey = keyof typeof ReceiptSchema.shape;
export type ClientKey = keyof typeof ClientSchema.shape;
export type JobKey = keyof typeof JobSchema.shape;
export type JournalLineKey = keyof typeof JournalLineSchema.shape;
export type SystemSettingsKey = keyof typeof SystemSettingsSchema.shape;
export type AuditLogKey = keyof typeof AuditLogSchema.shape;
export type LearningRuleKey = keyof typeof LearningRuleSchema.shape;

/**
 * Enum値の型定義
 */
export type AccountingSoftware = z.infer<typeof AccountingSoftwareSchema>;
export type ClientStatus = z.infer<typeof ClientStatusSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type TaxFilingType = z.infer<typeof TaxFilingTypeSchema>;
export type ConsumptionTaxMode = z.infer<typeof ConsumptionTaxModeSchema>;
export type SimplifiedTaxCategory = z.infer<typeof SimplifiedTaxCategorySchema>;

// Zodの型推論用にインポート
import { z } from 'zod';
