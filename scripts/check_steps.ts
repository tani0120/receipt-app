import { readFileSync } from 'fs'

const data = readFileSync('C:/Users/kazen/.gemini/antigravity-ide/brain/72e13309-43a5-4dc8-b435-e6b84188c8c6/.system_generated/logs/transcript.jsonl', 'utf-8')
const lines = data.split('\n').filter(l => l.trim())

for (let i = 3703; i <= 3720; i++) {
  const line = lines.find(x => x.includes('"step_index":' + i + ','))
  if (line) {
    const j = JSON.parse(line)
    const cl = j.content ? j.content.length : 0
    const preview = j.content ? j.content.substring(0, 150).replace(/\n/g, ' ') : '(empty)'
    console.log(`Step ${i} | ${j.type} | ${j.created_at} | len=${cl} | ${preview}`)
  }
}
