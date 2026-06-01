/**
 * TSK（c_wTdnMKDO）にテスト仕訳を送信し、
 * account_id/tax_idの省略パターンを検証するスクリプト
 */
import 'dotenv/config'
import { mcpFetchTaxes, mcpFetchAccounts, mcpCreateJournal } from '../src/api/services/mfMcpClient.js'

const TSK_TOKEN = 'c_wTdnMKDO'

async function main() {
  // まずTSKの科目・税区分のmfIdを取得
  const taxes = await mcpFetchTaxes(TSK_TOKEN)
  const accounts = await mcpFetchAccounts(TSK_TOKEN)

  // 基本的な科目・税区分を特定
  const genkin = accounts.find((a: any) => a.name === '現金')
  const uriage = accounts.find((a: any) => a.name === '売上高')
  const kazeiUriage10 = taxes.find((t: any) => t.name === '課税売上 10%')
  const taisyogai = taxes.find((t: any) => t.name === '対象外')

  console.log('=== TSK データ取得 ===')
  console.log(`現金: id=${genkin?.id}, name=${genkin?.name}`)
  console.log(`売上高: id=${uriage?.id}, name=${uriage?.name}`)
  console.log(`課税売上10%: id=${kazeiUriage10?.id}, name=${kazeiUriage10?.name}`)
  console.log(`対象外: id=${taisyogai?.id}, name=${taisyogai?.name}`)
  console.log('')

  const results: Array<{test: string; success: boolean; detail: string}> = []

  // ────────────────────────────────────────
  // テスト1: account_id + tax_id（正常系）
  // ────────────────────────────────────────
  try {
    console.log('--- テスト1: account_id + tax_id（正常系） ---')
    const res = await mcpCreateJournal({
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [{
        debitor: { account_id: genkin.id, value: 100, tax_id: taisyogai.id },
        creditor: { account_id: uriage.id, value: 100, tax_id: kazeiUriage10.id },
        remark: 'テスト1: ID完全指定',
      }],
      memo: 'sugusru-test-1-full-ids',
    }, TSK_TOKEN)
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 200))
    results.push({ test: 'テスト1: account_id + tax_id', success: true, detail: `MF#${(res as any).number}` })
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 300))
    results.push({ test: 'テスト1: account_id + tax_id', success: false, detail: e.message?.substring(0, 200) })
  }

  // ────────────────────────────────────────
  // テスト2: account_id のみ（tax_id省略）
  // ────────────────────────────────────────
  try {
    console.log('--- テスト2: account_id のみ（tax_id省略） ---')
    const res = await mcpCreateJournal({
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [{
        debitor: { account_id: genkin.id, value: 200 },
        creditor: { account_id: uriage.id, value: 200 },
        remark: 'テスト2: tax_id省略',
      }],
      memo: 'sugusru-test-2-no-tax-id',
    }, TSK_TOKEN)
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 200))
    results.push({ test: 'テスト2: account_idのみ（tax_id省略）', success: true, detail: `MF#${(res as any).number}` })
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 300))
    results.push({ test: 'テスト2: account_idのみ（tax_id省略）', success: false, detail: e.message?.substring(0, 200) })
  }

  // ────────────────────────────────────────
  // テスト3: account_id空文字 + tax_id（account_idなしで送れるか？）
  // ────────────────────────────────────────
  try {
    console.log('--- テスト3: account_id空文字（科目名なし） ---')
    const res = await mcpCreateJournal({
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [{
        debitor: { account_id: '', value: 300, tax_id: taisyogai.id },
        creditor: { account_id: '', value: 300, tax_id: kazeiUriage10.id },
        remark: 'テスト3: account_id空',
      }],
      memo: 'sugusru-test-3-no-account-id',
    }, TSK_TOKEN)
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 200))
    results.push({ test: 'テスト3: account_id空', success: true, detail: `MF#${(res as any).number}` })
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 300))
    results.push({ test: 'テスト3: account_id空', success: false, detail: e.message?.substring(0, 200) })
  }

  // ────────────────────────────────────────
  // テスト4: 科目名をaccount_idに入れたら？（名前で送信）
  // ────────────────────────────────────────
  try {
    console.log('--- テスト4: 科目名をaccount_idに入れる ---')
    const res = await mcpCreateJournal({
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [{
        debitor: { account_id: '現金', value: 400, tax_id: taisyogai.id },
        creditor: { account_id: '売上高', value: 400, tax_id: kazeiUriage10.id },
        remark: 'テスト4: 名前をIDとして送信',
      }],
      memo: 'sugusru-test-4-name-as-id',
    }, TSK_TOKEN)
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 200))
    results.push({ test: 'テスト4: 科目名をaccount_idに', success: true, detail: `MF#${(res as any).number}` })
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 300))
    results.push({ test: 'テスト4: 科目名をaccount_idに', success: false, detail: e.message?.substring(0, 200) })
  }

  // ────────────────────────────────────────
  // テスト5: 税区分名をtax_idに入れたら？
  // ────────────────────────────────────────
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
    console.log('✅ 成功:', JSON.stringify(res).substring(0, 200))
    results.push({ test: 'テスト5: 税区分名をtax_idに', success: true, detail: `MF#${(res as any).number}` })
  } catch (e: any) {
    console.log('❌ 失敗:', e.message?.substring(0, 300))
    results.push({ test: 'テスト5: 税区分名をtax_idに', success: false, detail: e.message?.substring(0, 200) })
  }

  // ────────────────────────────────────────
  // 結果まとめ
  // ────────────────────────────────────────
  console.log('\n=== 結果まとめ ===')
  for (const r of results) {
    console.log(`${r.success ? '✅' : '❌'} ${r.test}: ${r.detail}`)
  }
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1) })
