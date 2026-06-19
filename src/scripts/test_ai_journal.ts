/**
 * AI丸投げ仕訳推定テスト
 * MCP取得データ（勘定科目・過去仕訳）→ AIに仕訳を直接推定させる
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'
import { GoogleGenAI } from '@google/genai'

const TK = process.env['MF_TEST_TOKEN_KEY'] ?? ''
const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

async function main() {
  const ai = new GoogleGenAI({ apiKey: API_KEY })

  // 1. 勘定科目取得
  console.log('━━━ 勘定科目取得 ━━━')
  const accts = await callMcpTool('mfc_ca_getAccounts', {}, TK) as Record<string, unknown>
  const acctNames = ((accts.accounts || []) as Record<string, unknown>[])
    .filter((a: Record<string, unknown>) => a.available !== false)
    .map((a: Record<string, unknown>) => a.name)
  console.log(`  ${acctNames.length}件\n`)

  // 2. 過去仕訳取得
  console.log('━━━ 過去仕訳取得 ━━━')
  const js = await callMcpTool('mfc_ca_getJournals', {
    start_date: '2025-01-01', end_date: '2025-12-31', per_page: 500,
  }, TK) as Record<string, unknown>
  const journals = js.journals || []
  console.log(`  ${journals.length}件`)

  const pastLines: string[] = []
  for (const j of journals) {
    for (const b of j.branches) {
      pastLines.push(
        `${j.transaction_date} ${b.remark || '(なし)'} 借方:${b.debitor?.account_name || '?'} ¥${b.debitor?.value || 0} / 貸方:${b.creditor?.account_name || '?'} ¥${b.creditor?.value || 0}`
      )
    }
  }
  console.log(`  branch: ${pastLines.length}件\n`)

  // 3. OCRデータ
  const ocrItems = [
    { vendor: 'スギ薬局 瀬田店', amount: 690, type: 'レシート' },
    { vendor: '有限会社トラスティーサービス', amount: 21450, type: '請求書（受領）' },
    { vendor: '堺市', amount: 76000, type: '税金納付書' },
    { vendor: '近畿陸運協会 和泉支部', amount: 500, type: 'レシート' },
    { vendor: 'まんかい 天満橋店', amount: 2350, type: 'レシート（飲食）' },
    { vendor: 'ドトールコーヒー 東梅田店', amount: 590, type: 'レシート（飲食）' },
  ]

  // 4. AI仕訳推定
  console.log('━━━ AI仕訳推定（Gemini 2.5 Flash） ━━━\n')

  const prompt = `あなたは日本の会計事務所の経験豊富なスタッフです。
以下の情報をもとに、OCR読取データの仕訳を推定してください。

■ 使用可能な勘定科目:
${acctNames.join('、')}

■ 過去の確定仕訳（この事業者の実績。参考にすること）:
${pastLines.join('\n')}

■ 今回仕訳すべきOCR読取データ:
${ocrItems.map((o, i) => `${i + 1}. 取引先: ${o.vendor} / 金額: ¥${o.amount.toLocaleString()} / 証票種別: ${o.type}`).join('\n')}

■ 出力ルール:
- 勘定科目は上記リストから選ぶこと
- 過去仕訳に同一・類似の取引先があれば、その科目を最優先で採用
- レシートの貸方は基本「現金」
- 請求書（受領）の貸方は「未払金」
- 税金は「租税公課」が一般的
- 飲食のレシートは金額・用途で「会議費」「接待交際費」「福利厚生費」を使い分ける

JSON配列で出力:
\`\`\`json
[
  {
    "no": 1,
    "vendor": "取引先名",
    "amount": 金額,
    "debit_account": "借方勘定科目",
    "credit_account": "貸方勘定科目",
    "reasoning": "推定根拠",
    "confidence": "高/中/低",
    "past_match": "参照した過去仕訳の摘要（あれば。なければnull）"
  }
]
\`\`\``

  const startTime = Date.now()
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
  })
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const text = result.text ?? ''

  console.log(`応答時間: ${elapsed}秒\n`)
  console.log(text)
}

main().catch(e => {
  console.error('エラー:', e)
  process.exit(1)
})
