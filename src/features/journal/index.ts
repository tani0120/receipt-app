/**
 * Journal（仕訳）機能のエントリーポイント
 *
 * 【エクスポート内容】
 * - スキーマ（JournalEntrySchema, JournalEntryDraftSchema, JournalLineSchema, JournalLineDraftSchema）
 * - 列挙型（AISourceTypeEnum, TaxTypeEnum, TaxCodeEnum, InvoiceDeductionEnum等）
 * - 型（JournalEntry, JournalEntryDraft, JournalLine, JournalLineDraft）
 * - ビジネスルール（JournalSemanticGuard）
 * - サービス（TaxResolutionService, NormalizationService, TaxCodeMapper, CsvValidator, CsvExportService）
 */

// ============================================================
// スキーマと列挙型
// ============================================================

export {
  // Draft/確定スキーマ（L1-3準拠）
  JournalEntryDraftSchema,
  JournalEntrySchema,
  JournalLineDraftSchema,
  JournalLineSchema,

  // 列挙型
  AISourceTypeEnum,
  TaxTypeEnum,
  TaxCodeEnum,              // Phase 1追加
  InvoiceDeductionEnum,     // Phase 1追加
  TaxAmountSourceEnum,
  TaxDiscrepancySeverityEnum,
  FileTypeEnum,

  // Keys定義
  JournalEntryKeys,
  JournalEntryDraftKeys,
  JournalLineKeys,
  JournalLineDraftKeys,
} from './JournalEntrySchema';

// ============================================================
// 型
// ============================================================

export type {
  JournalEntry,
  JournalEntryDraft,        // Phase 1追加
  JournalLine,
  JournalLineDraft,         // Phase 1追加
  AISourceType,
  TaxType,
  TaxCode,                  // Phase 1追加
  InvoiceDeduction,         // Phase 1追加
  TaxAmountSource,
  TaxDiscrepancySeverity,
  FileType,

  // Keys型
  JournalEntryKey,
  JournalEntryDraftKey,
  JournalLineKey,
  JournalLineDraftKey,
} from './JournalEntrySchema';

// ============================================================
// ビジネスルール
// ============================================================

export { JournalSemanticGuard } from './JournalSemanticGuard';

// ============================================================
// サービス
// ============================================================

export { TaxResolutionService } from './services/TaxResolutionService';
export { NormalizationService } from './services/NormalizationService';  // Phase 1追加
export { TaxCodeMapper } from './services/TaxCodeMapper';                // Phase 1追加
export { CsvValidator } from './services/CsvValidator';                  // Phase 1追加
export { CsvExportService } from './services/CsvExportService';          // Phase 1追加
