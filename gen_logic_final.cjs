const fs = require('fs');
const path = require('path');

function scan(dir) {
  let r = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      if (f === 'node_modules' || f === '.git' || f === 'dist') return;
      if (fs.statSync(p).isDirectory()) r = r.concat(scan(p));
      else if (f.endsWith('.ts') || f.endsWith('.vue')) r.push(p);
    });
  } catch (e) {}
  return r;
}

const excluded = new Set([
  'scripts\\preview_extract_postprocess.ts', 'scripts\\preview_extract_test.ts',
  'scripts\\preprocess.ts', 'components\\ScreenA_ClientList.vue',
  'components\\ScreenB_LogicMaster.vue', 'components\\ClientModal.vue',
  'components\\ScreenA_Detail_EditModal.vue', 'api\\lib\\ai\\strategy\\ZuboraLogic.ts',
  'adapters\\journalEntryAdapter.ts',
]);

const apiSide = ['api\\', 'core\\journal\\', 'repositories\\supabase\\'];
const frontOnly = ['router\\index.ts', 'shared\\utils\\copy-utils.ts'];

// UI操作系の関数名パターン
const uiPatterns = /^(toggle|show|hide|close|open|handle|on[A-Z]|start[A-Z]|stop[A-Z]|go|confirm|cancel|click|select|dismiss|reset|undo|redo|push|pop|scroll|drag|zoom|resize|navigate|switch|mount)/;
const uiComputedPatterns = /^(is[A-Z]|has[A-Z]|can[A-Z]|show[A-Z]|current|device|isMobile|page|modal|visible|selected)/;

const files = scan('./src');
const results = [];

