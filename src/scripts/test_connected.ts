/**
 * 連携サービス詳細確認テスト
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

async function main() {
  console.log('=== 事業者情報 ===')
  const office = await callMcpTool<unknown>('mfc_ca_currentOffice', {}, TOKEN_KEY)
  console.log(JSON.stringify(office, null, 2))

  console.log('\n=== 連携サービス（getConnectedAccounts） ===')
  const ca = await callMcpTool<unknown>('mfc_ca_getConnectedAccounts', {}, TOKEN_KEY)
  console.log(JSON.stringify(ca, null, 2))
}

main().catch(e => console.error('エラー:', e))
