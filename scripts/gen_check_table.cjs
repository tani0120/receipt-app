const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
const content = fs.readFileSync(file, 'utf8');

// セクションとフィールドを抽出
const sectionRegex = /title: '([^']*)'/g;
const sections = [];
let sm;
while ((sm = sectionRegex.exec(content)) !== null) {
  sections.push({ title: sm[1], pos: sm.index });
}

const fieldRegex = /\{ field: '([^']*)', label: '([^']*)', tsType: (?:'([^']*)'|"([^"]*)"), uploadOwn: '([^']*)', uploadDrive: '([^']*)', selectOwn: '([^']*)', selectDrive: '([^']*)', prodAi: '([^']*)', tsRule: '([^']*)', humanInput: '([^']*)', journalList: '([^']*)', outMf: '([^']*)', outCost: '([^']*)', outStaffCount: '([^']*)', outStaffTime: '([^']*)', note: (?:'([^']*)'|"([^"]*)") \}/g;
const fields = [];
let fm;
while ((fm = fieldRegex.exec(content)) !== null) {
  fields.push({
    pos: fm.index,
    field: fm[1], label: fm[2], tsType: fm[3] || fm[4],
    uO: fm[5], uD: fm[6], sO: fm[7], sD: fm[8],
    pA: fm[9], tR: fm[10], hI: fm[11], jL: fm[12],
    oM: fm[13], oC: fm[14], oSC: fm[15], oST: fm[16],
    note: fm[17] || fm[18] || ''
  });
}

let md = `# typeDefinitionsData.ts 全フィールドチェック表\n\n`;
md += `- 検証日時: ${new Date().toISOString()}\n`;
md += `- 総フィールド数: ${fields.length}\n`;
md += `- セクション数: ${sections.length}\n\n`;

let currentSection = 0;
fields.forEach((f, i) => {
  while (currentSection < sections.length - 1 && f.pos > sections[currentSection + 1].pos) {
    currentSection++;
  }
  if (i === 0 || (currentSection > 0 && f.pos > sections[currentSection].pos && (i === 0 || fields[i-1].pos < sections[currentSection].pos))) {
    md += `## ${sections[currentSection].title}\n\n`;
    md += `| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  }
  md += `| ${i+1} | ${f.field} | ${f.label} | ${f.tsType} | ${f.uO} | ${f.uD} | ${f.sO} | ${f.sD} | ${f.pA} | ${f.tR} | ${f.hI} | ${f.jL} | ${f.oM} | ${f.oC} | ${f.oSC} | ${f.oST} |\n`;
});

const outPath = path.join(__dirname, '..', '.gemini_artifacts', 'field_check_table.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, 'utf8');
console.log(`チェック表を出力: ${outPath}`);
console.log(`総フィールド数: ${fields.length}`);
