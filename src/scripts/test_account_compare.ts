import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { mcpFetchAccounts } from '../api/services/mfMcpClient'
import { readFileSync } from 'fs'

const TK = process.env['MF_TEST_TOKEN_KEY'] ?? ''

const mfAccts = await mcpFetchAccounts(TK)
console.log('MF科目数:', mfAccts.length)
const mfNames = new Set(mfAccts.map(a => a.name))

const sugAccts = JSON.parse(readFileSync('data/account-master.json', 'utf8')) as Array<{id: string; name: string; accountGroup: string}>
const unmatched = sugAccts.filter(s => !mfNames.has(s.name))
console.log('Sugusru科目数:', sugAccts.length)
console.log('マッチ:', sugAccts.length - unmatched.length, '件')
console.log('未マッチ:', unmatched.length, '件')
console.log('')
for (const [i, u] of unmatched.entries()) {
  console.log(`${i+1}. ${u.id} | ${u.name} | ${u.accountGroup}`)
}

const sugNames = new Set(sugAccts.map(s => s.name))
const mfOnly = mfAccts.filter(m => !sugNames.has(m.name) && m.available !== false)
console.log('')
console.log('逆: MFにあってSugusruにない科目:', mfOnly.length, '件')
for (const m of mfOnly) {
  console.log(`  ${m.name} | ${m.account_group}`)
}
process.exit(0)
