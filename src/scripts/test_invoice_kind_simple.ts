/**
 * 個人(c_wTdnMKDO)でinvoice_kind 4パターンテスト
 * 課税方式を変更しながら繰り返し実行する
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { mcpFetchAccounts, mcpCreateJournal } from '../api/services/mfMcpClient'

const TK = 'c_wTdnMKDO'

const KINDS = [
  { label: '省略', value: undefined },
  { label: 'INVOICE_KIND_QUALIFIED', value: 'INVOICE_KIND_QUALIFIED' },
  { label: 'INVOICE_KIND_NOT_QUALIFIED', value: 'INVOICE_KIND_NOT_QUALIFIED' },
  { label: 'INVOICE_KIND_NOT_TARGET', value: 'INVOICE_KIND_NOT_TARGET' },
] as const

async function main() {
  // まず課税方式を確認
  const { callMcpTool } = await import('../api/services/mfMcpClient')
  const office = await callMcpTool('mfc_ca_currentOffice', {}, TK) as Record<string, unknown>
  console.log(`━━━ 個人事業者 invoice_kindテスト ━━━`)
  console.log(`  事業者名: ${office.name}`)
  console.log(`  種別: ${office.type}`)
  // 全フィールド出力して課税方式を特定
  for (const [k, v] of Object.entries(office)) {
    if (v != null && v !== '' && !Array.isArray(v) && typeof v !== 'object') {
      console.log(`  ${k}: ${v}`)
    }
  }
  console.log()

  // 科目取得
  const accts = await mcpFetchAccounts(TK)
  const supplies = accts.find(a => a.name === '消耗品費')
  const cash = accts.find(a => a.name === '現金')
  if (!supplies || !cash) {
    console.log('科目が見つからない')
    console.log('利用可能:', accts.filter(a => a.available).map(a => a.name).join(', '))
    process.exit(1)
  }

  // 4パターンテスト
  for (const kind of KINDS) {
    console.log(`--- テスト: ${kind.label} ---`)
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
        memo: `【テスト】invoice_kind=${kind.label}`,
        tags: ['AI_TEST'],
        branches: [{ debitor, creditor, remark: `${kind.label}テスト` }] as never[],
      }, TK)

      const raw = result as Record<string, unknown>
      console.log(`  ✅ 成功 MF#${raw.number}`)
      // invoice_kindがレスポンスに含まれるか確認
      const branches = raw.branches as Array<Record<string, unknown>> | undefined
      if (branches?.[0]) {
        const d = branches[0].debitor as Record<string, unknown> | undefined
        console.log(`  レスポンスのinvoice_kind(借方): ${d?.invoice_kind ?? '含まれない'}`)
      }
    } catch (e) {
      console.log(`  ❌ 失敗: ${e instanceof Error ? e.message : e}`)
    }
    console.log()
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
