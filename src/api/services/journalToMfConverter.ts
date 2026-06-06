/**
 * journalToMfConverter.ts - Sugusru仕訳 -> MF postJournals形式 変換
 *
 * JournalPhase5Mock（debit_entries[] + credit_entries[]）を
 * MF APIのpostJournals形式（branches[{debitor, creditor, remark}]）に変換する。
 *
 * N:N仕訳のbranches変換ルール（検証済み 2026-05-23）:
 *   - 各branchで debitor.value === creditor.value
 *   - 長い側の金額が基準、短い側は同一科目を複製して対向金額に合わせる
 *   - invoice_kindはQUALIFIED/UNQUALIFIED_80をそのままMFに送信する（実機テスト確認済み 2026-05-23）
 *
 * 準拠: mf_sugusru_field_mapping.md
 */
import type { MfMappingTables } from './mfMappingService'
import { toMfInvoiceKind, MF_JOURNAL_TYPE_ENTRY, MF_SUGUSURU_TAG } from '../../constants/mfApiConstants'

// ────────────────────────────────────────────
// 入力型（JournalPhase5Mockの必要フィールドのみ）
// ────────────────────────────────────────────

/** 変換元の仕訳行 */
interface SourceEntryLine {
  account: string | null
  sub_account: string | null
  department: string | null
  amount: number | null
  tax_category_id: string | null
  /**
   * 取引先名（Sugusru側）
   *
   * 設定されている場合、tradePartnerMapでMF取引先コードに変換して送信。
   * MF側に該当取引先がない場合は無視（エラーにしない）。
   * 実際には人間がMF取引先マスタを登録しない限り空マップのため、常に無視される。
   */
  trade_partner_name?: string | null
}

/** 変換元の仕訳 */
export interface SourceJournal {
  journalId: string
  voucher_date: string | null
  description: string
  /**
   * インボイス区分（人間が判断した適格/非適格）
   *
   * MF API送信時にinvoice_kindとしてそのまま送信される（実機テスト確認済み 2026-05-23）。
   * QUALIFIED/UNQUALIFIED_80: 受理。NOT_TARGET: 対象外税区分とセットなら受理。
   */
  invoice_status?: 'qualified' | 'not_qualified' | null
  /** 免税事業者フラグ（trueならinvoice_kindを設定しない） */
  is_tax_exempt?: boolean
  /**
   * 課税方式（顧問先の設定から取得）
   *
   * バリデーションで使用:
   *   - exempt: 免税事業者。課税税区分の使用をエラー
   *   - simplified: 簡易課税。売上系税区分はT系（事業区分付き）のみ
   *   - general: 本則課税（一括比例/個別対応未区別）
   *   - general_proportional: 本則課税（一括比例）。COMMON/NT系税区分禁止
   *   - general_individual: 本則課税（個別対応）。COMMON/NT系税区分許可
   */
  consumption_tax_mode?: 'general' | 'general_proportional' | 'general_individual' | 'simplified' | 'exempt'
  debit_entries: SourceEntryLine[]
  credit_entries: SourceEntryLine[]
}

// ────────────────────────────────────────────
// 出力型（mcpCreateJournalの引数形式と同一）
// ────────────────────────────────────────────

/** MF仕訳行の借方/貸方 */
export interface MfJournalSide {
  account_id: string
  value: number
  tax_id?: string
  sub_account_id?: string
  department_id?: string
  trade_partner_code?: string
  /**
   * インボイス区分
   *
   * MF APIにそのまま送信される（実機テスト 2026-05-23確認済み）。
   * QUALIFIED/UNQUALIFIED_80: MF受理。
   * NOT_TARGET: 対象外税区分とセットなら受理、課税税区分とセットなら拒否。
   * UNQUALIFIED_50/NOT_QUALIFIED_0: MF未対応ならenumエラーで自然停止。
   */
  invoice_kind?: string
}

/** MF仕訳 */
export interface MfJournalPayload {
  transaction_date: string
  journal_type: string
  branches: Array<{
    debitor: MfJournalSide
    creditor: MfJournalSide
    remark?: string
  }>
  memo?: string
  tags?: string[]
}

