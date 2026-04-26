const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
const s = fs.readFileSync(file, 'utf8');

// 各フィールドオブジェクトを抽出
const fieldRegex = /\{ field: '([^']*)'[^}]*\}/g;
const fields = [];
let m;
while ((m = fieldRegex.exec(s)) !== null) {
  fields.push({ raw: m[0], field: m[1], pos: m.index });
}

const requiredProps = ['field','label','tsType','uploadOwn','uploadDrive','selectOwn','selectDrive','prodAi','tsRule','humanInput','journalList','outMf','outCost','outStaffCount','outStaffTime','note'];
const errors = [];

fields.forEach((f, i) => {
  requiredProps.forEach(prop => {
    if (!f.raw.includes(prop + ':') && !f.raw.includes(prop + ' :')) {
      errors.push(`[${i+1}] field='${f.field}' にプロパティ '${prop}' が欠落`);
    }
  });
});

// セクション数カウント
const sectionCount = (s.match(/title: '/g) || []).length;

console.log(`総フィールド数: ${fields.length}`);
console.log(`セクション数: ${sectionCount}`);
console.log(`エラー数: ${errors.length}`);
errors.forEach(e => console.log(`  ERROR: ${e}`));

if (errors.length === 0) {
  console.log('全フィールドの全プロパティが存在します。');
}
