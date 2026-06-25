/**
 * estimateAccountByAI.test.ts — AI科目推定モジュールのユニットテスト
 *
 * テスト対象: estimateAccountByAI()
 * 準拠: plan_phase_a_ai_fallback.md
 *
 * Gemini APIはモック化。実際のAPI呼び出しは行わない。
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'

// モック用の generateContent 関数
const mockGenerateContent = vi.fn()

// @google/genai をモック化（classコンストラクタ対応）
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
      }
    },
  }
})

import { estimateAccountByAI } from './estimateAccountByAI'
import type { EstimateAccountInput } from './estimateAccountByAI'

// ============================================================
// テスト用データ
// ============================================================

/** テスト用の科目マスタ */
const TEST_MASTER = [
  { accountId: 'TRAVEL', name: '旅費交通費', defaultTaxCategoryId: 'TAX_10' },
  { accountId: 'SUPPLIES', name: '消耗品費', defaultTaxCategoryId: 'TAX_10' },
  { accountId: 'MEETING', name: '会議費', defaultTaxCategoryId: 'TAX_10' },
]

/** テスト用の基本入力 */
function createInput(overrides: Partial<EstimateAccountInput> = {}): EstimateAccountInput {
  return {
    description: 'タクシー代 東京駅→品川',
    vendorNameRaw: 'タクシー会社',
    direction: 'expense',
    sourceType: 'receipt',
    accountMaster: TEST_MASTER,
    ...overrides,
  }
}

// ============================================================
// テストケース
// ============================================================

describe('estimateAccountByAI（AI科目推定）', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
    mockGenerateContent.mockReset()
  })

  test('正常応答（confidence >= 0.3）→ 推定結果を返す', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ accountId: 'TRAVEL', confidence: 0.85 }),
    })

    const result = await estimateAccountByAI(createInput())
    expect(result).not.toBeNull()
    expect(result!.account).toBe('TRAVEL')
    expect(result!.taxCategory).toBe('TAX_10')
    expect(result!.confidence).toBe(0.85)
  })

  test('正常応答（confidence < 0.3）→ null を返す（棄却）', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ accountId: 'TRAVEL', confidence: 0.2 }),
    })

    const result = await estimateAccountByAI(createInput())
    expect(result).toBeNull()
  })

  test('AI応答がマスタ外の科目ID → null を返す（ハルシネーション防止）', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ accountId: 'NONEXISTENT_ACCOUNT', confidence: 0.9 }),
    })

    const result = await estimateAccountByAI(createInput())
    expect(result).toBeNull()
  })

  test('AI呼び出し失敗（ネットワークエラー等）→ null を返す（例外を投げない）', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('ネットワークエラー'))

    const result = await estimateAccountByAI(createInput())
    expect(result).toBeNull()
  })

  test('API鍵未設定 → null を返す（AI推定スキップ）', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('VITE_GEMINI_API_KEY', '')

    const result = await estimateAccountByAI(createInput())
    expect(result).toBeNull()
  })

  test('AI応答が空文字 → null を返す', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '',
    })

    const result = await estimateAccountByAI(createInput())
    expect(result).toBeNull()
  })

  test('confidence が 1.0 を超える場合 → 1.0 にクランプされる', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ accountId: 'SUPPLIES', confidence: 1.5 }),
    })

    const result = await estimateAccountByAI(createInput())
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(1.0)
  })

  test('マスタの defaultTaxCategoryId が null の場合 → taxCategory が null', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ accountId: 'NO_TAX', confidence: 0.8 }),
    })

    const result = await estimateAccountByAI(createInput({
      accountMaster: [
        { accountId: 'NO_TAX', name: '税区分なし科目', defaultTaxCategoryId: null },
      ],
    }))
    expect(result).not.toBeNull()
    expect(result!.taxCategory).toBeNull()
  })
})
