const fs=require('fs')
const s=fs.readFileSync('src/mocks/components/typeDefinitionsData.ts','utf8')
const lines=s.split('\n')
let count=0
for(const line of lines){
  const fm=line.match(/field: '([^']*)'/)
  const nm=line.match(/note: '([^']*)'/)
  if(fm && nm && nm[1]!==''){
    console.log(fm[1]+': '+nm[1])
    count++
  }
}
console.log('合計: '+count+'件')
