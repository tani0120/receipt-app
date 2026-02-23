/**
 * Phase A-2 v2: 証票分類 Gemini実験 — メインテストスクリプト
 *
 * v1からの変更:
 *   - スキーマ: 32フィールド（層A 30 + G1 sub_account + G2 tax_category）
 *   - 前処理統合: sharp pipeline ON/OFFフラグ付き
 *   - post-process統合: 層B 8項目 + ラベル自動生成をコード側で実行
 *   - A/Bテスト: --preprocess フラグで前処理有無を切替
 *   - プロンプト: 税区分enum/クレカ払い/補助科目対応
 *   - 料金算定: Gemini 2.5 Flash公式料金に基づく正確なコスト計算
 *
 * 使用法:
 *   npx tsx src/scripts/classify_test.ts                 # Run A: 前処理なし
 *   npx tsx src/scripts/classify_test.ts --preprocess    # Run B: 前処理あり
 *
 * 前提:
 *   - gcloud auth application-default login 済み
 *   - src/scripts/test_images/ に実データ配置済み
 */

import { VertexAI } from '@google-cloud/vertexai';
import {
    CLASSIFY_RESPONSE_SCHEMA,
    type GeminiClassifyResponse,
    type ClassifyResult,
} from './classify_schema';
import { runPostProcess, estimateCost, type TokenUsage } from './classify_postprocess';
import { processFile as preprocessFile } from './preprocess';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 設定
// ============================================================

const PROJECT_ID = 'sugu-suru';
const LOCATION = 'asia-northeast1';
const MODEL_ID = 'gemini-2.5-flash';

const TEST_IMAGES_DIR = path.join(__dirname, 'test_images');
const RESULTS_DIR = path.join(__dirname, 'test_results');

// コマンドライン引数で前処理を制御
const ENABLE_PREPROCESS = process.argv.includes('--preprocess');
const RUN_LABEL = ENABLE_PREPROCESS ? 'B_with_preprocess' : 'A_no_preprocess';

/** サポートするファイル拡張子 */
const SUPPORTED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic',
    '.pdf',
    '.csv',
]);

// ============================================================
// v2 System Instruction
// ============================================================

const SYSTEM_INSTRUCTION = `あなたは日本の法人会計に精通した「AI公認会計士」兼「高度画像解析エンジン」です。
1枚の証票画像（またはCSVテキスト）から、会計処理に必要な全データを1回のレスポンスで抽出します。

## 基本原則

1. **勘定科目制限**: 提供リストの科目のみ使用。リスト外は一切不可。
2. **3状態の区別**:
   - 値あり → フィールドに値を入れる
   - 欄自体が存在しない → null
   - 欄はあるが文字が潰れて読めない → 該当_unreadableフラグをtrue + 値はnull
3. **数値優先**: 画像上に印字された数値を最優先。自分で計算した値と不整合があっても、画像の数値を採用する。
4. **T番号**: インボイス登録番号は「T」+ 数字13桁。ハイフンは除去して出力（例: T6120002074677）。
5. **構造化出力厳守**: 指定JSONスキーマを正確に出力。テキスト解説は不要。

## 証票タイプ判定

| タイプ | 判定基準 |
|--------|----------|
| RECEIPT | 「領収証」「レシート」の表記、またはPOS端末出力 |
| INVOICE | 「請求書」「御請求書」「納品書兼請求書」の表記 |
| TRANSPORT | 「乗車券」「ICカード利用明細」「タクシー領収書」 |
| CREDIT_CARD | 「クレジットカード利用明細」「カードご利用」 |
| BANK_STATEMENT | 通帳ページ、「普通預金」「当座預金」の表記 |
| MEDICAL | 「診療」「薬局」「医療費」「クリニック」の表記 |
| NOT_APPLICABLE | 名刺、メモ、風景写真、謄本等の仕訳不要書類 |

## 銀行名推定

通帳ページの場合、以下を手がかりに推定:
- ロゴの形状・配色・フォント
- 列ヘッダーの表現（「お支払金額」「お預り金額」等の固有表現）
- 摘要欄の略称・固有キーワード
- 通帳の地紋パターン
推定理由を bank_name_evidence に記載すること。

## 仕訳候補

- journal_entry_suggestions は配列。借方エントリと貸方エントリを分けて出力。
- entry_type: "debit"（借方）または "credit"（貸方）
- 通常の単純仕訳: debit 1件 + credit 1件 = 合計2件
- 複合仕訳（is_composite_transaction=true）: 3件以上
- 借方合計と貸方合計は必ず一致させること。
- 対象外（NOT_APPLICABLE）の場合は空配列。

## 商品明細（receipt_items）

レシートで個別商品が読み取れる場合、全品目を receipt_items に出力。
通帳・カード明細の場合は null。

## 明細行（line_items）

通帳・カード明細の場合、各行を line_items に出力。
レシート・請求書の場合は null。

## 手書きメモ

証票上に手書きの文字（ボールペン等）がある場合:
- has_handwritten_memo = true
- handwritten_memo_content に内容を記載`;

