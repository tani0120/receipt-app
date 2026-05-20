/**
 * パターン#22: 売上増減ランキング（科目別/取引先別）増減各10位
 *
 * 昨期・今期のPL試算表を取得し、REVENUE科目の月平均を比較。
 * 増加トップ10 + 減少トップ10 を出力。
 * さらに仕訳から取引先別の増減も算出。
 *
 * 実行: npx tsx src/ai-commands/patterns/p22_sales_change_ranking.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../../api/services/mfMcpClient'
import { GoogleGenAI } from '@google/genai'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

// ---------- 型定義 ----------

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

interface Branch {
  debitor?: { account_id: string; account_name: string; value: number; trade_partner_name?: string | null }
  creditor?: { account_id: string; account_name: string; value: number; trade_partner_name?: string | null }
  remark: string
}

interface Journal {
  id: string
  transaction_date: string
  branches: Branch[]
}

interface JournalsResponse {
  journals: Journal[]
  metadata: { total_count: number; total_pages: number }
}

interface AccountInfo {
  id: string
  name: string
  account_group: string
}

// ---------- ユーティリティ ----------

/** PLのrowsを再帰的にフラット化（末端科目のみ抽出） */
function flattenLeafRows(rows: PLRow[]): Array<{ name: string; values: number[] }> {
  const result: Array<{ name: string; values: number[] }> = []
  for (const row of rows) {
    if (row.rows && row.rows.length > 0) {
      result.push(...flattenLeafRows(row.rows))
    } else if (row.type === 'account') {
      result.push({ name: row.name, values: row.values })
    }
  }
  return result
}

/** 経過月数を算出（start_date〜end_date） */
function calcMonths(startDate: string, endDate: string): number {
  const s = new Date(startDate)
  const e = new Date(endDate)
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1
}

/** 全仕訳取得（ページネーション対応） */
async function fetchAllJournals(startDate: string, endDate: string, accountIds: Set<string>): Promise<Journal[]> {
  const all: Journal[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    if (page > 1) await new Promise(r => setTimeout(r, 500))
    const data = await callMcpTool<JournalsResponse>(
      'mfc_ca_getJournals',
      { start_date: startDate, end_date: endDate, per_page: 100, page },
      TOKEN_KEY
    )
    const filtered = data.journals.filter(j =>
      j.branches.some(b =>
        accountIds.has(b.creditor?.account_id ?? '') ||
        accountIds.has(b.debitor?.account_id ?? '')
      )
    )
    all.push(...filtered)
    totalPages = data.metadata.total_pages
    page++
  }
  return all
}

/** 仕訳から取引先別売上を集計 */
function aggregateByPartner(journals: Journal[], accountIds: Set<string>): Map<string, number> {
  const totals = new Map<string, number>()
  for (const j of journals) {
    for (const b of j.branches) {
      const isRevenue = accountIds.has(b.creditor?.account_id ?? '')
      if (!isRevenue) continue

      const amount = b.creditor?.value ?? 0
      // 取引先名: trade_partner_name > 摘要 > 「（不明）」
      let partner = b.creditor?.trade_partner_name ?? ''
      if (!partner) partner = (b.remark ?? '').trim()
      if (!partner) partner = '（不明）'

      totals.set(partner, (totals.get(partner) ?? 0) + amount)
    }
  }
  return totals
}

