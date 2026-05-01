/**
 * パイプラインAPIルート（Hono）
 *
 * レイヤー: ★route★ → service → postprocess
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   POST /api/pipeline/preview-extract  — Step 0-1: source_type + direction判定（FormData受信）
 *   POST /api/pipeline/extract   — 将来用（line_items抽出）
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 必須, FormData解析失敗, ファイル必須, ファイルサイズ超過, 非対応形式, 未検出, チャンク未検出, 未実装 } from '../helpers/apiMessages';
import { previewExtractImage, clearKnownHashes, isKnownHash } from '../services/pipeline/previewExtract.service';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, appendFileSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/** ファイル本体の永続保存先（data/uploads/{clientId}/{fileName}） */
const UPLOADS_DIR = join(process.cwd(), 'data', 'uploads');

/** ファイルを data/uploads/{clientId}/ に永続保存 */
function saveUploadedFile(clientId: string, fileName: string, buffer: Buffer): string {
  const clientDir = join(UPLOADS_DIR, clientId);
  if (!existsSync(clientDir)) {
    mkdirSync(clientDir, { recursive: true });
  }
  // ファイル名衝突回避: タイムスタンプ付与
  const ts = Date.now();
  const safeName = `${ts}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = join(clientDir, safeName);
  writeFileSync(filePath, buffer);
  console.log(`[pipeline] ファイル永続保存: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return safeName;
}

const app = new Hono();

// ============================================================
// サーバー並列制御（セマフォ）
// SHA-256 → base64変換 → Gemini APIを1タスクとして制御
// ============================================================

const CONCURRENCY_SERVER = 4; // 同時処理数（サーバー側）
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
// POST /preview-extract — Step 0-1: 証票種別 + 仕訳方向判定（FormData受信）
// ============================================================

