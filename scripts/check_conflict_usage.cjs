const fs = require('fs');
const s = fs.readFileSync('src/mocks/components/JournalListLevel3Mock.vue', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('voucherTypeConflict')) {
    console.log('L' + (i + 1) + ': ' + l.trim());
  }
});
// conflictInfo の .has() 使用も検索
lines.forEach((l, i) => {
  if (l.includes('conflictInfo') || l.includes('.has(')) {
    if (l.includes('conflict') || l.includes('ConflictMap')) {
      console.log('L' + (i + 1) + ' [has]: ' + l.trim());
    }
  }
});