// ============================================================
// v2 Request Prompt
// ============================================================

const REQUEST_PROMPT = `以下の証票を解析し、会計処理用JSONを生成せよ。

## 会計コンテキスト
- **会計期間**: 2025-04-01 〜 2026-03-31
- **勘定科目リスト（これ以外は使用禁止）**:
  旅費交通費, 消耗品費, 通信費, 会議費, 接待交際費, 広告宣伝費, 支払手数料,
  地代家賃, 水道光熱費, 保険料, 修繕費, 雑費, 福利厚生費, 外注費, 荷造運賃,
  売上高, 仕入高, 現金, 普通預金, 売掛金, 買掛金, 未払金,
  仮受消費税, 仮払消費税, 医療費, 受取利息, 不動産収入

- **税区分リスト（これ以外は使用禁止）**:
  | 税区分ID | 日本語 | 判定基準 |
  |----------|--------|----------|
  | TAXABLE_PURCHASE_10 | 課税仕入10% | 一般経費（消耗品、通信、家賃等） |
  | TAXABLE_PURCHASE_8 | 課税仕入8%（軽減） | 飲食料品、定期購読新聞 |
  | NON_TAXABLE_PURCHASE | 非課税仕入 | 保険料、利息、土地代、行政手数料 |
  | OUT_OF_SCOPE_PURCHASE | 対象外（仕入） | 給与、税金、寄付金、慶弔 |
  | TAXABLE_SALES_10 | 課税売上10% | 一般売上 |
  | TAXABLE_SALES_8 | 課税売上8%（軽減） | 飲食料品売上 |
  | NON_TAXABLE_SALES | 非課税売上 | 有価証券譲渡、住宅貸付 |
  | OUT_OF_SCOPE_SALES | 対象外売上 | 配当金、損害賠償 |

## 実行手順
1. **証票分類**: 7タイプから1つ選択。信頼度を0.0-1.0で評価。
2. **OCR抽出**: 日付・金額・発行者を抽出。読めない場合は unreadable=true。
3. **支店名**: 「〇〇店」「〇〇支店」等があれば issuer_branch に入れる。
4. **支払方法**: 現金/クレジット/振込/電子マネー/QR決済を判定。
5. **クレジットカード払い**: is_credit_card_paymentで判定。
   カード会社ロゴ、「カード」テキスト、下4桁番号等を検出した場合true。
   voucher_typeとは独立（RECEIPTでもカード払いは有り得る）。
6. **適格請求書**: T番号を検索。ハイフンは除去（T6120002074677形式）。
7. **税率抽出**: 8%/10%の内訳を tax_entries に。複数税率の場合は複数エントリ。
8. **銀行推定**: 通帳の場合、ロゴ・フォーマットから推定。根拠を evidence に。
9. **仕訳生成**: 借方・貸方を配列で。複合仕訳は is_composite_transaction=true。
   **各エントリに必ず tax_category（税区分）を指定すること。**
   sub_account（補助科目）は判定できる場合のみ記入（銀行名、カード名等）。不明ならnull。
10. **明細展開**: 通帳/カードは line_items、レシートは receipt_items。
11. **手書きメモ**: 手書き文字があれば内容を記載。
12. **複数証票**: 1画像に2枚以上写っている場合 has_multiple_vouchers=true。`;

