/**
 * accountDetermination.test.ts — 科目確定コア関数のユニットテスト
 *
 * テスト対象: determineAccount()
 * 準拠: plan_account_determination.md B-4
 *
 * 注意: vendorStore（インメモリ）に依存するため、テスト前にストアを初期化する。
 * 将来: vendorStoreもDI化すれば純粋なユニットテストになる。
 */

import { describe, test, expect, vi } from 'vitest'
import { determineAccount } from './accountDetermination'
import type { DetermineAccountInput } from './accountDetermination'
import type { LearningRule } from '../../../types/learning_rule.type'

// estimateAccountByAIをモック化（テストでGemini APIを実呼び出ししない）
vi.mock('./estimateAccountByAI', () => ({
  estimateAccountByAI: vi.fn().mockResolvedValue(null),
}))

// モックのインポート（vi.mock後に動的インポート不要。vitestが自動処理）
import { estimateAccountByAI } from './estimateAccountByAI'
const mockedEstimate = vi.mocked(estimateAccountByAI)

// ============================================================
// テスト用データ
// ============================================================

/** テスト用の基本入力（全層ミス想定） */
function createInput(overrides: Partial<DetermineAccountInput> = {}): DetermineAccountInput {
  return {
    vendorNameRaw: null,
    description: 'テスト摘要',
    amount: 1000,
    direction: 'expense',
    sourceType: null,
    clientId: 'TST-00011',
    tNumberRaw: null,
    learningRules: [],
    industryVectors: [],
    ...overrides,
  }
}

