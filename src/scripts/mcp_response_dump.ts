/**
 * MCPツールのレスポンス構造をダンプする
 *
 * 定型パターン実装に必要な「各ツールが何を返すか」を確認する。
 * 主要ツールを呼び出して、レスポンスのJSON構造（キー名・型）を出力。
 *
 * 実行: npx tsx src/scripts/mcp_response_dump.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../api/services/mfMcpClient'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

/** オブジェクトの構造（キー名と型）だけを抽出する */
function extractStructure(obj: unknown, depth = 0, maxDepth = 4): unknown {
  if (depth > maxDepth) return '...(深すぎ)'
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    // 配列の最初の要素だけ構造を見る
    return [extractStructure(obj[0], depth + 1, maxDepth), `...（計${obj.length}件）`]
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = extractStructure(value, depth + 1, maxDepth)
    }
    return result
  }
  // プリミティブは型名と値の例を返す
  if (typeof obj === 'string') {
    return obj.length > 50 ? `string("${obj.slice(0, 50)}...")` : `string("${obj}")`
  }
  return `${typeof obj}(${obj})`
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  MCPツール レスポンス構造ダンプ')
  console.log('═══════════════════════════════════════════════\n')

  const results: Record<string, unknown> = {}

  // 主要ツールを呼び出してレスポンス構造を取得
  const calls: { name: string; args: Record<string, unknown> }[] = [
    { name: 'mfc_ca_en_ja_dictionary', args: {} },
    { name: 'mfc_ca_currentOffice', args: {} },
    { name: 'mfc_ca_getTermSettings', args: {} },
    { name: 'mfc_ca_getAccounts', args: { available: true } },
    { name: 'mfc_ca_getTaxes', args: { available: true } },
    { name: 'mfc_ca_getTradePartners', args: {} },
    { name: 'mfc_ca_getDepartments', args: {} },
    { name: 'mfc_ca_getConnectedAccounts', args: {} },
    { name: 'mfc_ca_getSubAccounts', args: {} },
    { name: 'mfc_ca_getJournals', args: { start_date: '2025-01-01', end_date: '2025-12-31', per_page: 3 } },
    { name: 'mfc_ca_getReportsTrialBalanceProfitLoss', args: { fiscal_year: 2025 } },
    { name: 'mfc_ca_getReportsTrialBalanceBalanceSheet', args: { fiscal_year: 2025 } },
    { name: 'mfc_ca_getReportsTransitionProfitLoss', args: { type: 'monthly', fiscal_year: 2025 } },
  ]

  for (const { name, args } of calls) {
    console.log(`\n▼ ${name}`)
    try {
      const parsed = await callMcpTool(name, args, TOKEN_KEY)
      const structure = extractStructure(parsed)
      results[name] = {
        args,
        responseStructure: structure,
      }
      console.log('  ✅ 取得完了')
      const structStr = JSON.stringify(structure, null, 2)
      // 先頭20行だけ表示
      console.log('  構造:', structStr.split('\n').slice(0, 20).join('\n'))
    } catch (e) {
      console.log(`  ❌ エラー: ${(e as Error).message}`)
      results[name] = { args, error: (e as Error).message }
    }
  }

  // JSON保存
  const outputDir = join(process.cwd(), 'data', 'test-results')
  try { mkdirSync(outputDir, { recursive: true }) } catch { /* ok */ }
  const outputPath = join(outputDir, 'mcp_response_structures.json')
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\n📁 JSON保存: ${outputPath}`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
