/**
 * 2事業者の課税方式を確認 + 簡易/原則でinvoice_kindテスト
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

async function checkOffice(tokenKey: string) {
  console.log(`━━━ ${tokenKey} ━━━`)
  try {
    const office = await callMcpTool('mfc_ca_currentOffice', {}, tokenKey) as Record<string, unknown>
    console.log(`  事業者名: ${office.name}`)
    console.log(`  事業形態: ${office.business_type}`)
    console.log(`  課税方式: ${office.tax_method ?? '不明'}`)
    console.log(`  インボイス: ${office.invoice_registration_number ?? 'なし'}`)
    // 全フィールド表示
    for (const [k, v] of Object.entries(office)) {
      if (!['name', 'business_type'].includes(k) && v != null && v !== '') {
        console.log(`  ${k}: ${v}`)
      }
    }
  } catch (e) {
    console.error(`  エラー:`, e instanceof Error ? e.message : e)
  }
  console.log()
}

await checkOffice('c_wTdnMKDO')
await checkOffice('c_rODnkCDN')
process.exit(0)
