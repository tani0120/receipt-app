/**
 * MCP実機データダンプ: 補助科目・部門・科目（sub_accounts付き）
 *
 * 目的: AIが書いた型定義（病人の手紙）をMCP実機レスポンスと照合する
 * 出力: data/mcp-dump-sub-dept.json に生データを保存
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts, mcpFetchSubAccounts, mcpFetchDepartments } from '../api/services/mfMcpClient'
import { writeFileSync } from 'fs'
import { join } from 'path'

const TOKEN_KEYS = ['c_rODnkCDN', 'c_wTdnMKDO']

async function main() {
  const results: Record<string, unknown> = {}

  for (const tokenKey of TOKEN_KEYS) {
    console.log(`\n========== ${tokenKey} ==========`)

    // 1. getSubAccounts — 独立API
    let subAccounts: unknown = null
    try {
      subAccounts = await mcpFetchSubAccounts(tokenKey)
      console.log(`[getSubAccounts] ${Array.isArray(subAccounts) ? subAccounts.length : '?'}件`)
      if (Array.isArray(subAccounts) && subAccounts.length > 0) {
        console.log(`  先頭: ${JSON.stringify(subAccounts[0])}`)
        console.log(`  全キー: ${Object.keys(subAccounts[0] as Record<string, unknown>).join(', ')}`)
      }
    } catch (err) {
      console.error(`[getSubAccounts] 失敗:`, err instanceof Error ? err.message : err)
      subAccounts = { error: String(err) }
    }

    // 2. getDepartments — 独立API
    let departments: unknown = null
    try {
      departments = await mcpFetchDepartments(tokenKey)
      console.log(`[getDepartments] ${Array.isArray(departments) ? departments.length : '?'}件`)
      if (Array.isArray(departments) && departments.length > 0) {
        console.log(`  先頭: ${JSON.stringify(departments[0])}`)
        console.log(`  全キー: ${Object.keys(departments[0] as Record<string, unknown>).join(', ')}`)
      }
    } catch (err) {
      console.error(`[getDepartments] 失敗:`, err instanceof Error ? err.message : err)
      departments = { error: String(err) }
    }

    // 3. getAccounts — sub_accounts付き科目
    let accountsWithSub: unknown[] = []
    try {
      const allAccounts = await mcpFetchAccounts(tokenKey)
      console.log(`[getAccounts] ${allAccounts.length}件`)
      // sub_accountsがある科目のみ抽出
      const withSubs = allAccounts.filter(a => a.sub_accounts && a.sub_accounts.length > 0)
      console.log(`  補助科目ありの科目: ${withSubs.length}件`)
      for (const a of withSubs) {
        console.log(`  ${a.name}: ${a.sub_accounts.length}件`)
        for (const s of a.sub_accounts) {
          console.log(`    - ${JSON.stringify(s)}`)
        }
      }
      accountsWithSub = withSubs
    } catch (err) {
      console.error(`[getAccounts] 失敗:`, err instanceof Error ? err.message : err)
      accountsWithSub = [{ error: String(err) }]
    }

    results[tokenKey] = {
      subAccounts,
      departments,
      accountsWithSub,
      timestamp: new Date().toISOString(),
    }
  }

  // JSON保存
  const outPath = join(process.cwd(), 'data', 'mcp-dump-sub-dept.json')
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\n✅ 保存完了: ${outPath}`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
