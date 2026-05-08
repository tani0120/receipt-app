#!/usr/bin/env node
/**
 * JP_LITERAL カテゴリ別分析スクリプト
 */
const fs = require('fs');
const path = require('path');

function walk(dir, exts) {
  let r = [];
  try {
    for (const e of fs.readdirSync(dir)) {
      const fp = path.join(dir, e);
      if (fs.statSync(fp).isDirectory()) {
        if (e.startsWith('.') || e === 'node_modules' || e === 'dist') continue;
        r = r.concat(walk(fp, exts));
      } else if (exts.some(x => e.endsWith(x))) r.push(fp);
    }
  } catch (e) {}
  return r;
}

const JP_RE = /['"]([^'"]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+[^'"]*)['"]|`[^`]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+[^`]*`/g;
const CSS_RE = /^(bg-|text-|border-|hover:|focus:|rounded|flex|grid|p-|m-|w-|h-|font-|shadow|cursor|opacity|transition|overflow|relative|absolute|fa-|cm-|ce-|ds-|iv-)/;

const files = walk('src', ['.vue', '.ts', '.js']);
const byCategory = {};
const byFile = {};

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const norm = f.replace(/\\/g, '/');
  let cat = 'other';
  if (norm.includes('/constants/')) cat = 'constants';
  else if (norm.includes('/data/')) cat = 'data';
  else if (norm.includes('/composables/')) cat = 'composables';
  else if (norm.includes('/views/')) cat = 'views';
  else if (norm.includes('/components/')) cat = 'components';
  else if (norm.includes('/api/')) cat = 'api';
  else if (norm.includes('/utils/')) cat = 'utils';
  else if (norm.includes('/types/')) cat = 'types';
  else if (norm.includes('/scripts/')) cat = 'scripts';
  else if (norm.includes('/features/')) cat = 'features';

  let fileCount = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('<!--') || t.startsWith('#')) continue;
    if (t.startsWith('import ') || t.startsWith('export default') || t.startsWith('export type') || t.startsWith('export interface')) continue;
    if (t.includes('class=') || t.includes(':class=') || t.includes('className')) continue;

    const matches = t.match(JP_RE);
    if (matches) {
      const filtered = matches.filter(jp => {
        const inner = jp.startsWith('`') ? jp.slice(1, -1) : jp.slice(1, -1);
        return !CSS_RE.test(inner);
      });
      if (filtered.length > 0) {
        fileCount += filtered.length;
      }
    }
  }
  if (fileCount > 0) {
    byCategory[cat] = (byCategory[cat] || 0) + fileCount;
    byFile[norm] = { count: fileCount, cat };
  }
}

console.log('=== JP_LITERAL カテゴリ別 ===');
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}件`);
});
console.log(`\n  合計: ${Object.values(byCategory).reduce((a, b) => a + b, 0)}件`);

// constants/data を除外した場合の件数
const excludable = (byCategory.constants || 0) + (byCategory.data || 0);
const actionable = Object.values(byCategory).reduce((a, b) => a + b, 0) - excludable;
console.log(`\n=== 定数/データファイル除外後 ===`);
console.log(`  除外: ${excludable}件 (constants: ${byCategory.constants || 0}, data: ${byCategory.data || 0})`);
console.log(`  対処すべき: ${actionable}件`);

console.log(`\n=== 対処すべきファイル上位20 ===`);
Object.entries(byFile)
  .filter(([f]) => !f.includes('/constants/') && !f.includes('/data/'))
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 20)
  .forEach(([f, { count, cat }]) => {
    console.log(`  ${String(count).padStart(4)}件 [${cat}] ${f}`);
  });
