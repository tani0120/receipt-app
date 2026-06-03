/**
 * 要再検証項目のMCP実機確認スクリプト
 * 
 * §3-3: 事業者情報の種別（type）フィールドを確認
 * §4-3: 仕訳作成ツール（postJournals）の入力スキーマを確認
 * §4-4: 全ツールのスキーマで制約を確認
 * §7-3: 2事業所同時接続の確認
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchCurrentOffice, listMcpTools } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'  // 法人
const TSK_KEY = 'c_wTdnMKDO'  // 個人

async function main() {
  // §3-3: 事業者情報の種別（type）確認
  console.log('\n=== §3-3: 事業者情報の種別（type） ===')
  const tstOffice = await mcpFetchCurrentOffice(TST_KEY)
  console.log(`法人: type=${tstOffice.type}`)
  const tskOffice = await mcpFetchCurrentOffice(TSK_KEY)
  console.log(`個人: type=${tskOffice.type}`)
  console.log(`→ 2事業所同時接続: ✅（§7-3確認済み）`)

  // §4-3, §4-4: 全ツールの入力スキーマ
  console.log('\n=== §4-3/4-4: MCPツール入力スキーマ ===')
  const tools = await listMcpTools(TST_KEY)
  
  // 仕訳作成（postJournals）のスキーマを詳細表示
  const postJournals = tools.find(t => t.name === 'mfc_ca_postJournals')
  if (postJournals) {
    console.log('\n--- mfc_ca_postJournals 入力スキーマ ---')
    console.log(JSON.stringify(postJournals.inputSchema, null, 2))
  }

  // 仕訳一覧（getJournals）のスキーマ（日付必須制約の確認）
  const getJournals = tools.find(t => t.name === 'mfc_ca_getJournals')
  if (getJournals) {
    console.log('\n--- mfc_ca_getJournals 入力スキーマ ---')
    console.log(JSON.stringify(getJournals.inputSchema, null, 2))
  }

  // 推移表（getReportsTransitionProfitLoss）のスキーマ（type必須制約の確認）
  const transition = tools.find(t => t.name === 'mfc_ca_getReportsTransitionProfitLoss')
  if (transition) {
    console.log('\n--- mfc_ca_getReportsTransitionProfitLoss 入力スキーマ ---')
    console.log(JSON.stringify(transition.inputSchema, null, 2))
  }

  // 全ツール名一覧（select_tenantがないことの確認）
  console.log('\n--- 全ツール名（select_tenant確認） ---')
  const hasSelectTenant = tools.some(t => t.name.includes('select_tenant'))
  console.log(`select_tenantツール: ${hasSelectTenant ? '❌ 存在する' : '✅ 存在しない'}`)

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
