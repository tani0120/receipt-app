/**
 * drive.ts — Google Drive APIルート（Hono）
 *
 * レイヤー: ★route★ → driveService
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/drive/files            — 顧問先フォルダのファイル一覧取得（?withThumbnails=trueでサムネイルbase64付き）
 *   GET  /api/drive/preview/:fileId  — フルサイズプレビュー（Phase A-4）
 *   POST /api/drive/folder           — 顧問先フォルダ作成（新規登録時）
 *   POST /api/drive/upload           — PC D&D→Drive APIアップロード（Phase C）
 *   GET  /api/drive/download-excluded/:clientId — 仕訳外ZIPダウンロード（Phase E-2）
 */

import { Hono } from 'hono';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { apiError, apiCatchError } from '../helpers/apiError';
import { 必須, 未検出, 環境設定エラー, ファイル必須, 仕訳外ゼロ } from '../helpers/apiMessages';
import { listDriveFiles, getFilesWithThumbnails, getFilePreview, uploadToDrive, createDriveFolder, renameDriveFolder, checkFolderExists, shareFolderWithEmail, revokeFolderPermission } from '../services/drive/driveService';
import { enqueueMigrationJobs, getJobStatus, getExcludedCount } from '../services/migration/migrationRepository';
import { generateExcludedZip } from '../services/migration/excludedZipService';

const app = new Hono();

// ============================================================
// GET /files — 顧問先フォルダのファイル一覧取得
// ?withThumbnails=true でサムネイルbase64埋め込み（Phase A-2）
// ============================================================

app.get('/files', async (c) => {
  const folderId = c.req.query('folderId');
  const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;
  const withThumbnails = c.req.query('withThumbnails') === 'true';

  if (!folderId) {
    return apiError(c, 400, 必須('folderId'));
  }
  if (!sharedDriveId) {
    return apiError(c, 500, 環境設定エラー);
  }

  try {
    if (withThumbnails) {
      // Phase A-2: サムネイルbase64埋め込み付き（Drive借景方式）
      const files = await getFilesWithThumbnails(folderId, sharedDriveId);
      console.log(`[drive/route] GET /files (withThumbnails): ${files.length}件返却`);
      return c.json({ files });
    } else {
      // 従来動作: メタデータのみ（既存のフロント呼び出しに影響なし）
      const files = await listDriveFiles(folderId, sharedDriveId);
      console.log(`[drive/route] GET /files: ${files.length}件返却`);
      return c.json({ files });
    }
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /preview/:fileId — フルサイズプレビュー（Phase A-4）
// オンデマンドで1枚DL。ローカルキャッシュ付き（2回目以降は即返却）。
// ?clientId=xxx でキャッシュディレクトリを分離
// HEIC/HEIF/TIFF はブラウザ非対応のためサーバー側でJPEGに変換
// ============================================================

import sharp from 'sharp';

/** プレビューキャッシュディレクトリ */
const CACHE_DIR = join(process.cwd(), 'data', 'uploads', 'drive-cache');

/** ブラウザ非対応MIMEの判定 */
const NEEDS_CONVERSION = new Set(['image/heic', 'image/heif', 'image/tiff']);

/** 拡張子を推定（MIMEタイプから） */
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'application/pdf': '.pdf',
  };
  return map[mime] || '.bin';
}

/** 拡張子→MIMEタイプ */
const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', pdf: 'application/pdf',
};

/** HEIC/HEIF/TIFFをJPEGに変換（sharpを使用） */
async function convertToJpeg(inputBuffer: Buffer | ArrayBuffer): Promise<{ buffer: Buffer; mimeType: string }> {
  const buf = inputBuffer instanceof Buffer ? inputBuffer : new Uint8Array(inputBuffer);
  const output = await sharp(buf)
    .jpeg({ quality: 90 })
    .toBuffer();
  return { buffer: output, mimeType: 'image/jpeg' };
}

