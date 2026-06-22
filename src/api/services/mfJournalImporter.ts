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
import { importJournals } from './confirmedJournalsApi'
import { normalizeVendorName } from '../../utils/pipeline/vendorIdentification'
import { fromMfInvoiceKind, MF_JOURNAL_TYPE_ADJUSTING, DEFAULT_EFFECTIVE_FROM } from '../../constants/mfApiConstants'
import { generateMasterId } from './generateMasterId'
import { generateTaxMasterId, ensureUniqueTaxId } from './taxIdGenerator'
import { getClientAccounts, saveMfAccounts, getAllAccounts, getAllTaxCategories } from './accountMasterApi'
import { getById as getClientById } from './clientsApi'
import { isIndividualType } from '../../constants/clientOptions'
import type { Account } from '../../types/shared-account'

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

/**
 * MfMcpJournalSide → ConfirmedJournalEntry変換
 *
 * A-3: async化（generateMasterIdがGemini API呼び出しのため）
 * A-4: MISS時自動発番（科目: generateMasterId, 税区分: generateTaxMasterId）
 */
async function convertSide(
  side: MfMcpJournalSide,
  maps: MfMappingTables,
  unmatchedAccounts: Set<string>,
  unmatchedTaxes: Set<string>,
  isTaxExclusive: boolean,
  suffix: string,
  existingAccountIds: Set<string>,
  existingTaxIds: Set<string>,
  newAccounts: Account[],
  /** 免税事業者フラグ。trueの場合、MFのtax_name空を「対象外」（exemptDefault）として正規化 */
  isExempt: boolean = false,
  /** 免税デフォルト税区分ID（マスタからisExemptDefault=trueで取得済み） */
  exemptDefaultTaxId: string | null = null,
): Promise<ConfirmedJournalEntry> {
  // 科目: MF名前 → Sugusru概念ID（逆マッピング）
  let account = side.account_name
  const conceptId = maps.reverseAccountMap.get(side.account_name)
  if (conceptId) {
    account = conceptId
  } else {
    // ケース2: MCPが返さない過去科目 → generateMasterId()で自動発番
    const newId = await generateMasterId(side.account_name, suffix, existingAccountIds)
    account = newId
    existingAccountIds.add(newId)
    maps.reverseAccountMap.set(side.account_name, newId) // 同バッチ内の2件目以降用
    unmatchedAccounts.add(side.account_name)
    // client_mf_accountsへの追加保存用に蓄積（A-6）
    newAccounts.push({
      accountId: newId,
      name: side.account_name,
      target: suffix === 'IND' ? 'individual' : 'corp',
      accountGroup: 'PL_EXPENSE', // MCP外科目は分類不明。経費をデフォルト
      category: '',
      defaultTaxCategoryId: undefined,
      hidden: false,
      effectiveFrom: DEFAULT_EFFECTIVE_FROM,
      effectiveTo: null,
      sortOrder: 9999,
    })
  }

  // 税区分: MF名前 → Sugusru概念ID（逆マッピング）
  let taxCategoryId: string | null = null
  if (side.tax_name) {
    const taxConceptId = maps.reverseTaxMap.get(side.tax_name)
    if (taxConceptId) {
      taxCategoryId = taxConceptId
    } else {
      // F-1: generateTaxMasterId()でルールベース発番（同期）
      const baseId = generateTaxMasterId(side.tax_name)
      if (baseId) {
        taxCategoryId = ensureUniqueTaxId(baseId, existingTaxIds)
        existingTaxIds.add(taxCategoryId)
      } else {
        // ルール不一致: MF名のまま保存（従来動作）
        taxCategoryId = side.tax_name
      }
      maps.reverseTaxMap.set(side.tax_name, taxCategoryId) // 同バッチ内の2件目以降用
      unmatchedTaxes.add(side.tax_name)
    }
  } else if (isExempt && exemptDefaultTaxId) {
    // 免税事業者: MFはtax_nameを空文字で返す → 「対象外」として正規化
    // MF実機テスト確認済み: 免税ではtax_id省略でMFが自動的にNOT_TARGETを設定する
    taxCategoryId = exemptDefaultTaxId
  }

  // MF GET: value=税抜額。経理方式で分岐:
  //   税込経理（99%）: amount = value + tax_value（税込復元）
  //   税抜経理（大手）: amount = value（税抜のまま）
  const amount = isTaxExclusive
    ? side.value
    : side.value + (side.tax_value ?? 0)

  return {
    entryId: crypto.randomUUID(),
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
  const firstDebitAccount = mfJournal.branches[0]?.debitor?.account_name ?? ''
  if (/売上|収入|受取/.test(firstDebitAccount)) return 'income'
  const firstCreditAccount = mfJournal.branches[0]?.creditor?.account_name ?? ''
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
  // MF複合仕訳(N:M): N≠Mの場合、短い側のbranch.debitor/creditorがnull（パディング）
  // 片方nullは正常。両方nullはエラー。
  for (const branch of mfJournal.branches) {
    if (!branch.debitor && !branch.creditor) {
      return {
        severity: 'error', type: 'IMPORT_AMOUNT_INVALID', mfNumber: mfJournal.number,
        message: `MF#${mfJournal.number}: 仕訳行の借方・貸方が両方null`,
      }
    }
    // 非null側のみ金額・科目名チェック
    for (const side of [branch.debitor, branch.creditor]) {
      if (!side) continue // N:M複合仕訳のパディング（正常）
      if (side.value === 0 || side.value < 0 || !Number.isFinite(side.value)) {
        return {
          severity: 'error', type: 'IMPORT_AMOUNT_INVALID', mfNumber: mfJournal.number,
          message: `MF#${mfJournal.number}: 金額不正（${side.value}）科目: ${side.account_name}`,
        }
      }
      if (!side.account_name) {
        return {
          severity: 'error', type: 'IMPORT_ACCOUNT_MISSING', mfNumber: mfJournal.number,
          message: `MF#${mfJournal.number}: 科目名が空`,
        }
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
  /** 事前構築済みマッピング。渡された場合はbuildAllMaps()をスキップ（MCP二重呼び出し回避） */
  prebuiltMaps?: MfMappingTables,
): Promise<PrepareResult> {
  cleanupPending()

  const maps = prebuiltMaps ?? await buildAllMaps(clientId)
  const batchId = `mf-api-${Date.now()}`
  const unmatchedAccounts = new Set<string>()
  const unmatchedTaxes = new Set<string>()
  // 税抜経理: taxMethodが'tax_excluded_*'で始まる場合
  const isTaxExclusive = taxMethod.startsWith('tax_excluded')

  // A-5: clientType判定（SUFFIX決定）
  const client = getClientById(clientId)
  const suffix = (client && isIndividualType(client.type)) ? 'IND' : 'CORP'

  // 免税事業者判定: マスタからisExemptDefault=trueの税区分IDを取得（データ駆動）
  const isExempt = client?.consumptionTaxMode === 'exempt'
  const exemptDefaultTaxId = isExempt
    ? (getAllTaxCategories().find(t => t.isExemptDefault)?.taxCategoryId ?? null)
    : null

  // A-4: 既存IDセット（重複チェック用）
  const existingAccountIds = new Set<string>()
  const allAccounts = getAllAccounts()
  for (const a of allAccounts) existingAccountIds.add(a.accountId)
  try {
    const clientAcctData = getClientAccounts(clientId)
    for (const a of clientAcctData.accounts) existingAccountIds.add(a.accountId)
  } catch { /* 未保存の場合はスキップ */ }

  const existingTaxIds = new Set<string>()
  const allTaxes = getAllTaxCategories()
  for (const t of allTaxes) existingTaxIds.add(t.taxCategoryId)

  // A-6: 自動発番した科目を蓄積（バッチ完了後に一括保存）
  const newAccounts: Account[] = []

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
    // MF複合仕訳(N:M): debitor/creditorの一方がnullのbranchはパディング。非null側のみ取り込む。
    const debitEntries: ConfirmedJournalEntry[] = []
    const creditEntries: ConfirmedJournalEntry[] = []
    for (const branch of mfJournal.branches) {
      if (branch.debitor) {
        debitEntries.push(await convertSide(branch.debitor, maps, unmatchedAccounts, unmatchedTaxes, isTaxExclusive, suffix, existingAccountIds, existingTaxIds, newAccounts, isExempt, exemptDefaultTaxId))
      }
      if (branch.creditor) {
        creditEntries.push(await convertSide(branch.creditor, maps, unmatchedAccounts, unmatchedTaxes, isTaxExclusive, suffix, existingAccountIds, existingTaxIds, newAccounts, isExempt, exemptDefaultTaxId))
      }
    }

    const description = mfJournal.branches[0]?.remark || mfJournal.memo || ''
    // 取引先名: directionに応じて借方/貸方から取得
    // expense→貸方取引先（支払先）、income→借方取引先（入金元）、それ以外→最初に見つかった方
    const direction = inferDirection(mfJournal)
    const firstBranch = mfJournal.branches[0]
    let vendorName: string | null = null
    if (direction === 'income') {
      vendorName = firstBranch?.creditor?.trade_partner_name ?? firstBranch?.debitor?.trade_partner_name ?? null
    } else {
      vendorName = firstBranch?.debitor?.trade_partner_name ?? firstBranch?.creditor?.trade_partner_name ?? null
    }
    const matchKey = normalizeVendorName(description) ?? ''

    converted.push({
      journalId: crypto.randomUUID(),
      client_id: clientId,
      voucher_date: mfJournal.transaction_date,
      description,
      match_key: matchKey,
      vendor_id: null,
      vendor_name: vendorName,
      direction,
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

  // A-6: 自動発番した科目をclient_mf_accountsに差分追加保存
  if (newAccounts.length > 0) {
    try {
      const clientAcctData = getClientAccounts(clientId)
      const existingList = [...clientAcctData.accounts]
      const existingNameSet = new Set(existingList.map(a => a.name))
      const toAdd = newAccounts.filter(a => !existingNameSet.has(a.name))
      if (toAdd.length > 0) {
        saveMfAccounts(clientId, [...existingList, ...toAdd])
        console.log(`[mfJournalImporter] 自動発番科目${toAdd.length}件をclient_mf_accountsに追加保存: ${toAdd.map(a => `${a.name}→${a.accountId}`).join(', ')}`)
      }
    } catch {
      // 未保存の場合は新規保存
      saveMfAccounts(clientId, newAccounts)
      console.log(`[mfJournalImporter] 自動発番科目${newAccounts.length}件をclient_mf_accountsに新規保存`)
    }
  }

  // 未マッチ科目の通知（自動発番済み → info扱い。warningにすると承認待ちになり定期実行で仕訳消失）
  for (const name of unmatchedAccounts) {
    const autoId = maps.reverseAccountMap.get(name)
    infos.push({
      severity: 'info', type: 'IMPORT_ACCOUNT_UNMATCHED', mfNumber: 0,
      message: `科目「${name}」がMCPに未マッチ → 自動発番: ${autoId ?? 'unknown'}`,
    })
  }
  for (const name of unmatchedTaxes) {
    const autoId = maps.reverseTaxMap.get(name)
    infos.push({
      severity: 'info', type: 'IMPORT_TAX_UNMATCHED', mfNumber: 0,
      message: `税区分「${name}」がMCPに未マッチ → 自動発番: ${autoId ?? name}`,
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
  /** 事前構築済みマッピング。渡された場合はbuildAllMaps()をスキップ（MCP二重呼び出し回避） */
  prebuiltMaps?: MfMappingTables,
): Promise<PrepareResult & { committed: boolean; added?: number; skipped?: number }> {
  const result = await prepareMfImport(journals, clientId, taxMethod, prebuiltMaps)

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
