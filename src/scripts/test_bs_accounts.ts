import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

const result = await callMcpTool(
  'mfc_ca_getReportsTrialBalanceBalanceSheet',
  { fiscal_year: 2026 },
  TOKEN_KEY
)
// 普通預金・現金周辺だけ表示
const rows = (result as Record<string, unknown>).rows as Array<Record<string, unknown>> ?? []
function printRows(items: Array<Record<string, unknown>>, depth = 0) {
  for (const r of items) {
    const indent = '  '.repeat(depth)
    const vals = r.values ? ` → ${r.values.join(' / ')}` : ''
    console.log(`${indent}${r.name} [${r.type}]${vals}`)
    if (r.rows) printRows(r.rows, depth + 1)
  }
}
printRows(rows)
