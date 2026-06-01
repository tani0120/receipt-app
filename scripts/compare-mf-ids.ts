/**
 * MCP実機から TSK/TST の税区分・勘定科目を再取得し、
 * 1回目の結果と2回目を横並びで比較するスクリプト
 */
import 'dotenv/config'
import { mcpFetchTaxes, mcpFetchAccounts } from '../src/api/services/mfMcpClient.js'
import fs from 'fs'

const TSK = { id: 'c_wTdnMKDO', code: 'TSK', name: 'あああ（谷風行寛）', type: '個人' }
const TST = { id: 'c_rODnkCDN', code: 'TST', name: '株式会社すぐする', type: '法人' }
const OUT = 'C:\\Users\\kazen\\.gemini\\antigravity-ide\\brain\\bdd12135-7c58-4ad4-84ad-7e58fdc363b9\\mf_id_full_comparison.md'

async function main() {
  // 2回目取得
  const tskTaxes2 = await mcpFetchTaxes(TSK.id)
  const tstTaxes2 = await mcpFetchTaxes(TST.id)
  const tskAccts2 = await mcpFetchAccounts(TSK.id)
  const tstAccts2 = await mcpFetchAccounts(TST.id)

  // 1回目の結果を読み込んでパース
  // → 面倒なので1回目もMCPで再取得して3列比較にする代わりに、
  //   1回目結果をファイルから読む

  // 1回目結果をパース（マークダウン表から）
  const existingContent = fs.readFileSync(OUT, 'utf-8')
  const taxRows1 = parseTaxTable(existingContent)
  const acctRows1 = parseAcctTable(existingContent)

  const lines: string[] = []
  lines.push('# MF ID 全件比較（MCP実機取得 — 2回検証）')
  lines.push('')
  lines.push('> 1回目: 2026-06-01 23:23 取得')
  lines.push('> 2回目: 2026-06-01 23:25 取得（再検証）')
  lines.push('> 両方ともMCP実機（`mfc_ca_getTaxes`, `mfc_ca_getAccounts`）から直接取得。')
  lines.push('')
  lines.push('| コード | clientId | 会社名 | 種別 |')
  lines.push('|---|---|---|---|')
  lines.push(`| **${TSK.code}** | \`${TSK.id}\` | ${TSK.name} | ${TSK.type} |`)
  lines.push(`| **${TST.code}** | \`${TST.id}\` | ${TST.name} | ${TST.type} |`)
  lines.push('')

  // ━━━━━━━━━━━━━━━━━━━━━
  // 税区分
  // ━━━━━━━━━━━━━━━━━━━━━
  lines.push('---')
  lines.push('')
  lines.push('## 1. 税区分（mfc_ca_getTaxes）')
  lines.push('')
  lines.push(`- TSK 1回目: ${taxRows1.filter(r => r.tskId !== '—').length}件, 2回目: ${tskTaxes2.length}件`)
  lines.push(`- TST 1回目: ${taxRows1.filter(r => r.tstId !== '—').length}件, 2回目: ${tstTaxes2.length}件`)
  lines.push('')

  const tskTax2Map = new Map(tskTaxes2.map((t: any) => [t.name, decodeURIComponent(t.id)]))
  const tstTax2Map = new Map(tstTaxes2.map((t: any) => [t.name, decodeURIComponent(t.id)]))
  const allTaxNames1 = taxRows1.map(r => r.name)
  const allTaxNames2 = [...new Set([...tskTax2Map.keys(), ...tstTax2Map.keys()])].sort()
  const allTaxNames = [...new Set([...allTaxNames1, ...allTaxNames2])].sort()

  lines.push(`| # | 税区分名 | TSK 1回目 | TSK 2回目 | TSK安定 | TST 1回目 | TST 2回目 | TST安定 | TSK=TST |`)
  lines.push('|---|---|---|---|---|---|---|---|---|')

  let taxTskStable = 0, taxTstStable = 0, taxCross = 0, taxTotal = 0
  for (let i = 0; i < allTaxNames.length; i++) {
    const name = allTaxNames[i]
    const row1 = taxRows1.find(r => r.name === name)
    const tsk1 = row1?.tskId ?? '—'
    const tst1 = row1?.tstId ?? '—'
    const tsk2 = tskTax2Map.get(name) ?? '—'
    const tst2 = tstTax2Map.get(name) ?? '—'
    const tskOk = tsk1 === tsk2 ? '✅' : '❌'
    const tstOk = tst1 === tst2 ? '✅' : '❌'
    const cross = (tsk2 !== '—' && tst2 !== '—') ? (tsk2 === tst2 ? '✅' : '❌') : '—'
    if (tsk1 === tsk2 && tsk1 !== '—') taxTskStable++
    if (tst1 === tst2 && tst1 !== '—') taxTstStable++
    if (tsk2 !== '—' && tst2 !== '—' && tsk2 === tst2) taxCross++
    taxTotal++
    lines.push(`| ${i + 1} | ${name} | \`${trunc(tsk1)}\` | \`${trunc(tsk2)}\` | ${tskOk} | \`${trunc(tst1)}\` | \`${trunc(tst2)}\` | ${tstOk} | ${cross} |`)
  }

  lines.push('')
  lines.push(`**税区分集計:**`)
  lines.push(`- TSK 1回目=2回目（安定）: ${taxTskStable}/${taxTotal}件`)
  lines.push(`- TST 1回目=2回目（安定）: ${taxTstStable}/${taxTotal}件`)
  lines.push(`- TSK=TST（事業者間一致）: ${taxCross}/${taxTotal}件`)
  lines.push('')

  // ━━━━━━━━━━━━━━━━━━━━━
  // 勘定科目
  // ━━━━━━━━━━━━━━━━━━━━━
  lines.push('---')
  lines.push('')
  lines.push('## 2. 勘定科目（mfc_ca_getAccounts）')
  lines.push('')

  const tskAcct2Map = new Map(tskAccts2.map((a: any) => [a.name, decodeURIComponent(a.id)]))
  const tstAcct2Map = new Map(tstAccts2.map((a: any) => [a.name, decodeURIComponent(a.id)]))
  const allAcctNames1 = acctRows1.map(r => r.name)
  const allAcctNames2 = [...new Set([...tskAcct2Map.keys(), ...tstAcct2Map.keys()])].filter(Boolean).sort()
  const allAcctNames = [...new Set([...allAcctNames1, ...allAcctNames2])].filter(Boolean).sort()

  lines.push(`| # | 勘定科目名 | TSK 1回目 | TSK 2回目 | TSK安定 | TST 1回目 | TST 2回目 | TST安定 | TSK=TST |`)
  lines.push('|---|---|---|---|---|---|---|---|---|')

  let acctTskStable = 0, acctTstStable = 0, acctCross = 0, acctTotal = 0
  for (let i = 0; i < allAcctNames.length; i++) {
    const name = allAcctNames[i]
    const row1 = acctRows1.find(r => r.name === name)
    const tsk1 = row1?.tskId ?? '—'
    const tst1 = row1?.tstId ?? '—'
    const tsk2 = tskAcct2Map.get(name) ?? '—'
    const tst2 = tstAcct2Map.get(name) ?? '—'
    const tskOk = tsk1 === tsk2 ? '✅' : '❌'
    const tstOk = tst1 === tst2 ? '✅' : '❌'
    const cross = (tsk2 !== '—' && tst2 !== '—') ? (tsk2 === tst2 ? '✅' : '❌') : '—'
    if (tsk1 === tsk2 && tsk1 !== '—') acctTskStable++
    if (tst1 === tst2 && tst1 !== '—') acctTstStable++
    if (tsk2 !== '—' && tst2 !== '—' && tsk2 === tst2) acctCross++
    acctTotal++
    lines.push(`| ${i + 1} | ${name} | \`${trunc(tsk1)}\` | \`${trunc(tsk2)}\` | ${tskOk} | \`${trunc(tst1)}\` | \`${trunc(tst2)}\` | ${tstOk} | ${cross} |`)
  }

  lines.push('')
  lines.push(`**勘定科目集計:**`)
  lines.push(`- TSK 1回目=2回目（安定）: ${acctTskStable}/${acctTotal}件`)
  lines.push(`- TST 1回目=2回目（安定）: ${acctTstStable}/${acctTotal}件`)
  lines.push(`- TSK=TST（事業者間一致）: ${acctCross}/${acctTotal}件`)
  lines.push('')

  // ━━━━━━━━━━━━━━━━━━━━━
  // 結論
  // ━━━━━━━━━━━━━━━━━━━━━
  lines.push('---')
  lines.push('')
  lines.push('## 3. 結論')
  lines.push('')
  lines.push('| 項目 | 同一事業者安定性 | 事業者間一致 | ID照合可否 |')
  lines.push('|---|---|---|---|')
  lines.push(`| **税区分** | TSK: ${taxTskStable}/${taxTotal}, TST: ${taxTstStable}/${taxTotal} | ${taxCross}/${taxTotal} | ${taxCross === taxTotal ? '✅ ID照合可能' : '❌ ID照合不可（名前照合のみ）'} |`)
  lines.push(`| **勘定科目** | TSK: ${acctTskStable}/${acctTotal}, TST: ${acctTstStable}/${acctTotal} | ${acctCross}/${acctTotal} | ${acctCross === acctTotal ? '✅ ID照合可能' : '❌ ID照合不可（名前照合のみ）'} |`)

  fs.writeFileSync(OUT, lines.join('\n'), 'utf-8')
  console.log(`出力完了: ${OUT}`)
  console.log(`税区分: TSK安定=${taxTskStable}/${taxTotal}, TST安定=${taxTstStable}/${taxTotal}, 事業者間=${taxCross}/${taxTotal}`)
  console.log(`勘定科目: TSK安定=${acctTskStable}/${acctTotal}, TST安定=${acctTstStable}/${acctTotal}, 事業者間=${acctCross}/${acctTotal}`)
}

