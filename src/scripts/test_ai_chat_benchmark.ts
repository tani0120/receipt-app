/**
 * 層2 AIチャット ベンチマークテスト
 *
 * 目的: 3モデル × 2 thinking設定 = 6パターンで
 *       コマンド提案精度・自由回答品質・コスト・速度を比較
 *
 * 実行: npx tsx src/scripts/test_ai_chat_benchmark.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { getLayer2SystemPrompt, estimatePromptTokens } from '../api/services/aiContextProvider'


const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

// ===== 比較対象 =====
const MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
] as const

const THINKING_LEVELS = ['low', 'medium'] as const

// ===== 料金テーブル（$/100万トークン）2026年5月公式 =====
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.5-flash':       { input: 1.50, output: 9.00 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50 },
}
const USD_JPY = 150

// ===== テストケース =====
interface TestCase {
  id: number
  input: string
  expectedMode: 'suggest' | 'answer'
  /** suggestモード時、期待するコマンドIDの候補（1つでも含まれれば正解） */
  expectedCommands?: string[]
  /** answerモード時、回答に含まれるべきキーワード */
  expectedKeywords?: string[]
  カテゴリ: 'コマンド提案' | '自由質問'
}

const TEST_CASES: TestCase[] = [
  // ===== コマンド提案テスト =====
  {
    id: 1, input: '科目の一覧を見たい',
    expectedMode: 'suggest', expectedCommands: ['mf_sync_all'],
    カテゴリ: 'コマンド提案',
  },
  {
    id: 2, input: '売上のランキングを出して',
    expectedMode: 'suggest', expectedCommands: ['financial_analysis'],
    カテゴリ: 'コマンド提案',
  },
  {
    id: 3, input: 'MFからデータを取り込みたい',
    expectedMode: 'suggest', expectedCommands: ['mf_sync_all'],
    カテゴリ: 'コマンド提案',
  },
  {
    id: 4, input: '仕訳をMFに送りたい',
    expectedMode: 'suggest', expectedCommands: ['journal_write'],
    カテゴリ: 'コマンド提案',
  },
  {
    id: 5, input: '先月の経費が高い科目は？',
    expectedMode: 'suggest', expectedCommands: ['financial_analysis'],
    カテゴリ: 'コマンド提案',
  },

  // ===== 自由質問テスト =====
  {
    id: 6, input: 'まず何をすればいい？',
    expectedMode: 'answer', expectedKeywords: ['MF', '連携', 'データ', '同期', 'mf_sync_all'],
    カテゴリ: '自由質問',
  },
  {
    id: 7, input: '3コードとは何ですか？',
    expectedMode: 'answer', expectedKeywords: ['3', '文字', '顧問先', '識別'],
    カテゴリ: '自由質問',
  },
  {
    id: 8, input: '仕訳をMFに送る手順を教えて',
    expectedMode: 'answer', expectedKeywords: ['確認', '承認', '投入', 'journal'],
    カテゴリ: '自由質問',
  },
  {
    id: 9, input: '免税事業者の場合、何が違う？',
    expectedMode: 'answer', expectedKeywords: ['免税', 'invoice_kind', '不要', '除去'],
    カテゴリ: '自由質問',
  },
  {
    id: 10, input: 'この顧問先の消費税の判断をしてほしい',
    expectedMode: 'answer', expectedKeywords: ['税理士', '確認'],
    カテゴリ: '自由質問',
  },
]

// ===== 実行結果 =====
interface BenchmarkResult {
  モデル: string
  thinking: string
  ケースID: number
  カテゴリ: string
  入力: string
  期待モード: string
  実際モード: string
  モード正解: boolean
  コマンド正解: boolean | null
  キーワード正解: boolean | null
  入力トークン: number
  出力トークン: number
  合計トークン: number
  コスト円: number
  応答時間ms: number
  回答抜粋: string
}

