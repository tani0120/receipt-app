/**
 * MF MCPサーバーの全ツール一覧をダンプする
 *
 * MCPプロトコルの tools/list を呼び出し、
 * AIが参照するtool schema（名前・説明・引数スキーマ）を全量出力する。
 *
 * 実行: npx tsx src/scripts/mcp_tools_dump.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { getValidAccessToken } from '../api/services/mfAuthService'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const MF_MCP_URL = 'https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3'
const CLIENT_INFO = { name: process.env['APP_NAME'] ?? 'app', version: '1.0.0' }

/** テスト対象のトークンキー */
const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  MF MCPサーバー ツール一覧ダンプ')
  console.log('═══════════════════════════════════════════════\n')

  // 1. アクセストークン取得
  console.log('→ アクセストークン取得中...')
  const accessToken = await getValidAccessToken(TOKEN_KEY)
  console.log('✅ トークン取得完了\n')

  // 2. MCP接続
  console.log('→ MCPサーバーに接続中...')
  const url = new URL(MF_MCP_URL)
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  }

  let client: Client

  try {
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: { headers },
    })
    client = new Client(CLIENT_INFO)
    await client.connect(transport)
    console.log('✅ 接続成功（StreamableHTTP）\n')
  } catch (e) {
    console.warn('⚠️ StreamableHTTP失敗、SSEにフォールバック:', (e as Error).message)
    const transport = new SSEClientTransport(url, {
      requestInit: { headers },
    })
    client = new Client(CLIENT_INFO)
    await client.connect(transport)
    console.log('✅ 接続成功（SSEフォールバック）\n')
  }

  // 3. tools/list 呼び出し
  console.log('→ tools/list を呼び出し中...\n')
  const toolsResult = await client.listTools()

  console.log(`✅ ${toolsResult.tools.length}個のツールを取得\n`)
  console.log('━'.repeat(60))

  // 4. 全ツールを詳細出力
  for (const tool of toolsResult.tools) {
    console.log(`\n▼ ${tool.name}`)
    console.log(`  説明: ${tool.description ?? '（なし）'}`)

    if (tool.inputSchema) {
      const schema = tool.inputSchema as Record<string, unknown>
      const properties = schema.properties as Record<string, unknown> | undefined
      const required = schema.required as string[] | undefined

      if (properties) {
        console.log('  引数:')
        for (const [key, value] of Object.entries(properties)) {
          const prop = value as Record<string, unknown>
          const isRequired = required?.includes(key) ? '【必須】' : '【任意】'
          const type = prop.type ?? '不明'
          const desc = prop.description ?? ''
          const enumValues = prop.enum ? ` [${(prop.enum as string[]).join(', ')}]` : ''
          console.log(`    ${isRequired} ${key}: ${type}${enumValues} — ${desc}`)
        }
      } else {
        console.log('  引数: なし')
      }
    }
  }

  console.log('\n' + '━'.repeat(60))

  // 5. JSON保存
  const outputDir = join(process.cwd(), 'data', 'test-results')
  try { mkdirSync(outputDir, { recursive: true }) } catch { /* ok */ }
  const outputPath = join(outputDir, 'mcp_tools_dump.json')
  writeFileSync(
    outputPath,
    JSON.stringify(toolsResult.tools, null, 2),
    'utf-8',
  )
  console.log(`\n📁 JSON保存: ${outputPath}`)

  // 6. 切断
  await client.close()
  console.log('✅ MCPサーバー切断完了')
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