/** AI名寄せ: 取引先名一覧をgeminiでグルーピング → マージ後のMapを返す */
async function mergePartnersByAI(
  prevPartners: Map<string, number>,
  currPartners: Map<string, number>
): Promise<{ prev: Map<string, number>; curr: Map<string, number> }> {
  const allNames = [...new Set([...prevPartners.keys(), ...currPartners.keys()])]
  // 2件以下なら名寄せ不要
  if (allNames.length <= 2) return { prev: prevPartners, curr: currPartners }

  const apiKey = process.env['GEMINI_API_KEY'] ?? ''
  if (!apiKey) {
    console.log('  ⚠️ GEMINI_API_KEY未設定のため名寄せスキップ')
    return { prev: prevPartners, curr: currPartners }
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = `以下は会計仕訳の取引先名・摘要の一覧です。
同一の取引先と推定されるものをグルーピングしてください。
半角カナと全角、略称と正式名称、振込名義と会社名などを考慮してください。

取引先名一覧:
${allNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

出力形式（JSON配列のみ。説明不要）:
[["正式名称", "別名1", "別名2", ...], ["正式名称B", "別名B1"]]
グルーピング不要な取引先は1要素の配列で返してください。`

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })
  const text = resp.text ?? ''

  // JSONパース
  const jsonMatch = text.match(/\[\s*\[.*\]\s*\]/s)
  if (!jsonMatch) {
    console.log('  ⚠️ AI名寄せのレスポンスをパースできません。名寄せスキップ')
    return { prev: prevPartners, curr: currPartners }
  }

  let groups: string[][]
  try {
    groups = JSON.parse(jsonMatch[0])
  } catch {
    console.log('  ⚠️ AI名寄せJSONパースエラー。名寄せスキップ')
    return { prev: prevPartners, curr: currPartners }
  }

  // 別名→正式名称のマッピングを構築
  const aliasMap = new Map<string, string>()
  for (const group of groups) {
    if (group.length < 2) continue
    const canonical = group[0]!
    for (let i = 1; i < group.length; i++) {
      aliasMap.set(group[i]!, canonical)
    }
  }

  console.log(`  🤖 AI名寄せ: ${aliasMap.size}件の別名を統合`)
  for (const [alias, canonical] of aliasMap) {
    console.log(`     ${alias} → ${canonical}`)
  }

  // マージ関数
  function mergeMap(original: Map<string, number>): Map<string, number> {
    const merged = new Map<string, number>()
    for (const [name, amount] of original) {
      const canonical = aliasMap.get(name) ?? name
      merged.set(canonical, (merged.get(canonical) ?? 0) + amount)
    }
    return merged
  }

  return { prev: mergeMap(prevPartners), curr: mergeMap(currPartners) }
}

// ---------- メイン ----------