// ────────────────────────────────────────────
// バリデーション
// ────────────────────────────────────────────

export interface ConversionError {
  /** エラー種別 */
  type:
    | 'ACCOUNT_NOT_FOUND'
    | 'TAX_NOT_FOUND'
    | 'AMOUNT_NULL'
    | 'AMOUNT_ZERO'
    | 'AMOUNT_NEGATIVE'
    | 'AMOUNT_DECIMAL'
    | 'AMOUNT_INVALID'
    | 'DATE_NULL'
    | 'DATE_FORMAT'
    | 'ENTRIES_EMPTY'
    | 'DEBIT_CREDIT_MISMATCH'
    | 'TAX_DIRECTION_MISMATCH'
    | 'TAX_EXEMPT_VIOLATION'
    | 'TAX_SIMPLIFIED_VIOLATION'
    | 'TAX_PROPORTIONAL_VIOLATION'
  /** エラー詳細 */
  message: string
  /** 対象フィールド */
  field?: string
}

/**
 * 送信前バリデーション
 * 変換不可能な問題があればエラー配列を返す。空配列なら変換可能。
 */
export function validateBeforeConvert(journal: SourceJournal, maps: MfMappingTables): ConversionError[] {
  const errors: ConversionError[] = []

  // ── 日付チェック ──
  if (!journal.voucher_date) {
    errors.push({ type: 'DATE_NULL', message: '取引日（voucher_date）がnull', field: 'voucher_date' })
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(journal.voucher_date)) {
    errors.push({ type: 'DATE_FORMAT', message: `取引日のフォーマットが不正: "${journal.voucher_date}"（YYYY-MM-DD必須）`, field: 'voucher_date' })
  } else {
    const d = new Date(journal.voucher_date)
    if (isNaN(d.getTime())) {
      errors.push({ type: 'DATE_FORMAT', message: `取引日が無効な日付: "${journal.voucher_date}"`, field: 'voucher_date' })
    }
  }

  // ── entries空チェック ──
  if (journal.debit_entries.length === 0) {
    errors.push({ type: 'ENTRIES_EMPTY', message: '借方が0件（最低1行必要）', field: 'debit_entries' })
  }
  if (journal.credit_entries.length === 0) {
    errors.push({ type: 'ENTRIES_EMPTY', message: '貸方が0件（最低1行必要）', field: 'credit_entries' })
  }

  // ── 借方チェック ──
  for (let i = 0; i < journal.debit_entries.length; i++) {
    const entry = journal.debit_entries[i]!
    if (!entry.account) {
      errors.push({ type: 'ACCOUNT_NOT_FOUND', message: `借方[${i}] 科目がnull`, field: `debit_entries[${i}].account` })
    } else if (!maps.accountMap.has(entry.account)) {
      errors.push({ type: 'ACCOUNT_NOT_FOUND', message: `借方[${i}] 科目「${entry.account}」がMFにマッチしない`, field: `debit_entries[${i}].account` })
    }
    validateAmount(entry.amount, `借方[${i}]`, `debit_entries[${i}].amount`, errors)
  }

  // ── 貸方チェック ──
  for (let i = 0; i < journal.credit_entries.length; i++) {
    const entry = journal.credit_entries[i]!
    if (!entry.account) {
      errors.push({ type: 'ACCOUNT_NOT_FOUND', message: `貸方[${i}] 科目がnull`, field: `credit_entries[${i}].account` })
    } else if (!maps.accountMap.has(entry.account)) {
      errors.push({ type: 'ACCOUNT_NOT_FOUND', message: `貸方[${i}] 科目「${entry.account}」がMFにマッチしない`, field: `credit_entries[${i}].account` })
    }
    validateAmount(entry.amount, `貸方[${i}]`, `credit_entries[${i}].amount`, errors)
  }

  // ── 税区分チェック（nullは許容=対象外扱い） ──
  const allEntries = [
    ...journal.debit_entries.map((e, i) => ({ ...e, side: '借方' as const, idx: i })),
    ...journal.credit_entries.map((e, i) => ({ ...e, side: '貸方' as const, idx: i })),
  ]
  for (const entry of allEntries) {
    if (entry.tax_category_id && !maps.taxMap.has(entry.tax_category_id)) {
      errors.push({ type: 'TAX_NOT_FOUND', message: `税区分「${entry.tax_category_id}」がMFにマッチしない`, field: 'tax_category_id' })
    }
  }

  // ── 科目-税区分方向整合性チェック（実機テスト確認済み: MF APIは許容するが税務上不正） ──
  for (const entry of allEntries) {
    if (!entry.account || !entry.tax_category_id) continue
    const acctDir = maps.accountDirectionMap.get(entry.account)
    const taxDir = maps.taxDirectionMap.get(entry.tax_category_id)
    if (!acctDir || !taxDir || taxDir === 'common') continue
    // PL_REVENUE科目にpurchase系税区分、PL_EXPENSE科目にsales系税区分は不正
    if (acctDir === 'sales' && taxDir === 'purchase') {
      errors.push({
        type: 'TAX_DIRECTION_MISMATCH',
        message: `${entry.side}[${entry.idx}] 売上科目「${entry.account}」に仕入系税区分「${entry.tax_category_id}」は税務上不正`,
        field: `${entry.side === '借方' ? 'debit' : 'credit'}_entries[${entry.idx}].tax_category_id`,
      })
    } else if (acctDir === 'purchase' && taxDir === 'sales') {
      errors.push({
        type: 'TAX_DIRECTION_MISMATCH',
        message: `${entry.side}[${entry.idx}] 費用科目「${entry.account}」に売上系税区分「${entry.tax_category_id}」は税務上不正`,
        field: `${entry.side === '借方' ? 'debit' : 'credit'}_entries[${entry.idx}].tax_category_id`,
      })
    }
  }

  // ── 免税事業者の課税税区分チェック（実機テスト確認済み: MF APIは許容するが税務上不正） ──
  if (journal.consumption_tax_mode === 'exempt') {
    for (const entry of allEntries) {
      if (!entry.tax_category_id) continue
      const taxDir = maps.taxDirectionMap.get(entry.tax_category_id)
      // 免税事業者はcommon（対象外）のみ使用可。sales/purchase系は不正
      if (taxDir && taxDir !== 'common') {
        errors.push({
          type: 'TAX_EXEMPT_VIOLATION',
          message: `${entry.side}[${entry.idx}] 免税事業者が課税税区分「${entry.tax_category_id}」を使用（免税は対象外のみ）`,
          field: `${entry.side === '借方' ? 'debit' : 'credit'}_entries[${entry.idx}].tax_category_id`,
        })
      }
    }
  }

  // ── 簡易課税の売上税区分チェック（簡易課税専用のみ許可） ──
  if (journal.consumption_tax_mode === 'simplified') {
    for (const entry of allEntries) {
      if (!entry.tax_category_id) continue
      const taxDir = maps.taxDirectionMap.get(entry.tax_category_id)
      if (taxDir !== 'sales') continue
      // 売上方向の税区分は簡易課税専用（simplifiedOnly=true）のみ許可
      // データ駆動: IDパターンマッチ（_T[1-6]）に依存しない
      if (!maps.taxSimplifiedOnlySet.has(entry.tax_category_id)) {
        errors.push({
          type: 'TAX_SIMPLIFIED_VIOLATION',
          message: `${entry.side}[${entry.idx}] 簡易課税で原則用売上税区分「${entry.tax_category_id}」を使用（事業区分付きのみ許可）`,
          field: `${entry.side === '借方' ? 'debit' : 'credit'}_entries[${entry.idx}].tax_category_id`,
        })
      }
    }
  }

  // ── 本則（一括比例）の個別対応専用税区分禁止 ──
  // 一括比例では「共通課税仕入」「非課税対応仕入」が使えない（MF available=false）
  // データ駆動: individualOnlyフラグで判定（IDパターンマッチに依存しない）
  if (journal.consumption_tax_mode === 'general_proportional') {
    for (const entry of allEntries) {
      if (!entry.tax_category_id) continue
      if (maps.taxIndividualOnlySet.has(entry.tax_category_id)) {
        errors.push({
          type: 'TAX_PROPORTIONAL_VIOLATION',
          message: `${entry.side}[${entry.idx}] 本則（一括比例）で個別対応用税区分「${entry.tax_category_id}」を使用（共通/非課税対応は個別対応のみ）`,
          field: `${entry.side === '借方' ? 'debit' : 'credit'}_entries[${entry.idx}].tax_category_id`,
        })
      }
    }
  }

  // ── 貸借一致チェック ──
  const debitTotal = journal.debit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const creditTotal = journal.credit_entries.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  if (debitTotal !== creditTotal) {
    errors.push({
      type: 'DEBIT_CREDIT_MISMATCH',
      message: `貸借不一致: 借方合計=${debitTotal} ≠ 貸方合計=${creditTotal}`,
    })
  }

  return errors
}

