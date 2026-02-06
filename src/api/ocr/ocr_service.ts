/**
 * OCR Service（統一ファサード）
 *
 * Phase 6.2: Gemini API（ブラウザ）
 * Phase 6.3: Vertex AI（Node.js API経由）
 */

import { executeOCRBrowser } from '../gemini/ocr_service_browser';
import type { AIIntermediateOutput } from '../gemini/schemas';

/**
 * OCR実行（唯一の呼び出し口）
 *
 * 環境変数VITE_API_PROVIDERで切り替え:
 * - 'gemini': Gemini API（Phase 6.2、ブラウザ直接呼び出し）
 * - 'vertex': Vertex AI（Phase 6.3、Node.js API経由）
 *
 * @param imageFile - File object
 * @param clientId - クライアントID
 * @returns AIIntermediateOutput
 */
export async function executeOCR(
    imageFile: File,
    clientId: string = 'CL-001'
): Promise<AIIntermediateOutput> {
    const provider = import.meta.env.VITE_API_PROVIDER || 'gemini';

    if (provider === 'vertex') {
        console.info('[OCR Service] Provider: Vertex AI (Phase 6.3)');
        return executeOCRVertex(imageFile, clientId);
    } else {
        console.info('[OCR Service] Provider: Gemini API (Phase 6.2)');
        return executeOCRBrowser(imageFile, clientId);
    }
}

/**
 * Vertex AI経由でOCR実行（Node.js API呼び出し）
 *
 * @param imageFile - File object
 * @param clientId - クライアントID
 * @returns AIIntermediateOutput
 */
async function executeOCRVertex(
    imageFile: File,
    clientId: string
): Promise<AIIntermediateOutput> {
    // File → Base64変換
    const base64Image = await fileToBase64(imageFile);

    // Node.js APIにPOST
    const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: base64Image,
            mimeType: imageFile.type,
            clientId: clientId
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR API呼び出しに失敗しました');
    }

    const result = await response.json();
    return result.data;
}

/**
 * File → Base64変換
 *
 * @param file - File object
 * @returns Base64文字列
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // data:image/jpeg;base64,... → base64部分のみ抽出
            const base64 = result.split(',')[1];
            resolve(base64);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}
