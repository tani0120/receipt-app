/**
 * journalWarningSync.ts — 後方互換re-export
 *
 * 実装本体は shared/validation/journalValidationCore.ts（SSOT）に集約。
 * 既存のimport元（MockExportPage.vue、JournalListLevel3Mock.vue）を
 * 変更せずに済むよう、このファイルでre-exportする。
 */
export {
  syncWarningLabelsCore,
  getMegaGroup,
  validateDebitCreditCombination,
  validateByVoucherType,
  getVoucherTypeConflictAccounts,
  isTaxCategoryInvalidForMode,
  resolveValidTaxCategoryForMode,
  getExemptDefaultTaxCategoryId,
} from '@/shared/validation/journalValidationCore'

export type {
  AccountForValidation,
  TaxCategoryForValidation,
  MegaGroupType,
  SyncWarningResult,
  JournalForValidation,
  JournalEntryForValidation,
} from '@/shared/validation/journalValidationCore'