app.get('/preview/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const clientId = c.req.query('clientId') || '_shared';

  // キャッシュディレクトリ確保
  const clientCacheDir = join(CACHE_DIR, clientId);
  if (!existsSync(clientCacheDir)) mkdirSync(clientCacheDir, { recursive: true });

  // キャッシュ検索（fileIdベースのファイル名）
  const cacheFiles = existsSync(clientCacheDir)
    ? readdirSync(clientCacheDir) as string[]
    : [];
  const cached = cacheFiles.find((f: string) => f.startsWith(fileId));

  if (cached) {
    // キャッシュヒット → ローカルから即返却
    const cachedPath = join(clientCacheDir, cached);
    const buffer = readFileSync(cachedPath);
    const ext = cached.split('.').pop() || '';
    c.header('Cache-Control', 'private, max-age=86400');
    c.header('Content-Type', EXT_TO_MIME[ext] || 'application/octet-stream');
    return c.body(new Uint8Array(buffer));
  }

  // キャッシュミス → Driveからダウンロードしてキャッシュに保存
  try {
    const result = await getFilePreview(fileId);

    let finalBuffer: Buffer;
    let finalMime: string;

    // ブラウザ非対応形式（HEIC/HEIF/TIFF）はJPEGに変換
    if (NEEDS_CONVERSION.has(result.mimeType)) {
      const converted = await convertToJpeg(result.buffer);
      finalBuffer = converted.buffer;
      finalMime = converted.mimeType;
      console.log(`[drive/route] ${result.mimeType} → JPEG変換完了 (${result.fileName})`);
    } else {
      finalBuffer = Buffer.from(result.buffer);
      finalMime = result.mimeType;
    }

    // キャッシュに保存（変換後の拡張子で保存）
    const ext = extFromMime(finalMime);
    const cachePath = join(clientCacheDir, `${fileId}${ext}`);
    writeFileSync(cachePath, finalBuffer);
    console.log(`[drive/route] プレビューキャッシュ保存: ${cachePath}`);

    c.header('Cache-Control', 'private, max-age=86400');
    c.header('Content-Type', finalMime);
    c.header('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);
    return c.body(new Uint8Array(finalBuffer));
  } catch (err) {
    const status = (err as { code?: number }).code;
    if (status === 404) {
      return apiError(c, 404, 未検出('ファイル'));
    }
    return apiCatchError(c, err);
  }
});

// ============================================================
// POST /upload — PC版ファイルアップロード（Phase C-2）
// multipart/form-dataでファイル受信 → Driveに保存
// ============================================================

