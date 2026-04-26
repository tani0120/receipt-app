const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// Classify AI → ... のnoteを空に戻す
let count = 0;
s = s.replace(/note: 'Classify AI → [^']*'/g, () => { count++; return "note: ''"; });
fs.writeFileSync(file, s, 'utf8');
console.log('note削除: ' + count);
