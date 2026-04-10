/**
 * journal_inference.ts — Step 3: 仕訳推論（過去仕訳マッチなし時）
 *
 * 役割:
 *   Step 0（FilterResult）と Step 2（VendorVector / 過去仕訳不一致）を経た証票に対して、
 *   Gemini 2.5 Flash に「仕訳を1から考えさせる」処理。
 *
 * 入力:
 *   - 証票画像（base64）
 *   - FilterResult（source_type, is_handwritten, readability）
 *   - VendorContext（ベンダー名・業種推定）
 *   - ClientContext（自社名・住所・勘定科目マスタ）
 *
 * 出力:
 *   - InferenceResult（候補仕訳行[]・信頼度・要人間確認フラグ）
 *
 * 前処理（このファイルが担う）:
 *   1. 画像リサイズ（max 1400px）— T番号の文字潰れ防止
 *   2. 自社名注入 — 発行請求書 vs 受取請求書の誤判定防止
 *   3. 証票種類別プロンプト分岐 — source_type 毎に最適化
 *   4. VendorContext注入 — 業種→科目候補を絞り込む
 *
 * 注意: このファイルはスケルトン。実装はT-00a設計確定後に行う。
 */

// ============================================================
// 依存関係（将来インストール）
// ============================================================
// import sharp from 'sharp';  // 画像リサイズ: npm install sharp
// import { GoogleGenAI } from '@google/genai';

// ============================================================
// 型定義（T-01〜T-03 完成後に正式な型に置き換える）
// ============================================================

type SourceType =
  | 'receipt'
  | 'invoice_received'
  | 'tax_payment'
  | 'journal_voucher'
  | 'bank_statement'
  | 'credit_card'
  | 'cash_ledger';

/** Step 0の出力（FilterResult）から引き継ぐ情報 */
interface InferenceInput {
  // --- Step 0から ---
  source_type: SourceType;
  is_handwritten: boolean;
  readability: 'clear' | 'partial' | 'unreadable';
  // --- 証票画像 ---
  image_base64: string;
  image_mime: 'image/jpeg' | 'image/png' | 'application/pdf';
  // --- Step 2から（VendorVector推定結果） ---
  vendor_name: string | null;            // 例: "鳥貴族"
  vendor_industry: string | null;        // 例: "飲食店"
  vendor_account_hint: string[] | null;  // 例: ["接待交際費", "会議費"]
  // --- ClientContext（クライアント固有情報） ---
  client_company_name: string;           // 例: "株式会社LDI"
  client_address: string | null;
  account_codes: AccountCode[];          // 勘定科目マスタ
}

interface AccountCode {
  code: string;       // 例: "5101"
  name: string;       // 例: "接待交際費"
  tax_category: string; // 例: "10%課税"
}

/** Geminiが推論した仕訳1行分 */
interface JournalLine {
  debit_account: string;      // 借方科目名
  debit_amount: number;       // 借方金額（税込）
  credit_account: string;     // 貸方科目名
  credit_amount: number;      // 貸方金額（税込）
  tax_category: '10%' | '8%' | '非課税' | '対象外' | '不明';
  description: string;        // 摘要
  date: string;               // ISO8601 例: "2025-08-21"
  line_confidence: number;    // この行の信頼度 0.0〜1.0
}

/** Step 3の出力 */
interface InferenceResult {
  lines: JournalLine[];
  overall_confidence: number;
  needs_human_review: boolean;
  review_reason: string | null;     // 要確認の理由
  raw_response: string;             // Geminiの生JSON（デバッグ用）
  metadata: {
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    cost_jpy: number;
    duration_ms: number;
    preprocessing_applied: string[];  // 適用した前処理のリスト
  };
}

// ============================================================
// 前処理 1: 画像リサイズ（max 1400px）
// ============================================================

/**
 * T番号（13桁）や税区分の微細文字が潰れないよう、
 * 入力画像の長辺を 1400px 以内に統一する。
 *
 * Gemini 2.5 Flash はトークン上限があり、巨大すぎる画像は
 * 内部で圧縮されて細かい文字が失われる。
 *
 * TODO: sharp を導入したら下記を実装する
 */
async function preprocessImage(
  _base64: string,
  _mime: string,
): Promise<{ base64: string; applied: boolean }> {
  // TODO: sharp で長辺1400pxにリサイズ
  // const buf = Buffer.from(base64, 'base64');
  // const resized = await sharp(buf).resize({ width: 1400, height: 1400, fit: 'inside' }).toBuffer();
  // return { base64: resized.toString('base64'), applied: true };

  // スケルトン: 現時点では何もしない
  return { base64: _base64, applied: false };
}

// ============================================================
// 前処理 2: 証票種類別プロンプトテンプレート
// ============================================================

/**
 * source_type に応じて Gemini への指示を最適化する。
 *
 * これにより、クレカ明細では「各行が独立した仕訳になる」、
 * 通帳では「各トランザクションが独立した仕訳になる」等の
 * 構造的な前提をAIに与える。
 */
