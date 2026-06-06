/**
 * journalValidation.ts — 仕訳バリデーションサービス（API側ラッパー）
 *
 * ロジック本体は shared/validation/journalValidationCore.ts（SSOT）。
 * このファイルはAPI固有の薄いラッパー + 型のre-exportのみ。
 *
 * 設計:
 *   - sharedのsyncWarningLabelsCoreは破壊的（labels直接mutate）
 *   - API側では非破壊にしたいため、labelsをコピーしてから呼び出す
 *   - ValidationResult はJSON化可能な形式（Set→配列変換済み）
 */

import {
  syncWarningLabelsCore,
  type SyncWarningResult,
} from '../../shared/validation/journalValidationCore'
import { VOUCHER_TYPE_RULES } from '../../data/master/voucherTypeRules'

// 型のre-export（journalRoutes.ts / journalHintService.ts が使用）
export type {
  AccountForValidation,
  TaxCategoryForValidation,
  MegaGroupType,
  JournalForValidation,
  JournalEntryForValidation,
} from '../../shared/validation/journalValidationCore'

// 関数のre-export（journalHintService.ts が使用）
export {
  getMegaGroup,
  validateDebitCreditCombination,
  validateByVoucherType,
  getVoucherTypeConflictAccounts,
} from '../../shared/validation/journalValidationCore'

// ────────────────────────────────────────────
// API固有の型定義
// ────────────────────────────────────────────

import type { AccountForValidation, TaxCategoryForValidation, JournalForValidation } from '../../shared/validation/journalValidationCore'

/** バリデーション結果（APIレスポンス用） */
export interface ValidationResult {
  journalId: string
  labels: string[]
  warning_details: Record<string, string>
  addedLabels: string[]
  removedLabels: string[]
  /** 証票意味ルール矛盾の科目一覧（UIセルハイライト用。Set→配列変換済み） */
  conflictAccounts: { debit: string[]; credit: string[] }
}

// ────────────────────────────────────────────
// API固有のバリデーション関数
// ────────────────────────────────────────────

/**
 * 仕訳バリデーション（API側: 非破壊ラッパー）
 *
 * sharedのsyncWarningLabelsCoreは破壊的（labels直接mutate）のため、
 * コピーを作ってから呼び出し、元のjournalを変更しない。
 */
export function validateJournal(
  journal: JournalForValidation,
  accounts: AccountForValidation[],
  taxCategories: TaxCategoryForValidation[]
): ValidationResult {
  // 非破壊: labelsとwarning_detailsのコピーを作成
  const journalCopy = {
    ...journal,
    labels: [...journal.labels],
    warning_details: { ...(journal.warning_details ?? {}) },
  }

  const result: SyncWarningResult = syncWarningLabelsCore(journalCopy, accounts, taxCategories, VOUCHER_TYPE_RULES)

  return {
    journalId: journal.journalId,
    labels: journalCopy.labels,
    warning_details: journalCopy.warning_details ?? {},
    addedLabels: result.addedLabels,
    removedLabels: result.removedLabels,
    // Set→配列変換（JSON.stringifyで{}に化けるのを防止）
    conflictAccounts: {
      debit: Array.from(result.voucherTypeConflicts.debit),
      credit: Array.from(result.voucherTypeConflicts.credit),
    },
  }
}
