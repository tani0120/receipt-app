/**
 * テスト: AI名寄せ → 仕訳候補生成（登録しない）
 *
 * フロー:
 *   ① 過去仕訳333件から全摘要を取得
 *   ② AI名寄せで「Google系」を統合
 *   ③ 統合結果から科目パターンを分析
 *   ④ 「GOOGLE*WORKSPACE SUG」の仕訳候補を生成（登録しない）
 *   ⑤ 根拠（どの過去仕訳から取ったか）を表示
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'
import { GoogleGenAI } from '@google/genai'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''
const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

interface Branch {
  debitor?: { account_id: string; account_name: string; value: number; tax_name?: string; tax_id?: string }
  creditor?: { account_id: string; account_name: string; value: number; tax_name?: string; tax_id?: string }
  remark: string
}

interface Journal {
  id: string
  transaction_date: string
  is_realized: boolean
  branches: Branch[]
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  AI名寄せ → 仕訳候補生成テスト（登録しない）')
  console.log('  新規摘要: GOOGLE*WORKSPACE SUG')
  console.log('═══════════════════════════════════════════════════════\n')

  // ============================
  // Step 1: 過去仕訳取得
  // ============================
  console.log('━━━ Step 1: 過去仕訳取得（2025年） ━━━\n')
  const allJournals: Journal[] = []
  let page = 1, totalPages = 1
  while (page <= totalPages) {
    const r = await callMcpTool<{ journals: Journal[]; metadata: { total_pages: number } }>(
      'mfc_ca_getJournals',
      { start_date: '2025-01-01', end_date: '2025-12-31', per_page: 100, page },
      TOKEN_KEY
    )
    allJournals.push(...r.journals)
    totalPages = r.metadata.total_pages
    page++
  }
  console.log(`  ${allJournals.length}件取得\n`)

  // ============================
  // Step 2: 全摘要のユニーク一覧
  // ============================
  console.log('━━━ Step 2: 全摘要ユニーク一覧 ━━━\n')
  const remarkSet = new Set<string>()
  for (const j of allJournals) {
    for (const b of j.branches) {
      if (b.remark?.trim()) remarkSet.add(b.remark.trim())
    }
  }
  const allRemarks = [...remarkSet].sort()
  console.log(`  ユニーク摘要: ${allRemarks.length}件\n`)

  // ============================
  // Step 3: AI名寄せ（GOOGLE*WORKSPACE SUGに類似する摘要を特定）
  // ============================
  console.log('━━━ Step 3: AI名寄せ（Gemini 2.5 Flash） ━━━\n')

  const ai = new GoogleGenAI({ apiKey: API_KEY })
  const nayosePrompt = `以下は会計ソフトの仕訳摘要リストです。
新しい摘要「GOOGLE*WORKSPACE SUG」と同一の取引先と思われる摘要をすべて選んでください。

判定基準:
- 会社名の表記揺れ（全角/半角、カナ/英語、略称）
- Google、グーグル、GOOGLE等は同一
- ただし明らかに別サービス（Google Play等の個人消費）は区別

摘要リスト:
${allRemarks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

回答はJSON配列で、該当する摘要の原文をそのまま返してください。
例: ["GOOGLE*WORKSPACE TAN", "グーグル・ジヤパン・ジー・ド"]`

  const startTime = Date.now()
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: nayosePrompt,
  })
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  const responseText = result.text ?? ''
  console.log(`  AI応答（${elapsed}秒）:`)
  console.log(`  ${responseText}\n`)

  // JSONパース
  let matchedRemarks: string[] = []
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      matchedRemarks = JSON.parse(jsonMatch[0])
    }
  } catch {
    console.log('  ⚠️ JSONパース失敗。手動で解析。')
  }

  console.log(`  名寄せ結果: ${matchedRemarks.length}件の類似摘要を検出`)
  for (const r of matchedRemarks) {
    console.log(`    → ${r}`)
  }

  // ============================
  // Step 4: 名寄せ結果で仕訳を検索
  // ============================
  console.log('\n━━━ Step 4: 類似取引先の過去仕訳 ━━━\n')

  const matchedJournals = allJournals.filter(j =>
    j.branches.some(b => {
      const remark = (b.remark || '').trim()
      return matchedRemarks.some(mr => remark.includes(mr) || mr.includes(remark))
    })
  )

  console.log(`  ヒット: ${matchedJournals.length}件\n`)

  // パターン分析
  const patterns = new Map<string, {
    count: number
    totalAmount: number
    debitId: string
    creditId: string
    debitTaxId?: string
    creditTaxId?: string
    examples: string[]
  }>()

  for (const j of matchedJournals) {
    for (const b of j.branches) {
      const key = `${b.debitor?.account_name || '?'} / ${b.creditor?.account_name || '?'}`
      const existing = patterns.get(key) || {
        count: 0, totalAmount: 0,
        debitId: b.debitor?.account_id || '',
        creditId: b.creditor?.account_id || '',
        debitTaxId: b.debitor?.tax_id,
        creditTaxId: b.creditor?.tax_id,
        examples: [],
      }
      existing.count++
      existing.totalAmount += b.debitor?.value || 0
      if (existing.examples.length < 5) {
        existing.examples.push(`${j.transaction_date} ${b.remark} ¥${b.debitor?.value}`)
      }
      patterns.set(key, existing)
    }
  }

  console.log('  | 科目パターン | 件数 | 合計金額 |')
  console.log('  |---|---|---|')
  for (const [key, val] of patterns) {
    console.log(`  | ${key} | ${val.count}件 | ¥${val.totalAmount.toLocaleString()} |`)
  }

  // ============================
  // Step 5: 仕訳候補生成（登録しない）
  // ============================
  console.log('\n━━━ Step 5: 仕訳候補（登録しない） ━━━\n')

  if (patterns.size === 0) {
    console.log('  ❌ パターンなし。')
    return
  }

  let candidateIdx = 1
  for (const [key, val] of patterns) {
    console.log(`  ┌─ 候補${candidateIdx}: ${key}`)
    console.log(`  │  新規摘要: GOOGLE*WORKSPACE SUG`)
    console.log(`  │  借方: ${key.split(' / ')[0]} ¥1`)
    console.log(`  │  貸方: ${key.split(' / ')[1]} ¥1`)
    console.log(`  │  日付: 2026-06-01`)
    console.log(`  │`)
    console.log(`  │  【根拠】過去${val.count}件の同一取引先仕訳:`)
    for (const ex of val.examples) {
      console.log(`  │    ${ex}`)
    }
    console.log(`  │  平均金額: ¥${Math.round(val.totalAmount / val.count).toLocaleString()}`)
    console.log(`  │`)
    console.log(`  │  信頼度: ${val.count >= 3 ? '★★★ 高（3件以上）' : val.count >= 2 ? '★★☆ 中（2件）' : '★☆☆ 低（1件）'}`)
    console.log(`  └─ 人間✓待ち`)
    console.log()
    candidateIdx++
  }

  console.log('  ⏸️ ここで人間が確認 → OKならpostJournals → MFに登録')
  console.log('  ⏸️ 今回は登録しない（テスト終了）')
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
