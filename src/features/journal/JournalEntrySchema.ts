/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【型安全性ルール - AI必須遵守事項】
 *
 * ❌ 禁止事項（6項目）- NEVER DO THESE:
 * 1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
 * 2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
 * 3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
 * 4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
 * 5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
 * 6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT
 *
 * ✅ 許可事項（3項目）- ALLOWED:
 * 1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
 * 2. unknown型の使用（型ガードと組み合わせて）
 * 3. 必要最小限の型定義（Pick<T>, Omit<T>等）
 *
 * 詳細: complete_evidence_no_cover_up.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

// L1: Zod Guard（構造防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// ============================================================
// 列挙型
// ============================================================

/**
 * AI由来の情報かどうかを示す
 */
export const AISourceTypeEnum = z.enum(['gemini', 'manual', 'hybrid']);

/**
 * 税率区分（旧）- 下位互換のため残す
 */
export const TaxTypeEnum = z.enum(['none', 'consumption', 'reduced']);

/**
 * 税区分（中間コード） - Phase 1必須
 */
export const TaxCodeEnum = z.enum([
  // 売上
  'TAXABLE_SALES_10',           // 課税売上10%
  'TAXABLE_SALES_REDUCED_8',    // 課税売上8%(軽)
  'NON_TAXABLE_SALES',          // 非課税売上
  'OUT_OF_SCOPE_SALES',         // 対象外売上

  // 仕入
  'TAXABLE_PURCHASE_10',        // 課税仕入10%
  'TAXABLE_PURCHASE_REDUCED_8', // 課税仕入8%(軽)
  'COMMON_TAXABLE_PURCHASE_10', // 共通課税仕入10%
  'NON_TAXABLE_PURCHASE',       // 非課税仕入
  'OUT_OF_SCOPE_PURCHASE',      // 対象外(仕入)

  // 特殊
  'REVERSE_CHARGE',             // リバースチャージ
  'IMPORT_TAX',                 // 輸入消費税
]);

/**
 * インボイス控除区分 - Phase 1: 80%固定、Phase 2: 70/50/30%追加
 */
export const InvoiceDeductionEnum = z.enum([
  'QUALIFIED',        // 適格請求書（100%控除）
  'DEDUCTION_80',     // 80%控除（～2026/09/30）
  'DEDUCTION_70',     // 70%控除（2026/10/01～）Phase 2
  'DEDUCTION_50',     // 50%控除 Phase 2
  'DEDUCTION_30',     // 30%控除 Phase 2
  'DEDUCTION_NONE',   // 控除不可
]);

/**
 * 最終税額がどこから採用されたか
 */
export const TaxAmountSourceEnum = z.enum(['FROM_DOCUMENT', 'CALCULATED', 'USER_INPUT']);

/**
 * 税額ズレの重要度
 */
export const TaxDiscrepancySeverityEnum = z.enum(['OK', 'WARNING', 'ERROR']);

/**
 * ファイルタイプ（2段階分類のステージ1）
 */
export const FileTypeEnum = z.enum([
  'RECEIPT',             // 領収書
  'INVOICE',             // 請求書
  'BANK_CSV',            // 通帳CSV
  'BANK_IMAGE',          // 通帳画像
  'CREDIT_CSV',          // クレカ明細CSV
  'CREDIT_IMAGE',        // クレカ明細画像
  'OTHER_JOURNAL',       // その他（仕訳関連）
  'OTHER_NON_JOURNAL',   // その他（仕訳無関係）
]);

// ============================================================
// JournalLine（仕訳明細）
// ============================================================

