/**
 * Gemini OCR Service（ブラウザ版）
 *
 * Node.js版のocr_service.tsをブラウザ環境に移植
 *
 * 主な変更点:
 * - readFileSync → FileReader API
 * - process.env → import.meta.env
 * - Buffer → browser native APIs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { OCRRequest, AIIntermediateOutput } from './schemas';
import { SYSTEM_INSTRUCTION } from './system_instruction';

/**
 * Gemini OCR実行（ブラウザ版）
 *
 * @param imageFile - File object（ブラウザのFileReader用）
 * @param clientId - クライアントID（将来のCache用）
 * @returns AIIntermediateOutput
 */
export async function executeOCRBrowser(
    imageFile: File,
    clientId: string = 'CL-001'
): Promise<AIIntermediateOutput> {
    console.log(`🔍 [Browser] OCR実行開始: ${imageFile.name}, clientId: ${clientId}`);

    // 画像をBase64に変換
    const base64Image = await fileToBase64(imageFile);

    // Gemini API呼び出し
    const responseText = await callGeminiAPIBrowser(
        base64Image,
        imageFile.type
    );

    // レスポンスJSON抽出
    const rawJSON = extractJSONFromResponse(responseText);

    console.log(`✅ [Browser] OCR完了`);

    return rawJSON as AIIntermediateOutput;
}

/**
 * File → Base64変換（ブラウザ専用）
 */
async function fileToBase64(file: File): Promise<string> {
    console.log('[fileToBase64] 開始', {
        type: typeof file,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
        name: file?.name,
        size: file?.size
    });

    if (!(file instanceof File)) {
        console.error('[fileToBase64] File object expected, got:', file);
        throw new Error(`Expected File object, got ${typeof file}`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // data:image/jpeg;base64,... → base64部分のみ抽出
            const base64 = result.split(',')[1];
            console.log('[fileToBase64] 成功', {
                base64Length: base64?.length
            });
            resolve(base64);
        };

        reader.onerror = () => {
            console.error('[fileToBase64] FileReader error');
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Gemini API呼び出し（ブラウザ版）
 */
async function callGeminiAPIBrowser(
    base64Image: string,
    mimeType: string,
    batchHistory: any[]
): Promise<string> {
    // API Key取得（Vite環境変数）
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY が設定されていません');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        // シンプルなOCR実行（Cache不使用）
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview'
        });

        console.log('📤 [Browser] Gemini API呼び出し中...');

        // API呼び出し
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            },
            {
                text: `あなたは会計OCRエンジンです。
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
- 接待交際費
- 会議費
- 飲食費
- 外食費
- 福利厚生費
- 仮払金

【選択ルール】
- **複数名での飲食、居酒屋、社外の会食** → 接待交際費
- **会議・打ち合わせ中の飲食** → 会議費
- **個人の軽食、コンビニ、カフェ** → 飲食費
- **個人のレストラン利用** → 外食費
- **社員向けイベント・慰労会** → 福利厚生費
- **上記に当てはまらない、または判断困難** → 仮払金

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

この領収書から上記形式でJSONを抽出してください。`
            }
        ]);

        const responseText = result.response.text();

        // トークン使用量を取得
        const usageMetadata = result.response.usageMetadata;
        if (usageMetadata) {
            console.log('📊 [Browser] トークン使用量:', {
                promptTokenCount: usageMetadata.promptTokenCount,
                candidatesTokenCount: usageMetadata.candidatesTokenCount,
                totalTokenCount: usageMetadata.totalTokenCount
            });

            // Gemini 3 Flash料金で実コスト計算（$1=¥150）
            const inputCost = (usageMetadata.promptTokenCount / 1_000_000) * 0.50 * 150;
            const outputCost = (usageMetadata.candidatesTokenCount / 1_000_000) * 3.00 * 150;
            const totalCost = inputCost + outputCost;

            console.log('💰 [Browser] 推定コスト:', {
                入力: `¥${inputCost.toFixed(4)}`,
                出力: `¥${outputCost.toFixed(4)}`,
                合計: `¥${totalCost.toFixed(4)}`
            });
        }

        console.log(`✅ [Browser] Gemini API呼び出し成功`);

        return responseText;
    } catch (error) {
        console.error('❌ [Browser] Gemini API呼び出し失敗:', error);
        throw new Error(`Gemini API call failed: ${error}`);
    }
}

/**
 * レスポンスからJSON抽出
 *
 * Geminiは ```json ... ``` 形式で返すことが多い
 */
function extractJSONFromResponse(responseText: string): any {
    // マークダウンコードブロックを削除
    const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);

    if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
    }

    // コードブロックがない場合は直接パース
    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.error('JSON解析失敗:', responseText);
        throw new Error('Invalid JSON response from Gemini');
    }
}
