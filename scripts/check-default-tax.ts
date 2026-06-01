import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { mcpFetchAccounts, mcpFetchTaxes } from '../src/api/services/mfMcpClient.js'

const TSK = 'c_wTdnMKDO'

async function main() {
  const accounts = await mcpFetchAccounts(TSK)
  const taxes = await mcpFetchTaxes(TSK)
  
  const taxMap = new Map(taxes.map((t: any) => [t.id, t.name]))
  
  const genkin = accounts.find((a: any) => a.name === '現金')
  const uriage = accounts.find((a: any) => a.name === '売上高')
  
  console.log('=== 勘定科目のデフォルト税区分 ===')
  console.log(`現金: tax_id=${genkin?.tax_id}, デフォルト税区分名=${taxMap.get(genkin?.tax_id) || '不明'}`)
  console.log(`売上高: tax_id=${uriage?.tax_id}, デフォルト税区分名=${taxMap.get(uriage?.tax_id) || '不明'}`)
  
  const taxCounts: Record<string, number> = {}
  for (const a of accounts as any[]) {
    const taxName = taxMap.get(a.tax_id) || `不明(${a.tax_id})`
    taxCounts[taxName] = (taxCounts[taxName] || 0) + 1
  }
  
  console.log('\n=== 全科目のデフォルト税区分分布 ===')
  for (const [name, count] of Object.entries(taxCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}件`)
  }
}

main().catch(e => console.error(e.message?.substring(0, 300)))
