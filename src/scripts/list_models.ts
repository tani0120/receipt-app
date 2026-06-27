/**
 * 全モデル比較テスト（実アップロード画像8枚 × 残り3モデル）
 * gemini-3.1-flash-liteは実戦で完了済み。残りを回す。
 */

import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import dotenv from 'dotenv';

import {
  DESC_SOURCE_TYPE, DESC_SOURCE_TYPE_CONFIDENCE,
  DESC_DIRECTION, DESC_DIRECTION_CONFIDENCE,
  DESC_EXTRACT_REASON, DESC_DOCUMENT_COUNT, DESC_DOCUMENT_COUNT_REASON,
  DESC_DESCRIPTION, DESC_ISSUER_NAME, DESC_DATE, DESC_TOTAL_AMOUNT,
  DESC_LINE_ITEMS, DESC_LINE_DATE, DESC_LINE_DESCRIPTION,
  DESC_LINE_AMOUNT, DESC_LINE_DIRECTION, DESC_LINE_BALANCE,
  REQUEST_PROMPT,
} from '../api/services/pipeline/schemaDescriptions';
import { buildKeywordsPrompt } from '../api/services/pipeline/source_type_keywords';

dotenv.config({ path: '.env.local' });

const PROJECT_ID = process.env['VERTEX_PROJECT_ID'] ?? '';
const LOCATION = 'global';

// テスト対象モデル（flash-liteは実戦済みなので除外）
const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
];

const PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50, thinking: 0 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00, thinking: 0 },
};
const USD_JPY = 150;

// firstAi同一のシステムインストラクション
const SYSTEM_INSTRUCTION_BASE = `あなたは日本の会計事務所向けのAI証票分類エンジンです。
【最優先タスク】まず画像内に独立した情報源が1つだけか、2つ以上あるかを判定せよ。判定後、主要な1つについて詳細情報を抽出せよ。
1枚の証票画像から、証票種別（source_type）と仕訳方向（direction）を判定し、行データ（line_items）を抽出してください。
`;

const SYSTEM_INSTRUCTION_RULES = `
## 仕訳方向（direction）判定基準
| direction | 判定基準 |
|---|---|
| expense | 出金・支払い。レシート、請求書の支払い等 |
| income | 入金・受取り。売上入金、利息入金等 |
| transfer | 振替。口座間移動、クレカ引落し等 |
| mixed | 混在。通帳ページ等で入金と出金が混在 |

## 行データ（line_items）抽出ルール
| source_type | line_itemsの抽出方法 |
|---|---|
| bank_statement | 通帳の全取引行を抽出。各行にdate/description/amount/direction/balanceを設定 |
| receipt | 1行。date=取引日、description=摘要、amount=税込合計、direction=expense |
| invoice_received | 1行。同上 |
| tax_payment | 1行。同上 |
| non_journal / other | 空配列[] |
| その他 | 可能な限り抽出。不明な場合は空配列[] |

## 出力ルール
- source_typeとdirectionは必ず上記のenumから選択。
- confidence（信頼度）は0.0〜1.0で評価。
- description: 取引内容を1文で要約。
- issuer_name: 発行者名・作成者名。
- date: 取引日・契約日（YYYY-MM-DD）。
- total_amount: 合計金額（税込）。
- preview_extract_reason: 判定根拠。
- document_count: 画像内の独立情報源の数。
- document_count_reason: 判定根拠。
- line_items: 行データ配列。各行のamountは必ず正の整数。入出金はdirectionで区別。`;

const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_BASE + buildKeywordsPrompt() + SYSTEM_INSTRUCTION_RULES;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    source_type: { type: Type.STRING, enum: ['receipt','invoice_received','tax_payment','journal_voucher','bank_statement','credit_card','cash_ledger','supplementary_doc','invoice_issued','receipt_issued','non_journal','other'], description: DESC_SOURCE_TYPE },
    source_type_confidence: { type: Type.NUMBER, description: DESC_SOURCE_TYPE_CONFIDENCE },
    direction: { type: Type.STRING, enum: ['expense','income','transfer','mixed'], description: DESC_DIRECTION },
    direction_confidence: { type: Type.NUMBER, description: DESC_DIRECTION_CONFIDENCE },
    preview_extract_reason: { type: Type.STRING, nullable: true, description: DESC_EXTRACT_REASON },
    document_count: { type: Type.NUMBER, description: DESC_DOCUMENT_COUNT },
    document_count_reason: { type: Type.STRING, nullable: true, description: DESC_DOCUMENT_COUNT_REASON },
    description: { type: Type.STRING, nullable: true, description: DESC_DESCRIPTION },
    issuer_name: { type: Type.STRING, nullable: true, description: DESC_ISSUER_NAME },
    date: { type: Type.STRING, nullable: true, description: DESC_DATE },
    total_amount: { type: Type.NUMBER, nullable: true, description: DESC_TOTAL_AMOUNT },
    line_items: { type: Type.ARRAY, description: DESC_LINE_ITEMS, items: { type: Type.OBJECT, properties: {
      date: { type: Type.STRING, nullable: true, description: DESC_LINE_DATE },
      description: { type: Type.STRING, description: DESC_LINE_DESCRIPTION },
      amount: { type: Type.NUMBER, description: DESC_LINE_AMOUNT },
      direction: { type: Type.STRING, enum: ['expense','income'], description: DESC_LINE_DIRECTION },
      balance: { type: Type.NUMBER, nullable: true, description: DESC_LINE_BALANCE },
    }, required: ['description','amount','direction'] } },
  },
  required: ['source_type','source_type_confidence','direction','direction_confidence','document_count'],
};

