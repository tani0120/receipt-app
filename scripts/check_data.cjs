const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');

// 1. journals
const jFiles = fs.readdirSync(DATA).filter(f => f.startsWith('journals-') && f.endsWith('.json'));
console.log('=== 仕訳データ ===');
let totalJ = 0;
for (const f of jFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  const active = d.filter(j => !j.deleted_at);
  totalJ += active.length;
  if (active.length > 0) {
    console.log(`  ${f}: ${active.length}件, created_at例: ${active[0].created_at || 'なし'}`);
  }
}
console.log(`  合計: ${totalJ}件`);

// 2. export-history
const eFiles = fs.readdirSync(DATA).filter(f => f.startsWith('export-history-') && f.endsWith('.json'));
console.log('\n=== 出力履歴 ===');
for (const f of eFiles) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  for (const e of d) {
    console.log(`  ${f}: date=${e.exportDate}, count=${e.count}, csvLineCount=${e.csvLineCount || 'なし'}, staffId=${e.staffId || 'なし'}`);
  }
}

// 3. documents (aiMetrics)
console.log('\n=== ドキュメント(aiMetrics) ===');
const docFile = path.join(DATA, 'documents.json');
if (fs.existsSync(docFile)) {
  const docs = JSON.parse(fs.readFileSync(docFile, 'utf8'));
  const withMetrics = docs.filter(d => d.aiMetrics);
  let totalCost = 0;
  for (const d of withMetrics) totalCost += d.aiMetrics.cost_yen || 0;
  console.log(`  全件: ${docs.length}, aiMetrics有: ${withMetrics.length}, 合計コスト: ${totalCost}円`);
}

// 4. activity-log
console.log('\n=== 活動ログ ===');
const actFile = path.join(DATA, 'activity-log.json');
if (fs.existsSync(actFile)) {
  const logs = JSON.parse(fs.readFileSync(actFile, 'utf8'));
  console.log(`  ${logs.length}件`);
} else {
  console.log('  ファイルなし');
}
