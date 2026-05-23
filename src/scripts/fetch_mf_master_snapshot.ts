/**
 * MF課税方式別データ取得・保存スクリプト
 * 
 * MF側で課税方式を切り替えた後に実行し、科目と税区分を保存する。
 * 実行: npx tsx src/scripts/fetch_mf_master_snapshot.ts <clientId> <label>
 * 例:   npx tsx src/scripts/fetch_mf_master_snapshot.ts c_rODnkCDN exempt
 *       npx tsx src/scripts/fetch_mf_master_snapshot.ts c_rODnkCDN simplified
 *       npx tsx src/scripts/fetch_mf_master_snapshot.ts c_rODnkCDN general
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const CLIENT_ID = process.argv[2]
const LABEL = process.argv[3]  // exempt（免税）/ simplified（簡易）/ general（本則）

if (!CLIENT_ID || !LABEL) {
  console.error('使い方: npx tsx src/scripts/fetch_mf_master_snapshot.ts <clientId> <label>')
  console.error('  label: exempt（免税）/ simplified（簡易）/ general（本則）')
  process.exit(1)
}

const BASE = 'http://localhost:8080/api/mf'

async function main() {
  console.log(`═══════════════════════════════════════`)
  console.log(`  MFマスタスナップショット取得`)
  console.log(`  顧問先: ${CLIENT_ID}`)
  console.log(`  課税方式: ${LABEL}`)
  console.log(`═══════════════════════════════════════\n`)

  // 科目取得
  console.log('━━━ 科目取得中... ━━━')
  const accRes = await fetch(`${BASE}/accounts?clientId=${CLIENT_ID}`)
  const accData = await accRes.json()
  const accounts = accData.accounts || accData
  const availAccounts = accounts.filter((a: { available: boolean }) => a.available)
  console.log(`  全科目: ${accounts.length}件`)
  console.log(`  available（利用可）=true: ${availAccounts.length}件`)
  console.log(`  available（利用可）=false: ${accounts.length - availAccounts.length}件`)

  // 税区分取得
  console.log('\n━━━ 税区分取得中... ━━━')
  const taxRes = await fetch(`${BASE}/taxes?clientId=${CLIENT_ID}`)
  const taxData = await taxRes.json()
  const taxes = taxData.taxes || taxData
  const availTaxes = taxes.filter((t: { available: boolean }) => t.available)
  console.log(`  全税区分: ${taxes.length}件`)
  console.log(`  available（利用可）=true: ${availTaxes.length}件`)
  console.log(`  available（利用可）=false: ${taxes.length - availTaxes.length}件`)

  // 保存
  const outDir = join(process.cwd(), 'data')
  const snapshot = {
    client_id: CLIENT_ID,
    label: LABEL,
    timestamp: new Date().toISOString(),
    accounts: {
      total: accounts.length,
      available_count: availAccounts.length,
      items: accounts,
    },
    taxes: {
      total: taxes.length,
      available_count: availTaxes.length,
      items: taxes,
    },
  }

  const filename = `mf-snapshot-${CLIENT_ID}-${LABEL}.json`
  const filepath = join(outDir, filename)
  writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log(`\n✅ 保存完了: ${filepath}`)

  // サマリー
  console.log(`\n━━━ サマリー ━━━`)
  console.log(`  科目（available=true）:`)
  const groups: Record<string, number> = {}
  for (const a of availAccounts) {
    const g = (a as { account_group: string }).account_group
    groups[g] = (groups[g] || 0) + 1
  }
  for (const [g, c] of Object.entries(groups)) {
    console.log(`    ${g}: ${c}件`)
  }

  console.log(`\n  税区分（available=true）:`)
  if (availTaxes.length === 0) {
    console.log(`    ⚠️ 0件（免税事業者のため全件false）`)
  } else {
    console.log(`    ${availTaxes.length}件`)
    availTaxes.slice(0, 10).forEach((t: { name: string }) =>
      console.log(`      ${t.name}`)
    )
    if (availTaxes.length > 10) {
      console.log(`      ...他 ${availTaxes.length - 10}件`)
    }
  }
}

main().catch(e => {
  console.error('エラー:', e)
  process.exit(1)
})
