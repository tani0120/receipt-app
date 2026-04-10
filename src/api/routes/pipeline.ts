/**
 * パイプラインAPIルート（Hono）
 *
 * レイヤー: ★route★ → service → postprocess
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   POST /api/pipeline/classify  — Step 0-1: source_type + direction判定
 *   POST /api/pipeline/extract   — 将来用（line_items抽出）
 */

import { Hono } from 'hono';
import { classifyImage } from '../services/pipeline/classify.service';
import type { ClassifyRequest } from '../services/pipeline/types';

const app = new Hono();

// ============================================================
// POST /classify — Step 0-1: 証票種別 + 仕訳方向判定
// ============================================================

app.post('/classify', async (c) => {
  console.log('[pipeline/route] POST /classify 受信');

  // リクエストボディ取得
  let body: ClassifyRequest;
  try {
    body = await c.req.json<ClassifyRequest>();
  } catch {
    return c.json({ error: 'リクエストボディのJSON解析に失敗しました' }, 400);
  }

  // バリデーション
  if (!body.image || typeof body.image !== 'string') {
    return c.json({ error: 'image（base64文字列）は必須です' }, 400);
  }
  if (!body.mimeType || typeof body.mimeType !== 'string') {
    return c.json({ error: 'mimeTypeは必須です' }, 400);
  }
  if (!body.clientId || typeof body.clientId !== 'string') {
    return c.json({ error: 'clientIdは必須です' }, 400);
  }

  // service呼び出し（例外はservice内でcatchされfallbackが返る）
  const result = await classifyImage(body);

  return c.json(result);
});

// ============================================================
// POST /extract — 将来用（line_items抽出）
// ============================================================

app.post('/extract', async (c) => {
  return c.json({
    error: 'extract エンドポイントは未実装です。classify確定後に実装予定。',
  }, 501);
});

// ============================================================
// GET /health — パイプラインヘルスチェック
// ============================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    project: process.env['VERTEX_PROJECT_ID'] ?? '(未設定)',
    model: process.env['VERTEX_MODEL_ID'] ?? 'gemini-2.5-flash-preview-04-17',
  });
});

export default app;
