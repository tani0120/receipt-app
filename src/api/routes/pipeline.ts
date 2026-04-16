/**
 * パイプラインAPIルート（Hono）
 *
 * レイヤー: ★route★ → service → postprocess
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   POST /api/pipeline/classify  — Step 0-1: source_type + direction判定（FormData受信）
 *   POST /api/pipeline/extract   — 将来用（line_items抽出）
 */

import { Hono } from 'hono';
import { classifyImage, clearKnownHashes } from '../services/pipeline/classify.service';
import { createHash } from 'crypto';

const app = new Hono();

// ============================================================
// サーバー並列制御（セマフォ）
// SHA-256 → base64変換 → Gemini APIを1タスクとして制御
// ============================================================

const CONCURRENCY_SERVER = 2; // 同時処理数（サーバー側）
let activeCount = 0;
const waitQueue: Array<() => void> = [];

async function withSemaphore<T>(fn: () => Promise<T>): Promise<T> {
  if (activeCount >= CONCURRENCY_SERVER) {
    // キューに入れて待機
    await new Promise<void>(resolve => waitQueue.push(resolve));
  }
  activeCount++;
  try {
    return await fn();
  } finally {
    activeCount--;
    const next = waitQueue.shift();
    if (next) next();
  }
}

// ============================================================
// POST /classify — Step 0-1: 証票種別 + 仕訳方向判定（FormData受信）
// ============================================================

app.post('/classify', async (c) => {
  console.log('[pipeline/route] POST /classify 受信');

  // FormData受信（Fileオブジェクトとして受け取る）
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'FormDataの解析に失敗しました' }, 400);
  }

  const file = formData.get('file');
  const mimeType = formData.get('mimeType') as string | null;
  const clientId = formData.get('clientId') as string | null;
  const filename = formData.get('filename') as string | null;

  // バリデーション
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'file（ファイル）は必須です' }, 400);
  }
  if (!mimeType) {
    return c.json({ error: 'mimeTypeは必須です' }, 400);
  }
  if (!clientId) {
    return c.json({ error: 'clientIdは必須です' }, 400);
  }

  // MIMEタイプホワイトリスト（Geminiコスト防御）
  const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp',
    'application/pdf',
  ];
  if (!ALLOWED_MIME.includes(mimeType.toLowerCase())) {
    return c.json({
      error: `対応していないファイル形式です（${mimeType}）。画像またはPDFのみ処理可能です`,
    }, 400);
  }

  // ファイルサイズ制限（サーバー側でも二重チェック）
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return c.json({
      error: `ファイルサイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB）。10MB以下にしてください`,
    }, 400);
  }

  // セマフォで並列制御（SHA-256 + base64 + Gemini = 1タスク）
  const result = await withSemaphore(async () => {
    // ファイルバイナリ取得
    const buffer = Buffer.from(await file.arrayBuffer());

    // SHA-256ハッシュ計算（サーバー側で実施）
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    // base64変換（サーバー側で実施。Gemini APIがbase64を要求するため）
    const base64 = buffer.toString('base64');

    // タイムアウト付きでclassifyImage呼出（30秒）
    const timeoutMs = 30_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API タイムアウト（${timeoutMs / 1000}秒）`)), timeoutMs)
    );

    return Promise.race([
      classifyImage({
        image: base64,
        mimeType,
        clientId,
        filename: filename ?? file.name ?? 'unknown',
        fileHash,
      }),
      timeoutPromise,
    ]);
  });

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

// ============================================================
// DELETE /hashes — 重複ハッシュ記録クリア（テスト・リセット用）
// ============================================================

app.delete('/hashes', (c) => {
  clearKnownHashes();
  console.log('[pipeline/route] 重複ハッシュ記録をクリアしました');
  return c.json({ status: 'ok', message: '重複ハッシュ記録をクリアしました' });
});

export default app;
