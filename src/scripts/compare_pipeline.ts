/**
 * 全モデル比較テスト（本番パイプライン完全同一条件）
 *
 * firstAiExtract() を直接呼び出し、前処理・ログ・コスト計算すべて本番と同一。
 * モデルだけ process.env['VERTEX_MODEL_ID'] で切り替え。
 *
 * 実行: npx tsx src/scripts/compare_pipeline.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { firstAiExtract, clearKnownHashes } from '../api/services/pipeline/firstAi.service';
import type { FirstAiResponse } from '../api/services/pipeline/types';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

/** 正確な料金テーブル（$/100万トークン） */
const PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50, thinking: 0 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50, thinking: 0 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00, thinking: 0 },
};
const USD_JPY = 150;

// 画像ファイル取得
const uploadsDir = join(process.cwd(), 'data/uploads/c_VdAnGFq3');
const files = readdirSync(uploadsDir)
  .filter(f => ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase()))
  .sort();

const CLIENT_ID = 'c_VdAnGFq3';

/** 正確なコスト再計算 */
function recalcCost(model: string, meta: FirstAiResponse['metadata']): number {
  const p = PRICING[model];
  if (!p) return meta.cost_yen;
  return ((meta.prompt_tokens * p.input + meta.completion_tokens * p.output + meta.thinking_tokens * p.thinking) / 1_000_000) * USD_JPY;
}

async function main() {
  console.log(`${'='.repeat(100)}`);
  console.log(`本番パイプライン完全同一条件テスト`);
  console.log(`画像: ${files.length}枚 | モデル: ${MODELS.join(', ')}`);
  console.log(`${'='.repeat(100)}\n`);

  const allResults: { model: string; file: string; result: FirstAiResponse; costYen: number }[] = [];

  for (const model of MODELS) {
    // モデル切替
    process.env['VERTEX_MODEL_ID'] = model;
    clearKnownHashes(); // 重複検出リセット

    console.log(`\n${'━'.repeat(100)}`);
    console.log(`🤖 ${model}`);
    console.log(`${'━'.repeat(100)}`);

    for (const file of files) {
      const shortName = file.replace(/^\d+_/, '');
      const buf = readFileSync(join(uploadsDir, file));
      const b64 = buf.toString('base64');
      const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const result = await firstAiExtract({
        image: b64,
        mimeType: mime,
        clientId: CLIENT_ID,
        filename: shortName,
      });

      const costYen = recalcCost(model, result.metadata);
      allResults.push({ model, file: shortName, result, costYen });

      // 人間向けサマリ（パイプラインログに加えてここでも出力）
      const m = result.metadata;
      const li = result.line_items;
      console.log(`\n  📄 ${shortName}`);
      console.log(`     種別: ${result.source_type} (${(result.source_type_confidence * 100).toFixed(0)}%) | 方向: ${result.direction}`);
      console.log(`     発行者: ${result.issuer_name ?? '-'} | 金額: ${result.total_amount != null ? `¥${result.total_amount.toLocaleString()}` : '-'} | 日付: ${result.date ?? '-'}`);
      console.log(`     行数: ${li.length} | ${(m.duration_ms / 1000).toFixed(1)}秒 | ¥${costYen.toFixed(2)} [in=${m.prompt_tokens} out=${m.completion_tokens} think=${m.thinking_tokens}]`);
      if (li.length > 0) {
        console.log(`     ┌──────────────────────────────────────────────────`);
        for (const l of li) {
          console.log(`     │ ${l.direction === 'income' ? '↓入' : '↑出'} ¥${l.amount.toLocaleString().padStart(10)} ${l.description}`);
        }
        console.log(`     └──────────────────────────────────────────────────`);
      }
    }

    // モデル別サマリ
    const mr = allResults.filter(r => r.model === model);
    const totalMs = mr.reduce((s, r) => s + r.result.metadata.duration_ms, 0);
    const totalCost = mr.reduce((s, r) => s + r.costYen, 0);
    console.log(`\n  📊 ${mr.length}枚完了 | 合計${(totalMs / 1000).toFixed(1)}秒 | 合計¥${totalCost.toFixed(2)} | 平均${(totalMs / mr.length / 1000).toFixed(1)}秒/枚 ¥${(totalCost / mr.length).toFixed(2)}/枚`);
  }

  // ━━ 最終比較 ━━
  console.log(`\n${'='.repeat(100)}`);
  console.log('最終比較（正確なコスト再計算済み）');
  console.log('='.repeat(100));

  console.log('\n| モデル | 成功 | 平均秒 | 合計コスト | 平均コスト/枚 |');
  console.log('|---|---|---|---|---|');
  for (const model of MODELS) {
    const mr = allResults.filter(r => r.model === model);
    const avgMs = mr.reduce((s, r) => s + r.result.metadata.duration_ms, 0) / mr.length;
    const totalCost = mr.reduce((s, r) => s + r.costYen, 0);
    console.log(`| ${model} | ${mr.length}/${files.length} | ${(avgMs / 1000).toFixed(1)}秒 | ¥${totalCost.toFixed(2)} | ¥${(totalCost / mr.length).toFixed(2)} |`);
  }

  // ファイル別比較
  console.log('\n--- ファイル別比較 ---');
  for (const file of files) {
    const shortName = file.replace(/^\d+_/, '');
    console.log(`\n📄 ${shortName}`);
    console.log('| モデル | 種別 | 発行者 | 金額 | 行数 | 秒 | コスト |');
    console.log('|---|---|---|---|---|---|---|');
    for (const model of MODELS) {
      const r = allResults.find(x => x.model === model && x.file === shortName);
      if (!r) continue;
      const res = r.result;
      console.log(`| ${model} | ${res.source_type} | ${(res.issuer_name ?? '-').slice(0, 16)} | ¥${res.total_amount?.toLocaleString() ?? '-'} | ${res.line_items.length} | ${(res.metadata.duration_ms / 1000).toFixed(1)} | ¥${r.costYen.toFixed(2)} |`);
    }
  }
}

main().catch(console.error);
