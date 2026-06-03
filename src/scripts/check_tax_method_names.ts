/**
 * currentOfficeの全フィールドを出力し、
 * 課税方式の日本語名を含むフィールドがないか確認する
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { callMcpTool } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'
const TSK_KEY = 'c_wTdnMKDO'

async function main() {
  console.log('\n=== 法人 currentOffice 全フィールド ===')
  const tst = await callMcpTool('mfc_ca_currentOffice', {}, TST_KEY)
  console.log(JSON.stringify(tst, null, 2))

  console.log('\n=== 個人 currentOffice 全フィールド ===')
  const tsk = await callMcpTool('mfc_ca_currentOffice', {}, TSK_KEY)
  console.log(JSON.stringify(tsk, null, 2))

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
