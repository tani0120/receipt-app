/**
 * 税区分が顧問先の課税方式に連動するか検証
 * TST(法人テスト) と TSK(個人テスト) で比較
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchTaxes, mcpFetchTermSettings } from '../api/services/mfMcpClient'
import * as fs from 'fs'

// TST=法人, TSK=個人
const TST_KEY = 'c_rODnkCDN'
const TSK_KEY = 'c_C0s5Keky'

async function main() {
  // 1. 各事業者の課税方式を確認
  console.log('=== 課税方式 ===')
  for (const key of [TST_KEY, TSK_KEY]) {
    try {
      const terms = await mcpFetchTermSettings(undefined, key)
      const latest = terms.sort((a, b) => b.fiscal_year - a.fiscal_year)[0]
      console.log(`${key}: tax_method=${latest?.tax_method}, fiscal_year=${latest?.fiscal_year}`)
    } catch {
      console.log(`${key}: 取得失敗`)
    }
  }

  // 2. 各事業者の税区分を比較
  console.log('\n=== 税区分比較 ===')
  const tstTaxes = await mcpFetchTaxes(TST_KEY)
  const tskTaxes = await mcpFetchTaxes(TSK_KEY)

  console.log(`TST: ${tstTaxes.length}件`)
  console.log(`TSK: ${tskTaxes.length}件`)

  // 名前でグループ化
  const tstNames = new Set(tstTaxes.map(t => t.name))
  const tskNames = new Set(tskTaxes.map(t => t.name))

  const tstOnly = [...tstNames].filter(n => !tskNames.has(n))
  const tskOnly = [...tskNames].filter(n => !tstNames.has(n))
  const common = [...tstNames].filter(n => tskNames.has(n))

  console.log(`\n共通: ${common.length}件`)
  console.log(`TST(法人)のみ: ${tstOnly.length}件`)
  tstOnly.forEach(n => {
    const t = tstTaxes.find(x => x.name === n)
    console.log(`  ${n} (available=${t?.available})`)
  })
  console.log(`TSK(個人)のみ: ${tskOnly.length}件`)
  tskOnly.forEach(n => {
    const t = tskTaxes.find(x => x.name === n)
    console.log(`  ${n} (available=${t?.available})`)
  })

  // 3. available=falseの税区分を確認
  console.log('\n=== TST available=false ===')
  const tstUnavail = tstTaxes.filter(t => !t.available)
  console.log(`${tstUnavail.length}件:`)
  tstUnavail.forEach(t => console.log(`  ${t.name} (${t.abbreviation})`))

  console.log('\n=== TSK available=false ===')
  const tskUnavail = tskTaxes.filter(t => !t.available)
  console.log(`${tskUnavail.length}件:`)
  tskUnavail.forEach(t => console.log(`  ${t.name} (${t.abbreviation})`))

  // 4. 全社マスタの税区分と比較
  const taxMasterRaw = fs.readFileSync('data/tax-category-master.json', 'utf8')
  const taxMaster = JSON.parse(taxMasterRaw)
  console.log(`\n=== 全社税区分マスタ: ${taxMaster.length}件 ===`)

  // 3科目のdefaultTaxCategoryIdとして何を設定すべきか
  // 全社マスタで「対象外」を検索
  const taiShouGai = taxMaster.filter((t: Record<string, unknown>) => 
    String(t.name ?? '').includes('対象外')
  )
  console.log(`\n「対象外」を含む全社税区分:`)
  taiShouGai.forEach((t: Record<string, unknown>) => 
    console.log(`  ${t.taxCategoryId}: ${t.name} (direction=${t.direction})`)
  )

  const kaShi10 = taxMaster.filter((t: Record<string, unknown>) => 
    String(t.name ?? '') === '課税仕入 10%'
  )
  console.log(`\n「課税仕入 10%」:`)
  kaShi10.forEach((t: Record<string, unknown>) => 
    console.log(`  ${t.taxCategoryId}: ${t.name}`)
  )

  process.exit(0)
}

main().catch(err => {
  console.error('[検証] エラー:', err)
  process.exit(1)
})