/** テスト用の学習ルール（型定義に完全準拠） */
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
      taxCategory: 'TAX_10',
      amountType: 'auto' as const,
      fixedAmount: null,
      displayName: null,
      description: null,
      targetMonth: null,
      displayOrder: 1,
    }, {
      entryId: 'e2',
      ruleId: 'lr_test001',
      side: 'credit' as const,
      account: 'TEST_CREDIT_ACCOUNT',
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

/** テスト用の科目マスタ */
const TEST_ACCOUNT_MASTER = [
  { accountId: 'TRAVEL', name: '旅費交通費', defaultTaxCategoryId: 'TAX_10' },
  { accountId: 'SUPPLIES', name: '消耗品費', defaultTaxCategoryId: 'TAX_10' },
  { accountId: 'MEETING', name: '会議費', defaultTaxCategoryId: 'TAX_10' },
]

// ============================================================
// テストケース
// ============================================================

describe('determineAccount（科目確定コア関数）', () => {

  // ━━ 全層ミス ━━
  test('全層ミス: 未登録取引先 + ルールなし + 辞書なし → insufficient', async () => {
    const result = await determineAccount(createInput({
      vendorNameRaw: '存在しない会社名XXXX',
      description: 'ありえない摘要YYYY',
    }))
    expect(result.level).toBe('insufficient')
    expect(result.predictionMethod).toBeNull()
    expect(result.determinedAccount).toBeNull()
    expect(result.vendorId).toBeNull()
  })

  // ━━ 第三層-①: 学習ルール照合 ━━
  test('学習ルールヒット → level A, predictionMethod=learning_rule', async () => {
    const rules = [createRule({ keyword: 'コンビニ' })]
    const result = await determineAccount(createInput({
      description: 'コンビニで文房具購入',
      learningRules: rules,
    }))
    expect(result.level).toBe('A')
    expect(result.predictionMethod).toBe('learning_rule')
    expect(result.ruleId).toBe('lr_test001')
    expect(result.determinedAccount).toBe('SUPPLIES')
    expect(result.debitEntries.length).toBeGreaterThan(0)
    expect(result.creditEntries.length).toBeGreaterThan(0)
  })

  test('学習ルール: キーワード不一致 → ルールスキップ', async () => {
    const rules = [createRule({ keyword: 'スタバ' })]
    const result = await determineAccount(createInput({
      description: 'コンビニで文房具購入',
      learningRules: rules,
    }))
    expect(result.predictionMethod).not.toBe('learning_rule')
  })

  test('学習ルール: isActive=false → スキップ', async () => {
    const rules = [createRule({ keyword: 'コンビニ', isActive: false })]
    const result = await determineAccount(createInput({
      description: 'コンビニで文房具購入',
      learningRules: rules,
    }))
    expect(result.predictionMethod).not.toBe('learning_rule')
  })

  // ━━ 結果型の整合性 ━━
  test('結果型: 全フィールドが初期化されている', async () => {
    const result = await determineAccount(createInput())
    expect(result).toHaveProperty('vendorId')
    expect(result).toHaveProperty('vendorName')
    expect(result).toHaveProperty('determinedAccount')
    expect(result).toHaveProperty('taxCategory')
    expect(result).toHaveProperty('subAccount')
    expect(result).toHaveProperty('department')
    expect(result).toHaveProperty('ruleId')
    expect(result).toHaveProperty('level')
    expect(result).toHaveProperty('predictionMethod')
    expect(result).toHaveProperty('candidates')
    expect(result).toHaveProperty('debitEntries')
    expect(result).toHaveProperty('creditEntries')
    expect(Array.isArray(result.candidates)).toBe(true)
    expect(Array.isArray(result.debitEntries)).toBe(true)
    expect(Array.isArray(result.creditEntries)).toBe(true)
  })

  test('学習ルール: 複合仕訳（借方・貸方）が正しく展開される', async () => {
    const rules = [createRule({ keyword: 'テスト' })]
    const result = await determineAccount(createInput({
      description: 'テスト摘要',
      amount: 5000,
      learningRules: rules,
    }))
    expect(result.debitEntries.length).toBe(1)
    expect(result.creditEntries.length).toBe(1)
    expect(result.debitEntries[0]!.account).toBe('SUPPLIES')
    expect(result.creditEntries[0]!.account).toBe('TEST_CREDIT_ACCOUNT')
    expect(result.debitEntries[0]!.amount).toBe(5000)
    expect(result.creditEntries[0]!.amount).toBe(5000)
  })

  // ━━ 第五層: AI推定テスト ━━
  test('第5層: 全層ミス + accountMasterあり + AI推定ヒット → level B', async () => {
    mockedEstimate.mockResolvedValueOnce({
      account: 'TRAVEL',
      taxCategory: 'TAX_10',
      confidence: 0.75,
    })
    const result = await determineAccount(createInput({
      vendorNameRaw: '不明な会社ABC',
      description: '不明な摘要XYZ',
      accountMaster: TEST_ACCOUNT_MASTER,
    }))
    expect(result.level).toBe('B')
    expect(result.predictionMethod).toBe('ai_fallback')
    expect(result.determinedAccount).toBe('TRAVEL')
    expect(result.taxCategory).toBe('TAX_10')
    expect(result.confidence).toBe(0.75)
    expect(result.candidates).toEqual(['TRAVEL'])
  })

  test('第5層: 全層ミス + accountMaster空配列 → AI推定スキップ → insufficient', async () => {
    mockedEstimate.mockClear()
    const result = await determineAccount(createInput({
      vendorNameRaw: '不明な会社',
      description: '不明な摘要',
      accountMaster: [],
    }))
    expect(result.level).toBe('insufficient')
    expect(mockedEstimate).not.toHaveBeenCalled()
  })

  test('第5層: 全層ミス + accountMaster未指定（undefined）→ AI推定スキップ → insufficient', async () => {
    mockedEstimate.mockClear()
    const result = await determineAccount(createInput({
      vendorNameRaw: '不明な会社',
      description: '不明な摘要',
      // accountMasterを渡さない
    }))
    expect(result.level).toBe('insufficient')
    expect(mockedEstimate).not.toHaveBeenCalled()
  })

  test('第5層: 第3層ヒット時 → AI推定は発火しない', async () => {
    mockedEstimate.mockClear()
    const rules = [createRule({ keyword: 'テスト推定' })]
    const result = await determineAccount(createInput({
      description: 'テスト推定の摘要',
      learningRules: rules,
      accountMaster: TEST_ACCOUNT_MASTER,
    }))
    expect(result.level).toBe('A')
    expect(result.predictionMethod).toBe('learning_rule')
    expect(mockedEstimate).not.toHaveBeenCalled()
  })

  test('第5層: AI推定の確信度 < 0.3 → 棄却 → insufficient', async () => {
    mockedEstimate.mockResolvedValueOnce(null) // estimateAccountByAI内部でconfidence < 0.3時はnullを返す
    const result = await determineAccount(createInput({
      vendorNameRaw: '不明な会社DEF',
      description: '不明な摘要UVW',
      accountMaster: TEST_ACCOUNT_MASTER,
    }))
    expect(result.level).toBe('insufficient')
    expect(result.predictionMethod).toBeNull()
  })
})
