/**
 * MCP経由でTSK(c_wTdnMKDO)の勘定科目を取得してJSONファイルに保存するスクリプト
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'
import { writeFileSync } from 'fs'
import { join } from 'path'

const TOKEN_KEY = 'c_wTdnMKDO'
const OUT_PATH = join(process.cwd(), 'docs/genzai/mf_accounts_raw_TSK.json')

async function main() {
  console.log(`[fetch] MCPで勘定科目を取得中... tokenKey=${TOKEN_KEY}`)
  const accounts = await mcpFetchAccounts(TOKEN_KEY)
  console.log(`[fetch] ${accounts.length}件取得`)
  
  writeFileSync(OUT_PATH, JSON.stringify(accounts, null, 2), 'utf-8')
  console.log(`[fetch] 保存完了: ${OUT_PATH}`)
  
  // サマリー出力
  const groups = new Map<string, number>()
  for (const a of accounts) {
    const key = `${a.account_group} / ${a.category}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  console.log('\n--- account_group / category 集計 ---')
  for (const [key, count] of [...groups.entries()].sort()) {
    console.log(`  ${key}: ${count}件`)
  }
  
  // available集計
  const avail = accounts.filter(a => a.available).length
  const unavail = accounts.filter(a => !a.available).length
  console.log(`\navailable: ${avail}件 / unavailable: ${unavail}件`)
  
  process.exit(0)
}

main().catch(err => {
  console.error('[fetch] エラー:', err)
  process.exit(1)
})
