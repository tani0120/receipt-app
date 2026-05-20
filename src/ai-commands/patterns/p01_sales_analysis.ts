/**
 * 売上上位分析 — 2つのアプローチを実機検証
 *
 * A: 摘要（remark）から取引先名パース → 取引先別集計
 * B: PL試算表の科目別集計 → 売上内訳
 *
 * 実行: npx tsx src/ai-commands/patterns/p01_sales_analysis.ts
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
  console.log('  売上上位分析 — 2アプローチ実機検証（2025年度）')
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // アプローチA: 摘要から取引先名パース
  // ============================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  アプローチA: 摘要（remark）から取引先名パース')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // REVENUE科目IDを取得
  const accountData = await callMcpTool<{ accounts: Array<{ id: string; name: string; account_group: string }> }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )
  const salesAccounts = accountData.accounts.filter(a => a.account_group === 'REVENUE')
  const salesAccountIds = new Set(salesAccounts.map(a => a.id))
  console.log(`  REVENUE科目: ${salesAccounts.length}件（${salesAccounts.map(a => a.name).join(', ')}）`)

  // 2025年度の全仕訳取得
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
      j.branches.some(b =>
        salesAccountIds.has(b.creditor?.account_id ?? '') ||
        salesAccountIds.has(b.debitor?.account_id ?? '')
      )
    )
    allJournals.push(...filtered)
    totalPages = data.metadata.total_pages
    page++
  }
  console.log(`  売上仕訳: ${allJournals.length}件\n`)

  // 摘要から取引先名をパース → 集計
  const remarkTotals = new Map<string, { count: number; total: number }>()
  for (const j of allJournals) {
    for (const b of j.branches) {
      // 貸方がREVENUE科目の行 → その金額が売上
      const isRevenue = salesAccountIds.has(b.creditor?.account_id ?? '')
      if (!isRevenue) continue

      const amount = b.creditor?.value ?? 0
      // 摘要をそのまま取引先キーにする（正規化: 全角→半角、トリム）
      let partnerName = (b.remark ?? '').trim()
      if (!partnerName) partnerName = '（摘要なし）'

      const existing = remarkTotals.get(partnerName) ?? { count: 0, total: 0 }
      existing.count++
      existing.total += amount
      remarkTotals.set(partnerName, existing)
    }
  }

  // 降順ソート
  const sortedA = [...remarkTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)

  const grandTotalA = [...remarkTotals.values()].reduce((s, v) => s + v.total, 0)

  console.log('  【結果A: 摘要別 売上ランキング】\n')
  console.log('  | 順位 | 摘要（取引先） | 件数 | 売上合計 | 構成比 |')
  console.log('  |---|---|---|---|---|')
  for (let i = 0; i < sortedA.length; i++) {
    const entry = sortedA[i]!
    const [name, { count, total }] = entry
    const ratio = ((total / grandTotalA) * 100).toFixed(1)
    console.log(`  | ${i + 1} | ${name} | ${count}件 | ¥${total.toLocaleString()} | ${ratio}% |`)
  }
  console.log(`\n  売上合計: ¥${grandTotalA.toLocaleString()}（ユニーク摘要: ${remarkTotals.size}件）`)

  // ============================
  // アプローチB: PL試算表の科目別集計
  // ============================
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  アプローチB: PL試算表の科目別集計')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const plData = await callMcpTool<PLResponse>(
    'mfc_ca_getReportsTrialBalanceProfitLoss',
    { fiscal_year: 2025 },
    TOKEN_KEY
  )

  console.log(`  columns: ${plData.columns.join(', ')}`)
  console.log(`  期間: ${plData.start_date} 〜 ${plData.end_date}\n`)

  // columnsのインデックスマップ
  const _colIndex = Object.fromEntries(plData.columns.map((c, i) => [c, i]))

  // 再帰的にrowsを展開
  function flattenRows(rows: PLRow[], depth = 0): Array<{ name: string; depth: number; values: number[]; type: string }> {
    const result: Array<{ name: string; depth: number; values: number[]; type: string }> = []
    for (const row of rows) {
      result.push({ name: row.name, depth, values: row.values, type: row.type })
      if (row.rows && row.rows.length > 0) {
        result.push(...flattenRows(row.rows, depth + 1))
      }
    }
    return result
  }

  const allRows = flattenRows(plData.rows)

  console.log('  【結果B: PL試算表 — 全科目】\n')
  console.log('  | 科目名 | 前期残高 | 借方 | 貸方 | 期末残高 | 構成比 | 種別 |')
  console.log('  |---|---|---|---|---|---|---|')
  for (const row of allRows) {
    const indent = '  '.repeat(row.depth)
    const [opening, debit, credit, closing, ratio] = row.values
    if (closing === 0 && debit === 0 && credit === 0) continue // ゼロ行スキップ
    const ratioStr = ratio !== null && ratio !== undefined ? `${ratio.toFixed(1)}%` : '-'
    console.log(`  | ${indent}${row.name} | ¥${opening?.toLocaleString() ?? 0} | ¥${debit?.toLocaleString() ?? 0} | ¥${credit?.toLocaleString() ?? 0} | ¥${closing?.toLocaleString() ?? 0} | ${ratioStr} | ${row.type} |`)
  }

  // ============================
  // 比較まとめ
  // ============================
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  比較まとめ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('  | 項目 | アプローチA（摘要パース） | アプローチB（PL試算表） |')
  console.log('  |---|---|---|')
  console.log(`  | API呼び出し回数 | ${totalPages + 2}回 | 1回 |`)
  console.log(`  | 取引先粒度 | 摘要文字列（荒い） | 勘定科目（大分類） |`)
  console.log(`  | 金額精度 | 仕訳単位の積み上げ | MF側の集計済み値 |`)
  console.log(`  | レート制限リスク | 高（全ページ取得） | 低（1回で完結） |`)
  console.log(`  | 売上合計 | ¥${grandTotalA.toLocaleString()} | PL参照 |`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
