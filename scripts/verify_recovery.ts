import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const base = execSync('git show HEAD:src/shared/validation/journalValidationCore.ts',
  { cwd: 'c:\\dev\\receipt-app' }).toString('utf-8').replace(/\r/g, '')

const d3664 = readFileSync('.git/original_diff_step3664.txt', 'utf-8').replace(/\r/g, '')
const d3703 = readFileSync('.git/original_diff_step3703.txt', 'utf-8').replace(/\r/g, '')
const currentRaw = readFileSync('src/shared/validation/journalValidationCore.ts', 'utf-8').replace(/\r/g, '')

function getBlock(t: string) {
  return t.match(/\[diff_block_start\]\n([\s\S]*?)\n\[diff_block_end\]/)![1].split('\n')
}

type Hunk = { oldStart: number; old: string[]; nw: string[] }

function parseHunks(dl: string[]): Hunk[] {
  const hunks: Hunk[] = []
  let cur: Hunk | null = null
  for (const l of dl) {
    const m = l.match(/^@@ -(\d+)/)
    if (m) { if (cur) hunks.push(cur); cur = { oldStart: +m[1], old: [], nw: [] }; continue }
    if (!cur) continue
    if (l.startsWith(' ')) { cur.old.push(l.slice(1)); cur.nw.push(l.slice(1)) }
    else if (l.startsWith('-')) cur.old.push(l.slice(1))
    else if (l.startsWith('+')) cur.nw.push(l.slice(1))
  }
  if (cur) hunks.push(cur)
  return hunks
}

// コンテキスト行でマッチさせて正確な位置を特定
function findHunkPosition(lines: string[], hunk: Hunk): number {
  // hunkのold行の最初のコンテキスト行を基準に、周辺を検索
  const searchStart = Math.max(0, hunk.oldStart - 5)
  const searchEnd = Math.min(lines.length - hunk.old.length, hunk.oldStart + 5)
  
  for (let pos = searchStart; pos <= searchEnd; pos++) {
    let match = true
    for (let i = 0; i < hunk.old.length; i++) {
      if (lines[pos + i] !== hunk.old[i]) { match = false; break }
    }
    if (match) return pos
  }
  
  // 見つからない場合、元の位置を返す
  console.log(`WARNING: Cannot find exact match for hunk @${hunk.oldStart}, using original position`)
  return hunk.oldStart - 1
}

function apply(text: string, dl: string[]): string {
  const lines = text.split('\n')
  const hunks = parseHunks(dl)
  
  // 実際の位置を特定
  const positioned = hunks.map(h => ({
    ...h,
    actualPos: findHunkPosition(lines, h)
  }))
  
  // 後ろから適用
  positioned.sort((a, b) => b.actualPos - a.actualPos)
  
  for (const h of positioned) {
    console.log(`  Hunk @${h.oldStart} → actual L${h.actualPos + 1}: ${h.old.length}行→${h.nw.length}行`)
    lines.splice(h.actualPos, h.old.length, ...h.nw)
  }
  
  return lines.join('\n')
}

console.log('=== Step3664 適用 ===')
const after1 = apply(base, getBlock(d3664))
console.log(`結果: ${after1.split('\n').length}行`)

console.log('\n=== Step3703 適用 ===')
const reconstructed = apply(after1, getBlock(d3703))
console.log(`結果: ${reconstructed.split('\n').length}行`)

console.log(`\n現在: ${currentRaw.split('\n').length}行`)

// 全文字比較
let dc = 0
const r = reconstructed.replace(/\n$/, '')
const c = currentRaw.replace(/\n$/, '')
for (let i = 0; i < Math.max(r.length, c.length); i++) {
  if ((i < r.length ? r[i] : '') !== (i < c.length ? c[i] : '')) dc++
}
console.log(`\n文字比較: 再構成=${r.length} 現在=${c.length} 差分=${dc}`)

if (dc === 0) {
  writeFileSync('.git/before_checkout.ts', currentRaw, 'utf-8')
  console.log('✅ 全文字完全一致。原本を .git/before_checkout.ts に出力。')
} else {
  console.log('❌ 差分あり')
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rv = i < r.length ? r[i] : '[EOF]'
    const cv = i < c.length ? c[i] : '[EOF]'
    if (rv !== cv) {
      const line = r.substring(0, i).split('\n').length
      console.log(`  最初の差分: 位置${i} L${line}`)
      console.log(`    再構成: [${r.substring(Math.max(0,i-20), i+30)}]`)
      console.log(`    現在:   [${c.substring(Math.max(0,i-20), i+30)}]`)
      break
    }
  }
}
