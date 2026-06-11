import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

// 仕訳を数件取得して、口座名に相当するフィールドがあるか確認
const result = await callMcpTool(
  'mfc_ca_getJournals',
  { start_date: '2026-01-01', end_date: '2026-06-11', per_page: 5 },
  TOKEN_KEY
)
const journals = (result as Record<string, unknown>).journals as Array<Record<string, unknown>> ?? []
for (const j of journals) {
  console.log(`\n── 仕訳 #${j.number} (${j.transaction_date}) ──`)
  console.log(`  entered_by: ${j.entered_by}`)
  console.log(`  memo: ${j.memo}`)
  for (const b of j.branches) {
    console.log(`  借方: ${b.debitor?.account_name} / 補助: ${b.debitor?.sub_account_name ?? 'なし'}`)
    console.log(`  貸方: ${b.creditor?.account_name} / 補助: ${b.creditor?.sub_account_name ?? 'なし'}`)
    console.log(`  摘要: ${b.remark}`)
  }
}
