/**
 * TSK（c_wTdnMKDO）に対して、勘定科目(account_id)×税区分(tax_id)の
 * 全7×7=49パターンをMCP実機でテストするスクリプト
 *
 * パターン:
 *   1. 正規ID   2. 名前   3. 省略（キーなし）  4. 空文字""
 *   5. null     6. デタラメID   7. 他社ID（TSTのID）
 */
import 'dotenv/config'
import { mcpFetchTaxes, mcpFetchAccounts, mcpCreateJournal } from '../src/api/services/mfMcpClient.js'
import fs from 'fs'

const TSK_TOKEN = 'c_wTdnMKDO'
const TST_TOKEN = 'c_rODnkCDN'
const DELAY_MS = 2000 // レートリミット対策

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

type パターン種別 = '正規ID' | '名前' | '省略' | '空文字' | 'null' | 'デタラメID' | '他社ID'
const パターン一覧: パターン種別[] = ['正規ID', '名前', '省略', '空文字', 'null', 'デタラメID', '他社ID']

async function main() {
  // データ取得
  const tskAccts = await mcpFetchAccounts(TSK_TOKEN)
  const tskTaxes = await mcpFetchTaxes(TSK_TOKEN)
  const tstAccts = await mcpFetchAccounts(TST_TOKEN)
  const tstTaxes = await mcpFetchTaxes(TST_TOKEN)

  const tskGenkin = tskAccts.find((a: any) => a.name === '現金')
  const tskUriage = tskAccts.find((a: any) => a.name === '売上高')
  const tskTaisyogai = tskTaxes.find((t: any) => t.name === '対象外')
  const tskKazei10 = tskTaxes.find((t: any) => t.name === '課税売上 10%')

  const tstGenkin = tstAccts.find((a: any) => a.name === '現金')
  const tstUriage = tstAccts.find((a: any) => a.name === '売上高')
  const tstTaisyogai = tstTaxes.find((t: any) => t.name === '対象外')
  const tstKazei10 = tstTaxes.find((t: any) => t.name === '課税売上 10%')

  console.log('=== TSKデータ ===')
  console.log(`現金: ${tskGenkin?.id}`)
  console.log(`売上高: ${tskUriage?.id}`)
  console.log(`対象外: ${tskTaisyogai?.id}`)
  console.log(`課税売上10%: ${tskKazei10?.id}`)
  console.log('=== TSTデータ（他社ID用） ===')
  console.log(`現金: ${tstGenkin?.id}`)
  console.log(`売上高: ${tstUriage?.id}`)
  console.log(`対象外: ${tstTaisyogai?.id}`)
  console.log(`課税売上10%: ${tstKazei10?.id}`)

  function 勘定科目値(パターン: パターン種別, side: 'debit' | 'credit'): any {
    const tsk = side === 'debit' ? tskGenkin : tskUriage
    const tst = side === 'debit' ? tstGenkin : tstUriage
    const name = side === 'debit' ? '現金' : '売上高'
    switch (パターン) {
      case '正規ID': return tsk.id
      case '名前': return name
      case '省略': return undefined // キー自体を省略
      case '空文字': return ''
      case 'null': return null
      case 'デタラメID': return 'AAABBBCCC123=='
      case '他社ID': return tst.id
    }
  }

  function 税区分値(パターン: パターン種別, side: 'debit' | 'credit'): any {
    const tsk = side === 'debit' ? tskTaisyogai : tskKazei10
    const tst = side === 'debit' ? tstTaisyogai : tstKazei10
    const name = side === 'debit' ? '対象外' : '課税売上 10%'
    switch (パターン) {
      case '正規ID': return tsk.id
      case '名前': return name
      case '省略': return undefined
      case '空文字': return ''
      case 'null': return null
      case 'デタラメID': return 'XXXYYYZZZ456=='
      case '他社ID': return tst.id
    }
  }

  const results: Array<{
    no: number
    勘定科目パターン: string
    税区分パターン: string
    結果: '✅' | '❌' | '⏳'
    詳細: string
  }> = []

  let testNo = 0
  for (const acctP of パターン一覧) {
    for (const taxP of パターン一覧) {
      testNo++
      const amount = 100 + testNo

      // ペイロード構築（省略パターン対応）
      const debitSide: any = { value: amount }
      const creditSide: any = { value: amount }

      const acctDebit = 勘定科目値(acctP, 'debit')
      const acctCredit = 勘定科目値(acctP, 'credit')
      const taxDebit = 税区分値(taxP, 'debit')
      const taxCredit = 税区分値(taxP, 'credit')

      if (acctDebit !== undefined) debitSide.account_id = acctDebit
      if (acctCredit !== undefined) creditSide.account_id = acctCredit
      if (taxDebit !== undefined) debitSide.tax_id = taxDebit
      if (taxCredit !== undefined) creditSide.tax_id = taxCredit

      try {
        console.log(`--- #${testNo} 勘定科目:${acctP} × 税区分:${taxP} ---`)
        const res = await mcpCreateJournal({
          transaction_date: '2026-06-01',
          journal_type: 'journal_entry',
          branches: [{
            debitor: debitSide,
            creditor: creditSide,
            remark: `テスト${testNo}: 勘定=${acctP}, 税=${taxP}`,
          }],
          memo: `sugusru-49test-${testNo}`,
        }, TSK_TOKEN)
        const mfNum = (res as any).number ?? '?'
        console.log(`  ✅ 成功 MF#${mfNum}`)
        results.push({ no: testNo, 勘定科目パターン: acctP, 税区分パターン: taxP, 結果: '✅', 詳細: `MF#${mfNum}` })
      } catch (e: any) {
        const msg = e.message?.substring(0, 300) ?? '不明'
        // レートリミットの場合はリトライ
        if (msg.includes('rate limit')) {
          console.log(`  ⏳ レートリミット。10秒待機してリトライ...`)
          await delay(10000)
          try {
            const res = await mcpCreateJournal({
              transaction_date: '2026-06-01',
              journal_type: 'journal_entry',
              branches: [{
                debitor: debitSide,
                creditor: creditSide,
                remark: `テスト${testNo}: 勘定=${acctP}, 税=${taxP}（リトライ）`,
              }],
              memo: `sugusru-49test-${testNo}-retry`,
            }, TSK_TOKEN)
            const mfNum = (res as any).number ?? '?'
            console.log(`  ✅ リトライ成功 MF#${mfNum}`)
            results.push({ no: testNo, 勘定科目パターン: acctP, 税区分パターン: taxP, 結果: '✅', 詳細: `MF#${mfNum}（リトライ）` })
          } catch (e2: any) {
            const msg2 = e2.message?.substring(0, 200) ?? '不明'
            console.log(`  ❌ リトライも失敗: ${msg2}`)
            results.push({ no: testNo, 勘定科目パターン: acctP, 税区分パターン: taxP, 結果: '❌', 詳細: msg2 })
          }
        } else {
          // エラーメッセージからコードだけ抽出
          const codeMatch = msg.match(/"code":"([^"]+)"/)
          const targetMatch = msg.match(/"message":"([^"]+)"/)
          const shortMsg = codeMatch ? `${codeMatch[1]}: ${targetMatch?.[1]?.substring(0, 80) ?? ''}` : msg.substring(0, 150)
          console.log(`  ❌ ${shortMsg}`)
          results.push({ no: testNo, 勘定科目パターン: acctP, 税区分パターン: taxP, 結果: '❌', 詳細: shortMsg })
        }
      }

      await delay(DELAY_MS)
    }
  }

  // マークダウン出力
  const lines: string[] = []
  lines.push('# MF MCP 仕訳送信 49パターン検証（TSK実機 2026-06-01）')
  lines.push('')
  lines.push('> 対象: TSK（`c_wTdnMKDO`/あああ/谷風行寛/個人）に6/1日付で送信')
  lines.push('> 勘定科目(account_id) × 税区分(tax_id) の 7×7=49パターン')
  lines.push('')
  lines.push('## パターン定義')
  lines.push('')
  lines.push('| # | パターン | 勘定科目での値 | 税区分での値 |')
  lines.push('|---|---|---|---|')
  lines.push('| 1 | 正規ID | TSKのMF ID | TSKのMF ID |')
  lines.push('| 2 | 名前 | `"現金"` / `"売上高"` | `"対象外"` / `"課税売上 10%"` |')
  lines.push('| 3 | 省略 | キー自体なし | キー自体なし |')
  lines.push('| 4 | 空文字 | `""` | `""` |')
  lines.push('| 5 | null | `null` | `null` |')
  lines.push('| 6 | デタラメID | `"AAABBBCCC123=="` | `"XXXYYYZZZ456=="` |')
  lines.push('| 7 | 他社ID | TSTの同名科目ID | TSTの同名税区分ID |')
  lines.push('')
  lines.push('## 結果マトリクス')
  lines.push('')

  // マトリクス表
  lines.push('| | 税:正規ID | 税:名前 | 税:省略 | 税:空文字 | 税:null | 税:デタラメ | 税:他社ID |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const acctP of パターン一覧) {
    const cells = パターン一覧.map(taxP => {
      const r = results.find(x => x.勘定科目パターン === acctP && x.税区分パターン === taxP)
      return r ? r.結果 : '?'
    })
    lines.push(`| **科目:${acctP}** | ${cells.join(' | ')} |`)
  }

  lines.push('')
  lines.push('## 全件詳細')
  lines.push('')
  lines.push('| # | 勘定科目 | 税区分 | 結果 | 詳細 |')
  lines.push('|---|---|---|---|---|')
  for (const r of results) {
    lines.push(`| ${r.no} | ${r.勘定科目パターン} | ${r.税区分パターン} | ${r.結果} | ${r.詳細} |`)
  }

  const outPath = 'c:\\dev\\receipt-app\\docs\\genzai\\46_mf_journal_send_49patterns.md'
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log(`\n出力完了: ${outPath}`)

  // サマリ
  const ok = results.filter(r => r.結果 === '✅').length
  const ng = results.filter(r => r.結果 === '❌').length
  console.log(`成功: ${ok}件, 失敗: ${ng}件`)
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1) })
