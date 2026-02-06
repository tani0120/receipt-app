/**
 * OCR API Route
 *
 * Vertex AI OCRのNode.js APIエンドポイント
 * - POST /api/ocr: レシート画像をOCR処理
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { executeOCRVertex } from '../vertex/ocr_service_vertex';

const ocrRoute = new Hono();

/**
 * OCRリクエストスキーマ
 */
const ocrRequestSchema = z.object({
    image: z.string().min(1, 'Base64画像が必要です'),
    mimeType: z.string().default('image/jpeg'),
    clientId: z.string().default('CL-001')
});

/**
 * POST /api/ocr
 *
 * レシート画像をOCR処理
 *
 * @body image - Base64エンコード画像
 * @body mimeType - MIMEタイプ（デフォルト: image/jpeg）
 * @body clientId - クライアントID（デフォルト: CL-001）
 * @returns AIIntermediateOutput
 */
ocrRoute.post(
    '/',
    zValidator('json', ocrRequestSchema),
    async (c) => {
        try {
            const { image, mimeType, clientId } = c.req.valid('json');

            console.log(`[OCR API] リクエスト受信: clientId=${clientId}`);

            // 環境変数から設定取得
            const projectId = process.env.VERTEX_PROJECT_ID || 'sugu-suru';
            const location = process.env.VERTEX_LOCATION || 'asia-northeast1';

            // Vertex OCR実行
            const result = await executeOCRVertex(
                image,
                mimeType,
                clientId,
                projectId,
                location
            );

            console.log(`[OCR API] ✅ 成功`);

            return c.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error(`[OCR API] ❌ エラー:`, error);

            return c.json(
                {
                    success: false,
                    error: error.message || 'OCR処理に失敗しました'
                },
                500
            );
        }
    }
);

export default ocrRoute;
