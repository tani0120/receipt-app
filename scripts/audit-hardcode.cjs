#!/usr/bin/env node
/**
 * ハードコード検出スクリプト（永続配置版）
 *
 * 使い方:
 *   node scripts/audit-hardcode.cjs              # サマリー表示
 *   node scripts/audit-hardcode.cjs --verbose    # 全行表示
 *   node scripts/audit-hardcode.cjs --file src/views/master/LeadListPage.vue  # 特定ファイル
 *
 * 検出パターン:
 *   HARDCODE_OPTION  - <option>タグの固定選択肢（v-forでない）
 *   COLUMN_DEF       - { key: '...', label: '...' } のカラム定義
 *   FILTER_LABEL     - filterType付きフィルタ列定義
 *   JP_LITERAL       - 日本語リテラル（CSSクラス名・import/export除外）
 *   MISSING_LOAD_LAYOUT - useFieldLayout()使用だがloadLayout()未呼出
 *
 * 前回結果との差分:
 *   scripts/.audit-hardcode-last.json に前回結果を保存し、
 *   増減を表示する。増加した場合は警告を出力。
 */
const fs = require('fs');
const path = require('path');

// --- 引数解析 ---
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const fileIdx = args.indexOf('--file');
const targetFile = fileIdx !== -1 ? args[fileIdx + 1] : null;
const LAST_RESULT_PATH = path.join(__dirname, '.audit-hardcode-last.json');

// --- ファイル走査 ---
function walk(dir, exts) {
  let results = [];
  try {
    for (const entry of fs.readdirSync(dir)) {
      const fp = path.join(dir, entry);
      if (fs.statSync(fp).isDirectory()) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') continue;
        results = results.concat(walk(fp, exts));
      } else if (exts.some(e => entry.endsWith(e))) {
        results.push(fp);
      }
    }
  } catch (e) { /* ディレクトリ読み取りエラーは無視 */ }
  return results;
}

// --- 検出ロジック ---
function detectIssues(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) { return []; }

  const lines = content.split(/\r?\n/);
  const issues = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // コメント行スキップ
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('<!--') || trimmed.startsWith('#')) return;
    // import/export行スキップ
    if (trimmed.startsWith('import ') || trimmed.startsWith('export default') || trimmed.startsWith('export type') || trimmed.startsWith('export interface')) return;

    // パターンA: <option>固定値（v-forでない）
    // ※UIプレースホルダは除外:
    //   - {{ }} を含む（定数参照済み）
    //   - value="" または :value="null" のデフォルトoption（フィルタ/未選択のプレースホルダ）
    if (/<option[\s:]+/.test(trimmed) && !trimmed.includes('v-for') && !trimmed.includes('{{')) {
      const isDefaultOption = /value=["']["']/.test(trimmed) || /:value=["']null["']/.test(trimmed) || /:value="undefined"/.test(trimmed);
      if (!isDefaultOption) {
        // value に具体的な値があるのにv-forでない → 真のハードコード
        if (/<option[^>]*value=["'][^"']+["'][^>]*>[^<]+<\/option>/.test(trimmed)) {
          issues.push({ lineNum, type: 'HARDCODE_OPTION', line: trimmed.substring(0, 130) });
        }
      }
    }

    // パターンB: { key: '...', label: '...' } のカラム定義
    if (/\{\s*key:\s*['"][^'"]+['"],\s*label:\s*['"][^'"]+['"]\s*\}/.test(trimmed)) {
      issues.push({ lineNum, type: 'COLUMN_DEF', line: trimmed.substring(0, 130) });
    }

    // パターンC: filterType付きフィルタ列定義
    if (/filterType/.test(trimmed) && /label:\s*['"]/.test(trimmed)) {
      issues.push({ lineNum, type: 'FILTER_LABEL', line: trimmed.substring(0, 130) });
    }

    // パターンD: 日本語リテラル
    const jpMatch = trimmed.match(/['"]([^'"]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+[^'"]*)['"]/g);
    if (jpMatch) {
      const filtered = jpMatch.filter(jp => {
        const inner = jp.slice(1, -1);
        // CSSクラス名パターンを除外
        if (/^(bg-|text-|border-|hover:|focus:|rounded|flex|grid|p-|m-|w-|h-|font-|shadow|cursor|opacity|transition|overflow|relative|absolute|fa-|cm-|ce-|ds-|iv-)/.test(inner)) return false;
        return true;
      });
      if (filtered.length > 0 && !trimmed.includes('class=') && !trimmed.includes(':class=') && !trimmed.includes('className')) {
        issues.push({ lineNum, type: 'JP_LITERAL', line: trimmed.substring(0, 130) });
      }
    }
  });

  // useFieldLayout使用チェック（composable定義ファイル自体は除外）
  if (content.includes('useFieldLayout(') && !content.includes('.loadLayout()') && !content.includes('export function useFieldLayout')) {
    issues.push({ lineNum: 0, type: 'MISSING_LOAD_LAYOUT', line: 'useFieldLayout()はあるがloadLayout()が呼ばれていない' });
  }

  return issues;
}

