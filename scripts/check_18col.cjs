const s = require('fs').readFileSync('src/mocks/components/typeDefinitionsData.ts', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes("field: '") && l.includes('uploadOwn:')) {
    console.log('行' + (i + 1) + ': 旧形式が残存');
  }
});