/**
 * 金額バリデーション（MF APIの制約に基づく実機テスト確認済み 2026-05-23）
 *
 * MF APIが拒否する値:
 *   - null/undefined → missing_required_request_body_key
 *   - 0             → missing_required_request_body_key（falsyとして扱われる）
 *   - 負数          → invalid_request_body_value「金額は整数で指定してください」
 *   - 小数          → MCPスキーマ拒否 want "integer"
 *   - NaN/Infinity  → JSONシリアライズ不可
 */
function validateAmount(
  amount: number | null,
  label: string,
  field: string,
  errors: ConversionError[],
): void {
  if (amount == null) {
    errors.push({ type: 'AMOUNT_NULL', message: `${label} 金額がnull`, field })
    return
  }
  if (!Number.isFinite(amount)) {
    errors.push({ type: 'AMOUNT_INVALID', message: `${label} 金額が不正値: ${amount}（NaN/Infinity）`, field })
    return
  }
  if (amount === 0) {
    errors.push({ type: 'AMOUNT_ZERO', message: `${label} 金額が0円（MF APIが拒否）`, field })
    return
  }
  if (amount < 0) {
    errors.push({ type: 'AMOUNT_NEGATIVE', message: `${label} 金額が負数: ${amount}（MF APIが拒否）`, field })
    return
  }
  if (!Number.isInteger(amount)) {
    errors.push({ type: 'AMOUNT_DECIMAL', message: `${label} 金額が小数: ${amount}（MF APIは整数のみ）`, field })
  }
}

