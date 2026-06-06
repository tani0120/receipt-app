/**
 * 科目・税区分バリデーションテスト（実環境MCP接続）
 * 
 * MFからリアルタイムでgetAccounts/getTaxes/getTermSettingsを呼び、
 * Sugusruマスタと突合して差異を人間に報告する。
 * 
 * 実行: npx tsx src/scripts/test_validation.ts <clientId>
 * 例:   npx tsx src/scripts/test_validation.ts c_wTdnMKDO
 */

import { readFileSync } from 'fs'

const CLIENT_ID: string = process.argv[2] ?? ''
if (!CLIENT_ID) {
  console.error('使い方: npx tsx src/scripts/test_validation.ts <clientId>')
  process.exit(1)
}

const BASE = 'http://localhost:8080/api/mf'

interface MfAccount {
  id: string
  name: string
  account_group: string
  category: string
  available: boolean
  tax_id?: string
  sub_accounts?: { id: string; name: string }[]
}

interface MfTax {
  id: string
  name: string
  available: boolean
}

interface SugAccount {
  accountId: string
  name: string
  accountGroup?: string
  category?: string
}

interface SugTax {
  taxCategoryId: string
  name: string
}

interface TermSetting {
  fiscal_year: number
  tax_method: string
  start_date: string
  end_date: string
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  科目・税区分バリデーション（実環境MCP接続）    ║')
  console.log('║  顧問先: ' + CLIENT_ID.padEnd(39) + '║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // ━━━ Step 1: MFから実データ取得 ━━━
  console.log('━━━ Step 1: MFからリアルタイム取得 ━━━\n')

  const [accRes, taxRes, termRes] = await Promise.all([
    fetch(`${BASE}/accounts?clientId=${CLIENT_ID}`),
    fetch(`${BASE}/taxes?clientId=${CLIENT_ID}`),
    fetch(`${BASE}/term-settings?clientId=${CLIENT_ID}`),
  ])

  const accData = await accRes.json()
  const taxData = await taxRes.json()
  const termData = await termRes.json()

  const mfAccounts: MfAccount[] = (accData.accounts || accData)
  const mfTaxes: MfTax[] = (taxData.taxes || taxData)
  const termSettings: TermSetting[] = termData.settings?.term_settings || termData.term_settings || (Array.isArray(termData) ? termData : [termData])
  const currentTerm = termSettings[0]

  console.log('  MF科目: ' + mfAccounts.length + '件')
  console.log('  MF税区分: ' + mfTaxes.length + '件')
  console.log('  課税方式: ' + (currentTerm?.tax_method || '不明'))
  console.log()

  // ━━━ Step 2: Sugusruマスタ読み込み ━━━
  console.log('━━━ Step 2: Sugusruマスタ読み込み ━━━\n')

  const sugAccounts: SugAccount[] = JSON.parse(readFileSync('data/account-master.json', 'utf8'))
  const sugTaxes: SugTax[] = JSON.parse(readFileSync('data/tax-category-master.json', 'utf8'))

  console.log('  Sugusru科目: ' + sugAccounts.length + '件')
  console.log('  Sugusru税区分: ' + sugTaxes.length + '件')
  console.log()

  // ━━━ Step 3: 科目バリデーション ━━━
  console.log('━━━ Step 3: 科目バリデーション ━━━\n')

  const mfAccByName = new Map(mfAccounts.filter(a => a.available).map(a => [a.name, a]))
  const sugAccByName = new Map(sugAccounts.map(a => [a.name, a]))

  const accBoth = sugAccounts.filter(a => mfAccByName.has(a.name))
  const accOnlySug = sugAccounts.filter(a => !mfAccByName.has(a.name))
  const accOnlyMf = mfAccounts.filter(a => a.available && !sugAccByName.has(a.name))

  console.log('  ┌─────────────────────────────────────────────┐')
  console.log('  │ 名前一致（両方にある）: ' + String(accBoth.length).padStart(3) + '件' + ' '.repeat(13) + '│')
  console.log('  │ Sugusruのみ（MFにない）: ' + String(accOnlySug.length).padStart(3) + '件 ⚠️' + ' '.repeat(11) + '│')
  console.log('  │ MFのみ（Sugusruにない）: ' + String(accOnlyMf.length).padStart(3) + '件 ⚠️' + ' '.repeat(11) + '│')
  console.log('  └─────────────────────────────────────────────┘')
  console.log()

  if (accOnlySug.length > 0) {
    console.log('  【⚠️ Sugusruにあり、MFにない科目（仕訳で使うと送信時エラー）】')
    accOnlySug.forEach(a => console.log('    ✗ ' + a.name + ' (' + a.accountId + ')'))
    console.log()
  }

  if (accOnlyMf.length > 0) {
    console.log('  【⚠️ MFにあり、Sugusruにない科目（MF独自。取り込み候補）】')
    accOnlyMf.forEach(a => console.log('    + ' + a.name + ' [' + a.account_group + '/' + a.category + ']'))
    console.log()
  }

  // ━━━ Step 4: 補助科目バリデーション ━━━
  console.log('━━━ Step 4: 補助科目バリデーション ━━━\n')

  const withSubs = mfAccounts.filter(a => a.sub_accounts && a.sub_accounts.length > 0)
  if (withSubs.length > 0) {
    console.log('  MFに補助科目がある科目: ' + withSubs.length + '件')
    withSubs.forEach(a => {
      const subs = a.sub_accounts!.map(s => s.name).join(', ')
      console.log('    ' + a.name + ': ' + subs)
    })
    console.log()
    console.log('  ⚠️ Sugusruに補助科目フィールドはあるが、MFの補助科目と突合されていない')
  } else {
    console.log('  補助科目なし')
  }
  console.log()

  // ━━━ Step 5: 税区分バリデーション ━━━
  console.log('━━━ Step 5: 税区分バリデーション ━━━\n')

  const taxMethod = currentTerm?.tax_method || '不明'
  const isTaxExempt = taxMethod === 'FREE'

  const mfTaxAvail = isTaxExempt ? mfTaxes : mfTaxes.filter(t => t.available)

  console.log('  課税方式: ' + taxMethod + (isTaxExempt ? '（免税 → availableフィルタなし。全件使用）' : ''))
  console.log('  MF税区分（フィルタ後）: ' + mfTaxAvail.length + '件')
  console.log('  Sugusru税区分: ' + sugTaxes.length + '件')
  console.log()

  const mfTaxByName = new Map(mfTaxAvail.map(t => [t.name, t]))
  const sugTaxByName = new Map(sugTaxes.map(t => [t.name, t]))

  const taxBoth = sugTaxes.filter(t => mfTaxByName.has(t.name))
  const taxOnlySug = sugTaxes.filter(t => !mfTaxByName.has(t.name))
  const taxOnlyMf = mfTaxAvail.filter(t => !sugTaxByName.has(t.name))

  console.log('  ┌─────────────────────────────────────────────┐')
  console.log('  │ 名前一致: ' + String(taxBoth.length).padStart(3) + '件' + ' '.repeat(27) + '│')
  console.log('  │ Sugusruのみ: ' + String(taxOnlySug.length).padStart(3) + '件' + ' '.repeat(24) + '│')
  console.log('  │ MFのみ: ' + String(taxOnlyMf.length).padStart(3) + '件' + ' '.repeat(29) + '│')
  console.log('  └─────────────────────────────────────────────┘')
  console.log()

  if (taxOnlySug.length > 0) {
    console.log('  【⚠️ Sugusruにあり、MFにない税区分】')
    taxOnlySug.forEach(t => console.log('    ✗ ' + t.name))
    console.log()
  }

  if (taxOnlyMf.length > 0) {
    console.log('  【⚠️ MFにあり、Sugusruにない税区分】')
    taxOnlyMf.forEach(t => console.log('    + ' + t.name))
    console.log()
  }

  // ━━━ Step 6: 総合判定 ━━━
  console.log('━━━ Step 6: 総合判定 ━━━\n')

  const issues: string[] = []

  if (accOnlySug.length > 0) {
    issues.push('⚠️ Sugusruにあり、MFにない科目が' + accOnlySug.length + '件。これらを使った仕訳はMFに送信できない。')
  }
  if (accOnlyMf.length > 0) {
    issues.push('ℹ️ MFにあり、Sugusruにない科目が' + accOnlyMf.length + '件。MF独自科目としてインポートが必要。')
  }
  if (taxOnlySug.length > 0) {
    issues.push('⚠️ Sugusruにあり、MFにない税区分が' + taxOnlySug.length + '件（課税方式: ' + taxMethod + '）。')
  }
  if (taxOnlyMf.length > 0) {
    issues.push('ℹ️ MFにあり、Sugusruにない税区分が' + taxOnlyMf.length + '件。')
  }
  if (withSubs.length > 0) {
    issues.push('ℹ️ MFに補助科目が' + withSubs.length + '科目ある。Sugusruとの突合が未実装。')
  }

  if (issues.length === 0) {
    console.log('  ✅ 差異なし。MFとSugusruの科目・税区分は完全一致。')
  } else {
    console.log('  検出した問題:')
    issues.forEach((issue, i) => console.log('  ' + (i + 1) + '. ' + issue))
  }
  console.log()
}

main().catch(e => {
  console.error('エラー:', e)
  process.exit(1)
})
