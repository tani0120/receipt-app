/**
 * 改善版: AI名寄せ → 仕訳候補生成（登録しない）
 *
 * 改善点:
 *   ① 名寄せ: 「同一サービス」判定（WORKSPACEとGoogle Playを区別）
 *   ② フィルタ: branch単位（仕訳単位ではなく）
 *   ③ 候補絞り込み: 完全一致優先 → 信頼度 → 上位3件
 *
 * 実行: npx tsx src/scripts/test_improved_candidate.ts "GOOGLE*WORKSPACE SUG" 1000
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'
import { GoogleGenAI } from '@google/genai'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''
const API_KEY = process.env['GEMINI_API_KEY'] ?? ''

// コマンドライン引数
const inputRemark = process.argv[2] || 'GOOGLE*WORKSPACE SUG'
const inputAmount = parseInt(process.argv[3] || '1000', 10)

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

interface Candidate {
  rank: number
  debitName: string
  creditName: string
  debitId: string
  creditId: string
  debitTaxId?: string
  creditTaxId?: string
  count: number
  avgAmount: number
  matchType: 'exact' | 'service' | 'partner'
  confidence: number
  examples: string[]
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  改善版 仕訳候補生成（登録しない）')
  console.log(`  入力摘要: ${inputRemark}`)
  console.log(`  入力金額: ¥${inputAmount.toLocaleString()}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // ============================
  // Step 1: 過去仕訳取得
  // ============================
  console.log('━━━ Step 1: 過去仕訳取得 ━━━\n')
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
    await new Promise(r2 => setTimeout(r2, 300))
  }
  console.log(`  ${allJournals.length}件取得\n`)

  // ============================
  // Step 2: 全摘要のユニーク一覧 + branch単位のデータ構築
  // ============================
  console.log('━━━ Step 2: branch単位のデータ構築 ━━━\n')

  interface BranchRecord {
    remark: string
    debitName: string
    creditName: string
    debitId: string
    creditId: string
    debitTaxId?: string
    creditTaxId?: string
    debitValue: number
    creditValue: number
    date: string
  }

  const allBranches: BranchRecord[] = []
  const remarkSet = new Set<string>()

  for (const j of allJournals) {
    for (const b of j.branches) {
      const remark = (b.remark || '').trim()
      if (!remark) continue
      remarkSet.add(remark)
      allBranches.push({
        remark,
        debitName: b.debitor?.account_name || '?',
        creditName: b.creditor?.account_name || '?',
        debitId: b.debitor?.account_id || '',
        creditId: b.creditor?.account_id || '',
        debitTaxId: b.debitor?.tax_id,
        creditTaxId: b.creditor?.tax_id,
        debitValue: b.debitor?.value || 0,
        creditValue: b.creditor?.value || 0,
        date: j.transaction_date,
      })
    }
  }

  const allRemarks = [...remarkSet].sort()
  console.log(`  ユニーク摘要: ${allRemarks.length}件`)
  console.log(`  branch総数: ${allBranches.length}件\n`)

  // ============================
  // Step 3: 完全一致チェック → なければAI名寄せ
  // ============================
  console.log('━━━ Step 3: 摘要マッチング ━━━\n')

  // 3a: 完全一致
  const exactMatches = allBranches.filter(b => b.remark === inputRemark)
  console.log(`  完全一致「${inputRemark}」: ${exactMatches.length}件`)

  // 3b: 部分一致（入力摘要のキーワードで検索）
  const keywords = inputRemark.split(/[\s*]+/).filter(k => k.length >= 3)
  const partialMatches = allBranches.filter(b =>
    keywords.some(kw => b.remark.toUpperCase().includes(kw.toUpperCase())) && b.remark !== inputRemark
  )
  console.log(`  部分一致（キーワード: ${keywords.join(', ')}）: ${partialMatches.length}件`)

  // 3c: AI名寄せ（同一サービスを判定）
  let aiMatches: BranchRecord[] = []
  if (exactMatches.length < 3) {
    console.log('\n  完全一致3件未満 → AI名寄せ実行\n')

    const ai = new GoogleGenAI({ apiKey: API_KEY })
    const prompt = `あなたは会計事務所の仕訳担当者です。
以下の仕訳摘要リストから、新規摘要「${inputRemark}」と**同一サービス・同一契約**の摘要を選んでください。

重要な判定基準:
- 同じ会社でもサービスが異なれば別物として扱う
  例: 「GOOGLE*WORKSPACE」と「GOOGLE PLAY」は別サービス
  例: 「ドコモ携帯電話料」と「ドコモ光」は別サービス
- 表記揺れ（全角/半角、カナ/英語）は同一とみなす
  例: 「GOOGLE*WORKSPACE TAN」と「GOOGLE*WORKSPACE SUG」は同一サービス

摘要リスト:
${allRemarks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

JSON配列で返してください。該当なしなら空配列[]。
例: ["GOOGLE*WORKSPACE TAN"]`

    const startTime = Date.now()
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const responseText = result.text ?? ''

    console.log(`  AI応答（${elapsed}秒）: ${responseText.trim()}\n`)

    let aiRemarks: string[] = []
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/)
      if (jsonMatch) aiRemarks = JSON.parse(jsonMatch[0])
    } catch { /* パース失敗 */ }

    console.log(`  AI名寄せ結果: ${aiRemarks.length}件`)
    for (const r of aiRemarks) console.log(`    → ${r}`)

    // AI名寄せ結果でbranchをフィルタ（branch単位！）
    aiMatches = allBranches.filter(b =>
      aiRemarks.some(ar => b.remark === ar) && b.remark !== inputRemark
    )
    console.log(`  branch単位ヒット: ${aiMatches.length}件\n`)
  }

  // ============================
  // Step 4: 候補生成（branch単位で集計）
  // ============================
  console.log('━━━ Step 4: 候補生成 ━━━\n')

  const candidateMap = new Map<string, {
    debitName: string; creditName: string
    debitId: string; creditId: string
    debitTaxId?: string; creditTaxId?: string
    count: number; totalAmount: number
    matchType: 'exact' | 'service' | 'partner'
    examples: string[]
  }>()

  // 完全一致を最優先
  for (const b of exactMatches) {
    const key = `${b.debitName}/${b.creditName}`
    const v = candidateMap.get(key) || {
      debitName: b.debitName, creditName: b.creditName,
      debitId: b.debitId, creditId: b.creditId,
      debitTaxId: b.debitTaxId, creditTaxId: b.creditTaxId,
      count: 0, totalAmount: 0, matchType: 'exact' as const, examples: [],
    }
    v.count++
    v.totalAmount += b.debitValue
    if (v.examples.length < 3) v.examples.push(`${b.date} ${b.remark} ¥${b.debitValue.toLocaleString()}`)
    candidateMap.set(key, v)
  }

  // AI名寄せ結果
  for (const b of aiMatches) {
    const key = `${b.debitName}/${b.creditName}`
    if (candidateMap.has(key)) {
      const v = candidateMap.get(key)!
      v.count++
      v.totalAmount += b.debitValue
      if (v.examples.length < 3) v.examples.push(`${b.date} ${b.remark} ¥${b.debitValue.toLocaleString()}`)
    } else {
      candidateMap.set(key, {
        debitName: b.debitName, creditName: b.creditName,
        debitId: b.debitId, creditId: b.creditId,
        debitTaxId: b.debitTaxId, creditTaxId: b.creditTaxId,
        count: 1, totalAmount: b.debitValue,
        matchType: 'service', examples: [`${b.date} ${b.remark} ¥${b.debitValue.toLocaleString()}`],
      })
    }
  }

  // ============================
  // Step 5: 候補を絞り込み・ランキング
  // ============================
  console.log('━━━ Step 5: 候補ランキング（上位3件） ━━━\n')

  // スコアリング
  const candidates: Candidate[] = [...candidateMap.entries()].map(([_, v]) => {
    const avgAmount = Math.round(v.totalAmount / v.count)

    // 信頼度スコア計算
    let confidence = 0

    // マッチタイプ: 完全一致 > サービス一致
    if (v.matchType === 'exact') confidence += 50
    else if (v.matchType === 'service') confidence += 30

    // 件数ボーナス
    confidence += Math.min(v.count * 10, 30)

    // 金額近接ボーナス（入力金額との差が小さいほど高スコア）
    if (inputAmount > 0 && avgAmount > 0) {
      const ratio = Math.min(inputAmount, avgAmount) / Math.max(inputAmount, avgAmount)
      confidence += Math.round(ratio * 20)
    }

    // 「?」が含まれる科目はペナルティ
    if (v.debitName === '?' || v.creditName === '?') confidence -= 30

    return {
      rank: 0,
      debitName: v.debitName,
      creditName: v.creditName,
      debitId: v.debitId,
      creditId: v.creditId,
      debitTaxId: v.debitTaxId,
      creditTaxId: v.creditTaxId,
      count: v.count,
      avgAmount,
      matchType: v.matchType,
      confidence: Math.max(0, Math.min(100, confidence)),
      examples: v.examples,
    }
  })

  // スコア降順ソート → 上位3件
  candidates.sort((a, b) => b.confidence - a.confidence)
  const top3 = candidates.slice(0, 3)

  for (let i = 0; i < top3.length; i++) {
    const c = top3[i]!
    c.rank = i + 1
    const stars = c.confidence >= 70 ? '★★★' : c.confidence >= 40 ? '★★☆' : '★☆☆'

    console.log(`  ┌─ 候補${c.rank}: ${c.debitName} / ${c.creditName}`)
    console.log(`  │  信頼度: ${stars} ${c.confidence}点`)
    console.log(`  │  マッチ: ${c.matchType === 'exact' ? '完全一致' : 'サービス一致（AI名寄せ）'}`)
    console.log(`  │`)
    console.log(`  │  仕訳候補:`)
    console.log(`  │    日付: 2026-06-01`)
    console.log(`  │    借方: ${c.debitName} ¥${inputAmount.toLocaleString()}`)
    console.log(`  │    貸方: ${c.creditName} ¥${inputAmount.toLocaleString()}`)
    console.log(`  │    摘要: ${inputRemark}`)
    console.log(`  │`)
    console.log(`  │  【根拠】過去${c.count}件:`)
    for (const ex of c.examples) {
      console.log(`  │    ${ex}`)
    }
    console.log(`  │  平均金額: ¥${c.avgAmount.toLocaleString()}`)
    console.log(`  └─ 人間✓待ち`)
    console.log()
  }

  if (candidates.length > 3) {
    console.log(`  （他 ${candidates.length - 3}件の候補は省略）\n`)
  }

  if (candidates.length === 0) {
    console.log('  ❌ 候補なし。過去に類似の摘要がありません。')
    console.log('  → 新規取引先。人間が科目を手動で選択する必要あり。\n')
  }

  console.log('  ⏸️ 登録しません（テスト終了）')
}

main().catch(e => {
  console.error('致命的エラー:', e)
  process.exit(1)
})
