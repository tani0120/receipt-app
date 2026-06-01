import fs from 'fs'

// §15の内容
const section15 = fs.readFileSync(
  'C:/Users/kazen/.gemini/antigravity-ide/brain/bdd12135-7c58-4ad4-84ad-7e58fdc363b9/scratch/section15_restored.md',
  'utf-8'
)

// b0446e31のmaster_factsheet.mdに§14の前に§15を挿入
const target = 'C:/Users/kazen/.gemini/antigravity-ide/brain/b0446e31-a415-4921-97ce-62c199da0ef1/master_factsheet.md'
let content = fs.readFileSync(target, 'utf-8')

// §14の前に§15を挿入
const marker = '## 14. 未実施・未解決 全件一覧'
const idx = content.indexOf(marker)
if (idx === -1) {
  console.error('§14が見つからない')
  process.exit(1)
}

content = content.slice(0, idx) + section15 + '\n' + content.slice(idx)
fs.writeFileSync(target, content, 'utf-8')
console.log('b0446e31版: §15挿入完了。行数:', content.split('\n').length)

// 43_master_factsheet.mdにも同じ処理
const proj = 'c:/dev/receipt-app/docs/genzai/43_master_factsheet.md'
let projContent = fs.readFileSync(proj, 'utf-8')
const projIdx = projContent.indexOf(marker)
if (projIdx === -1) {
  console.error('43_に§14が見つからない')
  process.exit(1)
}
projContent = projContent.slice(0, projIdx) + section15 + '\n' + projContent.slice(projIdx)
fs.writeFileSync(proj, projContent, 'utf-8')
console.log('43_版: §15挿入完了。行数:', projContent.split('\n').length)

// master_factsheet_original.mdにも
const orig = 'C:/Users/kazen/.gemini/antigravity-ide/brain/bdd12135-7c58-4ad4-84ad-7e58fdc363b9/master_factsheet_original.md'
let origContent = fs.readFileSync(orig, 'utf-8')
const origIdx = origContent.indexOf(marker)
if (origIdx === -1) {
  console.error('original版に§14が見つからない')
  process.exit(1)
}
origContent = origContent.slice(0, origIdx) + section15 + '\n' + origContent.slice(origIdx)
fs.writeFileSync(orig, origContent, 'utf-8')
console.log('original版: §15挿入完了。行数:', origContent.split('\n').length)

// master_factsheet_updated.mdにも
const upd = 'C:/Users/kazen/.gemini/antigravity-ide/brain/bdd12135-7c58-4ad4-84ad-7e58fdc363b9/master_factsheet_updated.md'
let updContent = fs.readFileSync(upd, 'utf-8')
const updIdx = updContent.indexOf(marker)
if (updIdx === -1) {
  console.error('updated版に§14が見つからない')
  process.exit(1)
}
updContent = updContent.slice(0, updIdx) + section15 + '\n' + updContent.slice(updIdx)
fs.writeFileSync(upd, updContent, 'utf-8')
console.log('updated版: §15挿入完了。行数:', updContent.split('\n').length)
