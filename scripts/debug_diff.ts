import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const base = execSync('git show HEAD:src/shared/validation/journalValidationCore.ts',
  { cwd: 'c:\\dev\\receipt-app' }).toString('utf-8').replace(/\r/g, '')

const d3664 = readFileSync('.git/original_diff_step3664.txt', 'utf-8').replace(/\r/g, '')
const d3703 = readFileSync('.git/original_diff_step3703.txt', 'utf-8').replace(/\r/g, '')

function getBlock(t: string) {
  return t.match(/\[diff_block_start\]\n([\s\S]*?)\n\[diff_block_end\]/)![1].split('\n')
}

function apply(text: string, dl: string[]): string {
  const lines = text.split('\n')
  type H = { s: number; old: string[]; nw: string[] }
  const hunks: H[] = []
  let cur: H | null = null
  for (const l of dl) {
    const m = l.match(/^@@ -(\d+)/)
    if (m) { if (cur) hunks.push(cur); cur = { s: +m[1], old: [], nw: [] }; continue }
    if (!cur) continue
    if (l.startsWith(' ')) { cur.old.push(l.slice(1)); cur.nw.push(l.slice(1)) }
    else if (l.startsWith('-')) cur.old.push(l.slice(1))
    else if (l.startsWith('+')) cur.nw.push(l.slice(1))
  }
  if (cur) hunks.push(cur)
  hunks.sort((a, b) => b.s - a.s)
  for (const h of hunks) {
    // 検証
    for (let i = 0; i < h.old.length; i++) {
      if (lines[h.s - 1 + i] !== h.old[i]) {
        console.log(`MISMATCH @${h.s} +${i}: expect=[${h.old[i]}] actual=[${lines[h.s - 1 + i]}]`)
      }
    }
    lines.splice(h.s - 1, h.old.length, ...h.nw)
  }
  return lines.join('\n')
}

console.log('=== Step3664 ===')
const a1 = apply(base, getBlock(d3664))
console.log(`行数: ${a1.split('\n').length}`)

// step3664適用後のL497-L520を表示
const a1lines = a1.split('\n')
console.log('\nStep3664適用後 L497-L520:')
for (let i = 496; i < 520; i++) console.log(`  L${i+1}: ${a1lines[i]}`)

console.log('\n=== Step3703 ===')
const a2 = apply(a1, getBlock(d3703))
console.log(`行数: ${a2.split('\n').length}`)
