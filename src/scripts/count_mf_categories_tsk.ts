/**
 * MCP実機からTSK（個人）の勘定科目を取得し、category集計
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'

const TSK_KEY = 'c_wTdnMKDO'

async function main() {
  console.log(`\n=== 個人 TSK (${TSK_KEY}) ===`)
  const accounts = await mcpFetchAccounts(TSK_KEY)
  console.log(`取得件数: ${accounts.length}`)

  const byGroup: Record<string, Set<string>> = {}
  const allCategories = new Set<string>()

  for (const a of accounts) {
    const group = a.account_group || '(なし)'
    const cat = a.category || '(なし)'
    if (!byGroup[group]) byGroup[group] = new Set()
    byGroup[group].add(cat)
    allCategories.add(cat)
  }

  console.log(`\ncategory ユニーク数: ${allCategories.size}`)
  console.log('\naccount_group / category 集計:')
  for (const [group, cats] of Object.entries(byGroup).sort()) {
    console.log(`  ${group} (${cats.size}種): ${[...cats].sort().join(', ')}`)
  }

  console.log('\n全enum値:')
  console.log(JSON.stringify([...allCategories].sort(), null, 2))

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
