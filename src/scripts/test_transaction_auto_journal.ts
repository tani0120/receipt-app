/**
 * テスト: postTransactions で科目なし明細を投げて、MF側の自動仕訳が適用されるか確認
 *
 * 目的:
 *   レシートOCR結果を「明細」としてMFに投げた場合、
 *   MF側の自動仕訳ルールが科目を自動判定するかを検証する。
 *   → これが動くなら sugu-sru の科目判定AIは不要になりうる。
 *
 * 実行: npx tsx src/scripts/test_transaction_auto_journal.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  postTransactions 自動仕訳テスト')
  console.log('  科目なしで明細を投げ → MFが自動で科目を付けるか？')
  console.log('═══════════════════════════════════════════════\n')

  // ============================
  // Step 1: 連携サービス一覧を取得
  // ============================
  console.log('━━━ Step 1: 連携サービス一覧 ━━━\n')
  const connectedData = await callMcpTool<{
    connected_accounts: Array<{
      id: string
      service_name?: string
      name?: string
      type?: string
      status?: string
    }>
  }>('mfc_ca_getConnectedAccounts', {}, TOKEN_KEY)

  console.log(`  取得件数: ${connectedData.connected_accounts.length}件\n`)

  if (connectedData.connected_accounts.length === 0) {
    console.log('  ❌ 連携サービスが0件。MFの「データ連携」→「新規登録」で作成してください。')
    return
  }

  for (const ca of connectedData.connected_accounts) {
    console.log(`  ID: ${ca.id}`)
    console.log(`  名前: ${ca.service_name ?? ca.name ?? '不明'}`)
    console.log(`  種別: ${ca.type ?? '不明'}`)
    console.log(`  状態: ${ca.status ?? '不明'}`)
    console.log()
  }

  // 最初の連携サービスを使う
  const targetCA = connectedData.connected_accounts[0]!
  console.log(`  → 対象: ${targetCA.service_name ?? targetCA.name ?? targetCA.id}\n`)

  // ============================
  // Step 2: 科目なし明細を投げる
  // ============================
  console.log('━━━ Step 2: postTransactions — 科目なし明細を投げる ━━━\n')
  console.log('  送信内容:')
  console.log('    日付:     2026-06-01')
  console.log('    内容:     鳥貴族 谷町四丁目店')
  console.log('    区分:     EXPENSE（支出）')
  console.log('    金額:     1円')
  console.log('    科目:     指定なし ← ★ここがポイント')
  console.log('    メモ:     【テスト】科目なし明細。MF自動仕訳テスト。要削除。')
  console.log()

  try {
    const txResult = await callMcpTool<unknown>(
      'mfc_ca_postTransactions',
      {
        connected_account_id: targetCA.id,
        transactions: [
          {
            date: '2026-06-01',
            content: '鳥貴族 谷町四丁目店',
            side: 'EXPENSE',
            value: 1,
            memo: '【テスト】科目なし明細。MF自動仕訳テスト。要削除。',
          },
        ],
      },
      TOKEN_KEY
    )

    console.log('  ✅ 明細登録成功！')
    console.log('  レスポンス:')
    console.log(JSON.stringify(txResult, null, 2))
    console.log()
  } catch (e) {
    console.log(`  ❌ 明細登録失敗: ${e}`)
    console.log()
    return
  }

  // ============================
  // 結果確認手順
  // ============================
  console.log('━━━ 次のステップ（手動確認） ━━━\n')
  console.log('  MFクラウド会計にログインし、以下を確認してください:\n')
  console.log('  1. 「自動で仕訳」→「連携サービスから入力」を開く')
  console.log('  2. 登録した明細「鳥貴族 谷町四丁目店 ¥1」が表示されているか')
  console.log('  3. MFが自動で科目を提案しているか（青色背景 = AI提案）')
  console.log('  4. 自動仕訳ルールが適用されているか（白色背景 = ルール適用済み）')
  console.log()
  console.log('  → 科目が自動で付いていれば、sugu-sruの科目判定は不要になりうる')
  console.log('  → 科目が空（未分類）なら、MFの自動仕訳は新規取引先に対して働かない')
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
