/**
 * matchLearningRule.ts — 学習ルール照合関数
 *
 * 27_account_determination.md §3 準拠。
 * 摘要テキスト + 金額 + 方向 + 証票種別 → 学習ルールを照合してテンプレート仕訳を返す。
 *
 * 照合優先順位:
 *   1. matchType: 'exact'（完全一致）を優先
 *   2. matchType: 'contains'（部分一致）
 *   3. 金額範囲が狭い方を優先（同点時）
 *   4. isActive: false のルールはスキップ
 *
 * 準拠: 27_account_determination.md §3-3（照合方式）
 */

import type { LearningRule } from '../../types/learning_rule.type'
import { learningRulesTST00011 } from '../../data/learning_rules_TST00011'

/**
 * 証票種別 → 学習ルールのsourceCategory への変換
 *
 * SourceType（11種）→ LearningRule.sourceCategory（4種）
 */
function toSourceCategory(
  sourceType: string | null,
): 'receipt' | 'bank' | 'credit' | 'all' | null {
  if (!sourceType) return null
  switch (sourceType) {
    case 'receipt':
    case 'invoice_received':
    case 'tax_payment':
      return 'receipt'
    case 'bank_statement':
    case 'cash_ledger':
      return 'bank'
    case 'credit_card':
      return 'credit'
    default:
      return null
  }
}

/**
 * 学習ルール照合メイン関数
 *
 * @param description - 摘要テキスト（正規化前の生テキスト）
 * @param amount - 取引金額（円・整数）
 * @param direction - 入出金方向（'expense' | 'income'）
 * @param sourceType - 証票種別（SourceType 11種。sourceCategoryに変換）
 * @param clientId - 顧問先ID（学習ルールは顧問先ごと）
 * @returns マッチした学習ルール。複数ヒット時は最も優先度の高い1件。マッチなしはnull。
 */
export function matchLearningRule(
  description: string,
  amount: number,
  direction: 'expense' | 'income',
  sourceType: string | null,
  clientId: string,
): LearningRule | null {
  const sourceCategory = toSourceCategory(sourceType)

  // 顧問先IDでフィルタ + 有効ルールのみ
  // TODO (2026-04): Supabase移行時はリポジトリ経由でクエリ
  const rules = learningRulesTST00011.filter(
    r => r.clientId === clientId && r.isActive,
  )

  const candidates: Array<{ rule: LearningRule; priority: number }> = []

  for (const rule of rules) {
    // ① 方向チェック（nullは全方向対象）
    if (rule.direction !== null && rule.direction !== direction) continue

    // ② 証票種別チェック（nullは全種別対象）
    if (rule.sourceCategory !== null && sourceCategory !== null) {
      if (rule.sourceCategory !== sourceCategory) continue
    }

    // ③ 金額条件チェック（MF方式: amountMin/amountMax）
    if (rule.amountMin !== null && amount < rule.amountMin) continue
    if (rule.amountMax !== null && amount > rule.amountMax) continue

    // ④ キーワード照合
    if (rule.matchType === 'exact') {
      // 完全一致: 摘要テキスト全体がキーワードと一致
      if (description !== rule.keyword) continue
      // 完全一致の優先度 = 1000（最高）+ 金額範囲の狭さボーナス
      const rangeWidth = calcRangeWidth(rule)
      candidates.push({ rule, priority: 1000 + rangeWidth })
    } else {
      // 部分一致: 摘要テキストにキーワードが含まれる
      if (!description.includes(rule.keyword)) continue
      // 部分一致の優先度 = 500 + 金額範囲の狭さボーナス
      const rangeWidth = calcRangeWidth(rule)
      candidates.push({ rule, priority: 500 + rangeWidth })
    }
  }

  if (candidates.length === 0) return null

  // 優先度降順でソート（同点時はhitCount降順 = 実績が多い方を優先）
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return b.rule.hitCount - a.rule.hitCount
  })

  return candidates[0]!.rule
}

/**
 * 金額範囲の「狭さ」スコア（狭いほど高い = より具体的なルール）
 *
 * 範囲なし（null/null）: 0
 * 同額一致（220000/220000）: 100（最高。最も具体的）
 * 範囲（5000/10000）: 5000幅 → スコア90
 * 以上のみ/以下のみ: 50
 */
function calcRangeWidth(rule: LearningRule): number {
  const { amountMin, amountMax } = rule
  if (amountMin === null && amountMax === null) return 0
  if (amountMin !== null && amountMax !== null) {
    if (amountMin === amountMax) return 100 // 同額一致
    const width = amountMax - amountMin
    return Math.max(0, 90 - Math.floor(width / 1000)) // 範囲が狭いほど高い
  }
  return 50 // 片側のみ
}

/** 公開: toSourceCategory（テスト用） */
export { toSourceCategory }
