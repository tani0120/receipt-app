/**
 * AIコマンド モデル比較テスト
 *
 * テストケース:
 *   1. 事業者情報の差分（すぐする vs MF）
 *   2. MFデータから2026年度の年間損益計画
 *
 * 対象モデル: 4モデル × 2テストケース = 8回実行
 *
 * 実行: npx tsx src/scripts/ai_command_model_test.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { GoogleGenAI } from '@google/genai'
import { resolveLocation } from '../api/ai/AIProviderFactory'
import { MODEL_PRICING, USD_JPY_RATE } from '../api/ai/modelConfig'
import { mcpFetchCurrentOffice } from '../api/services/mfMcpClient'
import { callMcpTool } from '../api/services/mfMcpClient'
import { readFileSync } from 'fs'
import { join } from 'path'

// ============================================================
// 設定
// ============================================================

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
]

/** テスト対象の顧問先ID */
const CLIENT_ID = process.env['MF_TEST_TOKEN_KEY'] ?? ''

/** MF認証のトークンキー（mfAuthServiceで保存時のキー） */
const TOKEN_KEY = CLIENT_ID

// ============================================================
// sugu-sru側クライアントデータ取得
// ============================================================

function getSuguSruClient(clientId: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'clients.json'), 'utf-8')
    const clients = JSON.parse(raw) as Array<Record<string, unknown>>
    return clients.find(c => c.clientId === clientId) ?? null
  } catch {
    return null
  }
}

// ============================================================
// Gemini呼び出し（Function Callingなし。データ+プロンプトで応答生成）
// ============================================================

interface TestResult {
  モデル: string
  テストケース: string
  応答: string
  速度_秒: number
  入力トークン: number
  出力トークン: number
  思考トークン: number
  合計トークン: number
  コスト円: number
  エラー: string | null
}

async function callGemini(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{
  text: string
  durationMs: number
  promptTokens: number
  completionTokens: number
  thinkingTokens: number
}> {
  const projectId = process.env.GCP_PROJECT_ID ?? ''
  const location = resolveLocation(modelId)

  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location,
  })

  const start = Date.now()

  const result = await ai.models.generateContent({
    model: modelId,
    contents: [
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
    config: {
      systemInstruction: systemPrompt,
    },
  })

  const durationMs = Date.now() - start
  const text = result.text ?? ''

  const usage = result.usageMetadata
  const promptTokens = usage?.promptTokenCount ?? 0
  const completionTokens = usage?.candidatesTokenCount ?? 0
  const thinkingTokens = usage?.thoughtsTokenCount ?? 0

  return { text, durationMs, promptTokens, completionTokens, thinkingTokens }
}

// ============================================================
// テストケース1: 事業者情報の差分
// ============================================================

