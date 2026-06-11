import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { callMcpTool } from '../api/services/mfMcpClient'

const TOKEN_KEY = process.env['MF_TEST_TOKEN_KEY'] ?? ''

const result = await callMcpTool('mfc_ca_en_ja_dictionary', {}, TOKEN_KEY)
console.log(JSON.stringify(result, null, 2))