// 画像ファイル取得
const uploadsDir = join(process.cwd(), 'data/uploads/c_VdAnGFq3');
const files = readdirSync(uploadsDir)
  .filter(f => ['.jpg','.jpeg','.png'].includes(extname(f).toLowerCase()))
  .sort();

console.log(`画像: ${files.length}枚`);
console.log(`モデル: ${MODELS.join(', ')}\n`);

const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

interface Result {
  model: string;
  file: string;
  success: boolean;
  sourceType: string;
  issuer: string;
  amount: number | null;
  date: string | null;
  lines: number;
  ms: number;
  costYen: number;
  inTk: number;
  outTk: number;
  thinkTk: number;
}

const allResults: Result[] = [];

for (const model of MODELS) {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`🤖 ${model}`);
  console.log('━'.repeat(80));

  for (const file of files) {
    const shortName = file.replace(/^\d+_/, '');
    const buf = readFileSync(join(uploadsDir, file));
    const b64 = buf.toString('base64');
    const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const start = Date.now();
    try {
      const thinkCfg = model.includes('flash-lite') ? {} : { thinkingConfig: { thinkingBudget: 2048 } };
      const r = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data: b64 } }, { text: REQUEST_PROMPT }] }],
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0, ...thinkCfg },
      });

      const usage = r.usageMetadata;
      const inTk = usage?.promptTokenCount ?? 0;
      const outTk = usage?.candidatesTokenCount ?? 0;
      const thinkTk = (usage as Record<string, number>)?.thoughtsTokenCount ?? 0;
      const p = PRICING[model]!;
      const cost = ((inTk * p.input + outTk * p.output + thinkTk * p.thinking) / 1_000_000) * USD_JPY;
      const ms = Date.now() - start;

      const parsed = JSON.parse(r.text ?? '{}') as Record<string, unknown>;
      const res: Result = {
        model, file: shortName, success: true,
        sourceType: String(parsed['source_type'] ?? ''),
        issuer: String(parsed['issuer_name'] ?? '').slice(0, 20),
        amount: parsed['total_amount'] as number ?? null,
        date: parsed['date'] as string ?? null,
        lines: Array.isArray(parsed['line_items']) ? (parsed['line_items'] as unknown[]).length : 0,
        ms, costYen: cost, inTk, outTk, thinkTk,
      };
      allResults.push(res);
      console.log(`  ✅ ${shortName.padEnd(28)} ${res.sourceType.padEnd(20)} ${res.issuer.padEnd(22)} ¥${String(res.amount ?? '-').padStart(8)} ${(ms/1000).toFixed(1)}秒 ¥${cost.toFixed(2)}`);
    } catch (e) {
      const ms = Date.now() - start;
      allResults.push({ model, file: shortName, success: false, sourceType:'', issuer:'', amount:null, date:null, lines:0, ms, costYen:0, inTk:0, outTk:0, thinkTk:0 });
      console.log(`  ❌ ${shortName.padEnd(28)} ${(ms/1000).toFixed(1)}秒 ${String(e).slice(0, 80)}`);
    }
  }

  // モデル別サマリ
  const modelResults = allResults.filter(r => r.model === model);
  const ok = modelResults.filter(r => r.success);
  const totalMs = ok.reduce((s, r) => s + r.ms, 0);
  const totalCost = ok.reduce((s, r) => s + r.costYen, 0);
  console.log(`\n  📊 ${ok.length}/${modelResults.length}成功 | 合計${(totalMs/1000).toFixed(1)}秒 | 合計¥${totalCost.toFixed(2)} | 平均${(totalMs/ok.length/1000).toFixed(1)}秒/枚`);
}

// 最終比較表
console.log(`\n${'='.repeat(100)}`);
console.log('全モデル比較（+ 実戦gemini-3.1-flash-liteの値）');
console.log('='.repeat(100));
console.log('\n| モデル | 成功 | 平均秒 | 合計コスト | 平均コスト |');
console.log('|---|---|---|---|---|');

// flash-lite実戦データ（ログから）
console.log(`| gemini-3.1-flash-lite | 8/8 | 5.7秒 | ¥1.76 | ¥0.22 | ← 実戦済み`);

for (const model of MODELS) {
  const mr = allResults.filter(r => r.model === model);
  const ok = mr.filter(r => r.success);
  if (ok.length === 0) { console.log(`| ${model} | 0/${mr.length} | - | - | - |`); continue; }
  const avgMs = ok.reduce((s, r) => s + r.ms, 0) / ok.length;
  const totalCost = ok.reduce((s, r) => s + r.costYen, 0);
  console.log(`| ${model} | ${ok.length}/${mr.length} | ${(avgMs/1000).toFixed(1)}秒 | ¥${totalCost.toFixed(2)} | ¥${(totalCost/ok.length).toFixed(2)} |`);
}