app.post('/preview-extract', async (c) => {
  console.log('[pipeline/route] POST /preview-extract 受信');

  // FormData受信（Fileオブジェクトとして受け取る）
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return apiError(c, 400, FormData解析失敗);
  }

  const file = formData.get('file');
  const mimeType = formData.get('mimeType') as string | null;
  const clientId = formData.get('clientId') as string | null;
  const filename = formData.get('filename') as string | null;

  // バリデーション
  if (!file || !(file instanceof File)) {
    return apiError(c, 400, ファイル必須);
  }
  if (!mimeType) {
    return apiError(c, 400, 必須('mimeType'));
  }
  if (!clientId) {
    return apiError(c, 400, 必須('clientId'));
  }

  // MIMEタイプホワイトリスト（Geminiコスト防御）
  const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp',
    'application/pdf',
  ];
  if (!ALLOWED_MIME.includes(mimeType.toLowerCase())) {
    return apiError(c, 400, 非対応形式(mimeType));
  }

  // ファイルサイズ制限（サーバー側でも二重チェック）
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return apiError(c, 413, ファイルサイズ超過);
  }

  // セマフォで並列制御（SHA-256 + base64 + Gemini = 1タスク）
  const result = await withSemaphore(async () => {
    // ファイルバイナリ取得
    const buffer = Buffer.from(await file.arrayBuffer());

    // SHA-256ハッシュ計算（サーバー側で実施）
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    // ファイル本体を永続保存（data/uploads/{clientId}/）
    // ブラウザのFileオブジェクトは処理完了後にGCされるため、サーバーに残す
    const actualName = filename ?? file.name ?? 'unknown';
    const savedName = saveUploadedFile(clientId, actualName, buffer);
    const fileUrl = `/api/pipeline/file/${clientId}/${savedName}`;

    // base64変換（サーバー側で実施。Gemini APIがbase64を要求するため）
    const base64 = buffer.toString('base64');

    // タイムアウト付きでpreviewExtractImage呼出（30秒）
    const timeoutMs = 30_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API タイムアウト（${timeoutMs / 1000}秒）`)), timeoutMs)
    );

    const previewExtractResult = await Promise.race([
      previewExtractImage({
        image: base64,
        mimeType,
        clientId,
        filename: actualName,
        fileHash,
      }),
      timeoutPromise,
    ]);

    // previewExtractResultにfileUrlを付与して返す
    return { ...previewExtractResult, fileUrl };
  });

  return c.json(result);
});

// ============================================================
// POST /upload — 軽量アップロード（AI分類なし。ハッシュ+重複検出のみ）
// スマホ版デフォルト。Supabase移行時はStorage APIに差し替え
// ============================================================

app.post('/upload', async (c) => {
  console.log('[pipeline/route] POST /upload 受信');

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return apiError(c, 400, FormData解析失敗);
  }

  const file = formData.get('file');
  const clientId = formData.get('clientId') as string | null;
  const documentId = formData.get('documentId') as string | null;
  const filename = formData.get('filename') as string | null;

  if (!file || !(file instanceof File)) {
    return apiError(c, 400, ファイル必須);
  }
  if (!clientId) {
    return apiError(c, 400, 必須('clientId'));
  }

  // ファイルサイズ制限（10MB）
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return apiError(c, 413, ファイルサイズ超過);
  }

  // ファイルバイナリ取得 + SHA-256ハッシュ
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = createHash('sha256').update(buffer).digest('hex');

  // サーバー側サムネイル生成（sharp 200px JPEG。スマホのデコード負荷ゼロ）
  let thumbnail: string | null = null;
  const mimeType = file.type || '';
  if (mimeType.startsWith('image/')) {
    try {
      const sharp = (await import('sharp')).default;
      const thumbBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
    } catch (err) {
      console.warn(`[pipeline/upload] サムネイル生成失敗: ${err}`);
    }
  }

  // 重複検出（既存ハッシュと照合）
  const isDuplicate = isKnownHash(fileHash);

  // ファイル本体を永続保存（data/uploads/{clientId}/）
  const actualName = filename ?? file.name ?? 'unknown';
  const savedName = saveUploadedFile(clientId, actualName, buffer);
  const fileUrl = `/api/pipeline/file/${clientId}/${savedName}`;
  console.log(`[pipeline/upload] ${actualName} (${(file.size / 1024).toFixed(0)}KB) hash=${fileHash.slice(0, 12)}... docId=${documentId ?? '(なし)'} thumb=${thumbnail ? `${(thumbnail.length / 1024).toFixed(1)}KB` : 'なし'} dup=${isDuplicate} saved=${savedName}`);

  return c.json({
    ok: true,
    fileHash,
    filename: actualName,
    sizeBytes: file.size,
    clientId,
    documentId,
    thumbnail,
    isDuplicate,
    fileUrl,
  });
});

// ============================================================
// チャンクアップロード（モバイルクラッシュ防止）
// File.slice(512KB)で分割送信 → メモリスパイク最大512KB
// ============================================================

/** チャンク一時保存ディレクトリ */
const UPLOAD_TMP = join(tmpdir(), 'receipt-app-chunks');

/**
 * POST /upload-chunk — チャンク受信→ディスク追記
 * Headers: X-Upload-Id（documentId）, Content-Type: application/octet-stream
 */
app.post('/upload-chunk', async (c) => {
  const uploadId = c.req.header('X-Upload-Id');
  if (!uploadId) {
    return apiError(c, 400, 必須('X-Upload-Id'));
  }

  // 一時ディレクトリ作成（初回のみ）
  if (!existsSync(UPLOAD_TMP)) {
    mkdirSync(UPLOAD_TMP, { recursive: true });
  }

  const chunk = Buffer.from(await c.req.arrayBuffer());
  const tmpPath = join(UPLOAD_TMP, uploadId);
  appendFileSync(tmpPath, chunk);

  return c.json({ ok: true, received: chunk.length });
});

/**
 * POST /upload-complete — 全チャンク結合 → ハッシュ + サムネイル + 重複検出
 * Body: { uploadId, filename, documentId, clientId }
 * Response: { fileHash, thumbnail, isDuplicate, ... }（既存uploadと同じ形式）
 */
app.post('/upload-complete', async (c) => {
  const body = await c.req.json();
  const { uploadId, filename, documentId, clientId } = body;

  if (!uploadId) {
    return apiError(c, 400, 必須('uploadId'));
  }

  const tmpPath = join(UPLOAD_TMP, uploadId);
  if (!existsSync(tmpPath)) {
    return apiError(c, 404, チャンク未検出);
  }

  // ファイル読み込み（全チャンク結合済み）
  const fileBuffer = readFileSync(tmpPath);

  // SHA-256ハッシュ計算
  const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

  // サムネイル生成（sharp 200px JPEG）
  let thumbnail: string | null = null;
  const ext = (filename || '').split('.').pop()?.toLowerCase() ?? '';
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'tiff'];
  if (imageExts.includes(ext)) {
    try {
      const sharp = (await import('sharp')).default;
      const thumbBuffer = await sharp(fileBuffer)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
    } catch (err) {
      console.warn(`[pipeline/upload-complete] サムネイル生成失敗: ${err}`);
    }
  }

  // 重複検出
  const isDuplicate = isKnownHash(fileHash);

  // ファイル本体を永続保存（data/uploads/{clientId}/）
  let savedName = '';
  let fileUrl = '';
  if (clientId) {
    savedName = saveUploadedFile(clientId, filename || 'unknown', fileBuffer);
    fileUrl = `/api/pipeline/file/${clientId}/${savedName}`;
  }

  // 一時ファイル削除（永続保存後）
  try { unlinkSync(tmpPath); } catch { /* 無視（既に削除済み等） */ }

  console.log(`[pipeline/upload-complete] ${filename} (${(fileBuffer.length / 1024).toFixed(0)}KB) hash=${fileHash.slice(0, 12)}... docId=${documentId ?? '(なし)'} thumb=${thumbnail ? `${(thumbnail.length / 1024).toFixed(1)}KB` : 'なし'} dup=${isDuplicate} saved=${savedName}`);

  return c.json({
    ok: true,
    fileHash,
    filename,
    sizeBytes: fileBuffer.length,
    clientId,
    documentId,
    thumbnail,
    isDuplicate,
    fileUrl,
  });
});

// ============================================================
// POST /extract — 将来用（line_items抽出）
// ============================================================

app.post('/extract', async (c) => {
  return apiError(c, 501, 未実装('extract エンドポイント'));
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
// POST /metrics — クライアント側パフォーマンス計測結果受信
// ============================================================

app.post('/metrics', async (c) => {
  const data = await c.req.json();
  if (data.mode === 'checkpoint') {
    // チェックポイント（クラッシュ地点特定用）
    const extras = Object.entries(data)
      .filter(([k]) => !['mode', 'fileName', 'memMB', 'ts'].includes(k))
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    console.log(`[checkpoint] ${data.fileName} | mem=${data.memMB ?? '-'}MB | ${extras}`);
  } else if (String(data.mode).startsWith('batch_')) {
    // バッチ壁時計
    console.log(`[metrics] ${data.mode} | ${data.fileName} | 壁時計=${data.totalMs ?? '?'}ms mem=${data.memMB ?? '-'}MB | ua=${data.ua ?? '-'}`);
  } else {
    // 1枚単位メトリクス
    console.log(`[metrics] ${data.mode ?? '?'} | ${data.fileName ?? '?'} | 合計=${data.totalMs ?? '?'}ms hash=${data.hashMs ?? '-'}ms upload=${data.uploadMs ?? '-'}ms api=${data.apiMs ?? '-'}ms dup=${data.isDuplicate ?? '-'} mem=${data.memMB ?? '-'}MB`);
  }
  return c.json({ ok: true });
});

// ============================================================
// DELETE /hashes — 重複ハッシュ記録クリア（テスト・リセット用）
// ============================================================

app.delete('/hashes', (c) => {
  clearKnownHashes();
  console.log('[pipeline/route] 重複ハッシュ記録をクリアしました');
  return c.json({ status: 'ok', message: '重複ハッシュ記録をクリアしました' });
});

// ============================================================
// GET /file/:clientId/:fileName — 保存済みファイル提供（プレビュー用）
// ============================================================

app.get('/file/:clientId/:fileName', (c) => {
  const clientIdParam = c.req.param('clientId');
  const fileNameParam = c.req.param('fileName');
  const filePath = join(UPLOADS_DIR, clientIdParam, fileNameParam);

  if (!existsSync(filePath)) {
    return apiError(c, 404, 未検出('ファイル'));
  }

  const buffer = readFileSync(filePath);

  // 拡張子からContent-Type推定
  const ext = fileNameParam.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
    heic: 'image/heic', heif: 'image/heif', tiff: 'image/tiff',
    pdf: 'application/pdf', csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

export default app;
