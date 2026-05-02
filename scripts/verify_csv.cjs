const fs = require('fs');
const lines = fs.readFileSync('./public/downloads/tst00011_journals.csv', 'utf8').split('\n');
const seen = {};
lines.slice(1).forEach(l => {
  const no = l.split(',')[0];
  if (!seen[no]) seen[no] = [];
  seen[no].push(l);
});
const multi = Object.entries(seen).filter(([, v]) => v.length > 1).slice(0, 3);
console.log('=== 複合仕訳サンプル ===');
multi.forEach(([no, ls]) => {
  console.log('\n取引No=' + no + ' (' + ls.length + '行):');
  ls.forEach(l => {
    const c = l.split(',');
    console.log('  借:' + c[2] + '/' + c[3] + ' ' + c[8] + '円 | 貸:' + c[10] + '/' + c[11] + ' ' + c[16] + '円 | ' + c[18]);
  });
});
const total = Object.keys(seen).length;
const multiC = Object.entries(seen).filter(([, v]) => v.length > 1).length;
console.log('\n=== 統計 ===');
console.log('仕訳数: ' + total + ', 複合仕訳: ' + multiC + '件');
