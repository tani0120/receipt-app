import { VertexAI, type Part } from '@google-cloud/vertexai';
import * as fs from 'fs';

// ■ 設定: テストするモデル一覧
const MODELS_TO_TEST = [
  { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash (Stable)' },
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro (Reference)' },
];

/**
 * ■ 万能型 OCR JSON Schema Definition
 * 領収書、請求書、通帳、カード明細を全てカバーする構造。
 */
const OCR_SCHEMA_TEMPLATE = {
  "document_type": "RECEIPT | INVOICE | BANK_STATEMENT | CARD_STATEMENT | OTHER",
  "meta": {
    "scan_date": "YYYY-MM-DD",
    "currency": "JPY",
    "language": "ja"
  },
  "issuer": {
    "name": "店舗名または発行者名 (正規化前)",
    "name_reading": "フリガナ (ある場合)",
    "registration_number": "T1234567890123 (インボイス番号)",
    "phone_number": "03-xxxx-xxxx (マッチング用キー)",
    "address": "住所文字列",
    "is_handwritten": false
  },
  "recipient": {
    "name": "宛名 (上様, 株式会社〇〇 etc.)"
  },
  "transaction_header": {
    "date": "YYYY-MM-DD (取引日)",
    "total_amount": 11000,
    "total_tax_amount": 1000,
    "payment_method": "CASH | CREDIT_CARD | E_MONEY | TRANSFER | UNKNOWN",
    "summary": "全体の摘要"
  },
  "tax_breakdown": [
    {
      "rate": 10,
      "taxable_amount": 10000,
      "tax_amount": 1000
    },
    {
      "rate": 8,
      "taxable_amount": 0,
      "tax_amount": 0
    }
  ],
  "line_items": [
    {
      "date": "YYYY-MM-DD (明細行の日付)",
      "description": "商品名 または 摘要",
      "amount": 5500,
      "tax_rate": 10,
      "type": "ITEM | TAX | DISCOUNT",
      "income_amount": 0,
      "expense_amount": 5500,
      "balance": 100000
    }
  ],
  "validation": {
    "is_invoice_qualified": true,
    "has_stamp_duty": false,
    "notes": "特記事項"
  }
};

const SYSTEM_PROMPT = `
あなたはプロの経理担当AIです。以下の画像を解析し、会計処理に必要な情報をJSON形式で抽出してください。

## 制約事項
- 必ず指定したJSONスキーマに従うこと。
- 消費税率が明記されていない場合は、品目から推測せよ(飲食料品は8%、それ以外は10%)。
- インボイス登録番号(T+13桁)は正確に読み取ること。
- 通帳や明細書の場合は line_items に全行を展開すること。
- 電話番号があれば必ず抽出すること(店舗特定のため)。
- 日付は YYYY-MM-DD 形式に補正すること(例: R6.1.1 -> 2024-01-01)。

# line_items の抽出ルール:
- 文書が「RECEIPT (領収書)」の場合:
    - 可能なら個々の商品を抽出せよ。ただし、明細が不明瞭で読み取れない場合は、空配列でも構わない（transaction_header の total_amount を優先する）。
- 文書が「BANK_STATEMENT (通帳)」または「CARD_STATEMENT (明細)」の場合:
    - **必須:** 全ての行を漏れなく抽出せよ。
    - 入金列の数値は \`income_amount\` に、出金列の数値は \`expense_amount\` に振り分けること。
    - 残高列がある場合は \`balance\` に記載すること。

# is_invoice_qualified の判定ルール:
- 登録番号(T+13桁)がある場合は true。
- 番号がなくても、税込合計金額が30,000円未満の場合は true (実務的適格) と判定せよ。

## JSON Schema
${JSON.stringify(OCR_SCHEMA_TEMPLATE, null, 2)}
`;

async function main() {
  const projectId = process.env.PROJECT_ID || 'YOUR_PROJECT_ID';
  const location = process.env.LOCATION || 'us-central1';
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error('Usage: ts-node src/scripts/compare_models.ts <path/to/image.jpg>');
    process.exit(1);
  }

  const vertex_ai = new VertexAI({ project: projectId, location: location });

  // 画像読み込み
  const imageBuffer = fs.readFileSync(imagePath);
  const imagePart: Part = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  console.log(`=== Universal OCR Benchmark ===`);
  console.log(`Target Image: ${imagePath}`);

  for (const modelDef of MODELS_TO_TEST) {
    console.log(`\n--- Testing: ${modelDef.name} (${modelDef.id}) ---`);
    const model = vertex_ai.getGenerativeModel({
      model: modelDef.id,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.0,
      }
    });

    const start = Date.now();
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }, imagePart] }],
      });
      const end = Date.now();
      const outputText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      console.log(`Time: ${end - start}ms`);
      try {
        const json = JSON.parse(outputText || '{}');
        // 検証用簡易表示
        console.log(`Type: ${json.document_type}`);
        console.log(`Issuer: ${json.issuer?.name} (T: ${json.issuer?.registration_number})`);
        console.log(`Total: ${json.transaction_header?.total_amount}`);
        console.log(`Items: ${json.line_items?.length} rows`);
        console.log(`Qualified: ${json.validation?.is_invoice_qualified}`);
      } catch {
        console.error('Failed to parse JSON:', outputText);
      }
    } catch (e) {
      console.error(`Error invoking model: ${(e as Error).message}`);
    }
  }
}

main();
