/**
 * 新規4枚 × 5回 × 4モデル 安定性テスト
 * 
 * 新しくアップロードされた4枚:
 *   - Photo_26-02-22-12-12-06.334.jpg
 *   - Photo_26-02-22-11-33-43.510.jpg
 *   - Photo_26-04-12-20-42-10.753.jpg
 *   - 20250912_075702.jpg
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { readFileSync } from 'fs';
import { join } from 'path';
import { firstAiExtract, clearKnownHashes } from '../api/services/pipeline/firstAi.service';
import type { FirstAiResponse } from '../api/services/pipeline/types';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

// 2026-05-20 公式価格
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00 },
};
const USD_JPY = 150;
const RUNS = 5;
const CLIENT_ID = 'c_VdAnGFq3';

const TARGET_FILES = [
  { file: '1779265249649_Photo_26-02-22-12-12-06.334.jpg', name: 'Photo_12-12-06' },
  { file: '1779265249659_Photo_26-02-22-11-33-43.510.jpg', name: 'Photo_11-33-43' },
  { file: '1779265249669_Photo_26-04-12-20-42-10.753.jpg', name: 'Photo_20-42-10' },
  { file: '1779265249727_20250912_075702.jpg',              name: '075702' },
];

const uploadsDir = join(process.cwd(), 'data/uploads/c_VdAnGFq3');

function recalcCost(model: string, meta: FirstAiResponse['metadata']): number {
  const p = PRICING[model]!;
  // thinkingトークンはoutputに含まれる（2.5-flashのusageMetadataで分離されるがコスト上はoutput単価）
  const outTokens = meta.completion_tokens + meta.thinking_tokens;
  return ((meta.prompt_tokens * p.input + outTokens * p.output) / 1_000_000) * USD_JPY;
}

interface Run {
  model: string;
  file: string;
  run: number;
  result: FirstAiResponse;
  costYen: number;
}

const allRuns: Run[] = [];

async function main() {
  console.log(`${'='.repeat(100)}`);
  console.log(`新規4枚 安定性テスト: ${TARGET_FILES.length}枚 × ${RUNS}回 × ${MODELS.length}モデル = ${TARGET_FILES.length * RUNS * MODELS.length}回`);
  console.log(`${'='.repeat(100)}\n`);

  for (const target of TARGET_FILES) {
    const buf = readFileSync(join(uploadsDir, target.file));
    const b64 = buf.toString('base64');
    const mime = 'image/jpeg';

    console.log(`\n${'━'.repeat(100)}`);
    console.log(`📄 ${target.name}`);
    console.log(`${'━'.repeat(100)}`);

    for (const model of MODELS) {
      process.env['VERTEX_MODEL_ID'] = model;

      console.log(`\n  🤖 ${model}`);

      for (let run = 1; run <= RUNS; run++) {
        clearKnownHashes();

        const result = await firstAiExtract({
          image: b64,
          mimeType: mime,
          clientId: CLIENT_ID,
          filename: `${target.name}_r${run}`,
        });

        const costYen = recalcCost(model, result.metadata);
        allRuns.push({ model, file: target.name, run, result, costYen });

        const m = result.metadata;
        const li = result.line_items;
        const lineDesc = li.map(l => `${l.direction === 'income' ? '入' : '出'}¥${l.amount.toLocaleString()} ${l.description}`).join(' / ');
        console.log(
          `     #${run} | ${result.source_type} ${result.direction} | ` +
          `${(result.issuer_name ?? '-').slice(0, 20)} ¥${result.total_amount?.toLocaleString() ?? '-'} | ` +
          `${li.length}行 | ${(m.duration_ms / 1000).toFixed(1)}秒 ¥${costYen.toFixed(2)} | ` +
          `${lineDesc}`
        );
      }
    }
  }

  // ━━ 最終差分まとめ ━━
  console.log(`\n\n${'='.repeat(100)}`);
  console.log('最終差分まとめ');
  console.log('='.repeat(100));

  for (const target of TARGET_FILES) {
    console.log(`\n📄 ${target.name}`);
    console.log('─'.repeat(100));

    for (const model of MODELS) {
      const runs = allRuns.filter(r => r.model === model && r.file === target.name);
      const amounts = runs.map(r => r.result.total_amount);
      const lineCounts = runs.map(r => r.result.line_items.length);
      const directions = runs.map(r => r.result.direction);
      const issuers = runs.map(r => r.result.issuer_name ?? '-');
      const dates = runs.map(r => r.result.date ?? '-');
      const sourceTypes = runs.map(r => r.result.source_type);
      const secs = runs.map(r => r.result.metadata.duration_ms / 1000);
      const costs = runs.map(r => r.costYen);

      const amtSet = [...new Set(amounts.map(String))];
      const lineSet = [...new Set(lineCounts.map(String))];
      const dirSet = [...new Set(directions)];
      const issuerSet = [...new Set(issuers)];
      const dateSet = [...new Set(dates)];
      const stSet = [...new Set(sourceTypes)];

      const stable = (s: string[]) => s.length === 1 ? '✅安定' : `⚠️不安定(${s.join('/')})`;

      const avgSec = (secs.reduce((a, b) => a + b, 0) / secs.length).toFixed(1);
      const avgCost = (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2);

      console.log(`  🤖 ${model}`);
      console.log(`     種別: ${stSet.join('/')} ${stable(stSet)}`);
      console.log(`     金額: ${amtSet.join('/')} ${stable(amtSet)}`);
      console.log(`     行数: ${lineSet.join('/')} ${stable(lineSet)}`);
      console.log(`     方向: ${dirSet.join('/')} ${stable(dirSet)}`);
      console.log(`     発行者: ${issuerSet.join(' / ')} ${stable(issuerSet)}`);
      console.log(`     日付: ${dateSet.join('/')} ${stable(dateSet)}`);
      console.log(`     速度: 平均${avgSec}秒 | コスト: 平均¥${avgCost}`);

      // 行内容の安定性
      const lineSignatures = runs.map(r =>
        r.result.line_items.map(l => `${l.direction}:${l.amount}:${l.description}`).join('|')
      );
      const sigSet = [...new Set(lineSignatures)];
      if (sigSet.length === 1) {
        console.log(`     行内容: ✅安定（全5回同一）`);
      } else {
        console.log(`     行内容: ⚠️不安定（${sigSet.length}パターン）`);
        for (let i = 0; i < sigSet.length; i++) {
          const count = lineSignatures.filter(s => s === sigSet[i]).length;
          console.log(`       パターン${i + 1}(${count}回): ${sigSet[i]}`);
        }
      }
    }
  }

  // 全体サマリ
  console.log(`\n${'='.repeat(100)}`);
  console.log('安定性スコア（全体）');
  console.log('='.repeat(100));
  console.log('| モデル | 種別安定 | 金額安定 | 行数安定 | 行内容安定 | 平均秒 | 平均コスト |');
  console.log('|---|---|---|---|---|---|---|');

  for (const model of MODELS) {
    const mr = allRuns.filter(r => r.model === model);
    let stOk = 0, amtOk = 0, lineOk = 0, contentOk = 0;

    for (const target of TARGET_FILES) {
      const runs = mr.filter(r => r.file === target.name);
      const stSet = new Set(runs.map(r => r.result.source_type));
      const amtSet = new Set(runs.map(r => r.result.total_amount));
      const lineSet = new Set(runs.map(r => r.result.line_items.length));
      const sigSet = new Set(runs.map(r => r.result.line_items.map(l => `${l.direction}:${l.amount}`).join('|')));
      if (stSet.size === 1) stOk++;
      if (amtSet.size === 1) amtOk++;
      if (lineSet.size === 1) lineOk++;
      if (sigSet.size === 1) contentOk++;
    }

    const avgSec = (mr.reduce((s, r) => s + r.result.metadata.duration_ms, 0) / mr.length / 1000).toFixed(1);
    const avgCost = (mr.reduce((s, r) => s + r.costYen, 0) / mr.length).toFixed(2);

    console.log(`| ${model} | ${stOk}/4 | ${amtOk}/4 | ${lineOk}/4 | ${contentOk}/4 | ${avgSec}秒 | ¥${avgCost} |`);
  }
}

main().catch(console.error);