function buildSourceTypeInstruction(sourceType: SourceType): string {
  const instructions: Record<SourceType, string> = {
    receipt: `
これは領収書またはレシートです。
- 原則として1枚=1仕訳（ただし軽減税率8%と標準10%が混在する場合は2行に分割）
- 合計金額（税込）を使って仕訳する（税抜金額ではない）
- 品目から勘定科目を判断する（飲食=接待交際費 or 会議費、文房具=消耗品費 等）
`,
    invoice_received: `
これは受取請求書です。
- 請求書の宛先が「${'{CLIENT_COMPANY_NAME}'}」であることを確認する
- 宛先が違う場合は needsHumanReview=true とする
- 明細が複数あれば行ごとに科目を分けることを検討する
- インボイス番号（T+13桁）がある場合は適格請求書として扱う
`,
    tax_payment: `
これは税金・社会保険料の納付書または領収書です。
- 税目（法人税/消費税/住民税/固定資産税/社会保険料）を特定する
- 借方科目: 税目に対応する費用勘定または預り金勘定
- 貸方科目: 現金 or 普通預金
- 消費税は対象外（課税区分=対象外）
`,
    journal_voucher: `
これは振替伝票・入出金伝票です。
- 伝票に記載された借方・貸方をそのまま読み取る
- 金額は伝票に書かれた通りに使用する
- 手書きの場合は可読性（readability）を考慮する
`,
    bank_statement: `
これは通帳または銀行明細です。
- 各行（トランザクション）が独立した仕訳になる
- 摘要から取引内容を推定し、勘定科目を決定する
- 「振込」「引落」「手数料」等のキーワードから科目を判断する
- 通帳は銀行口座（普通預金）の増減を記録するため、借方か貸方の一方は必ず「普通預金」
`,
    credit_card: `
これはクレジットカードまたは電子マネーの利用明細です。
- 各明細行が独立した仕訳になる
- 貸方は「未払金（クレジットカード）」で統一
- 各行の店舗名・内容から借方科目を判断する
- 支払日と利用日が異なる場合は利用日を仕訳日付とする
`,
    cash_ledger: `
これは現金出納帳です。
- 各行（入出金記録）が独立した仕訳になる
- 手書きが多いため、文字の判読に注意する
- 借方または貸方の一方は必ず「現金」
`,
  };

  return instructions[sourceType] ?? '証票種類が不明です。最善の判断をしてください。';
}

// ============================================================
// 前処理 3: Vendor/Client コンテキスト注入
// ============================================================

function buildContextBlock(input: InferenceInput): string {
  const lines: string[] = ['## 参照情報'];

  // 自社名（発行 vs 受取の誤判定防止）
  lines.push(`### 顧問先（自社）情報`);
  lines.push(`- 会社名: ${input.client_company_name}`);
  if (input.client_address) {
    lines.push(`- 住所: ${input.client_address}`);
  }
  lines.push(`※ 書類の「宛先」が上記会社名であれば「受取書類」です。`);
  lines.push(`※ 書類の「発行元」が上記会社名であれば「発行書類」であり、仕訳対象外です。`);

  // VendorContext
  if (input.vendor_name || input.vendor_industry) {
    lines.push(`### 取引先情報`);
    if (input.vendor_name) lines.push(`- 取引先名: ${input.vendor_name}`);
    if (input.vendor_industry) lines.push(`- 業種推定: ${input.vendor_industry}`);
    if (input.vendor_account_hint?.length) {
      lines.push(`- 科目候補（参考）: ${input.vendor_account_hint.join(', ')}`);
    }
  }

  // 科目マスタ（上位20件のみ。全件渡すとトークン爆発）
  if (input.account_codes.length > 0) {
    lines.push(`### 使用可能な勘定科目（抜粋）`);
    const topAccounts = input.account_codes.slice(0, 20);
    for (const ac of topAccounts) {
      lines.push(`- ${ac.code}: ${ac.name}（${ac.tax_category}）`);
    }
  }

  return lines.join('\n');
}

// ============================================================
// メインプロンプト構築
// ============================================================

function buildPrompt(input: InferenceInput): string {
  const sourceInstruction = buildSourceTypeInstruction(input.source_type)
    .replace('{CLIENT_COMPANY_NAME}', input.client_company_name);
  const contextBlock = buildContextBlock(input);

  return `${sourceInstruction}

${contextBlock}

---
## 指示

上記の書類を分析し、以下のJSON形式で仕訳データを返してください。

{
  "lines": [
    {
      "debit_account": "科目名",
      "debit_amount": 税込金額（数値）,
      "credit_account": "科目名",
      "credit_amount": 税込金額（数値）,
      "tax_category": "10%" | "8%" | "非課税" | "対象外" | "不明",
      "description": "摘要",
      "date": "YYYY-MM-DD",
      "line_confidence": 0.0〜1.0
    }
  ],
  "overall_confidence": 0.0〜1.0,
  "needs_human_review": true | false,
  "review_reason": "要確認の理由（不要ならnull）"
}

## ルール
- 金額は必ず税込金額を使用する
- 日付が不明な場合は書類上の最新日付を使用する
- 科目が特定できない場合は「不明勘定」を使い、needs_human_review=true とする
- 行ごとの借方合計=貸方合計になるよう金額を一致させる
- インボイス番号（T+13桁）があれば適格請求書として処理する`;
}

// ============================================================
// メイン関数（スケルトン）
// ============================================================

export async function inferJournal(
  _input: InferenceInput,
): Promise<InferenceResult> {
  // TODO: 実装
  // 1. preprocessImage でリサイズ
  // 2. buildPrompt でプロンプト構築
  // 3. VertexAI で generateContent
  // 4. JSON解析 → InferenceResult
  // 5. needs_human_review の後処理（confidence < 0.7 なら強制true等）

  throw new Error('journal_inference.ts はまだ実装されていません（スケルトン）');
}
