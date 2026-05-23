/**
 * UNQUALIFIED_80のみ再テスト（レート制限回避で単発実行）
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { mcpFetchAccounts, mcpCreateJournal } from '../api/services/mfMcpClient'

const TK = 'c_wTdnMKDO'

async function main() {
  console.log(`━━━ UNQUALIFIED_80 単発テスト ━━━\n`)

  const accts = await mcpFetchAccounts(TK)
  const supplies = accts.find(a => a.name === '消耗品費')
  const cash = accts.find(a => a.name === '現金')
  if (!supplies || !cash) { console.log('科目なし'); process.exit(1) }

  // 借方のみinvoice_kindを設定（貸方は省略）
  console.log('--- テスト1: 借方のみUNQUALIFIED_80 ---')
  try {
    const r = await mcpCreateJournal({
      transaction_date: '2026-05-23',
      journal_type: 'journal_entry',
      memo: '【テスト】UNQUALIFIED_80 借方のみ',
      tags: ['AI_TEST'],
      branches: [{
        debitor: { account_id: supplies.id, value: 1, invoice_kind: 'INVOICE_KIND_UNQUALIFIED_80' } as never,
        creditor: { account_id: cash.id, value: 1 },
        remark: 'UNQUALIFIED_80借方のみ',
      }],
    }, TK)
    const raw = r as Record<string, unknown>
    const branches = raw.branches as Array<Record<string, unknown>> | undefined
    const d = branches?.[0]?.debitor as Record<string, unknown> | undefined
    const c = branches?.[0]?.creditor as Record<string, unknown> | undefined
    console.log(`  ✅ 成功 MF#${raw.number}`)
    console.log(`  借方invoice_kind: ${d?.invoice_kind}`)
    console.log(`  貸方invoice_kind: ${c?.invoice_kind}`)
  } catch (e) {
    console.log(`  ❌ 失敗: ${e instanceof Error ? e.message : e}`)
  }

  console.log()

  // 両方にinvoice_kindを設定
  console.log('--- テスト2: 両方UNQUALIFIED_80 ---')
  try {
    const r = await mcpCreateJournal({
      transaction_date: '2026-05-23',
      journal_type: 'journal_entry',
      memo: '【テスト】UNQUALIFIED_80 両方',
      tags: ['AI_TEST'],
      branches: [{
        debitor: { account_id: supplies.id, value: 1, invoice_kind: 'INVOICE_KIND_UNQUALIFIED_80' } as never,
        creditor: { account_id: cash.id, value: 1, invoice_kind: 'INVOICE_KIND_UNQUALIFIED_80' } as never,
        remark: 'UNQUALIFIED_80両方',
      }],
    }, TK)
    const raw = r as Record<string, unknown>
    console.log(`  ✅ 成功 MF#${raw.number}`)
  } catch (e) {
    console.log(`  ❌ 失敗: ${e instanceof Error ? e.message : e}`)
  }

  console.log()

  // QUALIFIEDも借方のみで試す
  console.log('--- テスト3: 借方のみQUALIFIED ---')
  try {
    const r = await mcpCreateJournal({
      transaction_date: '2026-05-23',
      journal_type: 'journal_entry',
      memo: '【テスト】QUALIFIED 借方のみ',
      tags: ['AI_TEST'],
      branches: [{
        debitor: { account_id: supplies.id, value: 1, invoice_kind: 'INVOICE_KIND_QUALIFIED' } as never,
        creditor: { account_id: cash.id, value: 1 },
        remark: 'QUALIFIED借方のみ',
      }],
    }, TK)
    const raw = r as Record<string, unknown>
    console.log(`  ✅ 成功 MF#${raw.number}`)
  } catch (e) {
    console.log(`  ❌ 失敗: ${e instanceof Error ? e.message : e}`)
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
