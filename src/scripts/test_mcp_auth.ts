/**
 * alpha版とbeta版の全ツールの全スキーマを出力して認証以外の差異を比較
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

const ALPHA_URL = 'https://alpha.mcp.developers.biz.moneyforward.com/mcp/ca/v3'
const BETA_URL = 'https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3'

async function main() {
  const { getValidAccessToken } = await import('../api/services/mfAuthService')
  const token = await getValidAccessToken('c_rODnkCDN')

  const alphaClient = new Client({ name: 'test-alpha', version: '1.0.0' })
  await alphaClient.connect(new StreamableHTTPClientTransport(new URL(ALPHA_URL), {}))
  const alphaTools = await alphaClient.listTools()

  const betaClient = new Client({ name: 'test-beta', version: '1.0.0' })
  await betaClient.connect(new StreamableHTTPClientTransport(new URL(BETA_URL), {
    requestInit: { headers: { 'Authorization': `Bearer ${token}` } }
  }))
  const betaTools = await betaClient.listTools()

  const alphaMap = new Map(alphaTools.tools.map(t => [t.name, t]))
  const betaMap = new Map(betaTools.tools.map(t => [t.name, t]))

  // 共通ツールのaccess_token以外の差異
  console.log('\n=== 共通ツール: access_token以外のプロパティ差異 ===')
  for (const [name, betaTool] of betaMap) {
    const alphaTool = alphaMap.get(name)
    if (!alphaTool) continue

    const alphaProps = { ...(alphaTool.inputSchema as Record<string, unknown>)?.properties as Record<string, unknown> || {} }
    const betaProps = { ...(betaTool.inputSchema as Record<string, unknown>)?.properties as Record<string, unknown> || {} }
    
    // access_tokenを除外して比較
    delete alphaProps['access_token']
    
    const alphaStr = JSON.stringify(alphaProps)
    const betaStr = JSON.stringify(betaProps)
    
    if (alphaStr !== betaStr) {
      console.log(`\n⚠️ ${name} — 認証以外の差異あり`)
      console.log(`  alpha: ${alphaStr.substring(0, 1000)}`)
      console.log(`  beta:  ${betaStr.substring(0, 1000)}`)
    }
  }

  // 代表的なツール3つの全スキーマを出力（税区分・仕訳取得・科目取得）
  const targetTools = ['mfc_ca_getTaxes', 'mfc_ca_getJournals', 'mfc_ca_getAccounts']
  
  for (const name of targetTools) {
    console.log(`\n\n=== ${name} 全スキーマ比較 ===`)
    const a = alphaMap.get(name)
    const b = betaMap.get(name)
    if (a) {
      console.log(`\n--- alpha版 ---`)
      console.log(`説明: ${a.description}`)
      console.log(`スキーマ: ${JSON.stringify(a.inputSchema, null, 2)}`)
    }
    if (b) {
      console.log(`\n--- beta版 ---`)
      console.log(`説明: ${b.description}`)
      console.log(`スキーマ: ${JSON.stringify(b.inputSchema, null, 2)}`)
    }
  }

  // alpha版で税区分取得して中身を比較
  console.log('\n\n=== alpha版 getTaxes 実行結果 ===')
  try {
    const result = await alphaClient.callTool({
      name: 'mfc_ca_getTaxes',
      arguments: { access_token: token }
    })
    const text = ((result.content as Array<{type: string; text?: string}>)[0])?.text || ''
    const taxes = JSON.parse(text)
    console.log(`税区分数: ${Array.isArray(taxes) ? taxes.length : '不明'}`)
    if (Array.isArray(taxes)) {
      // 最初の3件
      console.log(`先頭3件: ${JSON.stringify(taxes.slice(0, 3), null, 2)}`)
    } else {
      console.log(`構造: ${JSON.stringify(taxes).substring(0, 2000)}`)
    }
  } catch (err: unknown) {
    console.log(`❌: ${(err as Error).message}`)
  }

  // beta版で税区分取得
  console.log('\n\n=== beta版 getTaxes 実行結果 ===')
  try {
    const result = await betaClient.callTool({
      name: 'mfc_ca_getTaxes',
      arguments: {}
    })
    const text = ((result.content as Array<{type: string; text?: string}>)[0])?.text || ''
    const taxes = JSON.parse(text)
    console.log(`税区分数: ${Array.isArray(taxes) ? taxes.length : '不明'}`)
    if (Array.isArray(taxes)) {
      console.log(`先頭3件: ${JSON.stringify(taxes.slice(0, 3), null, 2)}`)
    } else {
      console.log(`構造: ${JSON.stringify(taxes).substring(0, 2000)}`)
    }
  } catch (err: unknown) {
    console.log(`❌: ${(err as Error).message}`)
  }

  await alphaClient.close()
  await betaClient.close()
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
