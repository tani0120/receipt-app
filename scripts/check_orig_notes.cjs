const { execSync } = require('child_process')
try {
  const orig = execSync('git show HEAD:src/mocks/components/typeDefinitionsData.ts', { encoding: 'utf8' })
  const lines = orig.split('\n')
  let count = 0
  for (const line of lines) {
    const fm = line.match(/field: '([^']*)'/)
    const nm = line.match(/note: '([^']*)'/)
    if (fm && nm && nm[1] !== '') {
      console.log(fm[1] + ': ' + nm[1])
      count++
    }
  }
  console.log('合計: ' + count + '件')
} catch (e) {
  console.error('エラー:', e.message)
}
