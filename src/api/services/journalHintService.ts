/**
 * journalHintService.ts — 仕訳ヒント・修正候補生成サービス（API側）
 *
 * Phase 1 Step 6-A1（2026-05-03）
 * JournalListLevel3Mock.vue の generateHintValidations / generateHintSuggestions を移植。
 *
 * 依存:
 *   - shared/data/voucherTypeRules.ts（証票意味ルール）
 *   - journalValidation.ts（型定義の共有）
 *
 * Phase 2完了（2026-05-03）: accounts/taxCategories を accountMasterStore から取得する方式に変更済み。
 *   POSTボディ経由の受け渡しは廃止。
 */

import { VOUCHER_TYPE_RULES, getBaseAccountId } from '../../data/master/voucherTypeRules'
import type { VoucherTypeSideRule } from '../../data/master/voucherTypeRules'
import type { AccountForValidation, TaxCategoryForValidation } from './journalValidation'

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────

/** ヒント検証結果 */
export interface HintValidation {
  level: 'error' | 'warn'
  message: string
}

/** ヒント候補の選択肢 */
export interface HintAlternative {
  value: string
  label: string
}

/** ヒント修正候補 */
export interface HintSuggestion {
  side: 'debit' | 'credit'
  field: string
  currentValue: string | null
  currentLabel: string
  selectedValue: string
  selectedLabel: string
  alternatives: HintAlternative[]
  entryIndex: number
}

/** ヒント生成用の仕訳エントリ行 */
interface HintJournalEntry {
  account: string | null
  sub_account?: string | null
  tax_category_id: string | null
  amount: number | null
}

/** ヒント用の勘定科目（バリデーション用に加えてname/sub/defaultTaxCategoryIdが必要） */
export interface AccountForHint extends AccountForValidation {
  name: string
  sub?: string | null
}

/** ヒント生成対象の仕訳 */
export interface JournalForHint {
  id: string
  voucher_date: string | null
  description: string
  voucher_type: string | null
  vendor_name?: string | null
  debit_entries: HintJournalEntry[]
  credit_entries: HintJournalEntry[]
  labels: string[]
}

/** ヒントAPIのレスポンス */
export interface HintsResponse {
  journalId: string
  validations: HintValidation[]
  suggestions: HintSuggestion[]
}

// ────────────────────────────────────────────
// 税区分名解決用の拡張インターフェース
// ────────────────────────────────────────────

export interface TaxCategoryForHint extends TaxCategoryForValidation {
  name: string
  shortName?: string | null
}

// ────────────────────────────────────────────
// ヒント検証（warningラベルに基づくメッセージ生成）
// ────────────────────────────────────────────

export function generateHintValidations(
  journal: JournalForHint,
  accounts: AccountForHint[],
): HintValidation[] {
  const results: HintValidation[] = []
  const labels = journal.labels
  const accountIds = new Set(accounts.map(a => a.id))

  // 各warningLabelに対応するメッセージ
  if (labels.includes('ACCOUNT_UNKNOWN')) {
    let found = false
    for (const e of journal.debit_entries) {
      if (e.account && !accountIds.has(e.account)) {
        results.push({ level: 'error', message: `借方科目【${e.account}】はマスタに存在しません` })
        found = true
      }
    }
    for (const e of journal.credit_entries) {
      if (e.account && !accountIds.has(e.account)) {
        results.push({ level: 'error', message: `貸方科目【${e.account}】はマスタに存在しません` })
        found = true
      }
    }
    if (!found) {
      results.push({ level: 'error', message: '勘定科目が未設定または不明です' })
    }
  }
  if (labels.includes('TAX_UNKNOWN'))
    results.push({ level: 'error', message: '税区分が未設定または不明です' })
  if (labels.includes('DESCRIPTION_UNKNOWN'))
    results.push({ level: 'warn', message: '摘要が未設定です' })
  if (labels.includes('DATE_UNKNOWN'))
    results.push({ level: 'warn', message: '日付が未設定です' })
  if (labels.includes('AMOUNT_UNCLEAR'))
    results.push({ level: 'error', message: '金額が未設定のエントリがあります' })
  if (labels.includes('DEBIT_CREDIT_MISMATCH')) {
    const dSum = journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
    const cSum = journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
    results.push({ level: 'error', message: `貸借不一致: 借方合計 ${dSum.toLocaleString()} ≠ 貸方合計 ${cSum.toLocaleString()}` })
  }
  if (labels.includes('CATEGORY_CONFLICT'))
    results.push({ level: 'error', message: '借方・貸方の勘定科目の組み合わせに矛盾があります' })
  if (labels.includes('SAME_ACCOUNT_BOTH_SIDES'))
    results.push({ level: 'warn', message: '借方と貸方に同一の勘定科目が使用されています' })
  if (labels.includes('VOUCHER_TYPE_CONFLICT')) {
    const vt = journal.voucher_type
    const rule = vt ? VOUCHER_TYPE_RULES[vt] : null
    if (rule) {
      results.push({ level: 'error', message: `証票意味【${vt}】に対して不適切な科目があります\n${rule.description}` })
    } else {
      results.push({ level: 'error', message: '証票意味に対して不適切な科目があります' })
    }
  }
  if (labels.includes('TAX_ACCOUNT_MISMATCH'))
    results.push({ level: 'warn', message: '税区分と勘定科目の方向（売上/仕入）が一致しません' })
  if (labels.includes('FUTURE_DATE'))
    results.push({ level: 'error', message: `未来日付です（${journal.voucher_date}）。日付を確認してください` })

  return results
}

