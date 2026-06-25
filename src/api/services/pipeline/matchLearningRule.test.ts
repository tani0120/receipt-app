/**
 * matchLearningRule.test.ts — 学習ルール照合のユニットテスト
 *
 * テスト対象: matchLearningRule()
 * 準拠: plan_account_determination.md B-4
 */

import { describe, test, expect } from 'vitest'
import { matchLearningRule } from './matchLearningRule'
import type { LearningRule } from '../../../types/learning_rule.type'

// ============================================================
// テスト用ルール生成ヘルパー
// ============================================================

/** 最小限のLearningRuleを生成（型定義に完全準拠） */
function createRule(overrides: Partial<LearningRule> = {}): LearningRule {
  return {
    ruleId: 'lr_test001',
    clientId: 'TST-00011',
    keyword: 'テスト',
    matchType: 'contains',
    direction: null,
    sourceCategory: null,
    amountMin: null,
    amountMax: null,
    isActive: true,
    hitCount: 0,
    generatedBy: 'human',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    entries: [{
      entryId: 'e1',
      ruleId: 'lr_test001',
      side: 'debit' as const,
      account: 'SUPPLIES',
      subAccount: null,
      department: null,
      taxCategory: null,
      amountType: 'auto' as const,
      fixedAmount: null,
      displayName: null,
      description: null,
      targetMonth: null,
      displayOrder: 1,
    }],
    ...overrides,
  }
}

// ============================================================
// テストケース
// ============================================================

describe('matchLearningRule（学習ルール照合）', () => {

  test('空配列 → null返却', () => {
    const result = matchLearningRule(
      'スタバ コーヒー', 500, 'expense', null, 'TST-00011', [],
    )
    expect(result).toBeNull()
  })

  test('isActive=false のルールはスキップ → null返却', () => {
    const rules = [createRule({ keyword: 'スタバ', isActive: false })]
    const result = matchLearningRule(
      'スタバ コーヒー', 500, 'expense', null, 'TST-00011', rules,
    )
    expect(result).toBeNull()
  })

  test('部分一致（contains）でヒット', () => {
    const rules = [createRule({ keyword: 'スタバ', matchType: 'contains' })]
    const result = matchLearningRule(
      'スタバ 新宿店 コーヒー', 500, 'expense', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
    expect(result!.keyword).toBe('スタバ')
  })

  test('完全一致（exact）でヒット', () => {
    const rules = [createRule({ keyword: 'スタバ', matchType: 'exact' })]
    const result = matchLearningRule(
      'スタバ', 500, 'expense', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
  })

  test('完全一致（exact）: 摘要が異なる場合はミス', () => {
    const rules = [createRule({ keyword: 'スタバ', matchType: 'exact' })]
    const result = matchLearningRule(
      'スタバ 新宿店', 500, 'expense', null, 'TST-00011', rules,
    )
    expect(result).toBeNull()
  })

  test('完全一致 > 部分一致 の優先順位', () => {
    const rules = [
      createRule({ ruleId: 'r_contains', keyword: 'スタバ', matchType: 'contains' }),
      createRule({ ruleId: 'r_exact', keyword: 'スタバ', matchType: 'exact' }),
    ]
    const result = matchLearningRule(
      'スタバ', 500, 'expense', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
    expect(result!.ruleId).toBe('r_exact')
  })

  test('金額範囲フィルタ: 範囲内はヒット', () => {
    const rules = [createRule({ keyword: 'タクシー', amountMin: 1000, amountMax: 5000 })]
    const result = matchLearningRule(
      'タクシー代', 3000, 'expense', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
  })

  test('金額範囲フィルタ: 範囲外はスキップ', () => {
    const rules = [createRule({ keyword: 'タクシー', amountMin: 1000, amountMax: 5000 })]
    const result = matchLearningRule(
      'タクシー代', 10000, 'expense', null, 'TST-00011', rules,
    )
    expect(result).toBeNull()
  })

  test('方向フィルタ: expense指定ルールにincome入力 → スキップ', () => {
    const rules = [createRule({ keyword: 'テスト', direction: 'expense' })]
    const result = matchLearningRule(
      'テスト摘要', 1000, 'income', null, 'TST-00011', rules,
    )
    expect(result).toBeNull()
  })

  test('方向フィルタ: direction=null は全方向にヒット', () => {
    const rules = [createRule({ keyword: 'テスト', direction: null })]
    const result = matchLearningRule(
      'テスト摘要', 1000, 'income', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
  })

  test('clientIdが異なるルールはスキップ', () => {
    const rules = [createRule({ keyword: 'テスト', clientId: 'OTHER-99999' })]
    const result = matchLearningRule(
      'テスト摘要', 1000, 'expense', null, 'TST-00011', rules,
    )
    expect(result).toBeNull()
  })

  test('同点時はhitCount降順で選択', () => {
    const rules = [
      createRule({ ruleId: 'r_low', keyword: 'コンビニ', hitCount: 5 }),
      createRule({ ruleId: 'r_high', keyword: 'コンビニ', hitCount: 50 }),
    ]
    const result = matchLearningRule(
      'コンビニで買い物', 300, 'expense', null, 'TST-00011', rules,
    )
    expect(result).not.toBeNull()
    expect(result!.ruleId).toBe('r_high')
  })
})