app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return apiError(c, 400, ファイル必須);
    }
    if (!folderId) {
      return apiError(c, 400, 必須('folderId'));
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToDrive(
      folderId,
      buffer,
      file.name,
      file.type || 'application/octet-stream',
    );

    console.log(`[drive/route] POST /upload: ${file.name} → ${result.driveFileId}`);
    return c.json(result);
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// POST /migrate — 移行ジョブ登録（Phase D-2）
// ジョブ登録のみ。即レスポンス（~200ms）。処理はバックグラウンドワーカーが行う
// ============================================================

app.post('/migrate', async (c) => {
  try {
    const body = await c.req.json<{
      clientId: string;
      files: Array<{ fileId: string; status: string }>;
    }>();

    if (!body.clientId || !body.files || body.files.length === 0) {
      return apiError(c, 400, 必須('clientId と files'));
    }

    // jobId生成（タイムスタンプ + ランダム）
    const jobId = `mig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const queued = await enqueueMigrationJobs(jobId, body.clientId, body.files);

    console.log(`[drive/route] POST /migrate: jobId=${jobId}, queued=${queued}/${body.files.length}`);
    return c.json({ jobId, queued });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /migrate/status/:jobId — 移行ジョブステータス照会（Phase D-3）
// ============================================================

app.get('/migrate/status/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    if (!jobId) {
      return apiError(c, 400, 必須('jobId'));
    }

    const status = await getJobStatus(jobId);
    return c.json(status);
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /download-excluded/:clientId — 仕訳外ZIPダウンロード（Phase E-3/E-4）
// ?all=true でDL済み含む全件。デフォルトは未DLのみ
// ============================================================

app.get('/download-excluded/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const all = c.req.query('all') === 'true';

    if (!clientId) {
      return apiError(c, 400, 必須('clientId'));
    }

    // 0件チェック（Streamを作る前に確認）
    const count = await getExcludedCount(clientId);
    if (!all && count === 0) {
      return apiError(c, 404, 仕訳外ゼロ);
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `excluded_${clientId}_${today}.zip`;

    // Node.jsのWritableストリームとしてレスポンスに書き込む
    const { writable, readable } = new TransformStream();
    const writer = writable.getWriter();

    // ZIPを非同期で生成（バックグラウンド）
    const zipPromise = (async () => {
      const { Writable } = await import('stream');
      const nodeWritable = new Writable({
        async write(chunk, _encoding, callback) {
          try {
            await writer.write(chunk);
            callback();
          } catch (err) {
            callback(err instanceof Error ? err : new Error(String(err)));
          }
        },
        async final(callback) {
          try {
            await writer.close();
            callback();
          } catch (err) {
            callback(err instanceof Error ? err : new Error(String(err)));
          }
        },
      });

      const zipCount = await generateExcludedZip(clientId, nodeWritable, all);
      console.log(`[drive/route] GET /download-excluded: ${clientId}, ${zipCount}件ZIP送出`);
    })();

    zipPromise.catch((err) => {
      console.error('[drive/route] ZIP生成エラー:', err);
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /excluded-count/:clientId — 未DLのexcluded件数（バッジ表示用）
// ============================================================

app.get('/excluded-count/:clientId', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const count = await getExcludedCount(clientId);
    return c.json({ count });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// POST /folder — 顧問先フォルダ作成（新規登録時に共有ドライブ内にフォルダを自動作成）
// ============================================================

app.post('/folder', async (c) => {
  const body = await c.req.json<{ folderName: string; sharedEmail?: string }>();
  const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;

  if (!body.folderName) {
    return apiError(c, 400, 必須('folderName'));
  }
  if (!sharedDriveId) {
    return apiError(c, 500, 環境設定エラー);
  }

  try {
    const folderId = await createDriveFolder(body.folderName, sharedDriveId);
    console.log(`[drive/route] POST /folder: ${body.folderName} (id=${folderId})`);

    // 共有メールが指定されていれば編集者権限を付与
    if (body.sharedEmail) {
      try {
        await shareFolderWithEmail(folderId, body.sharedEmail, 'writer');
        console.log(`[drive/route] 共有権限付与: ${body.sharedEmail}`);
      } catch (shareErr) {
        const shareMsg = shareErr instanceof Error ? shareErr.message : String(shareErr);
        console.error(`[drive/route] 共有権限付与失敗（フォルダ自体は作成済み）: ${shareMsg}`);
        // フォルダ作成は成功しているのでエラーにはしない
      }
    }

    return c.json({ folderId, folderName: body.folderName });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /folder/check — フォルダ存在確認（削除済み検知）
// ============================================================

app.get('/folder/check', async (c) => {
  const folderId = c.req.query('folderId');

  if (!folderId) {
    return apiError(c, 400, 必須('folderId'));
  }

  try {
    const result = await checkFolderExists(folderId);
    return c.json(result);
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// PATCH /folder/rename — フォルダリネーム（3コード変更時）
// ============================================================

app.patch('/folder/rename', async (c) => {
  const body = await c.req.json<{ folderId: string; newName: string }>();

  if (!body.folderId || !body.newName) {
    return apiError(c, 400, 必須('folderId と newName'));
  }

  try {
    await renameDriveFolder(body.folderId, body.newName);
    console.log(`[drive/route] PATCH /folder/rename: ${body.newName} (id=${body.folderId})`);
    return c.json({ success: true, newName: body.newName });
  } catch (err) {
    return apiCatchError(c, err);
  }
});


// ============================================================
// POST /grant-permission — ゲストにDrive共有フォルダの権限を付与
// Googleログイン成功後にフロントから呼び出し
// ============================================================

app.post('/grant-permission', async (c) => {
  const body = await c.req.json<{ folderId: string; email: string; role?: 'reader' | 'writer' }>();

  if (!body.folderId || !body.email) {
    return apiError(c, 400, 必須('folderIdとemail'));
  }

  try {
    const { grantFolderPermission } = await import('../services/drive/driveService');
    await grantFolderPermission(body.folderId, body.email, body.role ?? 'writer');
    console.log(`[drive/route] POST /grant-permission: ${body.email} → ${body.folderId.slice(0, 12)}...`);
    return c.json({ ok: true, email: body.email, role: body.role ?? 'writer' });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// POST /revoke-permission — Drive共有フォルダの権限を削除
// 共有停止時にフロントから呼び出し
// ============================================================

app.post('/revoke-permission', async (c) => {
  const body = await c.req.json<{ folderId: string; email: string }>();

  if (!body.folderId || !body.email) {
    return apiError(c, 400, 必須('folderIdとemail'));
  }

  try {
    await revokeFolderPermission(body.folderId, body.email);
    console.log(`[drive/route] POST /revoke-permission: ${body.email} → ${body.folderId.slice(0, 12)}...`);
    return c.json({ ok: true, email: body.email });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

export default app;
