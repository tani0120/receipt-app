/**
 * 正しいenum値でinvoice_kindテスト（本則課税）
 * MCPバリデーションで判明した正しいenum:
 *   INVOICE_KIND_NOT_TARGET / INVOICE_KIND_QUALIFIED / INVOICE_KIND_UNQUALIFIED_80
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { mcpFetchAccounts, mcpCreateJournal } from '../api/services/mfMcpClient'

const TK = 'c_wTdnMKDO'

const KINDS = [
  { label: '省略', value: undefined },
  { label: 'QUALIFIED', value: 'INVOICE_KIND_QUALIFIED' },
  { label: 'NOT_TARGET', value: 'INVOICE_KIND_NOT_TARGET' },
  { label: 'UNQUALIFIED_80', value: 'INVOICE_KIND_UNQUALIFIED_80' },
] as const

async function main() {
  console.log(`━━━ 本則課税 invoice_kind正しいenum値テスト ━━━\n`)

  const accts = await mcpFetchAccounts(TK)
  const supplies = accts.find(a => a.name === '消耗品費')
  const cash = accts.find(a => a.name === '現金')
  if (!supplies || !cash) {
    console.log('科目が見つからない')
    process.exit(1)
  }

  for (const kind of KINDS) {
    console.log(`--- ${kind.label} ---`)
    try {
      const debitor: Record<string, unknown> = { account_id: supplies.id, value: 1 }
      const creditor: Record<string, unknown> = { account_id: cash.id, value: 1 }
      if (kind.value !== undefined) {
        debitor.invoice_kind = kind.value
        creditor.invoice_kind = kind.value
      }

      const result = await mcpCreateJournal({
        transaction_date: '2026-05-23',
        journal_type: 'journal_entry',
        memo: `【テスト】${kind.label}`,
        tags: ['AI_TEST'],
        branches: [{ debitor, creditor, remark: `${kind.label}` }] as never[],
      }, TK)

      const raw = result as Record<string, unknown>
      const branches = raw.branches as Array<Record<string, unknown>> | undefined
      const d = branches?.[0]?.debitor as Record<string, unknown> | undefined
      console.log(`  ✅ 成功 MF#${raw.number} invoice_kind=${d?.invoice_kind ?? '不明'}`)
    } catch (e) {
      console.log(`  ❌ 失敗: ${e instanceof Error ? e.message : e}`)
    }
    console.log()
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
