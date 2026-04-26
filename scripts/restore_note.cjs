const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');
// noteClassify: '...', noteExtract: '...' → dataSource: '', note: ''
s = s.replace(/noteClassify: '[^']*', noteExtract: '[^']*'/g, "dataSource: '', note: ''");
fs.writeFileSync(file, s, 'utf8');
const count = (s.match(/dataSource: ''/g) || []).length;
console.log('復元: ' + count);
