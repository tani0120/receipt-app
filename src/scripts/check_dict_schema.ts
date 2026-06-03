/**
 * MCP英和辞書ツール（mfc_ca_en_ja_dictionary）の
 * 説明と入力スキーマを確認する
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { listMcpTools } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'

async function main() {
  const tools = await listMcpTools(TST_KEY)
  const dict = tools.find(t => t.name === 'mfc_ca_en_ja_dictionary')
  if (dict) {
    console.log('ツール名:', dict.name)
    console.log('説明:', dict.description)
    console.log('入力スキーマ:', JSON.stringify(dict.inputSchema, null, 2))
  } else {
    console.log('英和辞書ツールが見つからない')
  }
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