async function testCase1_事業者情報差分(modelId: string): Promise<TestResult> {
  console.log(`\n📋 [テスト1] ${modelId} — 事業者情報差分`)

  // 1. MFから事業者情報を取得
  console.log('  → MCPから事業者情報を取得中...')
  let mfOffice: unknown
  try {
    mfOffice = await mcpFetchCurrentOffice(TOKEN_KEY)
    console.log('  ✅ MFデータ取得完了')
  } catch (e) {
    const errMsg = (e as Error).message
    console.error('  ❌ MFデータ取得失敗:', errMsg)
    return {
      モデル: modelId,
      テストケース: '事業者情報差分',
      応答: '',
      速度_秒: 0,
      入力トークン: 0,
      出力トークン: 0,
      思考トークン: 0,
      合計トークン: 0,
      コスト円: 0,
      エラー: `MCP取得失敗: ${errMsg}`,
    }
  }

  // 2. sugu-sru側のクライアント情報を取得
  const suguClient = getSuguSruClient(CLIENT_ID)
  if (!suguClient) {
    return {
      モデル: modelId,
      テストケース: '事業者情報差分',
      応答: '',
      速度_秒: 0,
      入力トークン: 0,
      出力トークン: 0,
      思考トークン: 0,
      合計トークン: 0,
      コスト円: 0,
      エラー: 'sugu-sruクライアント未検出',
    }
  }

  // 3. Geminiに比較させる
  const systemPrompt = `あなたは会計事務所の業務支援AIです。日本語で丁寧に回答してください。
テーブル形式で差分を分かりやすく整理し、不一致がある項目は ⚠️ マークをつけてください。
想像・推測は禁止。データにないことは「不明」と回答してください。`

  const userPrompt = `以下の2つのデータソースを比較し、事業者情報の差分を分析してください。

## すぐする（社内管理データ）
${JSON.stringify(suguClient, null, 2)}

## マネーフォワード（MCP経由取得）
${JSON.stringify(mfOffice, null, 2)}

比較すべき項目:
- 事業者名
- 事業者種別（個人/法人）
- 決算月
- 業種
- 課税方式
- 会計期間
- その他の不一致項目

テーブル形式で「項目 | すぐする | MF | 一致/不一致」で出力してください。`

  try {
    const { text, durationMs, promptTokens, completionTokens, thinkingTokens } =
      await callGemini(modelId, systemPrompt, userPrompt)

    const price = MODEL_PRICING[modelId]!
    const costYen = (
      (promptTokens * price.input / 1_000_000) +
      (completionTokens * price.output / 1_000_000) +
      (thinkingTokens * price.thinking / 1_000_000)
    ) * USD_JPY_RATE

    console.log(`  ✅ 完了 ${(durationMs / 1000).toFixed(1)}秒 ¥${costYen.toFixed(2)}`)

    return {
      モデル: modelId,
      テストケース: '事業者情報差分',
      応答: text,
      速度_秒: Math.round(durationMs / 100) / 10,
      入力トークン: promptTokens,
      出力トークン: completionTokens,
      思考トークン: thinkingTokens,
      合計トークン: promptTokens + completionTokens + thinkingTokens,
      コスト円: Math.round(costYen * 100) / 100,
      エラー: null,
    }
  } catch (e) {
    const errMsg = (e as Error).message
    console.error(`  ❌ Gemini呼出失敗:`, errMsg)
    return {
      モデル: modelId,
      テストケース: '事業者情報差分',
      応答: '',
      速度_秒: 0,
      入力トークン: 0,
      出力トークン: 0,
      思考トークン: 0,
      合計トークン: 0,
      コスト円: 0,
      エラー: errMsg,
    }
  }
}

// ============================================================
// テストケース2: 年間損益計画
// ============================================================

async function testCase2_年間損益計画(modelId: string): Promise<TestResult> {
  console.log(`\n📋 [テスト2] ${modelId} — 年間損益計画`)

  // 1. MFからPL推移表を取得
  console.log('  → MCPからPL推移表を取得中...')
  let plData: unknown
  try {
    plData = await callMcpTool(
      'mfc_ca_getReportsTransitionProfitLoss',
      { fiscal_year: 2025 },
      TOKEN_KEY,
    )
    console.log('  ✅ PLデータ取得完了')
  } catch (e) {
    const errMsg = (e as Error).message
    console.error('  ❌ PLデータ取得失敗:', errMsg)

    // フォールバック: BS推移表を試す
    try {
      console.log('  → フォールバック: PL試算表を取得中...')
      plData = await callMcpTool(
        'mfc_ca_getReportsTrialBalanceProfitLoss',
        { fiscal_year: 2025 },
        TOKEN_KEY,
      )
      console.log('  ✅ PL試算表で代替取得完了')
    } catch (e2) {
      return {
        モデル: modelId,
        テストケース: '年間損益計画',
        応答: '',
        速度_秒: 0,
        入力トークン: 0,
        出力トークン: 0,
        思考トークン: 0,
        合計トークン: 0,
        コスト円: 0,
        エラー: `MCP取得失敗: ${errMsg} / フォールバック: ${(e2 as Error).message}`,
      }
    }
  }

  // 2. Geminiに分析させる
  const systemPrompt = `あなたは税理士事務所の経営分析AIです。日本語で丁寧に回答してください。
顧問先の損益データに基づき、実績と今後の見通しを分析してください。
想像・推測は禁止。データに基づく分析のみ行ってください。
根拠は具体的な数字で示してください。`

  const userPrompt = `以下はテスト個人（飲食業・個人事業主）のマネーフォワード上の損益データです。

## PL（損益計算書）データ
${JSON.stringify(plData, null, 2)}

これに基づいて以下を回答してください:

### ①今期予想（2026年度）
- 年間売上高の予想
- 年間経費の予想
- 年間利益の予想

### ②根拠
- 過去実績のトレンド分析
- 季節変動があれば指摘
- 特異値（異常な月）があれば指摘
- リスク要因

テーブル形式で月別推移を含めて出力してください。`

  try {
    const { text, durationMs, promptTokens, completionTokens, thinkingTokens } =
      await callGemini(modelId, systemPrompt, userPrompt)

    const price = MODEL_PRICING[modelId]!
    const costYen = (
      (promptTokens * price.input / 1_000_000) +
      (completionTokens * price.output / 1_000_000) +
      (thinkingTokens * price.thinking / 1_000_000)
    ) * USD_JPY_RATE

    console.log(`  ✅ 完了 ${(durationMs / 1000).toFixed(1)}秒 ¥${costYen.toFixed(2)}`)

    return {
      モデル: modelId,
      テストケース: '年間損益計画',
      応答: text,
      速度_秒: Math.round(durationMs / 100) / 10,
      入力トークン: promptTokens,
      出力トークン: completionTokens,
      思考トークン: thinkingTokens,
      合計トークン: promptTokens + completionTokens + thinkingTokens,
      コスト円: Math.round(costYen * 100) / 100,
      エラー: null,
    }
  } catch (e) {
    const errMsg = (e as Error).message
    console.error(`  ❌ Gemini呼出失敗:`, errMsg)
    return {
      モデル: modelId,
      テストケース: '年間損益計画',
      応答: '',
      速度_秒: 0,
      入力トークン: 0,
      出力トークン: 0,
      思考トークン: 0,
      合計トークン: 0,
      コスト円: 0,
      エラー: errMsg,
    }
  }
}

