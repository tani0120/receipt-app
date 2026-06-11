import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

const result = await callMcpTool(
  'mfc_ca_postTransactions',
  {
    connected_account_id: 'KQhlJ6NbWfKhLYT3UHKqXw4f%2FAg897zPczKrY%2BjpDWE%3D',
    transactions: [{
      date: '2026-06-01',
      content: '鳥貴族 谷町四丁目店',
      side: 'EXPENSE',
      value: 2,
      memo: '【テスト2円】MF自動仕訳テスト。要削除。',
    }],
  },
  TOKEN_KEY
)
console.log('✅ 明細登録成功（2円）')
console.log(JSON.stringify(result, null, 2))
