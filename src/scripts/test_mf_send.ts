/**
 * test_mf_send.ts — Sugusru → MF 仕訳送信テスト
 *
 * テスト手順:
 *   1. マッピングテーブル生成（Sugusru概念ID → MF-ID）
 *   2. テスト用Sugusru仕訳（正しい概念ID使用）を作成
 *   3. 金額を1円に置換（テスト安全策）
 *   4. 変換（JournalPhase5Mock → postJournals形式）
 *   5. 送信（MCP経由でMFに登録）
 *   6. 結果表示
 *
 * 実行: npx tsx src/scripts/test_mf_send.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { buildAllMaps, clearMappingCache } from '../api/services/mfMappingService'
import { convertToMfJournal, validateBeforeConvert, type SourceJournal } from '../api/services/journalToMfConverter'
import { sendJournalToMf } from '../api/services/mfJournalSender'

const TK = process.env['MF_TEST_TOKEN_KEY'] ?? ''
if (!TK) {
  console.error('MF_TEST_TOKEN_KEY が .env.local に設定されていません')
  process.exit(1)
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Sugusru → MF 仕訳送信テスト                   ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // ━━━ Step 1: マッピングテーブル生成 ━━━
  console.log('━━━ Step 1: マッピングテーブル生成 ━━━\n')
  clearMappingCache()
  const maps = await buildAllMaps(TK)

  console.log(`  科目マッチ: ${maps.accountMap.size}件`)
  console.log(`  税区分マッチ: ${maps.taxMap.size}件`)
  console.log(`  補助科目: ${maps.subAccountMap.size}件`)
  console.log(`  部門: ${maps.departmentMap.size}件`)
  console.log(`  取引先: ${maps.tradePartnerMap.size}件`)

  if (maps.unmatchedAccounts.length > 0) {
    console.log(`\n  ⚠️ 未マッチ科目 (${maps.unmatchedAccounts.length}件):`)
    maps.unmatchedAccounts.slice(0, 10).forEach(a =>
      console.log(`    ✗ ${a.sugusruId} (${a.sugusruName})`))
    if (maps.unmatchedAccounts.length > 10) console.log(`    ... 他 ${maps.unmatchedAccounts.length - 10}件`)
  }
  if (maps.unmatchedTaxes.length > 0) {
    console.log(`\n  ⚠️ 未マッチ税区分 (${maps.unmatchedTaxes.length}件):`)
    maps.unmatchedTaxes.slice(0, 10).forEach(t =>
      console.log(`    ✗ ${t.sugusruId} (${t.sugusruName})`))
    if (maps.unmatchedTaxes.length > 10) console.log(`    ... 他 ${maps.unmatchedTaxes.length - 10}件`)
  }
  console.log()

  // ━━━ Step 2: テスト仕訳作成（1:1 / 3:1 の2パターン） ━━━
  console.log('━━━ Step 2: テスト仕訳作成 ━━━\n')

  // テスト仕訳A: 1:1（消耗品費/現金 1円）
  const testA: SourceJournal = {
    id: 'test-send-1to1',
    voucher_date: '2026-05-23',
    description: '【送信テスト】1:1 消耗品費/現金 1円',
    debit_entries: [
      { account: 'SUPPLIES', sub_account: null, department: null, amount: 1, tax_category_id: 'PURCHASE_TAXABLE_10' },
    ],
    credit_entries: [
      { account: 'CASH', sub_account: null, department: null, amount: 1, tax_category_id: 'COMMON_EXEMPT' },
    ],
  }

  // テスト仕訳B: 3:1 金額バラバラ（対向金額一致方式の検証）
  const testB: SourceJournal = {
    id: 'test-send-3to1-varied',
    voucher_date: '2026-05-23',
    description: '【送信テスト】3:1 N:N 金額バラバラ 10円',
    debit_entries: [
      { account: 'ORDINARY_DEPOSIT', sub_account: null, department: null, amount: 5, tax_category_id: 'COMMON_EXEMPT' },
      { account: 'OUTSOURCING', sub_account: null, department: null, amount: 3, tax_category_id: 'PURCHASE_TAXABLE_10' },
      { account: 'FEES', sub_account: null, department: null, amount: 2, tax_category_id: 'PURCHASE_TAXABLE_10' },
    ],
    credit_entries: [
      { account: 'SALES', sub_account: null, department: null, amount: 10, tax_category_id: 'SALES_TAXABLE_10' },
    ],
  }

  const tests = [testA, testB]

  for (const test of tests) {
    console.log(`  テスト: ${test.id}`)
    console.log(`    摘要: ${test.description}`)
    console.log(`    借方: ${test.debit_entries.map(e => `${e.account} ¥${e.amount}`).join(' + ')}`)
    console.log(`    貸方: ${test.credit_entries.map(e => `${e.account} ¥${e.amount}`).join(' + ')}`)
    console.log()
  }

  // ━━━ Step 3: バリデーション ━━━
  console.log('━━━ Step 3: バリデーション ━━━\n')

  for (const test of tests) {
    const errors = validateBeforeConvert(test, maps)
    if (errors.length === 0) {
      console.log(`  ✅ ${test.id}: バリデーションOK`)
    } else {
      console.log(`  ❌ ${test.id}: バリデーションNG`)
      errors.forEach(e => console.log(`    - ${e.type}: ${e.message}`))
    }
  }
  console.log()

  // ━━━ Step 4: 変換（ドライラン） ━━━
  console.log('━━━ Step 4: 変換（ドライラン） ━━━\n')

  for (const test of tests) {
    const { payload, errors } = convertToMfJournal(test, maps)
    if (payload) {
      console.log(`  ✅ ${test.id}: 変換成功`)
      console.log(`    transaction_date: ${payload.transaction_date}`)
      console.log(`    branches: ${payload.branches.length}行`)
      for (const [i, b] of payload.branches.entries()) {
        console.log(`      branch[${i}]: debit=${b.debitor.account_id.substring(0, 15)}... ¥${b.debitor.value} / credit=${b.creditor.account_id.substring(0, 15)}... ¥${b.creditor.value} | remark="${b.remark}"`)
      }
      console.log(`    memo: ${payload.memo}`)
      console.log(`    tags: ${payload.tags?.join(', ')}`)
    } else {
      console.log(`  ❌ ${test.id}: 変換失敗`)
      errors.forEach(e => console.log(`    - ${e.message}`))
    }
    console.log()
  }

  // ━━━ Step 5: MF送信（1円テスト） ━━━
  console.log('━━━ Step 5: MF送信（1円テスト） ━━━\n')

  const sendTargets = tests.filter(t => {
    const errors = validateBeforeConvert(t, maps)
    return errors.length === 0
  })

  if (sendTargets.length === 0) {
    console.log('  送信可能な仕訳なし（バリデーションエラー）')
    return
  }

  for (const test of sendTargets) {
    console.log(`  送信中: ${test.id}...`)
    const result = await sendJournalToMf(test, TK, maps)

    if (result.success) {
      console.log(`  ✅ 成功！`)
      console.log(`    MF-ID: ${result.mfId}`)
      console.log(`    MF番号: ${result.mfNumber}`)
    } else {
      console.log(`  ❌ 失敗`)
      if (result.conversionErrors) {
        result.conversionErrors.forEach(e => console.log(`    変換エラー: ${e.message}`))
      }
      if (result.sendError) {
        console.log(`    送信エラー: ${result.sendError}`)
      }
    }
    console.log()
  }

  // ━━━ 結果まとめ ━━━
  console.log('━━━ 結果まとめ ━━━\n')
  console.log('  送信したテスト仕訳はMF上で「取引No.」を取得しています。')
  console.log('  MF管理画面で確認後、テスト仕訳を削除してください。')
}

main().catch(e => {
  console.error('エラー:', e)
  process.exit(1)
})
