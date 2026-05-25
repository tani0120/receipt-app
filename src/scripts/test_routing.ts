/**
 * ルーティング採用可否テスト: 4モデル × 20ケース（新体系）
 *
 * 目的: AIがカタログを読んで自然言語→コマンド名に振り分けられるか
 * 判定:
 *   A: 正解率80%以上 → AIルーティング採用
 *   B: 80%未満 → UI選択に変更
 *
 * 実行: npx tsx src/scripts/test_routing.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { GoogleGenAI } from '@google/genai'

const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
]

// ━━ カタログ（7コマンド。新体系 2026-05-25） ━━
const CATALOG = `
MF全データ同期 — 事業者情報・科目・税区分・仕訳・取引先をMFから一括取込（常に3期分）
仕訳取得・確認 — 仕訳一覧の取得・検索・確認・過去同一取引の参照
仕訳投入 — 銀行明細・領収書から仕訳を作成してMFに投入
仕訳取消 — 投入済み仕訳を修正または削除
マスタ参照 — 取引先一覧・口座一覧・定期取引検出・仕訳ルール・中間勘定パターン
消込 — 売掛消込・買掛消込（売掛金/買掛金と入出金の突合）
財務分析 — PL/BS試算表・推移表・売上/経費ランキング・月次変動・概況分析
`.trim()

// ━━ テストケース ━━
interface TestCase {
  id: number
  input: string
  expected: string
  boundary?: string
}

const TEST_CASES: TestCase[] = [
  // 仕訳パイプライン
  { id: 1,  input: '今月の銀行明細を仕訳して',           expected: '仕訳投入' },
  { id: 2,  input: '領収書を処理して',                   expected: '仕訳投入' },
  { id: 3,  input: 'カード明細の仕訳を作って',           expected: '仕訳投入' },
  { id: 4,  input: '仕訳の確認をしたい',                 expected: '仕訳取得・確認' },
  { id: 5,  input: 'MFに登録して',                       expected: '仕訳投入' },
  { id: 6,  input: 'ドコモの仕訳を修正して',             expected: '仕訳取消' },
  // 消込・マスタ参照
  { id: 7,  input: '売掛金の消込状況は？',               expected: '消込' },
  { id: 8,  input: '仕訳のルールをまとめて',             expected: 'マスタ参照' },
  { id: 9,  input: 'この領収書と同じ過去の仕訳は？',     expected: '仕訳取得・確認', boundary: '仕訳投入 vs 仕訳取得・確認' },
  { id: 10, input: '毎月固定の支払いは？',               expected: 'マスタ参照' },
  // 財務分析
  { id: 11, input: '売上トップ10は？',                   expected: '財務分析' },
  { id: 12, input: '経費が多い取引先は？',               expected: '財務分析' },
  { id: 13, input: '先月と比べて増えた経費は？',         expected: '財務分析', boundary: '財務分析の月次変動 vs ランキング' },
  { id: 14, input: 'うちのビジネスモデルは？',           expected: '財務分析' },
  { id: 15, input: '取引先一覧を出して',                 expected: 'マスタ参照' },
  { id: 16, input: '給与の推移を見せて',                 expected: '財務分析' },
  { id: 17, input: '口座一覧',                           expected: 'マスタ参照' },
  { id: 18, input: '売上が増えた取引先は？',             expected: '財務分析' },
  { id: 19, input: 'MFからデータ取り込みたい',           expected: 'MF全データ同期' },
  // 拒否テスト
  { id: 20, input: '明日の天気を教えて',                 expected: 'unknown' },
]

// ━━ プロンプト ━━
const SYSTEM_PROMPT = `あなたは会計AIコマンドのルーターです。
ユーザーの入力から、実行すべきコマンドを判定してください。

コマンドカタログ:
${CATALOG}

回答はJSON形式でコマンド名のみ返してください:
{"command": "MF全データ同期"}

該当コマンドがない場合:
{"command": "unknown"}

JSON以外のテキストは一切含めないでください。`

// ━━ 実行 ━━
interface Result {
  model: string
  caseId: number
  input: string
  expected: string
  actual: string
  match: boolean
  durationMs: number
}

async function runOne(client: GoogleGenAI, model: string, tc: TestCase): Promise<Result> {
  const start = Date.now()

  const response = await client.models.generateContent({
    model,
    contents: tc.input,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
      responseMimeType: 'application/json',
    },
  })

  const durationMs = Date.now() - start
  const text = response.text?.trim() ?? '{}'

  let actual = 'ERROR'
  try {
    const parsed = JSON.parse(text)
    actual = parsed.command ?? 'ERROR'
  } catch {
    actual = `PARSE_ERROR: ${text.slice(0, 50)}`
  }

  return {
    model,
    caseId: tc.id,
    input: tc.input,
    expected: tc.expected,
    actual,
    match: actual === tc.expected,
    durationMs,
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY が未設定')
    process.exit(1)
  }

  const client = new GoogleGenAI({ apiKey: API_KEY })

  console.log('='.repeat(80))
  console.log('ルーティング採用可否テスト（新体系）')
  console.log(`${TEST_CASES.length}ケース × ${MODELS.length}モデル = ${TEST_CASES.length * MODELS.length}回`)
  console.log('判定: 正解率80%以上 → 採用 / 未満 → UI選択に変更')
  console.log('='.repeat(80))

  const allResults: Result[] = []

  for (const model of MODELS) {
    console.log(`\n${'━'.repeat(80)}`)
    console.log(`🤖 ${model}`)
    console.log('━'.repeat(80))

    for (const tc of TEST_CASES) {
      const r = await runOne(client, model, tc)
      allResults.push(r)

      const icon = r.match ? '✅' : '❌'
      const boundaryNote = tc.boundary ? ` [${tc.boundary}]` : ''
      console.log(
        `  ${icon} #${String(tc.id).padStart(2)} | ` +
        `期待:${r.expected} 実際:${r.actual} | ` +
        `${r.durationMs}ms | ` +
        `「${r.input}」${boundaryNote}`
      )
    }
  }

  // ━━ 最終サマリ ━━
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('最終サマリ')
  console.log('='.repeat(80))

  console.log('| モデル | 正解率 | 平均ms | 判定 |')
  console.log('|---|---|---|---|')

  for (const model of MODELS) {
    const mr = allResults.filter(r => r.model === model)
    const correct = mr.filter(r => r.match).length
    const total = mr.length
    const rate = Math.round(correct / total * 100)
    const avgMs = Math.round(mr.reduce((s, r) => s + r.durationMs, 0) / total)
    const verdict = rate >= 80 ? '✅ 採用可' : '❌ UI選択推奨'

    console.log(`| ${model} | ${correct}/${total} (${rate}%) | ${avgMs}ms | ${verdict} |`)
  }

  // ━━ 不正解詳細 ━━
  const failures = allResults.filter(r => !r.match)
  if (failures.length > 0) {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`不正解ケース詳細（${failures.length}件）`)
    console.log('─'.repeat(80))

    for (const f of failures) {
      const tc = TEST_CASES.find(t => t.id === f.caseId)!
      console.log(
        `  ❌ ${f.model} #${f.caseId} | ` +
        `期待:${f.expected} → 実際:${f.actual} | ` +
        `「${f.input}」${tc.boundary ? ` [${tc.boundary}]` : ''}`
      )
    }
  }

  // ━━ 最終判定 ━━
  const bestModel = MODELS.reduce((best, model) => {
    const rate = allResults.filter(r => r.model === model && r.match).length / TEST_CASES.length
    const bestRate = allResults.filter(r => r.model === best && r.match).length / TEST_CASES.length
    return rate > bestRate ? model : best
  })
  const bestRate = Math.round(allResults.filter(r => r.model === bestModel && r.match).length / TEST_CASES.length * 100)

  console.log(`\n${'='.repeat(80)}`)
  if (bestRate >= 80) {
    console.log(`🟢 結論A: AIルーティング採用可（${bestModel} ${bestRate}%）`)
  } else {
    console.log(`🔴 結論B: AIルーティング不可（最高${bestModel} ${bestRate}%）→ UI選択に変更`)
  }
  console.log('='.repeat(80))
}

main().catch(console.error)
