/**
 * N:N送信テスト — ダミー行なし（各branch独立）
 *
 * MFのN:N仕訳POSTで「value is required」エラーが出た原因を特定する。
 * 各branchにdebitor/creditor両方とも独立した科目・金額を設定。
 *
 * 実行: npx tsx src/scripts/test_nn_send.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { mcpFetchAccounts, mcpCreateJournal } from '../api/services/mfMcpClient'

const TK = process.env['MF_TEST_TOKEN_KEY'] ?? ''

async function main() {
  console.log('━━━ N:N送信テスト（ダミーなし・各branch独立） ━━━\n')

  const accts = await mcpFetchAccounts(TK)
  const find = (name: string) => {
    const a = accts.find(a => a.name === name)
    if (!a) throw new Error(`科目「${name}」が見つからない`)
    return a
  }

  const supplies = find('消耗品費')
  const cash = find('現金')
  const outsourcing = find('外注工賃')
  const fees = find('支払手数料')

  console.log('科目ID確認:')
  console.log(`  消耗品費: ${supplies.id}`)
  console.log(`  現金: ${cash.id}`)
  console.log(`  外注工賃: ${outsourcing.id}`)
  console.log(`  支払手数料: ${fees.id}\n`)

  // パターン: 各branchにdebitor/creditor両方設定（ダミーなし）
  // branch[0]: 消耗品費1 / 現金1
  // branch[1]: 外注工賃1 / 現金1
  // branch[2]: 支払手数料1 / 現金1
  // → MF側では借方3科目、貸方は現金3円（合計一致）
  console.log('送信中...')

  try {
    const result = await mcpCreateJournal({
      transaction_date: '2026-05-23',
      journal_type: 'journal_entry',
      memo: '【テスト】N:N 3:1 各branch独立',
      tags: ['AI_TEST'],
      branches: [
        {
          debitor: { account_id: supplies.id, value: 1 },
          creditor: { account_id: cash.id, value: 1 },
          remark: 'N:Nテスト branch[0]',
        },
        {
          debitor: { account_id: outsourcing.id, value: 1 },
          creditor: { account_id: cash.id, value: 1 },
          remark: '',
        },
        {
          debitor: { account_id: fees.id, value: 1 },
          creditor: { account_id: cash.id, value: 1 },
          remark: '',
        },
      ],
    }, TK)

    console.log('\n✅ 成功！')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('\n❌ 失敗:', err instanceof Error ? err.message : err)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
