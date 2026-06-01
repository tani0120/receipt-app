/**
 * テスト5のみリトライ: 税区分名をtax_idに入れたら？
 */
import 'dotenv/config'
import { mcpFetchTaxes, mcpFetchAccounts, mcpCreateJournal } from '../src/api/services/mfMcpClient.js'

const TSK_TOKEN = 'c_wTdnMKDO'

async function main() {
  const taxes = await mcpFetchTaxes(TSK_TOKEN)
  const accounts = await mcpFetchAccounts(TSK_TOKEN)
  const genkin = accounts.find((a: any) => a.name === '現金')
  const uriage = accounts.find((a: any) => a.name === '売上高')

  try {
    console.log('--- テスト5: 税区分名をtax_idに入れる ---')
    const res = await mcpCreateJournal({
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [{
        debitor: { account_id: genkin.id, value: 500, tax_id: '対象外' },
        creditor: { account_id: uriage.id, value: 500, tax_id: '課税売上 10%' },
        remark: 'テスト5: 税区分名をIDとして送信',
      }],
      memo: 'sugusru-test-5-tax-name-as-id',
    }, TSK_TOKEN)
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 300))
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 400))
  }
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1) })
