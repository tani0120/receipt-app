const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/confirmed_journals.json', 'utf8'));

// 件数
console.log(`総件数: ${data.length}件`);

// 顧問先別
const byClient = {};
for (const j of data) {
  byClient[j.client_id] = (byClient[j.client_id] || 0) + 1;
}
console.log('\n顧問先別:');
for (const [k, v] of Object.entries(byClient)) {
  console.log(`  ${k}: ${v}件`);
}

// バッチ別
const byBatch = {};
for (const j of data) {
  byBatch[j.import_batch_id] = (byBatch[j.import_batch_id] || 0) + 1;
}
console.log(`\nバッチ数: ${Object.keys(byBatch).length}`);

// description（摘要）のユニーク値TOP20
const descMap = {};
for (const j of data) {
  const d = j.description || '(空)';
  descMap[d] = (descMap[d] || 0) + 1;
}
const sorted = Object.entries(descMap).sort((a, b) => b[1] - a[1]);
console.log(`\n摘要ユニーク数: ${sorted.length}`);
console.log('摘要TOP20:');
for (const [desc, cnt] of sorted.slice(0, 20)) {
  const acct = data.find(j => j.description === desc)?.debit_entries?.[0]?.account || '?';
  console.log(`  ${cnt}件 | ${acct} | ${desc}`);
}

// match_key のユニーク値
const mkSet = new Set(data.map(j => j.match_key).filter(Boolean));
console.log(`\nmatch_keyユニーク数: ${mkSet.size}`);
