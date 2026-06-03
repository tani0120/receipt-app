/**
 * 普通預金のsub_accountsを確認（あああ銀行が補助科目に出るか）
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'

async function main() {
  console.log('[check] MCPで勘定科目を取得中...')
  const accounts = await mcpFetchAccounts('c_rODnkCDN')
  console.log(`[check] ${accounts.length}件取得`)

  // 普通預金を探す（sub_accountsがあるか）
  const futsu = accounts.find(a => a.name === '普通預金')
  if (futsu) {
    console.log('\n=== 普通預金 ===')
    console.log(JSON.stringify(futsu, null, 2))
  }

  // sub_accountsを持つ科目を全て表示
  const withSubs = accounts.filter(a => a.sub_accounts && a.sub_accounts.length > 0)
  if (withSubs.length > 0) {
    console.log(`\n=== 補助科目あり: ${withSubs.length}件 ===`)
    withSubs.forEach(a => {
      console.log(`  ${a.name}: ${a.sub_accounts.length}件`)
      a.sub_accounts.forEach((s: any) => console.log(`    - ${JSON.stringify(s)}`))
    })
  } else {
    console.log('\n補助科目を持つ科目: 0件')
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