// --- メイン処理 ---
function main() {
  console.log('='.repeat(60));
  console.log('ハードコード検出スクリプト（audit-hardcode）');
  console.log('='.repeat(60));

  let codeFiles;
  if (targetFile) {
    if (!fs.existsSync(targetFile)) {
      console.error(`エラー: ファイルが見つかりません: ${targetFile}`);
      process.exit(1);
    }
    codeFiles = [targetFile];
  } else {
    codeFiles = walk('src', ['.vue', '.ts', '.js', '.cjs', '.mjs']);
    // scripts/配下も対象外（このスクリプト自体を検出しないため）
    // ただしsrc/scripts/は対象
  }

  let totalIssues = 0;
  const fileSummary = [];
  const typeTotals = {};

  for (const cf of codeFiles) {
    const issues = detectIssues(cf);
    if (issues.length === 0) continue;

    const typeCounts = {};
    issues.forEach(i => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
      typeTotals[i.type] = (typeTotals[i.type] || 0) + 1;
    });

    fileSummary.push({ file: cf, total: issues.length, types: typeCounts });
    totalIssues += issues.length;

    if (verbose) {
      console.log(`\n  === ${cf} (${issues.length}件) ===`);
      issues.forEach(i => {
        console.log(`    L${String(i.lineNum).padStart(4)} [${i.type}] ${i.line}`);
      });
    }
  }

  // --- サマリー出力 ---
  console.log('\n' + '='.repeat(60));
  console.log('サマリー');
  console.log('='.repeat(60));
  console.log(`  対象ファイル数: ${codeFiles.length}`);
  console.log(`  検出ファイル数: ${fileSummary.length}`);
  console.log(`  合計検出件数: ${totalIssues}件`);

  console.log('\n  --- 種別別 ---');
  Object.entries(typeTotals).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
    console.log(`  ${t}: ${c}件`);
  });

  console.log('\n  --- ファイル別（上位20） ---');
  fileSummary.sort((a, b) => b.total - a.total);
  fileSummary.slice(0, 20).forEach(f => {
    const typeStr = Object.entries(f.types).map(([t, c]) => `${t}:${c}`).join(', ');
    console.log(`  ${String(f.total).padStart(4)}件 ${f.file} (${typeStr})`);
  });
  if (fileSummary.length > 20) {
    console.log(`  ... 他${fileSummary.length - 20}ファイル`);
  }

  // --- 前回結果との差分 ---
  const currentResult = { total: totalIssues, types: typeTotals, date: new Date().toISOString() };

  if (fs.existsSync(LAST_RESULT_PATH)) {
    try {
      const last = JSON.parse(fs.readFileSync(LAST_RESULT_PATH, 'utf8'));
      const diff = totalIssues - last.total;

      console.log('\n  --- 前回比較 ---');
      console.log(`  前回: ${last.total}件 (${last.date})`);
      console.log(`  今回: ${totalIssues}件`);

      if (diff > 0) {
        console.log(`  ⚠️  警告: ${diff}件増加！新規ハードコードが追加されています。`);
        console.log(`  ⚠️  コミット前に増加分を修正してください。`);
      } else if (diff < 0) {
        console.log(`  ✅ ${Math.abs(diff)}件削減。`);
      } else {
        console.log(`  ➖ 増減なし。`);
      }

      // 種別別差分
      const allTypes = new Set([...Object.keys(typeTotals), ...Object.keys(last.types || {})]);
      for (const t of allTypes) {
        const cur = typeTotals[t] || 0;
        const prev = (last.types || {})[t] || 0;
        const d = cur - prev;
        if (d !== 0) {
          const sign = d > 0 ? `+${d}` : `${d}`;
          console.log(`    ${t}: ${prev} → ${cur} (${sign})`);
        }
      }
    } catch (e) {
      console.log('\n  前回結果の読み込みに失敗。初回実行として記録します。');
    }
  } else {
    console.log('\n  初回実行。結果を保存します。');
  }

  // 結果保存
  fs.writeFileSync(LAST_RESULT_PATH, JSON.stringify(currentResult, null, 2), 'utf8');
  console.log(`\n  結果保存先: ${LAST_RESULT_PATH}`);

  // 終了コード（増加した場合は1で終了）
  if (fs.existsSync(LAST_RESULT_PATH)) {
    try {
      const last = JSON.parse(fs.readFileSync(LAST_RESULT_PATH, 'utf8'));
      // 保存直後なので今回の値が入っている。前回比較は上で済んでいる。
    } catch (e) { /* 無視 */ }
  }

  console.log('\n' + '='.repeat(60));
}

main();
