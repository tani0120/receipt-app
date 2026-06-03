/**
 * MCP実機から法人（TST）・個人（TSK）の会計年度設定を取得し、
 * 決算期が§3の記載通りか確認する。
 * 
 * §3の記載: 個人は1月〜12月固定、法人は任意
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchTermSettings } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'  // 法人（テスト法人）
const TSK_KEY = 'c_wTdnMKDO'  // 個人（テスト個人）

async function main() {
  // 法人の会計年度設定（getTermSettings）
  console.log(`\n=== 法人 TST (${TST_KEY}) — 会計年度設定 ===`)
  const tstTerms = await mcpFetchTermSettings(undefined, TST_KEY)
  console.log(JSON.stringify(tstTerms, null, 2))

  // 個人の会計年度設定（getTermSettings）
  console.log(`\n=== 個人 TSK (${TSK_KEY}) — 会計年度設定 ===`)
  const tskTerms = await mcpFetchTermSettings(undefined, TSK_KEY)
  console.log(JSON.stringify(tskTerms, null, 2))

  // 確認ポイント
  console.log('\n=== 検証 ===')
  if (tskTerms.length > 0) {
    const t = tskTerms[0]
    console.log(`個人 期首日: ${t.start_date} → 1月1日か？ ${t.start_date.endsWith('-01-01') ? '✅ はい' : '❌ いいえ'}`)
    console.log(`個人 期末日: ${t.end_date} → 12月31日か？ ${t.end_date.endsWith('-12-31') ? '✅ はい' : '❌ いいえ'}`)
  }
  if (tstTerms.length > 0) {
    const t = tstTerms[0]
    console.log(`法人 期首日: ${t.start_date}`)
    console.log(`法人 期末日: ${t.end_date}`)
    console.log(`法人 課税方式（tax_method）: ${t.tax_method}`)
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
