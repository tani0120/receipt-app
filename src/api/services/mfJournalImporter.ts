/**
 * mfJournalImporter.ts — MF API仕訳 → ConfirmedJournal変換 + 承認付き取込
 *
 * 2段階フロー:
 *   1. prepareMfImport(): 変換 + バリデーション（保存しない）
 *      → バリデーション結果を人間に表示
 *   2. commitMfImport(): 人間承認後に実際に保存
 *
 * バリデーション:
 *   - エラー（取込不可）: branches空、日付null、金額不正、科目名空
 *   - 警告（承認待ち）: 科目未マッチ、税区分未マッチ、決算整理仕訳
 *   - 情報（自動処理）: 重複スキップ
 *
 * 準拠: plan_validation_approval_flow.md, 39_mf_field_mapping.md（改訂16）
 */

import crypto from 'crypto'
import type { ConfirmedJournal, ConfirmedJournalEntry } from '../../types/confirmed_journal.type'
import type { MfMcpJournal, MfMcpJournalSide } from './mfMcpClient'
import type { MfMappingTables } from './mfMappingService'
import { buildAllMaps } from './mfMappingService'
import { importJournals } from './confirmedJournalStore'
import { normalizeVendorName } from '../../utils/pipeline/vendorIdentification'
import { fromMfInvoiceKind, MF_JOURNAL_TYPE_ADJUSTING } from '../../constants/mfApiConstants'

// ────────────────────────────────────────────
// バリデーション結果型
// ────────────────────────────────────────────

/** バリデーション問題の重大度 */
export type ImportSeverity = 'error' | 'warning' | 'info'

/** バリデーション問題1件 */
export interface ImportIssue {
  /** 重大度 */
  severity: ImportSeverity
  /** 問題種別 */
  type:
    | 'IMPORT_BRANCHES_EMPTY'
    | 'IMPORT_DATE_NULL'
    | 'IMPORT_AMOUNT_INVALID'
    | 'IMPORT_ACCOUNT_MISSING'
    | 'IMPORT_ACCOUNT_UNMATCHED'
    | 'IMPORT_TAX_UNMATCHED'
    | 'IMPORT_CLOSING_ENTRY'
    | 'IMPORT_DUPLICATE'
  /** 対象MF仕訳番号 */
  mfNumber: number
  /** 詳細メッセージ */
  message: string
}

/** 準備結果（保存前） */
export interface PrepareResult {
  /** 変換成功した仕訳 */
  converted: ConfirmedJournal[]
  /** エラーでスキップされた仕訳 */
  skippedErrors: ImportIssue[]
  /** 警告（人間承認が必要） */
  warnings: ImportIssue[]
  /** 情報 */
  infos: ImportIssue[]
  /** バッチID（commitで使用） */
  batchId: string
  /** 未マッチ科目一覧 */
  unmatchedAccounts: string[]
  /** 未マッチ税区分一覧 */
  unmatchedTaxes: string[]
}

// ────────────────────────────────────────────
// 一時キャッシュ（人間承認待ち）
// ────────────────────────────────────────────

const pendingImports = new Map<string, PrepareResult>()
const PENDING_TTL_MS = 10 * 60 * 1000 // 10分

/** 古い保留データをクリーンアップ */
function cleanupPending(): void {
  const now = Date.now()
  for (const [key, _] of pendingImports) {
    const ts = parseInt(key.split('-').pop() ?? '0', 10)
    if (now - ts > PENDING_TTL_MS) {
      pendingImports.delete(key)
    }
  }
}

// ────────────────────────────────────────────
// invoice_kind逆変換
// ────────────────────────────────────────────

function reverseInvoiceKind(mfKind: string | null | undefined): string | null {
  // 共通定数・ロジックは mfApiConstants.ts に集約
  return fromMfInvoiceKind(mfKind)
}

// ────────────────────────────────────────────
// MfMcpJournalSide → ConfirmedJournalEntry
// ────────────────────────────────────────────

function convertSide(
  side: MfMcpJournalSide,
  maps: MfMappingTables,
  unmatchedAccounts: Set<string>,
  unmatchedTaxes: Set<string>,
  isTaxExclusive: boolean,
): ConfirmedJournalEntry {
  // 科目: MF名前 → Sugusru概念ID（逆マッピング）
  let account = side.account_name
  const conceptId = maps.reverseAccountMap.get(side.account_name)
  if (conceptId) {
    account = conceptId
  } else {
    unmatchedAccounts.add(side.account_name)
  }

  // 税区分: MF名前 → Sugusru概念ID（逆マッピング）
  let taxCategoryId: string | null = null
  if (side.tax_name) {
    const taxConceptId = maps.reverseTaxMap.get(side.tax_name)
    if (taxConceptId) {
      taxCategoryId = taxConceptId
    } else {
      taxCategoryId = side.tax_name
      unmatchedTaxes.add(side.tax_name)
    }
  }

  // MF GET: value=税抜額。経理方式で分岐:
  //   税込経理（99%）: amount = value + tax_value（税込復元）
  //   税抜経理（大手）: amount = value（税抜のまま）
  const amount = isTaxExclusive
    ? side.value
    : side.value + (side.tax_value ?? 0)

  return {
    id: crypto.randomUUID(),
    account,
    sub_account: side.sub_account_name ?? null,
    department: side.department_name ?? null,
    vendor_name: side.trade_partner_name ?? null,
    tax_category_id: taxCategoryId,
    invoice: reverseInvoiceKind(side.invoice_kind),
    amount,
    tax_amount: side.tax_value ?? null,
  }
}