// ============================================================
// メイン
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  AIコマンド モデル比較テスト')
  console.log(`  クライアント: ${CLIENT_ID}（テスト個人）`)
  console.log('  テストケース: 2件 × モデル: 4件 = 8回実行')
  console.log('═══════════════════════════════════════════════')

  const allResults: TestResult[] = []

  // テストケース1: 事業者情報差分（全モデル）
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('テストケース1: 事業者情報差分（すぐする vs MF）')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (const model of MODELS) {
    const result = await testCase1_事業者情報差分(model)
    allResults.push(result)
  }

  // テストケース2: 年間損益計画（全モデル）
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('テストケース2: MFデータから2026年度年間損益計画')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (const model of MODELS) {
    const result = await testCase2_年間損益計画(model)
    allResults.push(result)
  }

  // ============================================================
  // 結果サマリー
  // ============================================================

  console.log('\n\n═══════════════════════════════════════════════')
  console.log('  結果サマリー')
  console.log('═══════════════════════════════════════════════\n')

  // メトリクス比較テーブル
  console.log('▼ メトリクス比較')
  console.log('┌─────────────────────────┬────────────────────┬────────┬──────────┬──────────┬──────────┬────────┐')
  console.log('│ モデル                  │ テストケース       │ 速度   │ 入力     │ 出力     │ 思考     │ コスト │')
  console.log('├─────────────────────────┼────────────────────┼────────┼──────────┼──────────┼──────────┼────────┤')

  for (const r of allResults) {
    if (r.エラー) {
      console.log(`│ ${r.モデル.padEnd(23)} │ ${r.テストケース.padEnd(18)} │ ❌ エラー: ${r.エラー.slice(0, 40)}`)
    } else {
      console.log(
        `│ ${r.モデル.padEnd(23)} │ ${r.テストケース.padEnd(18)} │ ${String(r.速度_秒 + '秒').padStart(6)} │ ${String(r.入力トークン).padStart(8)} │ ${String(r.出力トークン).padStart(8)} │ ${String(r.思考トークン).padStart(8)} │ ¥${String(r.コスト円).padStart(5)} │`
      )
    }
  }
  console.log('└─────────────────────────┴────────────────────┴────────┴──────────┴──────────┴──────────┴────────┘')

  // 各応答の全文出力
  console.log('\n\n▼ 応答全文')
  for (const r of allResults) {
    console.log(`\n${'━'.repeat(60)}`)
    console.log(`【${r.モデル}】 ${r.テストケース}`)
    console.log(`速度: ${r.速度_秒}秒 | トークン: ${r.合計トークン} | コスト: ¥${r.コスト円}`)
    console.log(`${'━'.repeat(60)}`)
    if (r.エラー) {
      console.log(`❌ エラー: ${r.エラー}`)
    } else {
      console.log(r.応答)
    }
  }

  // JSON全量保存
  const outputPath = join(process.cwd(), 'data', 'test-results', 'ai_command_model_test.json')
  const { mkdirSync: mkdir, writeFileSync: writeFile } = await import('fs')
  const dir = join(process.cwd(), 'data', 'test-results')
  try { mkdir(dir, { recursive: true }) } catch { /* ok */ }
  writeFile(outputPath, JSON.stringify(allResults, null, 2), 'utf-8')
  console.log(`\n📁 全結果JSON保存: ${outputPath}`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
