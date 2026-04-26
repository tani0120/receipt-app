const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// セクションC〜Hの残りフィールド（まだ tsRule がないもの）に追加
// パターン: prodAi: 'X', outMf （tsRuleがまだない行）
s = s.replace(/prodAi: '([^']*)', outMf/g, "prodAi: '$1', tsRule: '\u2014', humanInput: '\u2014', journalList: '\u2014', outMf");

// 特定フィールドのjournalList値を修正
// C. lineItems[] → journalList=✅
s = s.replace(
  /field: 'lineItems\[\]'([^}]*?)journalList: '\u2014'/,
  "field: 'lineItems[]'$1journalList: '\u2705'"
);
// E. clientId → journalList=✅
s = s.replace(
  /field: 'clientId'([^}]*?)journalList: '\u2014'/,
  "field: 'clientId'$1journalList: '\u2705'"
);
// E. createdBy → journalList=✅
s = s.replace(
  /field: 'createdBy'([^}]*?)journalList: '\u2014'/,
  "field: 'createdBy'$1journalList: '\u2705'"
);
// E. updatedBy → humanInput=✅, journalList=✅
s = s.replace(
  /field: 'updatedBy'([^}]*?)humanInput: '\u2014'([^}]*?)journalList: '\u2014'/,
  "field: 'updatedBy'$1humanInput: '\u2705'$2journalList: '\u2705'"
);
// E. updatedAt → journalList=✅
s = s.replace(
  /field: 'updatedAt'([^}]*?)journalList: '\u2014'/,
  "field: 'updatedAt'$1journalList: '\u2705'"
);
// F. status → journalList=✅
s = s.replace(
  /field: 'status'([^}]*?)journalList: '\u2014'/,
  "field: 'status'$1journalList: '\u2705'"
);
// F. batchId → journalList=✅
s = s.replace(
  /field: 'batchId'([^}]*?)journalList: '\u2014'/,
  "field: 'batchId'$1journalList: '\u2705'"
);
// F. journalId → journalList=✅
s = s.replace(
  /field: 'journalId'([^}]*?)journalList: '\u2014'/,
  "field: 'journalId'$1journalList: '\u2705'"
);
// H. ConfirmedJournal → journalList=🔧
s = s.replace(
  /field: 'ConfirmedJournal'([^}]*?)journalList: '\u2014'/,
  "field: 'ConfirmedJournal'$1journalList: '\uD83D\uDD27'"
);

fs.writeFileSync(file, s, { encoding: 'utf8' });
console.log('C-H props fixed');
