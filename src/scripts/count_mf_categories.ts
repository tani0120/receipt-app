/**
 * MCP実機からTST（法人）の勘定科目を取得し、
 * category（科目分類）のユニーク値を account_group 別に集計する。
 * 
 * 目的: 前セッションで「法人36種」と記載したが、ハルシネーションの可能性がある。
 * MCP生データから自分で数えて確認する。
 */
import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import { mcpFetchAccounts } from '../api/services/mfMcpClient'

const TST_KEY = 'c_rODnkCDN'  // 法人（株式会社すぐする）
const TSK_KEY = 'c_wTdnMKDO'  // 個人（谷風行寛）

async function main() {
  // 法人
  console.log(`\n=== 法人 TST (${TST_KEY}) ===`)
  const tstAccounts = await mcpFetchAccounts(TST_KEY)
  console.log(`取得件数: ${tstAccounts.length}`)
  
  const tstByGroup: Record<string, Set<string>> = {}
  const tstAllCategories = new Set<string>()
  
  for (const a of tstAccounts) {
    const group = a.account_group || '(なし)'
    const cat = a.category || '(なし)'
    if (!tstByGroup[group]) tstByGroup[group] = new Set()
    tstByGroup[group].add(cat)
    tstAllCategories.add(cat)
  }
  
  console.log(`\ncategory ユニーク数: ${tstAllCategories.size}`)
  console.log('\naccount_group別:')
  for (const [group, cats] of Object.entries(tstByGroup).sort()) {
    console.log(`  ${group} (${cats.size}種): ${[...cats].sort().join(', ')}`)
  }
  
  // 個人
  console.log(`\n=== 個人 TSK (${TSK_KEY}) ===`)
  const tskAccounts = await mcpFetchAccounts(TSK_KEY)
  console.log(`取得件数: ${tskAccounts.length}`)
  
  const tskByGroup: Record<string, Set<string>> = {}
  const tskAllCategories = new Set<string>()
  
  for (const a of tskAccounts) {
    const group = a.account_group || '(なし)'
    const cat = a.category || '(なし)'
    if (!tskByGroup[group]) tskByGroup[group] = new Set()
    tskByGroup[group].add(cat)
    tskAllCategories.add(cat)
  }
  
  console.log(`\ncategory ユニーク数: ${tskAllCategories.size}`)
  console.log('\naccount_group別:')
  for (const [group, cats] of Object.entries(tskByGroup).sort()) {
    console.log(`  ${group} (${cats.size}種): ${[...cats].sort().join(', ')}`)
  }
  
  // 差分
  console.log('\n=== 法人のみ ===')
  for (const c of [...tstAllCategories].sort()) {
    if (!tskAllCategories.has(c)) console.log(`  ${c}`)
  }
  console.log('\n=== 個人のみ ===')
  for (const c of [...tskAllCategories].sort()) {
    if (!tstAllCategories.has(c)) console.log(`  ${c}`)
  }
  
  // 全enum値リスト（JSON）
  console.log('\n=== 法人全enum値（JSON） ===')
  console.log(JSON.stringify([...tstAllCategories].sort()))
  console.log('\n=== 個人全enum値（JSON） ===')
  console.log(JSON.stringify([...tskAllCategories].sort()))
  
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
