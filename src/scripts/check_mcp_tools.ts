/**
 * MCPツール一覧を取得して科目作成ツールがあるか確認
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { listMcpTools } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'

async function main() {
  const tools = await listMcpTools(TST_KEY)
  console.log(`[検証] MCPツール ${tools.length}件:`)
  tools.forEach(t => {
    const hasAccount = t.name.toLowerCase().includes('account')
    console.log(`  ${hasAccount ? '★' : ' '} ${t.name}: ${t.description ?? ''}`)
  })
  process.exit(0)
}

main().catch(err => {
  console.error('[検証] エラー:', err)
  process.exit(1)
})
