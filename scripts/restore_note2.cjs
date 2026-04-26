const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// 元々noteに値が入っていたフィールドを復元
const NOTES = {
  'id':            'documentId(独自) / f.id(Drive)',
  'fileHash':      'Drive: migrationWorkerで計算→doc-store書戻し',
  'source':        'handleConfirm L902 / useDriveDocuments L121',
  'createdBy':     'Drive: fetchDriveFiles時にcurrentStaffId付与',
  'updatedBy':     'updateStatus()でstaffId付与。選別操作時に記録',
  'updatedAt':     '同上',
};

const lines = s.split('\n');
let count = 0;
const newLines = lines.map(line => {
  const m = line.match(/field: '([^']*)'/);
  if (!m) return line;
  const note = NOTES[m[1]];
  if (!note) return line;
  count++;
  return line.replace(/note: ''/, `note: '${note}'`);
});

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('note復元: ' + count);
