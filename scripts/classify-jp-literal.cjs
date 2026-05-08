#!/usr/bin/env node
/**
 * JP_LITERAL パターン分類 — audit verboseの出力を直接パースして分類
 */
const { execSync } = require('child_process');

const output = execSync('node scripts/audit-hardcode.cjs --verbose', { encoding: 'utf8' });
const lines = output.split(/\r?\n/);

const jpLines = [];
let currentFile = null;
for (const line of lines) {
  // === src\path\file.ts (N件) ===
  const fileMatch = line.match(/===\s+(.+?)\s+\(\d+件\)\s+===/);
  if (fileMatch) {
    currentFile = fileMatch[1].trim();
    continue;
  }
  // L 73 [JP_LITERAL] ...
  const issueMatch = line.match(/\[JP_LITERAL\]\s+(.*)/);
  if (issueMatch && currentFile) {
    jpLines.push({ file: currentFile, content: issueMatch[1].trim() });
  }
}

console.log(`=== JP_LITERAL 全 ${jpLines.length} 件 パターン分類 ===\n`);

const patterns = {
  'apiError/throw Error（エラー）': 0,
  'modal.notify/confirm（ダイアログ）': 0,
  'showToast（トースト通知）': 0,
  'alert/confirm（ブラウザ標準）': 0,
  'value+label（選択肢定義）': 0,
  'label:（ラベル定義）': 0,
  'title:（タイトル定義）': 0,
  'name:（名前定義）': 0,
  'cancelLabel（キャンセルボタン）': 0,
  'placeholder（プレースホルダ）': 0,
  'header/column（テーブル列）': 0,
  'テンプレートリテラル（`...${}`）': 0,
  'その他': 0,
};

const otherSamples = [];

for (const { file, content } of jpLines) {
  if (/apiError|throw new Error|throw Error/.test(content)) { patterns['apiError/throw Error（エラー）']++; continue; }
  if (/modal\.(notify|confirm)/.test(content)) { patterns['modal.notify/confirm（ダイアログ）']++; continue; }
  if (/showToast/.test(content)) { patterns['showToast（トースト通知）']++; continue; }
  if (/^alert\(|^confirm\(|window\.confirm/.test(content)) { patterns['alert/confirm（ブラウザ標準）']++; continue; }
  if (/cancelLabel/.test(content)) { patterns['cancelLabel（キャンセルボタン）']++; continue; }
  if (/\{\s*value:/.test(content) && /label:/.test(content)) { patterns['value+label（選択肢定義）']++; continue; }
  if (/label:\s*['"`]/.test(content)) { patterns['label:（ラベル定義）']++; continue; }
  if (/title:\s*['"`]/.test(content)) { patterns['title:（タイトル定義）']++; continue; }
  if (/name:\s*['"`]/.test(content)) { patterns['name:（名前定義）']++; continue; }
  if (/placeholder/.test(content)) { patterns['placeholder（プレースホルダ）']++; continue; }
  if (/header|Header|column|Column|thead|<th/.test(content)) { patterns['header/column（テーブル列）']++; continue; }
  if (/`[^`]*\$\{/.test(content)) { patterns['テンプレートリテラル（`...${}`）']++; continue; }
  patterns['その他']++;
  if (otherSamples.length < 30) {
    const shortFile = file.replace(/.*src[\\/]/, '');
    otherSamples.push(`  [${shortFile}] ${content.substring(0, 110)}`);
  }
}

Object.entries(patterns).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  if (v > 0) console.log(`  ${k.padEnd(40)}: ${String(v).padStart(4)}件`);
});

console.log(`\n=== 「その他」サンプル（先頭30件） ===`);
otherSamples.forEach(s => console.log(s));
