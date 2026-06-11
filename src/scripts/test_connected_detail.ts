import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

// 連携サービス一覧を詳細に取得
const result = await callMcpTool(
  'mfc_ca_getConnectedAccounts', {}, TOKEN_KEY
)
console.log('=== 連携サービス一覧（全フィールド） ===')
console.log(JSON.stringify(result, null, 2))
