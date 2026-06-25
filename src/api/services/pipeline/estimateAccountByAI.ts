/**
 * estimateAccountByAI.ts — AI科目推定モジュール（第5層フォールバック）
 *
 * 目的: 第1〜4層（TS決定論的）で全層ミスした場合に、Gemini APIで科目を推定する。
 *
 * 設計原則（DL-008準拠）:
 *   - 第1〜4層が常に優先。本モジュールは最終フォールバックのみ
 *   - 科目マスタを選択肢として渡し、AIの回答を有効な科目IDに制約（ハルシネーション防止）
 *   - Structured Output（JSON Schema強制）でAI出力形式を固定
 *   - 画像は渡さない（摘要・取引先・方向のテキスト情報のみで推定。コスト倍増防止）
 *   - confidence < 0.3 → 棄却（insufficient維持）
 *
 * 移動元: 新設
 * 変更履歴:
 *   2026-06-25: 初版（段階A: 第5層AI推定追加）
 */

import { GoogleGenAI } from '@google/genai'

// ============================================================
// § 入力型
// ============================================================

/** AI科目推定の入力 */
export interface EstimateAccountInput {
  /** 摘要テキスト（line_item.description） */
  description: string
  /** AI抽出の取引先名（生テキスト） */
  vendorNameRaw: string | null
  /** 入出金方向 */
  direction: 'expense' | 'income'
  /** 証票種別 */
  sourceType: string | null
  /** 顧問先の科目マスタ（IDと名称の一覧。AIの選択肢を制約する） */
  accountMaster: { accountId: string; name: string; defaultTaxCategoryId?: string | null }[]
}

// ============================================================
// § 出力型
// ============================================================

/** AI科目推定の結果 */
export interface EstimateAccountResult {
  /** 推定科目ID（accountMasterのaccountIdのいずれか） */
  account: string
  /** 推定税区分ID（マスタのdefaultTaxCategoryIdから自動解決） */
  taxCategory: string | null
  /** 確信度（0.0〜1.0） */
  confidence: number
}

// ============================================================
// § Gemini API呼び出し
// ============================================================

/** AI応答の期待構造 */
interface AiResponseSchema {
  accountId: string
  confidence: number
}

/** 確信度しきい値。これ未満はinsufficient維持 */
const CONFIDENCE_THRESHOLD = 0.3

/**
 * AI科目推定メイン関数
 *
 * @param input - 推定に必要なテキスト情報 + 科目マスタ
 * @returns 推定成功時: EstimateAccountResult。失敗 or confidence < 0.3: null
 */
export async function estimateAccountByAI(
  input: EstimateAccountInput
): Promise<EstimateAccountResult | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      console.warn('[estimateAccountByAI] API鍵が未設定。AI推定スキップ')
      return null
    }

    // 科目マスタを選択肢テキストに変換
    const accountChoices = input.accountMaster
      .map(a => `- ${a.accountId}: ${a.name}`)
      .join('\n')

    const prompt = buildPrompt(input, accountChoices)

    const genai = new GoogleGenAI({ apiKey })
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object' as const,
          properties: {
            accountId: { type: 'string' as const, description: '推定科目ID（科目マスタのaccountIdのいずれか）' },
            confidence: { type: 'number' as const, description: '確信度（0.0〜1.0）' },
          },
          required: ['accountId', 'confidence'],
        },
      },
    })

    const text = response.text ?? ''
    if (!text) {
      console.warn('[estimateAccountByAI] AI応答が空')
      return null
    }

    const parsed: AiResponseSchema = JSON.parse(text)

    // バリデーション: 科目マスタに存在するIDか確認（ハルシネーション防止）
    const matchedAccount = input.accountMaster.find(
      a => a.accountId === parsed.accountId
    )
    if (!matchedAccount) {
      console.warn(`[estimateAccountByAI] AIが返した科目ID "${parsed.accountId}" はマスタに存在しない。棄却`)
      return null
    }

    // 確信度しきい値チェック
    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0
    if (confidence < CONFIDENCE_THRESHOLD) {
      console.log(`[estimateAccountByAI] 確信度 ${confidence.toFixed(2)} < ${CONFIDENCE_THRESHOLD}。棄却`)
      return null
    }

    return {
      account: matchedAccount.accountId,
      taxCategory: matchedAccount.defaultTaxCategoryId ?? null,
      confidence,
    }
  } catch (error) {
    console.error('[estimateAccountByAI] AI呼び出し失敗:', error)
    return null
  }
}

// ============================================================
// § プロンプト構築
// ============================================================

/**
 * AI科目推定用プロンプトを構築する
 */
function buildPrompt(
  input: EstimateAccountInput,
  accountChoices: string
): string {
  const vendorInfo = input.vendorNameRaw
    ? `取引先名: ${input.vendorNameRaw}`
    : '取引先名: 不明'
  const directionLabel = input.direction === 'expense' ? '支払（出金）' : '受取（入金）'
  const sourceInfo = input.sourceType
    ? `証票種別: ${input.sourceType}`
    : '証票種別: 不明'

  return `あなたは日本の会計・簿記の専門家です。
以下の取引情報から、最も適切な勘定科目を推定してください。

## 取引情報
- 摘要: ${input.description}
- ${vendorInfo}
- 入出金方向: ${directionLabel}
- ${sourceInfo}

## 選択可能な勘定科目（この中から1つ選んでください）
${accountChoices}

## 回答規則
- 上記の科目リストの accountId を1つ選んでください
- confidence は 0.0〜1.0 で回答してください（1.0 = 確実、0.0 = 全く分からない）
- 摘要や取引先名から科目を推定できない場合は confidence を低く設定してください`
}