// ────────────────────────────────────────────
// 仕訳方向推定
// ────────────────────────────────────────────

function inferDirection(mfJournal: MfMcpJournal): 'expense' | 'income' | 'transfer' {
  if (mfJournal.branches.length === 0) return 'expense'
  const firstDebitAccount = mfJournal.branches[0]?.debitor.account_name ?? ''
  if (/売上|収入|受取/.test(firstDebitAccount)) return 'income'
  const firstCreditAccount = mfJournal.branches[0]?.creditor.account_name ?? ''
  const bsKeywords = /現金|預金|銀行|当座|普通|定期|貯金|売掛|買掛|未払|未収|前受|前払|借入|貸付/
  if (bsKeywords.test(firstDebitAccount) && bsKeywords.test(firstCreditAccount)) return 'transfer'
  return 'expense'
}

// ────────────────────────────────────────────
// 1件バリデーション
// ────────────────────────────────────────────

function validateMfJournal(mfJournal: MfMcpJournal): ImportIssue | null {
  // branches空
  if (!mfJournal.branches || mfJournal.branches.length === 0) {
    return {
      severity: 'error', type: 'IMPORT_BRANCHES_EMPTY', mfNumber: mfJournal.number,
      message: `MF#${mfJournal.number}: 仕訳行が空`,
    }
  }
  // 日付null
  if (!mfJournal.transaction_date) {
    return {
      severity: 'error', type: 'IMPORT_DATE_NULL', mfNumber: mfJournal.number,
      message: `MF#${mfJournal.number}: 取引日がnull`,
    }
  }
  // 金額チェック
  for (const branch of mfJournal.branches) {
    for (const side of [branch.debitor, branch.creditor]) {
      if (side.value === 0 || side.value < 0 || !Number.isFinite(side.value)) {
        return {
          severity: 'error', type: 'IMPORT_AMOUNT_INVALID', mfNumber: mfJournal.number,
          message: `MF#${mfJournal.number}: 金額不正（${side.value}）科目: ${side.account_name}`,
        }
      }
    }
    // 科目名空
    if (!branch.debitor.account_name) {
      return {
        severity: 'error', type: 'IMPORT_ACCOUNT_MISSING', mfNumber: mfJournal.number,
        message: `MF#${mfJournal.number}: 借方科目名が空`,
      }
    }
    if (!branch.creditor.account_name) {
      return {
        severity: 'error', type: 'IMPORT_ACCOUNT_MISSING', mfNumber: mfJournal.number,
        message: `MF#${mfJournal.number}: 貸方科目名が空`,
      }
    }
  }
  return null
}

// ────────────────────────────────────────────
// Step 1: 準備（変換 + バリデーション。保存しない）
// ────────────────────────────────────────────

/**
 * MF仕訳を変換 + バリデーション（保存はしない）
 *
 * 結果をpendingImportsに一時保持。
 * 人間が承認したらcommitMfImport()で保存する。
 */
