/**
 * MCP経由でTST(c_rODnkCDN)の勘定科目を取得して新科目を確認するスクリプト
 * fetch_mf_accounts.tsと同じ構造（実績あり）
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'

const TOKEN_KEY = 'c_rODnkCDN'

async function main() {
  console.log(`[check] MCPで勘定科目を取得中... tokenKey=${TOKEN_KEY}`)
  const accounts = await mcpFetchAccounts(TOKEN_KEY)
  console.log(`[check] ${accounts.length}件取得`)

  // 新科目検索
  const found = accounts.filter(a =>
    a.name.includes('ネット') || a.name.includes('スーパー') || a.name.includes('備品')
  )
  if (found.length > 0) {
    console.log(`\n=== 新科目 ${found.length}件発見 ===`)
    found.forEach(a => console.log(JSON.stringify(a, null, 2)))
  } else {
    console.log('\n新科目なし')
  }

  // category一覧
  const cats = [...new Set(accounts.map(a => `${a.account_group} / ${a.category}`))].sort()
  console.log('\n--- account_group / category 集計 ---')
  cats.forEach(c => {
    const count = accounts.filter(a => `${a.account_group} / ${a.category}` === c).length
    console.log(`  ${c}: ${count}件`)
  })

  process.exit(0)
}

main().catch(err => {
  console.error('[check] エラー:', err)
  process.exit(1)
})
