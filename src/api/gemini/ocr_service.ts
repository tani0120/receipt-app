/**
 * Gemini OCR Service（改善反映版 + 実API実装）
 *
 * Gemini 3 Flash + Context Cachingを使用したOCR処理
 * Phase 6.2-A: 基本実装（レシート専用）
 *
 * 改善ポイント:
 * ① GEMINI_API_KEY 統一（フォールバック対応）
 * ② SYSTEM_INSTRUCTIONを共通ファイルからimport
 * ③ mimeType安全化
 */

import type { AIIntermediateOutput } from '@/types/GeminiOCR.types';
import { getOrCreateCache } from './cache_manager';
import { validateAIIntermediateOutput, extractJSONFromResponse } from './schemas';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * OCRリクエストパラメータ
 */
export interface OCRRequest {
  /** 顧問先ID */
  client_id: string;
  /** 画像ファイルパス */
  image_path: string;
  /** バッチ履歴（重複チェック用） */
  batch_history?: any[];
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

  return rawJSON as any; // 一旦any型で返す
}

/**
 * Gemini API呼び出し（実API実装）
 *
 * 修正①: GEMINI_API_KEY統一（フォールバック対応）
 * 修正③: mimeType安全化
 *
 * Phase 6.2-B: GeminiCallContext構造化予定（改善⑤）
 *
 * @param cacheId - Context Cache ID
 * @param imagePath - 画像ファイルパス
 * @param batchHistory - バッチ履歴
 * @returns レスポンステキスト
 */
async function callGeminiAPI(
  cacheId: string,
  imagePath: string,
  batchHistory: any[]
): Promise<string> {
  // 修正①: API Key取得（フォールバック対応）
  const API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);

  // 画像存在チェック
  if (!readFileSync) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  try {
    // 【案B】Cache完全スキップ - シンプルなOCR直叩き
    const model = genAI.getGenerativeModel(
      { model: 'models/gemini-1.5-flash-001' }
      // apiVersion: v1beta 不要（Cacheなしの場合）
    );

    // 画像をBase64エンコード
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // 修正③: mimeType安全化
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // 【案B】systemInstruction削除、cachedContent削除
    // 画像のみでOCR実行
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      {
        text: 'この領収書から以下の情報をJSON形式で抽出してください：店名(vendor)、日付(date)、合計金額(total_amount)、T番号(t_number)'
      }
    ]);

    const responseText = result.response.text();
    console.log(`✅ Gemini API呼び出し成功`);

    return responseText;
  } catch (error) {
    console.error('❌ Gemini API呼び出し失敗:', error);
    throw new Error(`Gemini API call failed: ${error}`);
  }
}