// Draft段階（OCR直後）- optional許可
export const JournalLineDraftSchema = z.object({
  lineId: z.string().uuid(),

  // 勘定科目（optional許可）
  accountCode: z.string().optional(),
  accountName: z.string().optional(),
  subAccount: z.string().optional(),

  // 金額（optional許可）
  debit: z.number().min(0).optional(),
  credit: z.number().min(0).optional(),

  // 取引先（Phase 1追加）
  vendorNameRaw: z.string().optional(),
  vendorName: z.string().optional(),

  // 税区分（Phase 1追加）
  taxCode: TaxCodeEnum.optional(),
  invoiceDeduction: InvoiceDeductionEnum.optional(),

  // 税額情報
  taxType: TaxTypeEnum.optional(),
  taxAmountFromDocument: z.number().min(0).optional(),
  taxDocumentSource: z.enum(['OCR_EXTRACTED', 'MANUAL_INPUT', 'NOT_PRESENT']).optional(),
  taxAmountCalculated: z.number().min(0).optional(),
  taxCalculationMethod: z.enum(['SIMPLE_RATE', 'NET_AMOUNT_REVERSE', 'CUSTOM']).optional(),
  taxAmountFinal: z.number().min(0).optional(),
  taxAmountSource: TaxAmountSourceEnum.optional(),
  taxDiscrepancy: z.object({
    hasDiscrepancy: z.boolean(),
    differenceAmount: z.number(),
    severity: TaxDiscrepancySeverityEnum,
    reason: z.string().optional()
  }).optional(),

  // その他
  description: z.string().optional(),
  isAIGenerated: z.boolean().optional(),
  isOutOfPeriod: z.boolean().optional(),
  outOfPeriodReason: z.string().optional(),
}).strict();

// 確定段階（ユーザー確認後）- optional禁止
export const JournalLineSchema = z.object({
  lineId: z.string().uuid(),

  // 勘定科目（必須）
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  subAccount: z.string().optional(),

  // 金額（必須）
  debit: z.number().min(0),
  credit: z.number().min(0),

  // 取引先（Phase 1追加）
  vendorNameRaw: z.string().optional(),
  vendorName: z.string().optional(),

  // 税区分（Phase 1追加 - 必須）
  taxCode: TaxCodeEnum,
  invoiceDeduction: InvoiceDeductionEnum.default('QUALIFIED'),

  // 税額情報
  taxType: TaxTypeEnum,
  taxAmountFromDocument: z.number().min(0).optional(),
  taxDocumentSource: z.enum(['OCR_EXTRACTED', 'MANUAL_INPUT', 'NOT_PRESENT']),
  taxAmountCalculated: z.number().min(0),
  taxCalculationMethod: z.enum(['SIMPLE_RATE', 'NET_AMOUNT_REVERSE', 'CUSTOM']),
  taxAmountFinal: z.number().min(0),
  taxAmountSource: TaxAmountSourceEnum,
  taxDiscrepancy: z.object({
    hasDiscrepancy: z.boolean(),
    differenceAmount: z.number(),
    severity: TaxDiscrepancySeverityEnum,
    reason: z.string().optional()
  }).optional(),

  // その他
  description: z.string().optional(),
  isAIGenerated: z.boolean(),
  isOutOfPeriod: z.boolean().optional(),
  outOfPeriodReason: z.string().optional(),
}).strict();

// ============================================================
// JournalEntry（仕訳エントリ）
// ============================================================

// Draft段階（OCR直後）- optional許可
export const JournalEntryDraftSchema = z.object({
  id: z.string().uuid(),
  status: z.literal('Draft'),  // L1-3準拠

  // 基本情報（optional許可）
  date: z.string().optional(),
  description: z.string().optional(),
  totalAmount: z.number().min(0).optional(),

  // 明細行（最小1行、Draft時）
  lines: z.array(JournalLineDraftSchema).min(1),

  // 顧問先紐付け（必須）
  clientId: z.string(),
  clientCode: z.string(),

  // AI情報（必須）
  aiSourceType: AISourceTypeEnum,
  aiConfidence: z.number().min(0).max(1),

  // 証憑ファイル情報（optional）
  sourceFiles: z.array(z.object({
    driveFileId: z.string(),
    fileName: z.string(),
    fileType: FileTypeEnum,
    firestoreDocId: z.string(),
    copiedAt: z.string()
  })).optional(),

  // 監査証跡
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),

  // 確認状態
  isConfirmed: z.boolean().default(false),

  // インボイス
  hasQualifiedInvoice: z.boolean().optional(),

  // 重複検知（optional）
  duplicateCheckHash: z.string().optional(),
  isDuplicateSuspected: z.boolean().optional(),
  similarEntries: z.array(z.string()).optional(),

  // Phase 2
  aiConfidenceBreakdown: z.object({
    dateConfidence: z.number().optional(),
    amountConfidence: z.number().optional(),
    accountConfidence: z.number().optional()
  }).optional(),
  exportHistory: z.array(z.object({
    exportedAt: z.string(),
    exportedTo: z.string(),
    format: z.enum(['CSV', 'API', 'JSON']),
    status: z.enum(['SUCCESS', 'FAILED']),
    errorMessage: z.string().optional()
  })).optional(),
  approvalWorkflow: z.object({
    requiredApprovers: z.array(z.string()),
    approvals: z.array(z.object({
      approvedBy: z.string(),
      approverName: z.string(),
      approvedAt: z.string(),
      comment: z.string().optional()
    })),
    currentApprovalIndex: z.number()
  }).optional(),
}).strict();