function trunc(s: string): string {
  if (s === '—') return s
  return s.length > 16 ? s.substring(0, 14) + '…' : s
}

function parseTaxTable(content: string): Array<{name: string; tskId: string; tstId: string}> {
  const rows: Array<{name: string; tskId: string; tstId: string}> = []
  const lines = content.split('\n')
  let inTax = false
  for (const line of lines) {
    if (line.includes('## 1. 税区分')) { inTax = true; continue }
    if (line.includes('## 2. 勘定科目')) break
    if (!inTax || !line.startsWith('|') || line.includes('---') || line.includes('# |')) continue
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length >= 5 && /^\d+$/.test(cols[0])) {
      rows.push({
        name: cols[1],
        tskId: cols[2].replace(/`/g, ''),
        tstId: cols[3].replace(/`/g, ''),
      })
    }
  }
  return rows
}

function parseAcctTable(content: string): Array<{name: string; tskId: string; tstId: string}> {
  const rows: Array<{name: string; tskId: string; tstId: string}> = []
  const lines = content.split('\n')
  let inAcct = false
  for (const line of lines) {
    if (line.includes('## 2. 勘定科目')) { inAcct = true; continue }
    if (line.includes('## 3. 結論')) break
    if (!inAcct || !line.startsWith('|') || line.includes('---') || line.includes('# |')) continue
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length >= 5 && /^\d+$/.test(cols[0])) {
      rows.push({
        name: cols[1],
        tskId: cols[2].replace(/`/g, ''),
        tstId: cols[3].replace(/`/g, ''),
      })
    }
  }
  return rows
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1) })
