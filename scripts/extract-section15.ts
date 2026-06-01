/**
 * 前の会話のトランスクリプトから§15の全文を抽出するスクリプト
 */
import fs from 'fs'

const transcript = fs.readFileSync(
  'C:/Users/kazen/.gemini/antigravity-ide/brain/b0446e31-a415-4921-97ce-62c199da0ef1/.system_generated/logs/transcript.jsonl',
  'utf-8'
)

// step 714のReplacementContentを抽出（§13改訂+§15追加の全文）
const lines = transcript.split('\n')
const step714 = lines.find(l => l.includes('"step_index":714'))
if (!step714) { console.error('step 714 not found'); process.exit(1) }

// ReplacementContentを抽出
const match = step714.match(/"ReplacementContent":"(.*?)",\s*"StartLine"/)
if (!match) { console.error('ReplacementContent not found'); process.exit(1) }

// JSONエスケープを解除
let content = match[1]
// \" を除去（外側のクォート）
if (content.startsWith('\\"')) content = content.slice(2)
if (content.endsWith('\\"')) content = content.slice(0, -2)
// \\n を改行に
content = content.replace(/\\\\n/g, '\n')
// \\\\ を \\ に
content = content.replace(/\\\\\\\\/g, '\\')
// \\\" を " に
content = content.replace(/\\\\"/g, '"')
// \\" を " に
content = content.replace(/\\"/g, '"')

// §15部分を抽出
const idx15 = content.indexOf('## 15.')
if (idx15 === -1) {
  console.log('§15が見つからない。truncatedの可能性。')
  console.log('コンテンツ末尾500文字:')
  console.log(content.slice(-500))
} else {
  const section15 = content.slice(idx15)
  console.log('=== §15全文 ===')
  console.log(section15)
}

// 全体の行数
console.log('\n全体行数:', content.split('\n').length)
