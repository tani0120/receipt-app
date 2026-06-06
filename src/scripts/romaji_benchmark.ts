/**
 * 勘定科目ローマ字変換ベンチマーク
 * Gemini 3モデルで変換結果を比較し、AI変換案との差異を検出する
 *
 * 実行: npx tsx src/scripts/romaji_benchmark.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { GoogleGenAI } from '@google/genai'
import * as fs from 'fs'

const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
] as const

const PROMPT = `あなたは日本語会計用語のローマ字変換エンジンです。

## 入力
勘定科目名（日本語）が与えられます。

## 出力
JSON配列で返してください。各要素は以下の形式です：
{"name": "元の科目名", "reading": "ふりがな（ひらがな）", "romaji": "ROMAJI"}

## 変換ルール（厳守）

1. ヘボン式ローマ字を使用する
   - し→SHI, ち→CHI, つ→TSU, ふ→FU, じ→JI
   - しゃ→SHA, しゅ→SHU, しょ→SHO
   - ちゃ→CHA, ちゅ→CHU, ちょ→CHO

2. 長音は省略しない（そのまま綴る）
   - おう→OU, うう→UU, おお→OO
   - 例：交通→KOUTSUU, 証券→SHOUKEN, 普通→FUTSUU

3. 単語区切りなし（全て一続きにする）
   - 例：旅費交通費→RYOHIKOUTSUUHI（アンダースコアなし）

4. 全て大文字

5. 撥音「ん」は常にN
   - ただしB/M/Pの前ではMではなくNのまま
   - 例：新聞→SHINBUN

6. 促音「っ」は子音を重ねる
   - 例：雑費→ZAPPI, 別途→BETTO

7. 「・」「（）」「(不動産)」等の記号・括弧内テキストは無視する（IDに含めない）
   - 例：保証金・敷金→HOSHOUKINSHIKIKIN
   - 例：損害保険料(不動産)→SONGAIHOKENRYOU

## 会計用語の読み注意
- 売掛金→うりかけきん
- 買掛金→かいかけきん
- 貸倒→かしだおれ
- 棚卸→たなおろし
- 繰延→くりのべ
- 減価償却→げんかしょうきゃく
- 剰余金→じょうよきん
- 租税公課→そぜいこうか
- 仕掛品→しかかりひん
- 元入金→もといれきん
- 事業主貸→じぎょうぬしかし
- 事業主借→じぎょうぬしかり
- 福利厚生費→ふくりこうせいひ
- 荷造運賃→にづくりうんちん
- 消耗品費→しょうもうひんひ
- 貯蔵品→ちょぞうひん
- 附属設備→ふぞくせつび
- 預託金→よたくきん

## 入力データ
以下の科目名をローマ字変換してください。JSON配列のみを返してください：
`

interface RomajiResult {
  name: string
  reading: string
  romaji: string
}

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  names: string[]
): Promise<RomajiResult[]> {
  const input = PROMPT + '\n' + names.map(n => `- ${n}`).join('\n')

  const result = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = result.text ?? ''
  try {
    return JSON.parse(text)
  } catch {
    console.error(`[${model}] JSONパースエラー。先頭200文字:`, text.slice(0, 200))
    return []
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY が未設定（.env.local を確認）')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY })

  // 全科目名を取得（重複排除）
  const accounts = JSON.parse(fs.readFileSync('data/account-master.json', 'utf8'))
  const uniqueNames = [...new Set(accounts.map((a: { name: string }) => a.name))] as string[]
  console.log(`\n━━━ 勘定科目ローマ字変換ベンチマーク ━━━`)
  console.log(`  科目数: ${accounts.length}件（ユニーク名: ${uniqueNames.length}件）`)
  console.log(`  モデル: ${MODELS.join(', ')}\n`)

  // 各モデルで変換
  const results: Record<string, RomajiResult[]> = {}

  for (const model of MODELS) {
    console.log(`▶ ${model} 呼び出し中...`)
    const startTime = Date.now()
    try {
      results[model] = await callGemini(ai, model, uniqueNames)
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  ✅ ${results[model].length}件 (${elapsed}秒)\n`)
    } catch (err) {
      console.error(`  ❌ エラー: ${err}\n`)
      results[model] = []
    }
  }

  // 結果比較
  console.log(`\n━━━ モデル間差異 ━━━\n`)
  const nameToResults: Record<string, Record<string, string>> = {}

  for (const model of MODELS) {
    for (const r of results[model]) {
      if (!nameToResults[r.name]) nameToResults[r.name] = {}
      nameToResults[r.name][model] = r.romaji
    }
  }

  let diffCount = 0
  const diffLines: string[] = []

  for (const name of uniqueNames) {
    const mr = nameToResults[name]
    if (!mr) continue

    const values = MODELS.map(m => mr[m] ?? '(未出力)')
    const allSame = values.every(v => v === values[0])

    if (!allSame) {
      diffCount++
      diffLines.push(`\n  ${name}:`)
      for (const model of MODELS) {
        diffLines.push(`    ${model.padEnd(30)} → ${mr[model] ?? '(未出力)'}`)
      }
    }
  }

  if (diffCount === 0) {
    console.log('  全モデル一致 ✅')
  } else {
    console.log(`  差異: ${diffCount}件`)
    diffLines.forEach(l => console.log(l))
  }

  // 結果をファイルに出力
  const outputPath = 'data/romaji_benchmark_results.json'
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    models: MODELS,
    uniqueNames: uniqueNames.length,
    results,
    diffCount,
  }, null, 2), 'utf8')
  console.log(`\n結果を ${outputPath} に保存しました`)
}

main().catch(e => {
  console.error('エラー:', e)
  process.exit(1)
})