// ────────────────────────────────────────────
// ヒント修正候補生成
// ────────────────────────────────────────────

export function generateHintSuggestions(
  journal: JournalForHint,
  accounts: AccountForHint[],
  taxCategories: TaxCategoryForHint[],
): HintSuggestion[] {
  const suggestions: HintSuggestion[] = []
  const labels = journal.labels

  const accountIds = new Set(accounts.map(a => a.id))

  // 「科目名（補助科目）」形式のラベル生成
  const acctLabel = (id: string | null): string => {
    if (!id) return '未設定'
    const a = accounts.find(x => x.id === id)
    if (!a) return id
    return a.sub ? `${a.name}（${a.sub}）` : a.name
  }
  const taxName = (id: string | null | undefined): string => {
    if (!id) return '未設定'
    const t = taxCategories.find(x => x.id === id)
    return t ? (t.shortName ?? t.name) : id
  }

  // 該当グループの全科目をalternatives化
  const buildAlternatives = (
    sideRule: VoucherTypeSideRule,
    excludeId: string,
  ): HintAlternative[] => {
    const seen = new Set<string>()
    const alts: HintAlternative[] = []

    // allowedIdsから
    if (sideRule.allowedIds) {
      for (const id of sideRule.allowedIds) {
        if (id === excludeId || seen.has(id)) continue
        if (!accountIds.has(id)) continue
        seen.add(id)
        alts.push({ value: id, label: acctLabel(id) })
      }
      // コピー科目も候補に含める
      for (const a of accounts) {
        if (seen.has(a.id) || a.id === excludeId) continue
        const baseId = getBaseAccountId(a.id)
        if (baseId !== a.id && sideRule.allowedIds.includes(baseId)) {
          seen.add(a.id)
          alts.push({ value: a.id, label: acctLabel(a.id) })
        }
      }
    }
    // allowedGroupsから全件
    if (sideRule.allowedGroups) {
      for (const a of accounts) {
        if (seen.has(a.id) || a.id === excludeId) continue
        if (!sideRule.allowedGroups.includes(a.accountGroup ?? '')) continue
        seen.add(a.id)
        alts.push({ value: a.id, label: acctLabel(a.id) })
      }
    }
    // allowedCategoriesから全件
    if (sideRule.allowedCategories) {
      for (const a of accounts) {
        if (seen.has(a.id) || a.id === excludeId) continue
        if (!sideRule.allowedCategories.includes(a.category ?? '')) continue
        seen.add(a.id)
        alts.push({ value: a.id, label: acctLabel(a.id) })
      }
    }
    return alts
  }

  // デフォルト候補選択（証票意味に応じた賢い初期値）
  const pickDefault = (vt: string | null, alts: HintAlternative[]): HintAlternative | undefined => {
    if (alts.length === 0) return undefined
    // クレカ → 未払金を優先
    if (vt === 'クレカ') {
      const accrued = alts.find(a => a.value === 'ACCRUED_EXPENSES')
      if (accrued) return accrued
    }
    // 売上 → 売掛金を優先
    if (vt === '売上') {
      const receivable = alts.find(a => a.value === 'ACCOUNTS_RECEIVABLE')
      if (receivable) return receivable
    }
    return alts[0]
  }

  // ────── A: 証票意味ルールに基づく科目修正 ──────
  const vt = journal.voucher_type
  const rule = vt ? VOUCHER_TYPE_RULES[vt] : null

  // 借方・貸方の共通チェック関数
  const checkSideEntries = (
    entries: HintJournalEntry[],
    side: 'debit' | 'credit',
    sideRule: VoucherTypeSideRule | undefined,
  ) => {
    if (!sideRule) return
    entries.forEach((entry, idx) => {
      const acct = entry.account

      // ケース1: null科目 → 候補提案
      if (!acct) {
        const alts = buildAlternatives(sideRule, '')
        const def = pickDefault(vt, alts)
        if (def) {
          suggestions.push({
            side, field: '勘定科目', currentValue: null,
            currentLabel: '未設定',
            selectedValue: def.value, selectedLabel: def.label,
            alternatives: alts, entryIndex: idx,
          })
        }
        return
      }

      // ケース2: マスタ外科目 → 候補提案
      if (!accountIds.has(acct)) {
        const alts = buildAlternatives(sideRule, acct)
        const def = pickDefault(vt, alts)
        if (def) {
          suggestions.push({
            side, field: '勘定科目', currentValue: acct,
            currentLabel: acct, // マスタ外なのでID表示
            selectedValue: def.value, selectedLabel: def.label,
            alternatives: alts, entryIndex: idx,
          })
        }
        return
      }

      // ケース3: マスタ内だがグループ不一致 → 候補提案
      const acctObj = accounts.find(a => a.id === acct)
      if (!acctObj) return

      let allowed = false
      if (sideRule.allowedGroups?.includes(acctObj.accountGroup ?? '')) allowed = true
      if (sideRule.allowedIds?.includes(acct)) allowed = true
      // コピー元IDも照合
      if (sideRule.allowedIds) {
        const baseId = getBaseAccountId(acct)
        if (baseId !== acct && sideRule.allowedIds.includes(baseId)) allowed = true
      }
      // allowedCategoriesでcategoryが一致すればOK
      if (sideRule.allowedCategories?.includes(acctObj.category ?? '')) allowed = true

      if (!allowed) {
        const alts = buildAlternatives(sideRule, acct)
        const def = pickDefault(vt, alts)
        if (def) {
          suggestions.push({
            side, field: '勘定科目', currentValue: acct,
            currentLabel: acctLabel(acct),
            selectedValue: def.value, selectedLabel: def.label,
            alternatives: alts, entryIndex: idx,
          })
        }
      }
    })
  }

  if (rule) {
    checkSideEntries(journal.debit_entries, 'debit', rule.debit)
    checkSideEntries(journal.credit_entries, 'credit', rule.credit)
  }

  // ────── B: 税区分不整合修正 ──────
  if (labels.includes('TAX_ACCOUNT_MISMATCH') || labels.includes('TAX_UNKNOWN')) {
    const checkTaxEntries = (entries: HintJournalEntry[], side: 'debit' | 'credit') => {
      entries.forEach((entry, idx) => {
        const acct = entry.account
        if (!acct) return
        const acctObj = accounts.find(a => a.id === acct)
        if (!acctObj?.defaultTaxCategoryId) return

        const currentTax = entry.tax_category_id
        const expectedTax = acctObj.defaultTaxCategoryId
        if (currentTax !== expectedTax) {
          suggestions.push({
            side, field: '税区分', currentValue: currentTax ?? null,
            currentLabel: taxName(currentTax),
            selectedValue: expectedTax, selectedLabel: taxName(expectedTax),
            alternatives: [], entryIndex: idx,
          })
        }
      })
    }
    checkTaxEntries(journal.debit_entries, 'debit')
    checkTaxEntries(journal.credit_entries, 'credit')
  }

  // ────── C: 貸借不一致修正（1:N仕訳の場合） ──────
  if (labels.includes('DEBIT_CREDIT_MISMATCH')) {
    const dSum = journal.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
    const cSum = journal.credit_entries.reduce((s, e) => s + (e.amount ?? 0), 0)
    if (dSum !== cSum && dSum > 0 && cSum > 0) {
      const dCount = journal.debit_entries.length
      const cCount = journal.credit_entries.length

      if (dCount === 1 && cCount >= 2) {
        suggestions.push({
          side: 'debit', field: '金額', currentValue: String(dSum),
          currentLabel: dSum.toLocaleString(),
          selectedValue: String(cSum), selectedLabel: cSum.toLocaleString(),
          alternatives: [], entryIndex: 0,
        })
      } else if (cCount === 1 && dCount >= 2) {
        suggestions.push({
          side: 'credit', field: '金額', currentValue: String(cSum),
          currentLabel: cSum.toLocaleString(),
          selectedValue: String(dSum), selectedLabel: dSum.toLocaleString(),
          alternatives: [], entryIndex: 0,
        })
      }
      if (dCount >= 2 && cCount >= 2) {
        const diff = Math.abs(dSum - cSum)
        suggestions.push({
          side: dSum > cSum ? 'debit' : 'credit',
          field: '金額（差額）',
          currentValue: String(Math.max(dSum, cSum)),
          currentLabel: `差額 ${diff.toLocaleString()}`,
          selectedValue: String(Math.min(dSum, cSum)),
          selectedLabel: `${Math.min(dSum, cSum).toLocaleString()} に揃える`,
          alternatives: [], entryIndex: -1,
        })
      }
    }
  }

  return suggestions
}