export async function prepareMfImport(
  journals: MfMcpJournal[],
  clientId: string,
  /** 事業者の経理方式。税抜なら'tax_excluded_included'|'tax_excluded_separate' */
  taxMethod: string = 'tax_included',
): Promise<PrepareResult> {
  cleanupPending()

  const maps = await buildAllMaps(clientId)
  const batchId = `mf-api-${Date.now()}`
  const unmatchedAccounts = new Set<string>()
  const unmatchedTaxes = new Set<string>()
  // 税抜経理: taxMethodが'tax_excluded_*'で始まる場合
  const isTaxExclusive = taxMethod.startsWith('tax_excluded')

  const converted: ConfirmedJournal[] = []
  const skippedErrors: ImportIssue[] = []
  const warnings: ImportIssue[] = []
  const infos: ImportIssue[] = []

  for (const mfJournal of journals) {
    // エラーバリデーション
    const error = validateMfJournal(mfJournal)
    if (error) {
      skippedErrors.push(error)
      continue
    }

    // 変換
    const debitEntries: ConfirmedJournalEntry[] = []
    const creditEntries: ConfirmedJournalEntry[] = []
    for (const branch of mfJournal.branches) {
      debitEntries.push(convertSide(branch.debitor, maps, unmatchedAccounts, unmatchedTaxes, isTaxExclusive))
      creditEntries.push(convertSide(branch.creditor, maps, unmatchedAccounts, unmatchedTaxes, isTaxExclusive))
    }

    const description = mfJournal.branches[0]?.remark || mfJournal.memo || ''
    const vendorName = mfJournal.branches[0]?.debitor.trade_partner_name ?? null
    const matchKey = normalizeVendorName(description) ?? ''

    converted.push({
      id: crypto.randomUUID(),
      client_id: clientId,
      voucher_date: mfJournal.transaction_date,
      description,
      match_key: matchKey,
      vendor_id: null,
      vendor_name: vendorName,
      direction: inferDirection(mfJournal),
      debit_entries: debitEntries,
      credit_entries: creditEntries,
      source: 'mf_import',
      mf_journal_type: mfJournal.journal_type ?? null,
      is_closing_entry: mfJournal.journal_type === MF_JOURNAL_TYPE_ADJUSTING,
      memo: mfJournal.memo || null,
      tags: mfJournal.tags?.join(',') || null,
      import_batch_id: batchId,
      imported_at: new Date().toISOString(),
      mf_transaction_no: mfJournal.number ?? null,
      mf_raw: mfJournal as unknown as Record<string, unknown>,
    })

    // 決算整理仕訳の警告
    if (mfJournal.journal_type === MF_JOURNAL_TYPE_ADJUSTING) {
      warnings.push({
        severity: 'warning', type: 'IMPORT_CLOSING_ENTRY', mfNumber: mfJournal.number,
        message: `MF#${mfJournal.number}: 決算整理仕訳`,
      })
    }
  }

  // 未マッチ科目の警告
  for (const name of unmatchedAccounts) {
    warnings.push({
      severity: 'warning', type: 'IMPORT_ACCOUNT_UNMATCHED', mfNumber: 0,
      message: `科目「${name}」がSugusruマスタに未マッチ（MF名前でフォールバック）`,
    })
  }
  for (const name of unmatchedTaxes) {
    warnings.push({
      severity: 'warning', type: 'IMPORT_TAX_UNMATCHED', mfNumber: 0,
      message: `税区分「${name}」がSugusruマスタに未マッチ（MF名前でフォールバック）`,
    })
  }

  const result: PrepareResult = {
    converted,
    skippedErrors,
    warnings,
    infos,
    batchId,
    unmatchedAccounts: [...unmatchedAccounts],
    unmatchedTaxes: [...unmatchedTaxes],
  }

  // 一時キャッシュに保持（人間承認待ち）
  pendingImports.set(batchId, result)

  console.log(
    `[mfJournalImporter] 準備完了 batchId=${batchId}: ` +
    `変換${converted.length}件, エラー${skippedErrors.length}件, 警告${warnings.length}件`
  )

  return result
}

// ────────────────────────────────────────────
// Step 2: 承認後に保存
// ────────────────────────────────────────────

/**
 * 人間承認後にconfirmedJournalStoreに保存する
 *
 * @param batchId prepareMfImportで返されたbatchId
 * @returns 追加件数とスキップ件数。batchIdが見つからない場合はnull
 */
export function commitMfImport(batchId: string): { added: number; skipped: number } | null {
  const pending = pendingImports.get(batchId)
  if (!pending) {
    console.error(`[mfJournalImporter] batchId=${batchId} が見つかりません（期限切れ or 未準備）`)
    return null
  }

  // confirmedJournalStoreに保存（重複排除付き）
  const result = importJournals(pending.converted)

  // キャッシュから削除
  pendingImports.delete(batchId)

  console.log(
    `[mfJournalImporter] 承認→保存完了 batchId=${batchId}: ` +
    `${result.added}件追加, ${result.skipped}件スキップ（重複）`
  )

  return result
}

/**
 * 保留中のインポートを破棄する
 */
export function discardMfImport(batchId: string): boolean {
  const deleted = pendingImports.delete(batchId)
  if (deleted) {
    console.log(`[mfJournalImporter] 破棄 batchId=${batchId}`)
  }
  return deleted
}

// ────────────────────────────────────────────
// 互換用: 即時取込（警告なしの場合の高速パス）
// ────────────────────────────────────────────

/**
 * 警告がなければ即座に保存する高速パス
 * 警告があればPrepareResultを返す（人間承認待ち）
 */
export async function importMfJournals(
  journals: MfMcpJournal[],
  clientId: string,
  taxMethod: string = 'tax_included',
): Promise<PrepareResult & { committed: boolean; added?: number; skipped?: number }> {
  const result = await prepareMfImport(journals, clientId, taxMethod)

  // 警告もエラーもなければ即保存
  if (result.warnings.length === 0 && result.skippedErrors.length === 0) {
    const commitResult = commitMfImport(result.batchId)
    return {
      ...result,
      committed: true,
      added: commitResult?.added ?? 0,
      skipped: commitResult?.skipped ?? 0,
    }
  }

  // 警告ありの場合は保存しない（人間承認待ち）
  return { ...result, committed: false }
}