// ============================================================
// ユーティリティ
// ============================================================

function getTestFiles(): string[] {
    if (!fs.existsSync(TEST_IMAGES_DIR)) {
        console.error(`❌ テスト画像ディレクトリが見つかりません: ${TEST_IMAGES_DIR}`);
        process.exit(1);
    }

    return fs.readdirSync(TEST_IMAGES_DIR)
        .filter(f => {
            const ext = path.extname(f).toLowerCase();
            return SUPPORTED_EXTENSIONS.has(ext);
        })
        .sort();
}

// ============================================================
// メイン処理
// ============================================================

async function processOneFile(
    vertexAI: VertexAI,
    filePath: string,
    index: number,
    total: number
): Promise<{ file: string; gemini: GeminiClassifyResponse; duration: number; tokens: TokenUsage; preprocessed: boolean }> {
    const fileName = path.basename(filePath);
    console.log(`\n[${index + 1}/${total}] 処理中: ${fileName} (前処理: ${ENABLE_PREPROCESS ? 'ON' : 'OFF'})`);

    // 1. 前処理
    const processed = await preprocessFile(filePath, { enablePreprocess: ENABLE_PREPROCESS });
    console.log(`   📦 ${processed.category} | ${(processed.originalSize / 1024).toFixed(0)}KB → ${(processed.processedSize / 1024).toFixed(0)}KB | 前処理: ${processed.preprocessed}`);

    // 2. Vertex AIモデル初期化
    const generativeModel = vertexAI.getGenerativeModel({
        model: MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CLASSIFY_RESPONSE_SCHEMA,
            temperature: 0,
        },
    });

    // 3. API呼び出し
    const startTime = Date.now();

    const response = await generativeModel.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    processed.part,
                    { text: REQUEST_PROMPT },
                ],
            },
        ],
    });

    const duration = Date.now() - startTime;

    // 4. レスポンス解析
    const candidate = response.response.candidates?.[0];
    const usage = response.response.usageMetadata;

    // TODO: Vertex AI SDK が thoughtsTokenCount を公式サポートしたら
    //       Record<string, unknown> キャストを削除し、SDK型を直接使用する
    const tokenUsage: TokenUsage = {
        promptTokenCount: usage?.promptTokenCount || 0,
        candidatesTokenCount: usage?.candidatesTokenCount || 0,
        thoughtsTokenCount: (usage as Record<string, unknown>)?.thoughtsTokenCount as number || 0,
    };

    let geminiResult: GeminiClassifyResponse;
    if (candidate?.content?.parts?.[0]?.text) {
        try {
            geminiResult = JSON.parse(candidate.content.parts[0].text) as GeminiClassifyResponse;
        } catch {
            console.error(`   ⚠️ JSON解析失敗`);
            throw new Error(`JSON解析失敗: ${candidate.content.parts[0].text?.substring(0, 200)}`);
        }
    } else {
        throw new Error('Geminiからのレスポンスが空');
    }

    // 5. コンソール出力（要約）
    console.log(`   ✅ 完了 (${(duration / 1000).toFixed(1)}秒)`);
    console.log(`   📊 トークン: 入力=${tokenUsage.promptTokenCount} 出力=${tokenUsage.candidatesTokenCount} 思考=${tokenUsage.thoughtsTokenCount}`);
    console.log(`   🏷️  種類: ${geminiResult.voucher_type} (${geminiResult.voucher_type_confidence})`);
    console.log(`   📅 日付: ${geminiResult.date ?? 'null'} ${geminiResult.date_unreadable ? '⚠️読取不可' : ''}`);
    console.log(`   💰 金額: ${geminiResult.total_amount ?? 'null'} ${geminiResult.amount_unreadable ? '⚠️読取不可' : ''}`);
    console.log(`   🏢 発行者: ${geminiResult.issuer_name ?? 'null'} ${geminiResult.issuer_unreadable ? '⚠️読取不可' : ''}`);

    if (geminiResult.issuer_branch) console.log(`   🏪 支店: ${geminiResult.issuer_branch}`);
    if (geminiResult.payment_method) console.log(`   💳 支払方法: ${geminiResult.payment_method}`);
    if (geminiResult.bank_name_guess) console.log(`   🏦 銀行推定: ${geminiResult.bank_name_guess} (${geminiResult.bank_name_confidence}) 根拠: ${geminiResult.bank_name_evidence}`);
    if (geminiResult.invoice_registration_number) console.log(`   📝 T番号: ${geminiResult.invoice_registration_number}`);
    if (geminiResult.is_medical_expense) console.log(`   🏥 医療費: true`);
    if (geminiResult.has_handwritten_memo) console.log(`   ✍️ メモ: ${geminiResult.handwritten_memo_content ?? '内容不明'}`);
    if (geminiResult.has_multiple_vouchers) console.log(`   📑 複数証票: true`);
    if (geminiResult.is_composite_transaction) console.log(`   🔀 複合仕訳: true`);
    if (geminiResult.receipt_items?.length) console.log(`   🛒 商品明細: ${geminiResult.receipt_items.length}件`);
    if (geminiResult.line_items?.length) console.log(`   📑 明細行: ${geminiResult.line_items.length}件`);

    // 仕訳候補表示
    if (geminiResult.journal_entry_suggestions?.length > 0) {
        console.log(`   📒 仕訳候補:`);
        for (const e of geminiResult.journal_entry_suggestions) {
            const taxLabel = e.tax_category ? ` [税:${e.tax_category}]` : '';
            const subLabel = e.sub_account ? ` (補助:${e.sub_account})` : '';
            console.log(`      ${e.entry_type === 'debit' ? '借方' : '貸方'}: ${e.account}${subLabel} ¥${e.amount.toLocaleString()}${taxLabel} (${e.description})`);
        }
    }

    return {
        file: fileName,
        gemini: geminiResult,
        duration,
        tokens: tokenUsage,
        preprocessed: processed.preprocessed,
    };
}

