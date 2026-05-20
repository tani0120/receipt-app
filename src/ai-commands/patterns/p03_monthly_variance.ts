/**
 * パターン #3: 月次変動科目（摘要付き + 理由推定）
 *
 * 1. PL推移表で異常検出（±50%、乖離額 > 年商1%）
 * 2. getJournals全件 → 異常科目×月の仕訳から摘要抽出
 * 3. gemini-3.5-flashで理由推定
 *
 * 実行: npx tsx src/ai-commands/patterns/p03_monthly_variance.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../../api/services/mfMcpClient'
import { GoogleGenAI } from '@google/genai'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''
const GEMINI_KEY = process.env['GEMINI_API_KEY'] ?? ''

interface TransitionRow {
  name: string
  type: string
  values: number[]
  rows?: TransitionRow[]
}
interface TransitionResponse {
  columns: string[]
  rows: TransitionRow[]
  start_date: string
  end_date: string
}
interface Branch {
  debitor?: { account_id: string; value: number }
  creditor?: { account_id: string; value: number }
  remark: string
}
interface Journal {
  transaction_date: string
  branches: Branch[]
}
interface JournalsResponse {
  journals: Journal[]
  metadata: { total_count: number; total_pages: number }
}
interface AccountItem {
  id: string
  name: string
  account_group: string
}

function flattenRows(rows: TransitionRow[], depth = 0): Array<{ name: string; depth: number; values: number[]; type: string }> {
  const result: Array<{ name: string; depth: number; values: number[]; type: string }> = []
  for (const row of rows) {
    result.push({ name: row.name, depth, values: row.values, type: row.type })
    if (row.rows?.length) {
      result.push(...flattenRows(row.rows, depth + 1))
    }
  }
  return result
}

async function main() {
  const THRESHOLD = 0.50
  const REVENUE_THRESHOLD_RATE = 0.01  // 年商1%

  console.log('═══════════════════════════════════════════════')
  console.log('  パターン #3: 摘要付き月次変動 + 理由推定')
  console.log('  gemini-3.5-flash / 2025年度')
  console.log('═══════════════════════════════════════════════\n')

  // ① PL推移表取得
  console.log('▼ Step 1: PL推移表')
  const plData = await callMcpTool<TransitionResponse>(
    'mfc_ca_getReportsTransitionProfitLoss',
    { fiscal_year: 2025, type: 'monthly' },
    TOKEN_KEY
  )

  // 月次列特定
  const monthIndices: number[] = []
  const monthLabels: string[] = []
  for (let i = 0; i < plData.columns.length; i++) {
    const col = plData.columns[i]!
    if (/^\d{1,2}$/.test(col)) {
      monthIndices.push(i)
      monthLabels.push(`${col}月`)
    }
  }

  // 年商算出（売上高合計行のtotal列）
  const totalColIdx = plData.columns.indexOf('total')
  const revenueRow = flattenRows(plData.rows).find(r => r.name === '売上高合計')
  const annualRevenue = revenueRow ? revenueRow.values[totalColIdx]! : 0
  const amountThreshold = annualRevenue * REVENUE_THRESHOLD_RATE
  console.log(`  年商: ¥${annualRevenue.toLocaleString()}`)
  console.log(`  乖離額下限（年商1%）: ¥${Math.round(amountThreshold).toLocaleString()}`)

  // 異常検出
  const accountRows = flattenRows(plData.rows).filter(r => r.type === 'account')
  const anomalies: Array<{
    name: string; month: string; monthNum: number; value: number
    avg: number; diffAmount: number; diffRate: number
  }> = []

  for (const row of accountRows) {
    const monthlyValues = monthIndices.map(i => row.values[i]!)
    const nonZero = monthlyValues.filter(v => v !== 0)
    if (nonZero.length < 3) continue
    const avg = nonZero.reduce((s, v) => s + v, 0) / nonZero.length

    for (let mi = 0; mi < monthIndices.length; mi++) {
      const v = monthlyValues[mi]!
      if (v === 0) continue
      const diffRate = (v - avg) / Math.abs(avg)
      const diffAmount = v - Math.round(avg)
      if (Math.abs(diffRate) >= THRESHOLD && Math.abs(diffAmount) >= amountThreshold) {
        anomalies.push({
          name: row.name, month: monthLabels[mi]!,
          monthNum: mi + 1, value: v,
          avg: Math.round(avg), diffAmount, diffRate,
        })
      }
    }
  }

  anomalies.sort((a, b) => Math.abs(b.diffAmount) - Math.abs(a.diffAmount))
  const top10 = anomalies.slice(0, 10)
  console.log(`  異常検出: ${anomalies.length}件（±${THRESHOLD * 100}% AND 乖離額>¥${Math.round(amountThreshold).toLocaleString()}）`)

  if (top10.length === 0) {
    console.log('\n  ✅ 条件を満たす変動なし')
    return
  }

  // ② 全仕訳取得
  console.log('\n▼ Step 2: 全仕訳取得（摘要抽出用）')
  const allJournals: Journal[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    if (page > 1) await new Promise(r => setTimeout(r, 500))
    const data = await callMcpTool<JournalsResponse>(
      'mfc_ca_getJournals',
      { start_date: '2025-01-01', end_date: '2025-12-31', per_page: 100, page },
      TOKEN_KEY
    )
    allJournals.push(...data.journals)
    totalPages = data.metadata.total_pages
    page++
  }
  console.log(`  全仕訳: ${allJournals.length}件`)

  // 科目名→ID マッピング
  const accountData = await callMcpTool<{ accounts: AccountItem[] }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )
  const accountNameToIds = new Map<string, Set<string>>()
  for (const a of accountData.accounts) {
    const existing = accountNameToIds.get(a.name) ?? new Set()
    existing.add(a.id)
    accountNameToIds.set(a.name, existing)
  }

  // ③ 異常科目×月の摘要抽出
  console.log('\n▼ Step 3: 摘要抽出')
  const results: Array<{
    name: string; month: string; value: number; avg: number
    diffAmount: number; diffRate: number; allRemarks: string; journalCount: number
  }> = []

  for (const a of top10) {
    const accountIds = accountNameToIds.get(a.name)
    if (!accountIds) {
      results.push({ ...a, allRemarks: '（科目ID不明）', journalCount: 0 })
      continue
    }

    // 該当月の仕訳をフィルタ
    const monthStr = a.monthNum.toString().padStart(2, '0')
    const monthJournals = allJournals.filter(j => {
      const jMonth = j.transaction_date.substring(5, 7)
      if (jMonth !== monthStr) return false
      return j.branches.some(b =>
        accountIds.has(b.debitor?.account_id ?? '') || accountIds.has(b.creditor?.account_id ?? '')
      )
    })

    // 全摘要を収集（金額付き）
    const remarkList: Array<{ remark: string; amount: number }> = []
    for (const j of monthJournals) {
      for (const b of j.branches) {
        if (accountIds.has(b.debitor?.account_id ?? '') || accountIds.has(b.creditor?.account_id ?? '')) {
          const remark = (b.remark ?? '').trim() || '（摘要なし）'
          const amount = b.debitor?.value ?? b.creditor?.value ?? 0
          remarkList.push({ remark, amount })
        }
      }
    }

    // 金額降順でソートし、全摘要をカンマ区切り（金額付き）
    remarkList.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    const allRemarks = remarkList.length > 0
      ? remarkList.map(r => `${r.remark}(¥${r.amount.toLocaleString()})`).join(', ')
      : '（摘要なし）'

    results.push({ ...a, allRemarks, journalCount: monthJournals.length })
  }

  // テーブル表示
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  結果: 摘要付き月次変動（乖離額上位10）')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('  | 順位 | 科目名 | 月 | 金額 | 1年平均 | 乖離額 | 乖離率 | 件数 |')
  console.log('  |---|---|---|---|---|---|---|---|')
  results.forEach((r, i) => {
    const sign = r.diffAmount > 0 ? '+' : ''
    console.log(`  | ${i + 1} | ${r.name} | ${r.month} | ¥${r.value.toLocaleString()} | ¥${r.avg.toLocaleString()} | ${sign}¥${r.diffAmount.toLocaleString()} | ${sign}${(r.diffRate * 100).toFixed(0)}% | ${r.journalCount}件 |`)
    console.log(`  |   | 摘要: ${r.allRemarks} |`)
  })

  // ④ Gemini 3.5 flashで理由推定
  console.log('\n▼ Step 4: gemini-3.5-flash で理由推定')
  const tableForAI = results.map((r, i) => ({
    順位: i + 1, 科目名: r.name, 月: r.month,
    金額: r.value, 年平均: r.avg,
    乖離額: r.diffAmount, 乖離率: `${(r.diffRate * 100).toFixed(0)}%`,
    摘要一覧: r.allRemarks, 仕訳件数: r.journalCount,
  }))

  const prompt = `以下は2025年度のPL推移表から、直近1年平均に対して±50%以上かつ乖離額が年商の1%以上の変動がある科目です。

${JSON.stringify(tableForAI, null, 2)}

各項目について、摘要と金額のパターンから変動の理由を1行で推定してください。
出力形式:
| 順位 | 科目名 | 月 | 推定理由 |
|---|---|---|---|

データにないことは書かないでください。`

  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY })
  const startTime = Date.now()
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
  })
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  完了: ${elapsed}秒\n`)
  console.log(result.text ?? '（応答なし）')
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
