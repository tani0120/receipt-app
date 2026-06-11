/**
 * テスト: レシートOCR結果 → postJournals で MFに仕訳を直接登録
 *
 * レシートOCR結果:
 *   店名: 鳥貴族 谷町四丁目店
 *   日付: 2025-08-21 → テスト用に 2026-06-01
 *   金額: ¥7,410 → テスト用に ¥1
 *   登録番号: T2120001160795
 *
 * 実行: npx tsx src/scripts/test_receipt_to_journal.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

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
  console.log('  レシート → MF仕訳登録テスト（鳥貴族）')
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // Step 1: 勘定科目IDを取得
  // ============================
  console.log('━━━ Step 1: 勘定科目ID取得 ━━━\n')
  const accountsData = await callMcpTool<{ accounts: Array<{ id: string; name: string; account_group: string }> }>(
    'mfc_ca_getAccounts', { available: true }, TOKEN_KEY
  )

  const entertainmentAccount = accountsData.accounts.find(a => a.name === '接待交際費')
  const cashAccount = accountsData.accounts.find(a => a.name === '現金')

  if (!entertainmentAccount || !cashAccount) {
    console.log('  ❌ 科目（接待交際費 or 現金）が見つかりません')
    for (const a of accountsData.accounts.slice(0, 30)) {
      console.log(`    ${a.id} | ${a.name} | ${a.account_group}`)
    }
    return
  }
  console.log(`  接待交際費: ${entertainmentAccount.id}`)
  console.log(`  現金:       ${cashAccount.id}\n`)

  // ============================
  // Step 2: 仕訳登録（レシートOCR結果をそのまま）
  // ============================
  console.log('━━━ Step 2: postJournals — レシート仕訳登録 ━━━\n')

  const journalResult = await callMcpTool<{ journal: Journal }>(
    'mfc_ca_postJournals',
    {
      journal: {
        transaction_date: '2026-06-01',
        journal_type: 'journal_entry',
        memo: '【テスト1円】鳥貴族 谷町四丁目店 T2120001160795',
        tags: ['AI_TEST', '要削除', 'レシートOCR'],
        branches: [
          {
            debitor: {
              account_id: entertainmentAccount.id,  // 接待交際費
              value: 1,
              invoice_kind: 'INVOICE_KIND_QUALIFIED',  // 適格請求書あり（T番号あり）
            },
            creditor: {
              account_id: cashAccount.id,  // 現金
              value: 1,
            },
            remark: '鳥貴族 谷町四丁目店',
          },
        ],
      },
    },
    TOKEN_KEY
  )

  const posted = journalResult.journal
  console.log(`  ✅ 仕訳登録成功！`)
  console.log(`  仕訳ID:        ${posted.id}`)
  console.log(`  is_realized:   ${posted.is_realized}`)
  console.log(`  取引日:        ${posted.transaction_date}`)
  console.log(`  メモ:          ${posted.memo}`)
  console.log(`  タグ:          ${posted.tags?.join(', ')}`)
  console.log()

  for (const branch of posted.branches) {
    console.log(`  借方: ${branch.debitor?.account_name} ¥${branch.debitor?.value}`)
    console.log(`  貸方: ${branch.creditor?.account_name} ¥${branch.creditor?.value}`)
    console.log(`  摘要: ${branch.remark}`)
  }

  console.log('\n━━━ 結果まとめ ━━━\n')
  console.log(`  【削除対象】仕訳ID: ${posted.id}`)
  console.log(`  タグ: AI_TEST, 要削除, レシートOCR`)
  console.log()
  console.log(`  → MFクラウド会計の仕訳帳を開いて、この仕訳が表示されているか確認してください`)
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