async function main() {
  const CURRENT_YEAR = 2025  // 今期
  const PREV_YEAR = 2024     // 昨期

  console.log('═══════════════════════════════════════════════')
  console.log('  #22 売上増減ランキング（科目別/取引先別）')
  console.log(`  昨期: ${PREV_YEAR}年度  今期: ${CURRENT_YEAR}年度`)
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // Step 1: PL試算表を2期分取得（科目別）
  // ============================
  console.log('━━━ Step 1: PL試算表取得（科目別増減） ━━━\n')

  const [plPrev, plCurr] = await Promise.all([
    callMcpTool<PLResponse>(
      'mfc_ca_getReportsTrialBalanceProfitLoss',
      { fiscal_year: PREV_YEAR },
      TOKEN_KEY
    ),
    callMcpTool<PLResponse>(
      'mfc_ca_getReportsTrialBalanceProfitLoss',
      { fiscal_year: CURRENT_YEAR },
      TOKEN_KEY
    ),
  ])

  const prevMonths = calcMonths(plPrev.start_date, plPrev.end_date)
  const currMonths = calcMonths(plCurr.start_date, plCurr.end_date)
  console.log(`  昨期: ${plPrev.start_date}〜${plPrev.end_date}（${prevMonths}ヶ月）`)
  console.log(`  今期: ${plCurr.start_date}〜${plCurr.end_date}（${currMonths}ヶ月）\n`)

  // columns配列の closing_balance インデックスを特定
  // PL試算表のcolumns: ["opening_balance", "debit", "credit", "closing_balance", "composition_ratio"]
  const closingIdxPrev = plPrev.columns.indexOf('closing_balance')
  const closingIdxCurr = plCurr.columns.indexOf('closing_balance')

  // REVENUE科目の末端行を取得
  const prevLeaves = flattenLeafRows(plPrev.rows)
  const currLeaves = flattenLeafRows(plCurr.rows)

  // 科目名→closing_balanceのMap
  const prevMap = new Map(prevLeaves.map(r => [r.name, r.values[closingIdxPrev] ?? 0]))
  const currMap = new Map(currLeaves.map(r => [r.name, r.values[closingIdxCurr] ?? 0]))

  // 全科目名の和集合
  const allAccountNames = new Set([...prevMap.keys(), ...currMap.keys()])

  // REVENUE系の科目だけに絞る必要がある
  // → PLのrows構造から「売上高」セクションの下にある科目を特定
  function findRevenueNames(rows: PLRow[]): Set<string> {
    const names = new Set<string>()
    for (const row of rows) {
      // 「売上高」「売上」「営業収益」等のセクションの子を探す
      if (row.name.includes('売上') || row.name.includes('収益') || row.name.includes('収入')) {
        // このセクション配下の末端科目を収集
        const leaves = flattenLeafRows(row.rows ?? [])
        for (const l of leaves) names.add(l.name)
        // セクション自体がaccount型なら自身も追加
        if (row.type === 'account') names.add(row.name)
      }
      // 子を再帰的にチェック
      if (row.rows) {
        const childNames = findRevenueNames(row.rows)
        for (const n of childNames) names.add(n)
      }
    }
    return names
  }

  const revenueNames = new Set([
    ...findRevenueNames(plCurr.rows),
    ...findRevenueNames(plPrev.rows),
  ])

  console.log(`  REVENUE科目: ${revenueNames.size}件（${[...revenueNames].join(', ')}）\n`)

  // 増減計算
  interface ChangeEntry {
    name: string
    prevMonthlyAvg: number
    currMonthlyAvg: number
    changeAmount: number
    changeRate: number | null  // 昨期0の場合はnull
  }

  const changes: ChangeEntry[] = []
  for (const name of allAccountNames) {
    if (!revenueNames.has(name)) continue

    const prevClosing = prevMap.get(name) ?? 0
    const currClosing = currMap.get(name) ?? 0
    const prevAvg = prevClosing / prevMonths
    const currAvg = currClosing / currMonths
    const change = currAvg - prevAvg
    const rate = prevAvg !== 0 ? change / Math.abs(prevAvg) : null

    // 両方ゼロはスキップ
    if (prevClosing === 0 && currClosing === 0) continue

    changes.push({
      name,
      prevMonthlyAvg: Math.round(prevAvg),
      currMonthlyAvg: Math.round(currAvg),
      changeAmount: Math.round(change),
      changeRate: rate,
    })
  }

  // 増加トップ10
  const increases = changes
    .filter(c => c.changeAmount > 0)
    .sort((a, b) => b.changeAmount - a.changeAmount)
    .slice(0, 10)

  // 減少トップ10
  const decreases = changes
    .filter(c => c.changeAmount < 0)
    .sort((a, b) => a.changeAmount - b.changeAmount)
    .slice(0, 10)

  console.log('  【科目別 売上増加トップ10】\n')
  console.log('  | 順位 | 科目名 | 昨期月平均 | 今期月平均 | 増減額 | 増減率 |')
  console.log('  |---|---|---|---|---|---|')
  if (increases.length === 0) {
    console.log('  | — | 増加した科目はありません | — | — | — | — |')
  }
  for (let i = 0; i < increases.length; i++) {
    const c = increases[i]!
    const rateStr = c.changeRate !== null ? `${(c.changeRate * 100).toFixed(1)}%` : '新規'
    console.log(`  | ${i + 1} | ${c.name} | ¥${c.prevMonthlyAvg.toLocaleString()} | ¥${c.currMonthlyAvg.toLocaleString()} | +¥${c.changeAmount.toLocaleString()} | ${rateStr} |`)
  }

  console.log('\n  【科目別 売上減少トップ10】\n')
  console.log('  | 順位 | 科目名 | 昨期月平均 | 今期月平均 | 増減額 | 増減率 |')
  console.log('  |---|---|---|---|---|---|')
  if (decreases.length === 0) {
    console.log('  | — | 減少した科目はありません | — | — | — | — |')
  }
  for (let i = 0; i < decreases.length; i++) {
    const c = decreases[i]!
    const rateStr = c.changeRate !== null ? `${(c.changeRate * 100).toFixed(1)}%` : '—'
    console.log(`  | ${i + 1} | ${c.name} | ¥${c.prevMonthlyAvg.toLocaleString()} | ¥${c.currMonthlyAvg.toLocaleString()} | ¥${c.changeAmount.toLocaleString()} | ${rateStr} |`)
  }

  // ============================
  // Step 2: 取引先別増減
  // ============================
  console.log('\n\n━━━ Step 2: 取引先別増減 ━━━\n')

  // REVENUE科目IDを取得
  const accountData = await callMcpTool<{ accounts: AccountInfo[] }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )
  const revenueAccounts = accountData.accounts.filter(a => a.account_group === 'REVENUE')
  const revenueAccountIds = new Set(revenueAccounts.map(a => a.id))
  console.log(`  REVENUE科目ID: ${revenueAccounts.length}件\n`)

  // 昨期・今期の仕訳を取得
  console.log('  昨期仕訳取得中...')
  const prevJournals = await fetchAllJournals(
    plPrev.start_date, plPrev.end_date, revenueAccountIds
  )
  console.log(`  昨期: ${prevJournals.length}件`)

  console.log('  今期仕訳取得中...')
  const currJournals = await fetchAllJournals(
    plCurr.start_date, plCurr.end_date, revenueAccountIds
  )
  console.log(`  今期: ${currJournals.length}件\n`)

  // 取引先別集計（名寄せ前）
  const prevPartnersRaw = aggregateByPartner(prevJournals, revenueAccountIds)
  const currPartnersRaw = aggregateByPartner(currJournals, revenueAccountIds)

  // AI名寄せ
  console.log('  AI名寄せ実行中...')
  const { prev: prevPartners, curr: currPartners } = await mergePartnersByAI(prevPartnersRaw, currPartnersRaw)

  // 全取引先の和集合
  const allPartners = new Set([...prevPartners.keys(), ...currPartners.keys()])

  const partnerChanges: ChangeEntry[] = []
  for (const partner of allPartners) {
    const prevTotal = prevPartners.get(partner) ?? 0
    const currTotal = currPartners.get(partner) ?? 0
    const prevAvg = prevTotal / prevMonths
    const currAvg = currTotal / currMonths
    const change = currAvg - prevAvg
    const rate = prevAvg !== 0 ? change / Math.abs(prevAvg) : null

    if (prevTotal === 0 && currTotal === 0) continue

    partnerChanges.push({
      name: partner,
      prevMonthlyAvg: Math.round(prevAvg),
      currMonthlyAvg: Math.round(currAvg),
      changeAmount: Math.round(change),
      changeRate: rate,
    })
  }

  // 増加トップ10
  const partnerIncreases = partnerChanges
    .filter(c => c.changeAmount > 0)
    .sort((a, b) => b.changeAmount - a.changeAmount)
    .slice(0, 10)

  // 減少トップ10
  const partnerDecreases = partnerChanges
    .filter(c => c.changeAmount < 0)
    .sort((a, b) => a.changeAmount - b.changeAmount)
    .slice(0, 10)

  console.log('  【取引先別 売上増加トップ10】\n')
  console.log('  | 順位 | 取引先 | 昨期月平均 | 今期月平均 | 増減額 | 増減率 |')
  console.log('  |---|---|---|---|---|---|')
  if (partnerIncreases.length === 0) {
    console.log('  | — | 増加した取引先はありません | — | — | — | — |')
  }
  for (let i = 0; i < partnerIncreases.length; i++) {
    const c = partnerIncreases[i]!
    const rateStr = c.changeRate !== null ? `${(c.changeRate * 100).toFixed(1)}%` : '新規'
    console.log(`  | ${i + 1} | ${c.name} | ¥${c.prevMonthlyAvg.toLocaleString()} | ¥${c.currMonthlyAvg.toLocaleString()} | +¥${c.changeAmount.toLocaleString()} | ${rateStr} |`)
  }

  console.log('\n  【取引先別 売上減少トップ10】\n')
  console.log('  | 順位 | 取引先 | 昨期月平均 | 今期月平均 | 増減額 | 増減率 |')
  console.log('  |---|---|---|---|---|---|')
  if (partnerDecreases.length === 0) {
    console.log('  | — | 減少した取引先はありません | — | — | — | — |')
  }
  for (let i = 0; i < partnerDecreases.length; i++) {
    const c = partnerDecreases[i]!
    const rateStr = c.changeRate !== null ? `${(c.changeRate * 100).toFixed(1)}%` : '—'
    console.log(`  | ${i + 1} | ${c.name} | ¥${c.prevMonthlyAvg.toLocaleString()} | ¥${c.currMonthlyAvg.toLocaleString()} | ¥${c.changeAmount.toLocaleString()} | ${rateStr} |`)
  }

  // ============================
  // サマリー
  // ============================
  console.log('\n\n━━━ サマリー ━━━\n')
  const prevTotalSales = [...prevMap.entries()]
    .filter(([name]) => revenueNames.has(name))
    .reduce((s, [, v]) => s + v, 0)
  const currTotalSales = [...currMap.entries()]
    .filter(([name]) => revenueNames.has(name))
    .reduce((s, [, v]) => s + v, 0)

  console.log(`  昨期売上合計: ¥${prevTotalSales.toLocaleString()}（月平均 ¥${Math.round(prevTotalSales / prevMonths).toLocaleString()}）`)
  console.log(`  今期売上合計: ¥${currTotalSales.toLocaleString()}（月平均 ¥${Math.round(currTotalSales / currMonths).toLocaleString()}）`)
  const totalChange = Math.round(currTotalSales / currMonths) - Math.round(prevTotalSales / prevMonths)
  const totalRate = prevTotalSales !== 0 ? ((currTotalSales / currMonths) / (prevTotalSales / prevMonths) * 100).toFixed(1) : '—'
  console.log(`  月平均増減: ¥${totalChange.toLocaleString()}（${totalRate}%）`)
  console.log(`  科目別: 増加${increases.length}件 / 減少${decreases.length}件`)
  console.log(`  取引先別: 増加${partnerIncreases.length}件 / 減少${partnerDecreases.length}件`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