async function main() {
    console.log('='.repeat(60));
    console.log(`Phase A-2 v2: 証票分類 A/Bテスト`);
    console.log(`Run: ${RUN_LABEL}`);
    console.log('='.repeat(60));
    console.log(`プロジェクト: ${PROJECT_ID}`);
    console.log(`モデル: ${MODEL_ID} @ ${LOCATION}`);
    console.log(`前処理: ${ENABLE_PREPROCESS ? '✅ ON（sharp全項目）' : '❌ OFF（生ファイル直送）'}`);
    console.log(`料金: 入力$0.30/M  出力$2.50/M  思考$2.50/M`);
    console.log('='.repeat(60));

    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    const files = getTestFiles();
    console.log(`\n📁 テストファイル: ${files.length}件`);
    files.forEach(f => console.log(`   - ${f}`));

    // 結果ディレクトリ作成（Run別）
    const runResultsDir = path.join(RESULTS_DIR, RUN_LABEL);
    if (!fs.existsSync(runResultsDir)) {
        fs.mkdirSync(runResultsDir, { recursive: true });
    }

    // 全ファイル処理（Gemini出力を先に全件収集）
    const rawResults: Array<{
        file: string;
        gemini: GeminiClassifyResponse;
        duration: number;
        tokens: TokenUsage;
        preprocessed: boolean;
    }> = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ file: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(TEST_IMAGES_DIR, files[i] ?? '');
        try {
            const result = await processOneFile(vertexAI, filePath, i, files.length);
            rawResults.push(result);
            successCount++;
        } catch (err) {
            console.error(`\n   ❌ エラー: ${files[i]}`);
            console.error(`   ${err}`);
            errors.push({ file: files[i] ?? '', error: String(err) });
            errorCount++;
        }
    }

    // post-process（全件揃ってから実行 — 重複検出に全件必要）
    console.log('\n' + '='.repeat(60));
    console.log('📊 層B post-processing');
    console.log('='.repeat(60));

    const allGeminiResults = rawResults.map(r => r.gemini);
    const finalResults: ClassifyResult[] = [];

    for (let i = 0; i < rawResults.length; i++) {
        const raw = rawResults[i]!;
        const postprocess = runPostProcess(raw.gemini, i, allGeminiResults, raw.tokens);

        console.log(`\n   [${i + 1}] ${raw.file}`);
        console.log(`      ステータス: ${postprocess.classification_status}`);
        console.log(`      税検算: ${postprocess.tax_calculation_detail}`);
        console.log(`      日付: ${postprocess.date_anomaly ? `⚠️ ${postprocess.date_anomaly_reason}` : '✅ 期間内'}`);
        console.log(`      貸借: ${postprocess.debit_credit_detail}`);
        console.log(`      重複: ${postprocess.duplicate_suspect ? `⚠️ ${postprocess.duplicate_suspect_detail}` : 'なし'}`);
        console.log(`      ラベル: [${postprocess.labels.join(', ')}]`);
        console.log(`      料金: $${postprocess.estimated_cost_usd.toFixed(6)}`);

        const costBreakdown = estimateCost(raw.tokens);

        const classifyResult: ClassifyResult = {
            gemini: raw.gemini,
            postprocess,
            metadata: {
                file: raw.file,
                duration_ms: raw.duration,
                prompt_tokens: raw.tokens.promptTokenCount,
                completion_tokens: raw.tokens.candidatesTokenCount,
                thinking_tokens: raw.tokens.thoughtsTokenCount || 0,
                preprocessed: raw.preprocessed,
                cost_breakdown: costBreakdown,
            },
        };

        finalResults.push(classifyResult);

        // 個別結果保存
        const resultFileName = path.parse(raw.file).name + '_result.json';
        const resultPath = path.join(runResultsDir, resultFileName);
        fs.writeFileSync(resultPath, JSON.stringify(classifyResult, null, 2), 'utf-8');
    }

    // サマリー
    console.log('\n' + '='.repeat(60));
    console.log('📊 最終サマリー');
    console.log('='.repeat(60));
    console.log(`Run: ${RUN_LABEL}`);
    console.log(`成功: ${successCount}/${files.length}`);
    console.log(`エラー: ${errorCount}/${files.length}`);

    const autoConfirmed = finalResults.filter(r => r.postprocess.classification_status === 'auto_confirmed').length;
    const needsReview = finalResults.filter(r => r.postprocess.classification_status === 'needs_review').length;
    const excluded = finalResults.filter(r => r.postprocess.classification_status === 'excluded').length;
    const taxMismatch = finalResults.filter(r => r.postprocess.tax_calculation_mismatch).length;
    const dateAnomaly = finalResults.filter(r => r.postprocess.date_anomaly).length;
    const duplicates = finalResults.filter(r => r.postprocess.duplicate_suspect).length;
    const dcMismatch = finalResults.filter(r => r.postprocess.debit_credit_mismatch).length;
    const totalPrompt = finalResults.reduce((sum, r) => sum + r.metadata.prompt_tokens, 0);
    const totalCompletion = finalResults.reduce((sum, r) => sum + r.metadata.completion_tokens, 0);
    const totalThinking = finalResults.reduce((sum, r) => sum + r.metadata.thinking_tokens, 0);
    const avgDuration = finalResults.reduce((sum, r) => sum + r.metadata.duration_ms, 0) / finalResults.length;

    // 料金計算（CostBreakdownから集計）
    const totalPromptCost = finalResults.reduce((sum, r) => sum + r.metadata.cost_breakdown.prompt_cost_usd, 0);
    const totalCompletionCost = finalResults.reduce((sum, r) => sum + r.metadata.cost_breakdown.completion_cost_usd, 0);
    const totalThinkingCost = finalResults.reduce((sum, r) => sum + r.metadata.cost_breakdown.thinking_cost_usd, 0);
    const totalCost = totalPromptCost + totalCompletionCost + totalThinkingCost;
    const perFileCost = totalCost / finalResults.length;

    // ラベル統計
    const labelStats: Record<string, number> = {};
    for (const r of finalResults) {
        for (const label of r.postprocess.labels) {
            labelStats[label] = (labelStats[label] || 0) + 1;
        }
    }

    console.log(`\nステータス:`);
    console.log(`   auto_confirmed: ${autoConfirmed}件`);
    console.log(`   needs_review: ${needsReview}件`);
    console.log(`   excluded: ${excluded}件`);
    console.log(`\n検証:`);
    console.log(`   税計算不整合: ${taxMismatch}件`);
    console.log(`   日付異常: ${dateAnomaly}件`);
    console.log(`   重複疑い: ${duplicates}件`);
    console.log(`   貸借不一致: ${dcMismatch}件`);
    console.log(`\nラベル統計:`);
    const labelCategories = {
        '証票': ['RECEIPT', 'INVOICE', 'TRANSPORT', 'CREDIT_CARD', 'BANK_STATEMENT', 'MEDICAL', 'NOT_APPLICABLE'],
        '警告': ['DEBIT_CREDIT_MISMATCH', 'TAX_CALCULATION_ERROR', 'MISSING_FIELD', 'UNREADABLE_FAILED', 'DUPLICATE_CONFIRMED', 'MULTIPLE_VOUCHERS', 'DUPLICATE_SUSPECT', 'DATE_OUT_OF_RANGE', 'UNREADABLE_ESTIMATED', 'MEMO_DETECTED'],
        '制度': ['INVOICE_QUALIFIED', 'INVOICE_NOT_QUALIFIED', 'MULTI_TAX_RATE'],
    };
    for (const [cat, labels] of Object.entries(labelCategories)) {
        const items = labels.filter(l => labelStats[l]).map(l => `${l}×${labelStats[l]}`);
        if (items.length > 0) console.log(`   ${cat}: ${items.join(', ')}`);
    }
    console.log(`\nトークン/料金:`);
    console.log(`   入力合計: ${totalPrompt.toLocaleString()} → $${totalPromptCost.toFixed(4)}`);
    console.log(`   出力合計: ${totalCompletion.toLocaleString()} → $${totalCompletionCost.toFixed(4)}`);
    console.log(`   思考合計: ${totalThinking.toLocaleString()} → $${totalThinkingCost.toFixed(4)}`);
    console.log(`   ──────────────────`);
    console.log(`   合計: $${totalCost.toFixed(4)}`);
    console.log(`   1枚単価: $${perFileCost.toFixed(4)} (≒¥${(perFileCost * 150).toFixed(1)})`);
    console.log(`   月間推計: 100件=$${(perFileCost * 100).toFixed(2)}  500件=$${(perFileCost * 500).toFixed(2)}  1000件=$${(perFileCost * 1000).toFixed(2)}`);
    console.log(`   平均処理時間: ${(avgDuration / 1000).toFixed(1)}秒/件`);

    // サマリーJSON保存
    const summaryData = {
        run: RUN_LABEL,
        timestamp: new Date().toISOString(),
        model: MODEL_ID,
        location: LOCATION,
        preprocess: ENABLE_PREPROCESS,
        pricing: {
            prompt_per_million: 0.30,
            completion_per_million: 2.50,
            thinking_per_million: 2.50,
            source: 'Gemini 2.5 Flash 公式料金 2026-02',
        },
        stats: {
            total: files.length,
            success: successCount,
            errors: errorCount,
            auto_confirmed: autoConfirmed,
            needs_review: needsReview,
            excluded,
            tax_mismatch: taxMismatch,
            date_anomaly: dateAnomaly,
            duplicates,
            debit_credit_mismatch: dcMismatch,
        },
        label_stats: labelStats,
        tokens: { prompt: totalPrompt, completion: totalCompletion, thinking: totalThinking },
        cost: {
            prompt_total_usd: totalPromptCost,
            completion_total_usd: totalCompletionCost,
            thinking_total_usd: totalThinkingCost,
            total_usd: totalCost,
            per_file_usd: perFileCost,
            monthly_estimate: {
                '100_files': perFileCost * 100,
                '500_files': perFileCost * 500,
                '1000_files': perFileCost * 1000,
            },
        },
        avg_duration_ms: avgDuration,
        results: finalResults,
        errors: errors,
    };

    const summaryPath = path.join(runResultsDir, '_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2), 'utf-8');
    console.log(`\n💾 結果保存先: ${runResultsDir}`);
    console.log(`   サマリー: ${summaryPath}`);
}

main().catch(err => {
    console.error('致命的エラー:', err);
    process.exit(1);
});