files.forEach(f => {
  const rel = path.relative('./src', f);
  if (excluded.has(rel)) return;
  
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const logicLines = lines.filter(l => l.match(/\.filter\(|\.sort\(|\.map\(|\.reduce\(|\.find\(|\.some\(|\.every\(|if \(|switch\s*\(|for \(|while \(/)).length;
  if (logicLines < 5) return;
  if (rel.includes('JournalListLevel3Mock') || rel.includes('journalWarningSync')) return;
  
  let fileCategory;
  if (apiSide.some(d => rel.startsWith(d))) fileCategory = '\u2705 \u7dad\u6301';
  else if (frontOnly.includes(rel)) fileCategory = '\ud83d\udfe2 \u30d5\u30ed\u30f3\u30c8\u6b8b\u7559';
  else fileCategory = '\ud83d\udd34 API\u5316';
  
  const funcs = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    let funcName = null;
    let isComputed = false;
    
    const funcMatch = t.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
    if (funcMatch) funcName = funcMatch[3];
    
    const arrowMatch = t.match(/^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\(/);
    if (arrowMatch && !t.includes('computed') && !t.includes('ref(') && !t.includes('reactive(')) funcName = arrowMatch[2];
    
    const compMatch = t.match(/^const\s+(\w+)\s*=\s*computed\(/);
    if (compMatch) { funcName = compMatch[1]; isComputed = true; }
    
    if (!funcName) continue;
    // skip one-letter variable names
    if (funcName.length <= 1) continue;
    
    // 関数本文5行
    const bodyLines = [];
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      bodyLines.push(lines[j].trim());
    }
    const body = bodyLines.join(' ');
    
    // 正確な内容推定（具体的なキーワードを検出）
    const tags = [];
    // ネットワーク
    if (body.includes('fetch(') || body.includes('fetch(`') || t.includes('fetch(')) tags.push('API\u547c\u51fa');
    // ファイルI/O
    if (body.includes('writeFile') || body.includes('readFile') || body.includes('readFileSync') || body.includes('writeFileSync')) tags.push('\u30d5\u30a1\u30a4\u30ebI/O');
    // localStorage
    if (body.includes('localStorage')) tags.push('\u30ed\u30fc\u30ab\u30eb\u4fdd\u5b58');
    // 配列操作
    if (body.includes('.filter(')) tags.push('\u30d5\u30a3\u30eb\u30bf');
    if (body.includes('.sort(')) tags.push('\u30bd\u30fc\u30c8');
    if (body.includes('.map(')) tags.push('\u5909\u63db');
    if (body.includes('.reduce(')) tags.push('\u96c6\u8a08');
    if (body.includes('.find(')) tags.push('\u691c\u7d22');
    // ドメイン
    if (body.includes('zip') || body.includes('Zip') || body.includes('archiver')) tags.push('ZIP');
    if (body.includes('csv') || body.includes('CSV') || funcName.toLowerCase().includes('csv')) tags.push('CSV');
    if (body.includes('pdf') || body.includes('PDF') || funcName.toLowerCase().includes('pdf')) tags.push('PDF');
    if (body.includes('sharp(') || body.includes('compress') || body.includes('thumbnail')) tags.push('\u753b\u50cf\u51e6\u7406');
    if (body.includes('Drive') || body.includes('drive') || funcName.includes('Drive') || funcName.includes('drive')) tags.push('\u30c9\u30e9\u30a4\u30d6');
    if (body.includes('folder') || body.includes('Folder')) tags.push('\u30d5\u30a9\u30eb\u30c0');
    if (body.includes('permission') || body.includes('Permission')) tags.push('\u6a29\u9650');
    if (body.includes('validate') || funcName.includes('validate') || funcName.includes('Validate')) tags.push('\u30d0\u30ea\u30c7\u30fc\u30b7\u30e7\u30f3');
    if (funcName.includes('save') || funcName.includes('Save')) tags.push('\u4fdd\u5b58');
    if (funcName.includes('delete') || funcName.includes('Delete') || funcName.includes('remove') || funcName.includes('Remove')) tags.push('\u524a\u9664');
    if (funcName.includes('create') || funcName.includes('Create') || funcName.includes('add') && funcName.length > 3) tags.push('\u4f5c\u6210');
    if (funcName.includes('update') || funcName.includes('Update')) tags.push('\u66f4\u65b0');
    if (funcName.includes('load') || funcName.includes('Load') || funcName.includes('fetch') || funcName.includes('Fetch')) tags.push('\u30c7\u30fc\u30bf\u53d6\u5f97');
    if (funcName.includes('sync') || funcName.includes('Sync') || funcName.includes('propagate')) tags.push('\u540c\u671f/\u4f1d\u64ad');
    if (funcName.includes('upload') || funcName.includes('Upload')) tags.push('\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9');
    if (funcName.includes('download') || funcName.includes('Download')) tags.push('\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9');
    if (funcName.includes('invite') || funcName.includes('Invite')) tags.push('\u62db\u5f85');
    if (funcName.includes('hash') || funcName.includes('Hash')) tags.push('\u30cf\u30c3\u30b7\u30e5');
    if (funcName.includes('poll') || funcName.includes('Poll')) tags.push('\u30dd\u30fc\u30ea\u30f3\u30b0');
    if (funcName.includes('migrate') || funcName.includes('Migrate')) tags.push('\u30de\u30a4\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3');
    
    const desc = tags.length > 0 ? tags.join('\u30fb') : '\u30ed\u30b8\u30c3\u30af';
    
    // API化判定
    let judge;
    if (fileCategory === '\u2705 \u7dad\u6301' || fileCategory === '\ud83d\udfe2 \u30d5\u30ed\u30f3\u30c8\u6b8b\u7559') {
      judge = fileCategory;
    } else if (isComputed && uiComputedPatterns.test(funcName)) {
      judge = '\ud83d\udfe2 UI';
    } else if (uiPatterns.test(funcName)) {
      judge = '\ud83d\udfe2 UI';
    } else if (tags.includes('API\u547c\u51fa') && tags.length === 1) {
      // フロントからAPIを呼ぶだけ→UI側に残す
      judge = '\ud83d\udfe2 UI';
    } else if (tags.some(t => ['\u30d5\u30a3\u30eb\u30bf', '\u30bd\u30fc\u30c8', '\u5909\u63db', '\u96c6\u8a08', '\u691c\u7d22', '\u30d0\u30ea\u30c7\u30fc\u30b7\u30e7\u30f3', 'CSV', 'ZIP', 'PDF', '\u753b\u50cf\u51e6\u7406', '\u30c9\u30e9\u30a4\u30d6', '\u30d5\u30a9\u30eb\u30c0', '\u6a29\u9650', '\u540c\u671f/\u4f1d\u64ad', '\u30de\u30a4\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3'].includes(t))) {
      judge = '\ud83d\udd34 API\u5316';
    } else if (tags.some(t => ['\u4fdd\u5b58', '\u524a\u9664', '\u4f5c\u6210', '\u66f4\u65b0', '\u30c7\u30fc\u30bf\u53d6\u5f97', '\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9', '\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9', '\u30cf\u30c3\u30b7\u30e5', '\u30dd\u30fc\u30ea\u30f3\u30b0'].includes(t))) {
      judge = '\ud83d\udd34 API\u5316';
    } else {
      judge = '\ud83d\udd34 API\u5316';
    }
    
    const displayName = isComputed ? funcName + ' (computed)' : funcName;
    funcs.push({ name: displayName, line: i + 1, desc, judge });
  }
  
  results.push({ file: rel, kb: Math.round(fs.statSync(f).size / 1024), logic: logicLines, category: fileCategory, funcs });
});

results.sort((a, b) => b.logic - a.logic);

let out = '';
let apiCount = 0, uiCount = 0, keepCount = 0;

results.forEach(f => {
  out += `\n### ${f.file} (${f.kb}KB / ${f.logic}\u30ed\u30b8\u30c3\u30af\u884c) ${f.category}\n\n`;
  out += `| \u95a2\u6570 | \u884c | \u5185\u5bb9 | \u5224\u5b9a |\n|---|---|---|---|\n`;
  if (f.funcs.length === 0) {
    out += `| (\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u5185\u30ed\u30b8\u30c3\u30af) | - | \u30d5\u30a1\u30a4\u30eb\u5168\u4f53\u78ba\u8a8d\u5fc5\u8981 | ${f.category} |\n`;
  }
  f.funcs.forEach(fn => {
    out += `| \`${fn.name}\` | L${fn.line} | ${fn.desc} | ${fn.judge} |\n`;
    if (fn.judge.includes('API')) apiCount++;
    else if (fn.judge.includes('UI') || fn.judge.includes('\u30d5\u30ed\u30f3\u30c8')) uiCount++;
    else keepCount++;
  });
  out += '\n';
});

// サマリ
const summary = `
## \u5168\u95a2\u6570\u5224\u5b9a\u30b5\u30de\u30ea

| \u5224\u5b9a | \u95a2\u6570\u6570 |
|---|---|
| \ud83d\udd34 API\u5316 | ${apiCount} |
| \ud83d\udfe2 UI/\u30d5\u30ed\u30f3\u30c8\u6b8b\u7559 | ${uiCount} |
| \u2705 \u7dad\u6301 | ${keepCount} |
| **\u5408\u8a08** | **${apiCount + uiCount + keepCount}** |

`;

fs.writeFileSync('./logic_final_v3.txt', summary + out, 'utf8');
console.log('\u5b8c\u4e86: ' + results.length + '\u30d5\u30a1\u30a4\u30eb / ' + (apiCount + uiCount + keepCount) + '\u95a2\u6570');
console.log('API\u5316: ' + apiCount + ' / UI: ' + uiCount + ' / \u7dad\u6301: ' + keepCount);
