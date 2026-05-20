/**
 * 定型パターン #2「経費取引先上位10社」実機検証
 *
 * A: 摘要パース → 取引先別集計
 * B: PL試算表 → 経費科目別集計
 *
 * 実行: npx tsx src/ai-commands/patterns/p02_expense_analysis.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

interface Branch {
  debitor?: { account_id: string; value: number; trade_partner_code?: string }
  creditor?: { account_id: string; value: number; trade_partner_code?: string }
  remark: string
}

interface Journal {
  id: string
  number: number
  transaction_date: string
  branches: Branch[]
}

interface JournalsResponse {
  journals: Journal[]
  metadata: { total_count: number; total_pages: number }
}

interface PLRow {
  name: string
  type: string
  values: number[]
  rows?: PLRow[]
}

interface PLResponse {
  columns: string[]
  rows: PLRow[]
  start_date: string
  end_date: string
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  経費上位分析 — 2アプローチ実機検証（2025年度）')
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // アプローチB: PL試算表の経費科目別集計
  // ============================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  アプローチB: PL試算表の経費科目別集計')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const plData = await callMcpTool<PLResponse>(
    'mfc_ca_getReportsTrialBalanceProfitLoss',
    { fiscal_year: 2025 },
    TOKEN_KEY
  )

  const colIndex = Object.fromEntries(plData.columns.map((c, i) => [c, i]))
  const closingIdx = colIndex['closing_balance'] ?? 0

  // 経費合計を探す
  const expenseRow = plData.rows.find(r => r.name === '経費合計')
  console.log(`  経費合計の行: ${expenseRow ? '✅ 発見' : '❌ なし'}`)

  if (expenseRow?.rows) {
    const sorted = [...expenseRow.rows]
      .filter(r => r.values[closingIdx] !== 0)
      .sort((a, b) => Math.abs(b.values[closingIdx] ?? 0) - Math.abs(a.values[closingIdx] ?? 0))

    console.log(`  経費科目数: ${sorted.length}件\n`)
    console.log('  | 順位 | 科目名 | 金額 | 構成比 |')
    console.log('  |---|---|---|---|')
    const total = expenseRow.values[closingIdx] ?? 0
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i]!
      const amount = r.values[closingIdx] ?? 0
      const ratio = ((amount / total) * 100).toFixed(1)
      console.log(`  | ${i + 1} | ${r.name} | ¥${amount.toLocaleString()} | ${ratio}% |`)
    }
    console.log(`\n  経費合計: ¥${total.toLocaleString()}`)
  }

  // ============================
  // アプローチA: 摘要パースで取引先別集計
  // ============================
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  アプローチA: 摘要パースで取引先別集計')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // EXPENSE科目IDを取得
  const accountData = await callMcpTool<{ accounts: Array<{ id: string; name: string; account_group: string }> }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )
  const expenseAccounts = accountData.accounts.filter(a => a.account_group === 'EXPENSE')
  const expenseAccountIds = new Set(expenseAccounts.map(a => a.id))
  console.log(`  EXPENSE科目: ${expenseAccounts.length}件`)

  // 科目ID→科目名マップ
  const accountNameMap = new Map(expenseAccounts.map(a => [a.id, a.name]))

  // 全仕訳取得
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
    const filtered = data.journals.filter(j =>
      j.branches.some(b => expenseAccountIds.has(b.debitor?.account_id ?? ''))
    )
    allJournals.push(...filtered)
    totalPages = data.metadata.total_pages
    console.log(`  ページ${page}/${totalPages}（取得${data.journals.length}件 → 経費${filtered.length}件）`)
    page++
  }
  console.log(`  経費仕訳合計: ${allJournals.length}件\n`)

  // 摘要別に集計
  const remarkTotals = new Map<string, { count: number; total: number; accounts: Set<string> }>()
  for (const j of allJournals) {
    for (const b of j.branches) {
      if (!expenseAccountIds.has(b.debitor?.account_id ?? '')) continue
      const amount = b.debitor?.value ?? 0
      const key = (b.remark ?? '').trim() || '（摘要なし）'
      const accountName = accountNameMap.get(b.debitor?.account_id ?? '') ?? ''
      const existing = remarkTotals.get(key) ?? { count: 0, total: 0, accounts: new Set<string>() }
      existing.count++
      existing.total += amount
      existing.accounts.add(accountName)
      remarkTotals.set(key, existing)
    }
  }

  const sortedA = [...remarkTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)

  const grandTotalA = [...remarkTotals.values()].reduce((s, v) => s + v.total, 0)

  console.log('  【結果A: 摘要別 経費ランキング 上位10】\n')
  console.log('  | 順位 | 摘要（取引先） | 件数 | 経費合計 | 構成比 | 科目 |')
  console.log('  |---|---|---|---|---|---|')
  for (let i = 0; i < sortedA.length; i++) {
    const entry = sortedA[i]!
    const [name, { count, total, accounts }] = entry
    const ratio = ((total / grandTotalA) * 100).toFixed(1)
    const accts = [...accounts].join(', ')
    console.log(`  | ${i + 1} | ${name} | ${count}件 | ¥${total.toLocaleString()} | ${ratio}% | ${accts} |`)
  }
  console.log(`\n  経費合計: ¥${grandTotalA.toLocaleString()}（ユニーク摘要: ${remarkTotals.size}件）`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
