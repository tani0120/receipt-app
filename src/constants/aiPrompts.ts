/**
 * AIプロンプト定数
 *
 * OCR/分類サービスで使用するプロンプト文をここに一元管理する。
 * 各サービスファイルでのインラインプロンプト記述は禁止。
 *
 * Supabase移行時: ai_prompts テーブルに移行可能な構造
 * API管理: aiPromptRoutes.ts でGET/PUT提供（デプロイなしで変更可能）
 */

// System Instruction は既存ファイルからre-export（後方互換維持）
export { SYSTEM_INSTRUCTION } from '@/api/ai/gemini/system_instruction';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 勘定科目推論ルール（共通）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 推定勘定科目のenum（全OCRサービス共通） */
export const INFERRED_CATEGORY_ENUM = [
  '接待交際費',
  '会議費',
  '飲食費',
  '外食費',
  '福利厚生費',
  '仮払金',
] as const;

/** 科目選択ルール（テキスト） */
export const CATEGORY_SELECTION_RULES = `
- **複数名での飲食、居酒屋、社外の会食** → 接待交際費
- **会議・打ち合わせ中の飲食** → 会議費
- **個人の軽食、コンビニ、カフェ** → 飲食費
- **個人のレストラン利用** → 外食費
- **社員向けイベント・慰労会** → 福利厚生費
- **上記に当てはまらない、または判断困難** → 仮払金
`.trim();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCRプロンプト（簡易版 — Gemini API直接呼び出し用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 簡易OCRプロンプト（ocr_service.ts用） */
export const OCR_SIMPLE_PROMPT =
  'この領収書から以下の情報をJSON形式で抽出してください：店名(vendor)、日付(date)、合計金額(total_amount)、T番号(t_number)';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCRプロンプト（詳細版 — Vertex AI / ブラウザ版用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 詳細OCRプロンプト（ocr_service_browser.ts / ocr_service_vertex.ts用） */
export const OCR_DETAILED_PROMPT = `あなたは会計OCRエンジンです。
以下のJSON Schemaに厳密に従って出力してください。

【絶対ルール - べき等性のために必須】
1. inferred_category は必ず以下のenumから**1つだけ**選択してください
2. **同じ入力（同じ画像・同じSystem Instruction）に対しては、常に同じ inferred_category を返してください**
3. 判断に迷う場合は、必ず「仮払金」を選択してください
4. explanation は inferred_category の選択理由を1文で記載してください（内容は自由）
5. **explanation の内容が変わっても、inferred_category の選択を変更してはいけません**

【出力フィールド】
- vendor: 店名
- date: 日付（YYYY-MM-DD形式）
- total_amount: 合計金額（数値）
- t_number: T番号（インボイス番号）
- tax_items: 税率別の内訳（配列）
- inferred_category: 推定勘定科目（以下のenumから選択）
- explanation: inferred_category を選択した理由（1文、簡潔に）

【inferred_category のenum】
${INFERRED_CATEGORY_ENUM.map(c => `- ${c}`).join('\n')}

【選択ルール】
${CATEGORY_SELECTION_RULES}

【出力例】
{
  "vendor": "まんがい 天満橋店",
  "date": "2025-05-12",
  "total_amount": 2350,
  "t_number": "T1234567890123",
  "tax_items": [{"tax_rate": 10, "amount": 2350}],
  "inferred_category": "接待交際費",
  "explanation": "居酒屋での飲食のため接待交際費と判断"
}

この領収書から上記形式でJSONを抽出してください。`;

/** Vertex AI用プロンプト（Cache併用・JSON出力指示） */
export const OCR_VERTEX_PROMPT = `【画像を確認してJSONのみを出力してください】

この画像は領収書です。以下のJSON形式で出力してください。説明文やMarkdownは不要です。

{
  "category": "RECEIPT",
  "vendor": "店名（画像から正確に読み取る）",
  "date": "YYYY-MM-DD",
  "total_amount": 数値,
  "t_number": "T番号（13桁の数字がある場合）または null",
  "tax_items": [{"rate": 10, "net": 税抜額, "tax": 消費税}],
  "inferred_category": "勘定科目（下記ルール参照）",
  "explanation": "選択理由（1文）"
}

【inferred_category決定ルール（厳守）】
1. T番号マスタに一致 → T番号マスタの科目を使用
2. T番号マスタに不一致または無し → 以下の判断基準で決定:
${CATEGORY_SELECTION_RULES}

【べき等性ルール（最重要）】
- 同じ画像には常に同じ結果を返してください
- 店名が飲食店で金額10,000円未満なら「飲食費」を選択
- 迷った場合は「飲食費」を選択

【出力形式】
- JSONオブジェクトのみ出力
- コードブロック不要
- 説明文不要`;
