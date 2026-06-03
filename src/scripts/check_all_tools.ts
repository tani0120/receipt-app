/**
 * 全19ツールの名前・説明・入力スキーマを出力し、
 * 課税方式の日本語名を返す可能性のあるツールを特定する
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { listMcpTools } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'

async function main() {
  const tools = await listMcpTools(TST_KEY)
  for (const t of tools) {
    console.log(`\n=== ${t.name} ===`)
    console.log(`説明: ${t.description}`)
    console.log(`入力スキーマ: ${JSON.stringify(t.inputSchema, null, 2)}`)
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
