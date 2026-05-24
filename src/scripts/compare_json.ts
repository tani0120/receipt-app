/**
 * 物件別収支報告書 1枚 × 4モデル JSON全出力比較
 */
import { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';
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
const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

const MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

const PRICING: Record<string, { input: number; output: number; thinking: number }> = {
  'gemini-2.5-flash':       { input: 0.30, output: 2.50, thinking: 0 },
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, thinking: 0 },
  'gemini-3.1-flash-lite':  { input: 0.25, output: 1.50, thinking: 0 },
  'gemini-3.5-flash':       { input: 1.50, output: 9.00, thinking: 0 },
};

const SYSTEM_INSTRUCTION_BASE = `あなたは日本の会計事務所向けのAI証票分類エンジンです。
【最優先タスク】まず画像内に独立した情報源が1つだけか、2つ以上あるかを判定せよ。判定後、主要な1つについて詳細情報を抽出せよ。
1枚の証票画像から、証票種別（source_type）と仕訳方向（direction）を判定し、行データ（line_items）を抽出してください。
`;
const SYSTEM_INSTRUCTION_RULES = `
## 仕訳方向（direction）判定基準
| direction | 判定基準 |
|---|---|
| expense | 出金・支払い |
| income | 入金・受取り |
| transfer | 振替 |
| mixed | 混在 |

## 行データ（line_items）抽出ルール
| source_type | line_itemsの抽出方法 |
|---|---|
| supplementary_doc | 可能な限り全行抽出。収支報告書なら収入・支出全行 |
| receipt | 1行。amount=税込合計 |
| その他 | 可能な限り抽出 |

## 出力ルール
- confidence: 0.0〜1.0
- line_items: 各行のamountは必ず正の整数。入出金はdirectionで区別。`;

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

// 物件別収支報告書
const FILE = join(process.cwd(), 'data/uploads/c_VdAnGFq3/1779260703617_20250912_074802.jpg');
const buf = readFileSync(FILE);
const b64 = buf.toString('base64');

console.log(`画像: 20250912_074802.jpg (物件別収支報告書) ${(buf.length/1024).toFixed(0)}KB\n`);

for (const model of MODELS) {
  console.log(`${'━'.repeat(80)}`);
  console.log(`🤖 ${model}`);
  console.log('━'.repeat(80));

  const start = Date.now();
  try {
    const thinkCfg = model.includes('flash-lite') ? {} : { thinkingConfig: { thinkingBudget: 2048 } };
    const r = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: b64 } }, { text: REQUEST_PROMPT }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0, ...thinkCfg },
    });

    const usage = r.usageMetadata;
    const inTk = usage?.promptTokenCount ?? 0;
    const outTk = usage?.candidatesTokenCount ?? 0;
    const thinkTk = (usage as Record<string, number>)?.thoughtsTokenCount ?? 0;
    const p = PRICING[model]!;
    const cost = ((inTk * p.input + outTk * p.output + thinkTk * p.thinking) / 1_000_000) * 150;
    const ms = Date.now() - start;

    console.log(`⏱️ ${(ms/1000).toFixed(1)}秒 | ¥${cost.toFixed(2)} | in=${inTk} out=${outTk} think=${thinkTk}\n`);
    console.log(JSON.stringify(JSON.parse(r.text ?? '{}'), null, 2));
  } catch (e) {
    console.log(`❌ ${(Date.now()-start)}ms ${String(e).slice(0,200)}`);
  }
  console.log('');
}
