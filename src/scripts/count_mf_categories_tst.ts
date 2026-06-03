/**
 * MCP実機から法人TST（c_rODnkCDN）の勘定科目を取得し、
 * 科目分類（category）のユニーク値を集計する。
 * 
 * 目的: 過去の劣化した私が作ったスクリプトの結果（36種）を
 * 今の私が一から書いたスクリプトで再検証する。
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'  // 法人（株式会社すぐする）

async function main() {
  console.log(`\n=== 法人 TST (${TST_KEY}) ===`)
  const accounts = await mcpFetchAccounts(TST_KEY)
  console.log(`取得件数: ${accounts.length}`)

  // 科目分類（category）のユニーク値を集計
  const allCategories = new Set<string>()
  for (const a of accounts) {
    if (a.category) allCategories.add(a.category)
  }

  console.log(`\n科目分類（category）ユニーク数: ${allCategories.size}`)
  console.log('\n全ユニーク値:')
  for (const c of [...allCategories].sort()) {
    const count = accounts.filter(a => a.category === c).length
    console.log(`  ${c}: ${count}件`)
  }

  // 科目グループ（account_group）別の集計
  const byGroup: Record<string, Set<string>> = {}
  for (const a of accounts) {
    const group = a.account_group || '(なし)'
    const cat = a.category || '(なし)'
    if (!byGroup[group]) byGroup[group] = new Set()
    byGroup[group].add(cat)
  }

  console.log('\n科目グループ（account_group）別:')
  for (const [group, cats] of Object.entries(byGroup).sort()) {
    console.log(`  ${group} (${cats.size}種): ${[...cats].sort().join(', ')}`)
  }

  // 組み合わせ数（過去スクリプトが数えていたもの）
  const combos = new Set(accounts.map(a => `${a.account_group} / ${a.category}`))
  console.log(`\n組み合わせ（account_group × category）数: ${combos.size}`)
  console.log(`科目分類（category）単独ユニーク数: ${allCategories.size}`)
  console.log(`差異: ${combos.size - allCategories.size}（同じ科目分類が異なる科目グループに属するケース）`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