// 確定段階（ユーザー確認後）- optional禁止
export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'Submitted',
    'Approved',
    'READY_FOR_WORK',  // Layer 2 C型修正: useJournalEditor.ts用
    'REMANDED'         // Layer 2 C型修正: useJournalEditor.ts & ScreenE_Workbench.vue用
  ]),  // L1-3準拠

  // 基本情報（必須）
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  totalAmount: z.number().min(0),

  // 明細行（最小2行、確定時）
  lines: z.array(JournalLineSchema).min(2),

  // 顧問先紐付け（必須）
  clientId: z.string(),
  clientCode: z.string().regex(/^[A-Z]{3}$/),

  // AI情報（必須）
  aiSourceType: AISourceTypeEnum,
  aiConfidence: z.number().min(0).max(1),

  // 証憑ファイル情報（必須）
  sourceFiles: z.array(z.object({
    driveFileId: z.string(),
    fileName: z.string(),
    fileType: FileTypeEnum,
    firestoreDocId: z.string(),
    copiedAt: z.string()
  })),

  // 監査証跡
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),

  // 確認状態
  isConfirmed: z.boolean().default(false),

  // インボイス
  hasQualifiedInvoice: z.boolean().optional(),

  // 重複検知（必須）
  duplicateCheckHash: z.string(),
  isDuplicateSuspected: z.boolean().optional(),
  similarEntries: z.array(z.string()).optional(),

  // Phase 2
  aiConfidenceBreakdown: z.object({
    dateConfidence: z.number().optional(),
    amountConfidence: z.number().optional(),
    accountConfidence: z.number().optional()
  }).optional(),
  exportHistory: z.array(z.object({
    exportedAt: z.string(),
    exportedTo: z.string(),
    format: z.enum(['CSV', 'API', 'JSON']),
    status: z.enum(['SUCCESS', 'FAILED']),
    errorMessage: z.string().optional()
  })).optional(),
  approvalWorkflow: z.object({
    requiredApprovers: z.array(z.string()),
    approvals: z.array(z.object({
      approvedBy: z.string(),
      approverName: z.string(),
      approvedAt: z.string(),
      comment: z.string().optional()
    })),
    currentApprovalIndex: z.number()
  }).optional(),
}).strict();

// ============================================================
// Keys定義（ADR-001: 型安全マッピング戦略に準拠）
// ============================================================

export const JournalEntryKeys = JournalEntrySchema.keyof().enum;
export type JournalEntryKey = keyof typeof JournalEntryKeys;

export const JournalEntryDraftKeys = JournalEntryDraftSchema.keyof().enum;
export type JournalEntryDraftKey = keyof typeof JournalEntryDraftKeys;

export const JournalLineKeys = JournalLineSchema.keyof().enum;
export type JournalLineKey = keyof typeof JournalLineKeys;

export const JournalLineDraftKeys = JournalLineDraftSchema.keyof().enum;
export type JournalLineDraftKey = keyof typeof JournalLineDraftKeys;

// ============================================================
// 型エクスポート
// ============================================================

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalEntryDraft = z.infer<typeof JournalEntryDraftSchema>;
export type JournalLine = z.infer<typeof JournalLineSchema>;
export type JournalLineDraft = z.infer<typeof JournalLineDraftSchema>;
export type AISourceType = z.infer<typeof AISourceTypeEnum>;
export type TaxType = z.infer<typeof TaxTypeEnum>;
export type TaxCode = z.infer<typeof TaxCodeEnum>;
export type InvoiceDeduction = z.infer<typeof InvoiceDeductionEnum>;
export type TaxAmountSource = z.infer<typeof TaxAmountSourceEnum>;
export type TaxDiscrepancySeverity = z.infer<typeof TaxDiscrepancySeverityEnum>;
export type FileType = z.infer<typeof FileTypeEnum>;