// ────────────────────────────────────────────
// 仕訳行変換
// ────────────────────────────────────────────

/**
 * 1つのSugusru行をMf行に変換する
 */
function convertSide(
  entry: SourceEntryLine,
  maps: MfMappingTables,
  invoiceKind: string | null,
): MfJournalSide {
  // バリデーション通過後なのでnull/0/負数/小数はありえないが防御
  const accountId = maps.accountMap.get(entry.account!)
  if (!accountId) {
    throw new Error(`[convertSide] account_idの解決に失敗: ${entry.account}（バリデーション通過後に到達すべきでない）`)
  }
  if (entry.amount == null || entry.amount <= 0 || !Number.isInteger(entry.amount)) {
    throw new Error(`[convertSide] 不正な金額: ${entry.amount}（バリデーション通過後に到達すべきでない）`)
  }
  const side: MfJournalSide = {
    account_id: accountId,
    value: entry.amount,
  }

  // インボイス区分（免税事業者はnull=省略。MFが自動判定する）
  if (invoiceKind !== null) {
    side.invoice_kind = invoiceKind
  }

  // 税区分（nullなら省略=MFが自動判定）
  if (entry.tax_category_id) {
    const mfTaxId = maps.taxMap.get(entry.tax_category_id)
    if (mfTaxId) side.tax_id = mfTaxId
  }

  // 補助科目（名前→MF-ID）
  if (entry.sub_account) {
    const mfSubId = maps.subAccountMap.get(entry.sub_account)
    if (mfSubId) side.sub_account_id = mfSubId
  }

  // 部門（名前→MF-ID）
  if (entry.department) {
    const mfDeptId = maps.departmentMap.get(entry.department)
    if (mfDeptId) side.department_id = mfDeptId
  }

  // 取引先（名前→MF取引先コード）
  // MF側に該当取引先がなければ無視（取引先なしで送信）
  if (entry.trade_partner_name) {
    const mfCode = maps.tradePartnerMap.get(entry.trade_partner_name)
    if (mfCode) side.trade_partner_code = mfCode
  }

  return side
}