// ===== メイン =====
async function main() {
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY が未設定')
    process.exit(1)
  }

  const client = new GoogleGenAI({ apiKey: API_KEY })
  const systemPrompt = getLayer2SystemPrompt()
  const estimatedTokens = estimatePromptTokens()

  console.log('='.repeat(100))
  console.log('層2 AIチャット ベンチマークテスト')
  console.log(`${MODELS.length}モデル × ${THINKING_LEVELS.length} thinking = ${MODELS.length * THINKING_LEVELS.length}パターン`)
  console.log(`テストケース: ${TEST_CASES.length}件（コマンド提案5件 + 自由質問5件）`)
  console.log(`システムプロンプト推定: ${estimatedTokens}トークン`)
  console.log('='.repeat(100))

  const allResults: BenchmarkResult[] = []

  for (const model of MODELS) {
    for (const thinking of THINKING_LEVELS) {
      console.log(`\n${'━'.repeat(100)}`)
      console.log(`🤖 ${model} / thinking=${thinking}`)
      console.log('━'.repeat(100))

      for (const tc of TEST_CASES) {
        const start = Date.now()

        try {
          const response = await client.models.generateContent({
            model,
            contents: `ユーザー入力: 「${tc.input}」\n顧問先: TEST_CLIENT`,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingLevel: thinking === 'low' ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM },
            },
          })

          const durationMs = Date.now() - start
          const text = response.text?.trim() ?? '{}'

          let parsed: Record<string, unknown> = {}
          try {
            parsed = JSON.parse(text)
          } catch {
            parsed = { mode: 'error', answer: text.slice(0, 100) }
          }

          // トークン使用量
          const inputTokens = response.usageMetadata?.promptTokenCount ?? 0
          const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0
          const totalTokens = response.usageMetadata?.totalTokenCount ?? 0

          // コスト計算
          const pricing = PRICING[model] ?? { input: 0, output: 0 }
          const costUsd = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
          const costJpy = costUsd * USD_JPY

          // モード判定
          const actualMode = String(parsed.mode ?? 'unknown')
          const modeCorrect = actualMode === tc.expectedMode

          // コマンド正解判定
          let commandCorrect: boolean | null = null
          if (tc.expectedMode === 'suggest' && tc.expectedCommands) {
            const suggestions = parsed.suggestions ?? []
            const actualCommands = (suggestions as Array<Record<string, unknown>>).map((s) => s.command)
            commandCorrect = tc.expectedCommands.some(ec => actualCommands.includes(ec))
          }

          // キーワード正解判定
          let keywordCorrect: boolean | null = null
          if (tc.expectedMode === 'answer' && tc.expectedKeywords) {
            const answerText = String(parsed.answer ?? '') + String(parsed.supplement ?? '')
            keywordCorrect = tc.expectedKeywords.some(kw =>
              answerText.includes(kw)
            )
          }

          // 回答抜粋
          let snippet = ''
          if (actualMode === 'suggest') {
            const cmds = ((parsed.suggestions ?? []) as Array<Record<string, unknown>>).map((s) => s.command).join(', ')
            snippet = `候補: [${cmds}]`
          } else if (actualMode === 'answer') {
            snippet = String(parsed.answer ?? '').slice(0, 80)
          } else {
            snippet = text.slice(0, 80)
          }

          const result: BenchmarkResult = {
            モデル: model,
            thinking,
            ケースID: tc.id,
            カテゴリ: tc.カテゴリ,
            入力: tc.input,
            期待モード: tc.expectedMode,
            実際モード: actualMode,
            モード正解: modeCorrect,
            コマンド正解: commandCorrect,
            キーワード正解: keywordCorrect,
            入力トークン: inputTokens,
            出力トークン: outputTokens,
            合計トークン: totalTokens,
            コスト円: Math.round(costJpy * 10000) / 10000,
            応答時間ms: durationMs,
            回答抜粋: snippet,
          }

          allResults.push(result)

          const modeIcon = modeCorrect ? '✅' : '❌'
          const accIcon = (commandCorrect ?? keywordCorrect ?? false) ? '✅' : '❌'
          console.log(
            `  ${modeIcon}${accIcon} #${String(tc.id).padStart(2)} | ` +
            `${tc.カテゴリ} | ${durationMs}ms | ` +
            `入${inputTokens} 出${outputTokens} ¥${result.コスト円} | ` +
            `${snippet}`
          )

        } catch (err) {
          const durationMs = Date.now() - start
          const message = err instanceof Error ? err.message : String(err)
          console.log(`  ❌❌ #${String(tc.id).padStart(2)} | エラー: ${message.slice(0, 60)} | ${durationMs}ms`)

          allResults.push({
            モデル: model,
            thinking,
            ケースID: tc.id,
            カテゴリ: tc.カテゴリ,
            入力: tc.input,
            期待モード: tc.expectedMode,
            実際モード: 'error',
            モード正解: false,
            コマンド正解: null,
            キーワード正解: null,
            入力トークン: 0,
            出力トークン: 0,
            合計トークン: 0,
            コスト円: 0,
            応答時間ms: durationMs,
            回答抜粋: `ERROR: ${message.slice(0, 60)}`,
          })
        }
      }
    }
  }

  // ===== 最終サマリ =====
  console.log(`\n\n${'='.repeat(100)}`)
  console.log('最終サマリ')
  console.log('='.repeat(100))

  console.log('| モデル | thinking | モード正解 | コマンド正解 | キーワード正解 | 平均ms | 平均入tok | 平均出tok | 平均¥/回 |')
  console.log('|---|---|---|---|---|---|---|---|---|')

  for (const model of MODELS) {
    for (const thinking of THINKING_LEVELS) {
      const results = allResults.filter(r => r.モデル === model && r.thinking === thinking)
      const total = results.length

      const modeCorrect = results.filter(r => r.モード正解).length
      const cmdResults = results.filter(r => r.コマンド正解 !== null)
      const cmdCorrect = cmdResults.filter(r => r.コマンド正解).length
      const kwResults = results.filter(r => r.キーワード正解 !== null)
      const kwCorrect = kwResults.filter(r => r.キーワード正解).length

      const avgMs = Math.round(results.reduce((s, r) => s + r.応答時間ms, 0) / total)
      const avgInput = Math.round(results.reduce((s, r) => s + r.入力トークン, 0) / total)
      const avgOutput = Math.round(results.reduce((s, r) => s + r.出力トークン, 0) / total)
      const avgCost = Math.round(results.reduce((s, r) => s + r.コスト円, 0) / total * 10000) / 10000

      console.log(
        `| ${model} | ${thinking} | ` +
        `${modeCorrect}/${total} | ` +
        `${cmdCorrect}/${cmdResults.length} | ` +
        `${kwCorrect}/${kwResults.length} | ` +
        `${avgMs}ms | ${avgInput} | ${avgOutput} | ¥${avgCost} |`
      )
    }
  }

  // ===== 不正解ケース =====
  const failures = allResults.filter(r => !r.モード正解 || r.コマンド正解 === false || r.キーワード正解 === false)
  if (failures.length > 0) {
    console.log(`\n${'─'.repeat(100)}`)
    console.log(`不正解ケース詳細（${failures.length}件）`)
    console.log('─'.repeat(100))

    for (const f of failures) {
      console.log(
        `  ❌ ${f.モデル}/${f.thinking} #${f.ケースID} | ` +
        `モード:${f.期待モード}→${f.実際モード} | ` +
        `「${f.入力}」→ ${f.回答抜粋}`
      )
    }
  }

  // ===== コスト比較 =====
  console.log(`\n${'─'.repeat(100)}`)
  console.log('月次コスト試算（月100回利用想定）')
  console.log('─'.repeat(100))

  for (const model of MODELS) {
    for (const thinking of THINKING_LEVELS) {
      const results = allResults.filter(r => r.モデル === model && r.thinking === thinking)
      const avgCost = results.reduce((s, r) => s + r.コスト円, 0) / results.length
      const monthlyCost = Math.round(avgCost * 100)
      console.log(`  ${model} / ${thinking}: ¥${avgCost.toFixed(4)}/回 → ¥${monthlyCost}/月`)
    }
  }

  console.log(`\n${'='.repeat(100)}`)
  console.log('テスト完了')
  console.log('='.repeat(100))
}

main().catch(console.error)
