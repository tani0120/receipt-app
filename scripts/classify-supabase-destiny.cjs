#!/usr/bin/env node
/**
 * JP_LITERAL Supabase移行判定スクリプト
 * 残り全件を「DB行き / 定数行き / コード据え置き」に分類
 */
const { execSync } = require('child_process');

const output = execSync('node scripts/audit-hardcode.cjs --verbose', { encoding: 'utf8' });
const lines = output.split(/\r?\n/);

const jpLines = [];
let currentFile = null;
for (const line of lines) {
  const fileMatch = line.match(/===\s+(.+?)\s+\(\d+件\)\s+===/);
  if (fileMatch) { currentFile = fileMatch[1].trim(); continue; }
  const issueMatch = line.match(/L\s*(\d+)\s+\[JP_LITERAL\]\s+(.*)/);
  if (issueMatch && currentFile) {
    jpLines.push({ file: currentFile, lineNum: +issueMatch[1], content: issueMatch[2].trim() });
  }
}

// ファイルパスからカテゴリを判定
function classifyDestination(file, content) {
  const f = file.replace(/\\/g, '/');
  
  // API層（エラーメッセージ・バリデーション）→ コード内定数で十分
  if (f.includes('/api/')) {
    if (/apiError|throw.*Error|return.*apiError/.test(content)) return 'コード据え置き（APIエラー）';
    if (/zod|validate|Validation/.test(content)) return 'コード据え置き（バリデーション）';
    return 'コード据え置き（APIロジック）';
  }

  // composable層
  if (f.includes('/composables/')) {
    if (/showToast|modal\.(notify|confirm)|alert\(/.test(content)) return '定数化推奨（通知メッセージ）';
    if (/label:|title:/.test(content)) return '定数化推奨（UIラベル）';
    return 'コード据え置き（ロジック内）';
  }

  // shared層
  if (f.includes('/shared/')) return 'コード据え置き（共有定義）';

  // utils層
  if (f.includes('/utils/')) return 'コード据え置き（ユーティリティ）';

  // view/component層（UI）
  if (f.includes('/views/') || f.includes('/components/')) {
    if (/modal\.(notify|confirm)|showToast|alert\(/.test(content)) return '定数化推奨（通知メッセージ）';
    if (/label:\s*['"`]/.test(content)) return 'DB候補（フィールドラベル）';
    if (/\{\s*value:.*label:/.test(content)) return 'DB候補（選択肢定義）';
    if (/title:\s*['"`]/.test(content)) return '定数化推奨（ダイアログタイトル）';
    if (/header|Header|<th/.test(content)) return 'DB候補（テーブルヘッダ）';
    if (/placeholder/.test(content)) return '定数化推奨（プレースホルダ）';
    if (/cancelLabel|confirmLabel/.test(content)) return '定数化推奨（ボタンラベル）';
    if (/name:\s*['"`]/.test(content)) return '定数化推奨（UI名称）';
    if (/`[^`]*\$\{/.test(content)) return '定数化困難（動的テンプレート）';
    if (/markDirty/.test(content)) return 'コード据え置き（操作ログ）';
    return 'その他（要個別判断）';
  }

  return 'その他（要個別判断）';
}

const categories = {};
for (const { file, content } of jpLines) {
  const cat = classifyDestination(file, content);
  if (!categories[cat]) categories[cat] = { count: 0, files: {} };
  categories[cat].count++;
  const shortFile = file.replace(/.*src[\\/]/, '');
  if (!categories[cat].files[shortFile]) categories[cat].files[shortFile] = 0;
  categories[cat].files[shortFile]++;
}

console.log(`=== JP_LITERAL ${jpLines.length}件 Supabase移行判定 ===\n`);

// 大分類で集約
const groups = {
  'DB候補（Supabase移行時にテーブル化）': 0,
  '定数化推奨（今やるべき）': 0,
  '定数化困難（動的テンプレート）': 0,
  'コード据え置き（移行不要）': 0,
  'その他（要個別判断）': 0,
};

Object.entries(categories).sort((a, b) => b[1].count - a[1].count).forEach(([cat, data]) => {
  console.log(`\n■ ${cat}: ${data.count}件`);
  const topFiles = Object.entries(data.files).sort((a, b) => b[1] - a[1]).slice(0, 5);
  topFiles.forEach(([f, c]) => console.log(`    ${f}: ${c}件`));

  if (cat.startsWith('DB候補')) groups['DB候補（Supabase移行時にテーブル化）'] += data.count;
  else if (cat.startsWith('定数化推奨')) groups['定数化推奨（今やるべき）'] += data.count;
  else if (cat.startsWith('定数化困難')) groups['定数化困難（動的テンプレート）'] += data.count;
  else if (cat.startsWith('コード据え置き')) groups['コード据え置き（移行不要）'] += data.count;
  else groups['その他（要個別判断）'] += data.count;
});

console.log('\n\n=== 大分類サマリー ===\n');
Object.entries(groups).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  const pct = ((v / jpLines.length) * 100).toFixed(1);
  console.log(`  ${k.padEnd(40)}: ${String(v).padStart(4)}件 (${pct}%)`);
});
console.log(`\n  合計: ${jpLines.length}件`);