// ────────────────────────────────────────────
// N:N → branches変換
// ────────────────────────────────────────────

/**
 * debit_entries[] + credit_entries[] → MF branches[] に変換する
 *
 * MF API POSTルール（検証済み 2026-05-23）:
 *   - 各branchにdebitor/creditor両方必須
 *   - 各branchで debitor.value === creditor.value であること
 *   - N:N（3:1等）: 長い側の金額をそのまま使い、
 *     短い側は同一科目を複製して対向の金額に合わせる
 *
 * 変換例（debit 3行 / credit 1行）:
 *   debit: [消耗品費¥500, 外注工賃¥300, 手数料¥200]
 *   credit: [現金¥1000]
 *   →
 *   branch[0]: debitor=消耗品費¥500, creditor=現金¥500
 *   branch[1]: debitor=外注工賃¥300, creditor=現金¥300
 *   branch[2]: debitor=手数料¥200,   creditor=現金¥200
 */
export function convertBranches(
  debitEntries: SourceEntryLine[],
  creditEntries: SourceEntryLine[],
  maps: MfMappingTables,
  invoiceKind: string | null,
  remark: string,
): MfJournalPayload['branches'] {
  const dLen = debitEntries.length
  const cLen = creditEntries.length
  const maxLen = Math.max(dLen, cLen)
  const branches: MfJournalPayload['branches'] = []

  for (let i = 0; i < maxLen; i++) {
    let debitor: MfJournalSide
    let creditor: MfJournalSide

    // 借方と貸方の元データを決定
    const debitEntry = i < dLen ? debitEntries[i]! : null
    const creditEntry = i < cLen ? creditEntries[i]! : null

    if (debitEntry && creditEntry && dLen === cLen) {
      // N:Nで行数が同じ → 普通にペア（金額はそれぞれそのまま）
      debitor = convertSide(debitEntry, maps, invoiceKind)
      creditor = convertSide(creditEntry, maps, invoiceKind)
    } else if (debitEntry && dLen > cLen) {
      // 借方が長い → 借方金額が基準、貸方は最後のcredit科目を複製して金額合わせ
      debitor = convertSide(debitEntry, maps, invoiceKind)
      const creditBase = creditEntry ?? creditEntries[cLen - 1]!
      const mirrorCredit: SourceEntryLine = { ...creditBase, amount: debitEntry.amount }
      creditor = convertSide(mirrorCredit, maps, invoiceKind)
    } else if (creditEntry && cLen > dLen) {
      // 貸方が長い → 貸方金額が基準、借方は最後のdebit科目を複製して金額合わせ
      creditor = convertSide(creditEntry, maps, invoiceKind)
      const debitBase = debitEntry ?? debitEntries[dLen - 1]!
      const mirrorDebit: SourceEntryLine = { ...debitBase, amount: creditEntry.amount }
      debitor = convertSide(mirrorDebit, maps, invoiceKind)
    } else if (debitEntry && creditEntry) {
      // フォールバック（dLen === cLen以外で両方ある場合）
      debitor = convertSide(debitEntry, maps, invoiceKind)
      creditor = convertSide(creditEntry, maps, invoiceKind)
    } else {
      continue
    }

    branches.push({
      debitor,
      creditor,
      remark: i === 0 ? remark : '',
    })
  }

  return branches
}


// ────────────────────────────────────────────
// インボイス区分変換
// ────────────────────────────────────────────

