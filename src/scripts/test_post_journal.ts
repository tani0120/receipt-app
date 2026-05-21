/**
 * テスト: postTransactions / postJournals の未実現(is_realized)挙動確認
 *
 * 目的:
 *   ① postTransactions で明細登録 → 自動仕訳ルール適用されるか？
 *   ② postJournals で仕訳登録 → is_realized はどうなるか？
 *   ③ 登録したIDを記録 → 後で削除可能に
 *
 * 実行: npx tsx src/scripts/test_post_journal.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

interface ConnectedAccount {
  id: string
  service_name: string
  type: string
  status: string
}

interface Journal {
  id: string
  transaction_date: string
  is_realized: boolean
  memo: string
  tags: string[]
  branches: Array<{
    debitor?: { account_id: string; account_name: string; value: number }
    creditor?: { account_id: string; account_name: string; value: number }
    remark: string
  }>
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  postTransactions / postJournals 未実現テスト')
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // Step 1: 連携サービス一覧を取得
  // ============================
  console.log('━━━ Step 1: 連携サービス一覧 ━━━\n')
  const connectedData = await callMcpTool<{ connected_accounts: ConnectedAccount[] }>(
    'mfc_ca_getConnectedAccounts', {}, TOKEN_KEY
  )
  for (const ca of connectedData.connected_accounts) {
    console.log(`  ${ca.id} | ${ca.service_name} | ${ca.type} | ${ca.status}`)
  }
  console.log(`\n  合計: ${connectedData.connected_accounts.length}件\n`)

  // ============================
  // Step 2: 勘定科目IDを取得（テスト用に消耗品費を使う）
  // ============================
  console.log('━━━ Step 2: 勘定科目ID取得 ━━━\n')
  const accountsData = await callMcpTool<{ accounts: Array<{ id: string; name: string; account_group: string }> }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )
  // 消耗品費を探す（テスト用。影響が小さい科目）
  const testAccount = accountsData.accounts.find(a => a.name === '消耗品費')
  // 現金を探す（借方用）
  const cashAccount = accountsData.accounts.find(a => a.name === '現金')

  if (!testAccount || !cashAccount) {
    console.log('  ❌ テスト用科目（消耗品費 or 現金）が見つかりません')
    console.log('  利用可能な科目:')
    for (const a of accountsData.accounts.slice(0, 20)) {
      console.log(`    ${a.id} | ${a.name} | ${a.account_group}`)
    }
    return
  }
  console.log(`  消耗品費: ${testAccount.id}`)
  console.log(`  現金:     ${cashAccount.id}\n`)

  // ============================
  // Step 3: postJournals で仕訳登録（is_realized確認用）
  // ============================
  console.log('━━━ Step 3: postJournals テスト ━━━\n')
  const testDate = '2026-06-01'  // 今期内の日付（帳簿制限回避）
  const testAmount = 1  // 1円（影響最小）

  const journalResult = await callMcpTool<{ journal: Journal }>(
    'mfc_ca_postJournals',
    {
      journal: {
        transaction_date: testDate,
        journal_type: 'journal_entry',
        memo: '【テスト】sugu-sru AI仕訳テスト。要削除。',
        tags: ['AI_TEST', '要削除'],
        branches: [
          {
            debitor: {
              account_id: testAccount.id,  // 消耗品費
              value: testAmount,
            },
            creditor: {
              account_id: cashAccount.id,  // 現金
              value: testAmount,
            },
            remark: 'AIテスト仕訳（1円）',
          },
        ],
      },
    },
    TOKEN_KEY
  )

  const postedJournal = journalResult.journal
  console.log(`  ✅ 仕訳登録成功`)
  console.log(`  仕訳ID: ${postedJournal.id}`)
  console.log(`  is_realized: ${postedJournal.is_realized}`)
  console.log(`  取引日: ${postedJournal.transaction_date}`)
  console.log(`  メモ: ${postedJournal.memo}`)
  console.log(`  タグ: ${postedJournal.tags?.join(', ')}`)
  console.log()

  // getJournalByIdで再確認
  console.log('  getJournalByIdで再確認...')
  const verifyResult = await callMcpTool<{ journal: Journal }>(
    'mfc_ca_getJournalById',
    { id: postedJournal.id },
    TOKEN_KEY
  )
  console.log(`  is_realized（再取得）: ${verifyResult.journal.is_realized}`)
  console.log()

  // ============================
  // Step 4: postTransactions テスト（連携サービスがある場合のみ）
  // ============================
  console.log('━━━ Step 4: postTransactions テスト ━━━\n')
  if (connectedData.connected_accounts.length === 0) {
    console.log('  ⚠️ 連携サービスなし。postTransactionsテストスキップ\n')
  } else {
    const targetCA = connectedData.connected_accounts[0]!
    console.log(`  対象連携サービス: ${targetCA.service_name} (${targetCA.id})\n`)

    try {
      const txResult = await callMcpTool<unknown>(
        'mfc_ca_postTransactions',
        {
          connected_account_id: targetCA.id,
          transactions: [
            {
              date: testDate,
              content: 'AIテスト明細（1円）要削除',
              side: 'EXPENSE',
              value: testAmount,
              memo: '【テスト】sugu-sru AI明細テスト。要削除。',
            },
          ],
        },
        TOKEN_KEY
      )
      console.log(`  ✅ 明細登録成功`)
      console.log(`  レスポンス:`, JSON.stringify(txResult, null, 2))
    } catch (e) {
      console.log(`  ❌ 明細登録失敗: ${e}`)
    }
  }

  // ============================
  // 結果まとめ
  // ============================
  console.log('\n━━━ 結果まとめ ━━━\n')
  console.log(`  【削除対象】`)
  console.log(`  仕訳ID: ${postedJournal.id}`)
  console.log(`  is_realized: ${postedJournal.is_realized}`)
  console.log(`  タグ: AI_TEST, 要削除`)
  console.log()
  console.log(`  is_realized の値:`)
  if (postedJournal.is_realized === true) {
    console.log(`    → postJournals は即確定（is_realized=true）`)
    console.log(`    → 「未実現」で登録するにはpostTransactionsを使う必要あり`)
  } else if (postedJournal.is_realized === false) {
    console.log(`    → postJournals は未実現（is_realized=false）で登録される！`)
    console.log(`    → MFのUI上で人間が「実現」に変更して確定するフロー成立`)
  } else {
    console.log(`    → is_realized フィールドが存在しない（値: ${postedJournal.is_realized}）`)
  }
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
