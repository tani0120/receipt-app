const { execSync } = require('child_process')
const fs = require('fs')
const file = 'src/mocks/components/typeDefinitionsData.ts'

// 元のnoteを取得
const orig = execSync('git show HEAD:' + file, { encoding: 'utf8' })
const origNotes = {}
let secOrig = 0
for (const line of orig.split('\n')) {
  const tm = line.match(/title: '([A-O])\./)
  if (tm) secOrig = tm[1].charCodeAt(0) - 65
  const fm = line.match(/field: '([^']*)'/)
  const nm = line.match(/note: '([^']*)'/)
  if (fm && nm && nm[1] !== '') {
    const key = secOrig + ':' + fm[1]
    origNotes[key] = nm[1]
  }
}

// 現在のファイルに適用
let s = fs.readFileSync(file, 'utf8')
let secCur = 0
let count = 0
const lines = s.split('\n')
const newLines = lines.map(line => {
  const tm = line.match(/title: '([A-O])\./)
  if (tm) secCur = tm[1].charCodeAt(0) - 65
  const fm = line.match(/field: '([^']*)'/)
  if (!fm) return line
  const key = secCur + ':' + fm[1]
  const origNote = origNotes[key]
  if (!origNote) return line
  // 現在のnoteが空の場合のみ復元
  if (line.includes("note: ''")) {
    count++
    return line.replace("note: ''", "note: '" + origNote + "'")
  }
  return line
})
fs.writeFileSync(file, newLines.join('\n'), 'utf8')
console.log('note復元: ' + count + '/' + Object.keys(origNotes).length)
