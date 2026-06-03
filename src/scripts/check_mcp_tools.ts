/**
 * MCP実機からツール一覧（listTools）を取得し、
 * §4-3の「全19ツール」という記載が正しいか検証する。
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { listMcpTools } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'  // 法人

async function main() {
  console.log(`\n=== MCPツール一覧取得（listTools） ===`)
  const tools = await listMcpTools(TST_KEY)
  console.log(`ツール数: ${tools.length}`)
  console.log('\n全ツール名:')
  tools.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name}`)
  })

  // §4-3に記載されている19ツールとの突合
  const expected = [
    'mfc_ca_currentOffice',
    'mfc_ca_en_ja_dictionary',
    'mfc_ca_getAccounts',
    'mfc_ca_getConnectedAccounts',
    'mfc_ca_getDepartments',
    'mfc_ca_getJournalById',
    'mfc_ca_getJournals',
    'mfc_ca_getReportsTransitionBalanceSheet',
    'mfc_ca_getReportsTransitionProfitLoss',
    'mfc_ca_getReportsTrialBalanceBalanceSheet',
    'mfc_ca_getReportsTrialBalanceProfitLoss',
    'mfc_ca_getSubAccounts',
    'mfc_ca_getTaxes',
    'mfc_ca_getTermSettings',
    'mfc_ca_getTradePartners',
    'mfc_ca_postJournals',
    'mfc_ca_putJournals',
    'mfc_ca_postTradePartners',
    'mfc_ca_postTransactions',
  ]

  const actualNames = tools.map(t => t.name).sort()
  const expectedSorted = expected.sort()

  console.log('\n=== §4-3との突合 ===')
  console.log(`§4-3記載: ${expected.length}ツール`)
  console.log(`MCP実機: ${tools.length}ツール`)

  // §4-3にあるがMCP実機にないもの
  const missing = expectedSorted.filter(e => !actualNames.includes(e))
  if (missing.length > 0) {
    console.log(`\n❌ §4-3にあるがMCP実機にない: ${missing.join(', ')}`)
  }

  // MCP実機にあるが§4-3にないもの
  const extra = actualNames.filter(a => !expectedSorted.includes(a))
  if (extra.length > 0) {
    console.log(`\n⚠️ MCP実機にあるが§4-3にない: ${extra.join(', ')}`)
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log('\n✅ 完全一致')
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
