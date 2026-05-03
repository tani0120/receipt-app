/**
 * Gemini OCR Service（Gen AI SDK版）
 *
 * @google/genai 統一SDK使用
 * Phase 6.2-A: 基本実装（レシート専用）
 */

import type { AIIntermediateOutput } from '@/types/GeminiOCR.types';
// getOrCreateCache: Phase 6.2-Bでcache復活時にimport復元
import { extractJSONFromResponse } from './schemas';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

/**
 * OCRリクエストパラメータ
 */
export interface OCRRequest {
  /** 顧問先ID */
  client_id: string;
  /** 画像ファイルパス */
  image_path: string;
  /** バッチ履歴（重複チェック用） */
  batch_history?: unknown[];
}

/**
 * Gemini OCR実行
 *
 * @param request - OCRリクエスト
 * @returns AIIntermediateOutput
 */
export async function executeOCR(request: OCRRequest): Promise<AIIntermediateOutput> {
  console.log(`🔍 OCR実行開始: ${request.image_path}`);

  // 【案B】Cache取得を完全スキップ
  console.log(`⚠️  [案B] Cache機能スキップ中...`);

  // 2. Gemini API呼び出し（Cache IDは使用しない）
  const responseText = await callGeminiAPI(
    '', // cacheIdは空文字列
    request.image_path,
    request.batch_history || []
  );

  // 3. レスポンスJSON抽出
  const rawJSON = extractJSONFromResponse(responseText);

  // 4. バリデーション（簡易版）
  console.log('⚠️  [案B] バリデーションスキップ - 生JSONを返却');

  console.log(`✅ OCR完了`);

  return rawJSON as AIIntermediateOutput; // extractJSONFromResponseがunknown型を返すためキャスト（Phase 6.2-Bでバリデーション追加予定）
}

/**
 * Gemini API呼び出し（@google/genai SDK版）
 */
async function callGeminiAPI(
  _cacheId: string,
  imagePath: string,
  _batchHistory: unknown[]
): Promise<string> {
  const API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 画像存在チェック
  if (!readFileSync) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  try {
    // 画像をBase64エンコード
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // mimeType安全化
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            },
            {
              text: 'この領収書から以下の情報をJSON形式で抽出してください：店名(vendor)、日付(date)、合計金額(total_amount)、T番号(t_number)'
            }
          ]
        }
      ],
    });

    const responseText = result.text ?? '';
    console.log(`✅ Gemini API呼び出し成功`);

    return responseText;
  } catch (error) {
    console.error('❌ Gemini API呼び出し失敗:', error);
    throw new Error(`Gemini API call failed: ${error}`);
  }
}
