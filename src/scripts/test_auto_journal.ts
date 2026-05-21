/**
 * テスト: 過去仕訳参照 → 同パターンで新規仕訳登録
 *
 * フロー:
 *   ① MCP getJournals で過去仕訳を全件取得
 *   ② 摘要「コスト削減グループ」の仕訳を抽出
 *   ③ 科目・税区分・取引先パターンを表示（根拠）
 *   ④ 同じパターンで1円の仕訳を postJournals
 *   ⑤ 登録結果を表示（後で削除用にID記録）
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

interface Branch {
  debitor?: { account_id: string; account_name: string; value: number; tax_name?: string; tax_id?: string; trade_partner_code?: string }
  creditor?: { account_id: string; account_name: string; value: number; tax_name?: string; tax_id?: string; trade_partner_code?: string }
  remark: string
}

interface Journal {
  id: string
  transaction_date: string
  is_realized: boolean
  memo: string
  tags: string[]
  branches: Branch[]
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  過去仕訳参照 → 同パターン新規仕訳テスト')
  console.log('  対象摘要: コスト削減グループ')
  console.log('═══════════════════════════════════════════════════\n')

  // ============================
  // Step 1: 過去仕訳を取得（2025年全件）
  // ============================
  console.log('━━━ Step 1: 過去仕訳取得（2025年） ━━━\n')

  const allJournals: Journal[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await callMcpTool<{ journals: Journal[]; metadata: { total_count: number; total_pages: number } }>(
      'mfc_ca_getJournals',
      { start_date: '2025-01-01', end_date: '2025-12-31', per_page: 100, page },
      TOKEN_KEY
    )
    allJournals.push(...result.journals)
    totalPages = result.metadata.total_pages
    console.log(`  ページ ${page}/${totalPages}  取得: ${result.journals.length}件`)
    page++
  }
  console.log(`\n  合計: ${allJournals.length}件\n`)

  // ============================
  // Step 2: 「コスト削減グループ」を検索
  // ============================
  console.log('━━━ Step 2: 「コスト削減グループ」の仕訳を検索 ━━━\n')

  const targetKeyword = 'コスト削減'
  const matched = allJournals.filter(j =>
    j.branches.some(b => b.remark?.includes(targetKeyword))
  )

  console.log(`  ヒット: ${matched.length}件\n`)

  if (matched.length === 0) {
    console.log('  ❌ 該当仕訳なし。終了。')
    return
  }

  // ============================
  // Step 3: パターン分析（根拠表示）
  // ============================
  console.log('━━━ Step 3: 過去仕訳パターン（根拠） ━━━\n')

  // 科目パターンを集計
  const patterns = new Map<string, { count: number; totalAmount: number; debitId: string; creditId: string; debitTaxId?: string; creditTaxId?: string; tradePartnerCode?: string }>()

  for (const j of matched) {
    for (const b of j.branches) {
      const key = `${b.debitor?.account_name || '?'} / ${b.creditor?.account_name || '?'}`
      const existing = patterns.get(key) || {
        count: 0,
        totalAmount: 0,
        debitId: b.debitor?.account_id || '',
        creditId: b.creditor?.account_id || '',
        debitTaxId: b.debitor?.tax_id,
        creditTaxId: b.creditor?.tax_id,
        tradePartnerCode: b.creditor?.trade_partner_code || b.debitor?.trade_partner_code,
      }
      existing.count++
      existing.totalAmount += b.debitor?.value || 0
      patterns.set(key, existing)
    }
  }

  console.log('  | 科目パターン | 件数 | 合計金額 |')
  console.log('  |---|---|---|')
  for (const [key, val] of patterns) {
    console.log(`  | ${key} | ${val.count}件 | ¥${val.totalAmount.toLocaleString()} |`)
  }

  // 最頻パターンを採用
  const bestPattern = [...patterns.entries()].sort((a, b) => b[1].count - a[1].count)[0]!
  console.log(`\n  採用パターン: ${bestPattern[0]}（${bestPattern[1].count}件）`)
  console.log(`  借方科目ID: ${bestPattern[1].debitId}`)
  console.log(`  貸方科目ID: ${bestPattern[1].creditId}`)
  if (bestPattern[1].debitTaxId) console.log(`  借方税区分ID: ${bestPattern[1].debitTaxId}`)
  if (bestPattern[1].creditTaxId) console.log(`  貸方税区分ID: ${bestPattern[1].creditTaxId}`)
  if (bestPattern[1].tradePartnerCode) console.log(`  取引先コード: ${bestPattern[1].tradePartnerCode}`)

  // 過去仕訳の詳細を表示
  console.log('\n  【根拠となる過去仕訳】')
  for (const j of matched.slice(0, 5)) {
    for (const b of j.branches) {
      console.log(`    ${j.transaction_date} | ${b.debitor?.account_name} ¥${b.debitor?.value} / ${b.creditor?.account_name} ¥${b.creditor?.value} | ${b.remark}`)
    }
  }
  if (matched.length > 5) {
    console.log(`    ...他 ${matched.length - 5}件`)
  }

  // ============================
  // Step 4: 同パターンで1円仕訳を登録
  // ============================
  console.log('\n━━━ Step 4: 1円仕訳を登録（postJournals） ━━━\n')

  const debitEntry: Record<string, unknown> = {
    account_id: bestPattern[1].debitId,
    value: 1,
  }
  const creditEntry: Record<string, unknown> = {
    account_id: bestPattern[1].creditId,
    value: 1,
  }

  // 税区分があれば設定
  if (bestPattern[1].debitTaxId) debitEntry.tax_id = bestPattern[1].debitTaxId
  if (bestPattern[1].creditTaxId) creditEntry.tax_id = bestPattern[1].creditTaxId
  // 取引先コードがあれば設定
  if (bestPattern[1].tradePartnerCode) {
    creditEntry.trade_partner_code = bestPattern[1].tradePartnerCode
  }

  const postData = {
    journal: {
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry' as const,
      memo: '【テスト】過去仕訳パターン参照で自動生成。要削除。',
      tags: ['AI_TEST', '要削除'],
      branches: [
        {
          debitor: debitEntry,
          creditor: creditEntry,
          remark: 'コスト削減グループ（AIテスト1円）',
        },
      ],
    },
  }

  console.log('  登録データ:')
  console.log(JSON.stringify(postData, null, 4))

  try {
    const result = await callMcpTool<{ journal: Journal }>(
      'mfc_ca_postJournals', postData, TOKEN_KEY
    )

    const posted = result.journal
    console.log('\n  ✅ 登録成功！')
    console.log(`  仕訳ID: ${posted.id}`)
    console.log(`  is_realized: ${posted.is_realized}`)
    console.log(`  取引日: ${posted.transaction_date}`)
    for (const b of posted.branches) {
      console.log(`  借方: ${b.debitor?.account_name} ¥${b.debitor?.value}`)
      console.log(`  貸方: ${b.creditor?.account_name} ¥${b.creditor?.value}`)
      console.log(`  摘要: ${b.remark}`)
    }

    console.log('\n━━━ 結果まとめ ━━━')
    console.log(`\n  【削除対象】`)
    console.log(`  仕訳ID: ${posted.id}`)
    console.log(`  タグ: AI_TEST, 要削除`)
    console.log(`\n  フロー実証:`)
    console.log(`    ① 過去仕訳取得（getJournals）: ${allJournals.length}件`)
    console.log(`    ② 摘要検索「コスト削減グループ」: ${matched.length}件ヒット`)
    console.log(`    ③ パターン抽出: ${bestPattern[0]}`)
    console.log(`    ④ 同パターンで1円仕訳登録: ✅ 成功`)
    console.log(`    ⑤ is_realized: ${posted.is_realized}`)
  } catch (e) {
    console.error('\n  ❌ 登録失敗:', e)
  }
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