/**
 * invoice_status → MF invoice_kind 変換（内部保持用）
 *
 * MF APIの正しいenum値（MCPバリデーションで確認済み 2026-05-23）:
 *   INVOICE_KIND_QUALIFIED      — 適格請求書あり
 *   INVOICE_KIND_UNQUALIFIED_80 — 非適格（経過措置80%控除）
 *   INVOICE_KIND_NOT_TARGET     — 対象外
 *
 * 送信ルール（実機テスト 2026-05-23 全課税方式テスト済み）:
 *   - 免税: QUALIFIED(MF#17)/UNQUALIFIED_80(MF#18)/NOT_TARGET(MF#19) 全受理。
 *           ただし免税は消費税申告しないためinvoice_kindは無意味。省略でよい。
 *   - 簡易: QUALIFIED(MF#12)/UNQUALIFIED_80(MF#13)/NOT_TARGET(MF#14) 全受理。
 *   - 本則: QUALIFIED(MF#7)/UNQUALIFIED_80(MF#8)/NOT_TARGET+対象外(MF#10) 全受理。
 *           NOT_TARGET+課税税区分は拒否（税務矛盾）。
 *   - 省略時: MFが税区分から自動判定（課税→QUALIFIED、対象外→NOT_TARGET）。
 *
 * 現在の設計:
 *   - 免税: null（省略）→ MFが自動判定（実害なし）
 *   - 非免税: 適格→QUALIFIED、非適格→日付で80/50/0、未判定→NOT_TARGET
 */
export function toInvoiceKind(
  status: 'qualified' | 'not_qualified' | null | undefined,
  isTaxExempt?: boolean,
  voucherDate?: string | null,
): string | null {
  // 共通定数・ロジックは mfApiConstants.ts に集約
  return toMfInvoiceKind(status, !!isTaxExempt, voucherDate)
}

// ────────────────────────────────────────────
// メイン変換関数
// ────────────────────────────────────────────

/** 変換結果 */
export interface ConvertResult {
  /** MF送信用ペイロード（変換成功時） */
  payload: MfJournalPayload | null
  /** 変換エラー（バリデーション失敗時） */
  errors: ConversionError[]
  /**
   * 非適格の仕訳が含まれるか
   * trueの場合、invoice_kind=UNQUALIFIED_80/50でMFにそのまま送信される。
   * MF管理画面での手動修正は不要。
   */
  hasNonQualified: boolean
  /** 変換時のinvoice_kind（ログ用） */
  invoiceKind: string | null
}

/**
 * Sugusru仕訳 → MF postJournals形式に変換する
 *
 * invoice_kindは税務的に正しい値を設定し、そのままMFに送信される（実機テスト 2026-05-23確認済み）。
 * QUALIFIED/UNQUALIFIED_80はMF APIが受理するため、非適格仕訳も正しく登録される。
 *
 * @param journal Sugusru仕訳
 * @param maps マッピングテーブル（buildAllMapsで取得）
 */
export function convertToMfJournal(
  journal: SourceJournal,
  maps: MfMappingTables,
): ConvertResult {
  // バリデーション
  const errors = validateBeforeConvert(journal, maps)
  if (errors.length > 0) {
    return { payload: null, errors, hasNonQualified: false, invoiceKind: null }
  }

  // invoice_kind変換（税務的に正しい値を算出）
  const invoiceKind = toInvoiceKind(journal.invoice_status, journal.is_tax_exempt, journal.voucher_date)

  // 非適格判定
  const hasNonQualified = journal.invoice_status === 'not_qualified'

  const branches = convertBranches(
    journal.debit_entries,
    journal.credit_entries,
    maps,
    invoiceKind,
    journal.description || '',
  )

  const payload: MfJournalPayload = {
    transaction_date: journal.voucher_date!,
    journal_type: MF_JOURNAL_TYPE_ENTRY,
    branches,
    memo: journal.description || '',
    tags: [MF_SUGUSURU_TAG],
  }

  return { payload, errors: [], hasNonQualified, invoiceKind }
}
