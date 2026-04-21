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
 *   POST /api/drive/process          — 選択ファイルのDL+ハッシュ+サムネイル+AI分類（→Phase Fで廃止予定）
 */

import { Hono } from 'hono';
import { listDriveFiles, getFilesWithThumbnails, getFilePreview, uploadToDrive, downloadAndProcessDriveFile, createDriveFolder, renameDriveFolder, checkFolderExists, shareFolderWithEmail, trashDriveFile } from '../services/drive/driveService';
import { isKnownHash } from '../services/pipeline/classify.service';
import { addDocuments } from '../services/documentStore';
import { enqueueMigrationJobs, getJobStatus, getExcludedCount } from '../services/migration/migrationRepository';
import { generateExcludedZip } from '../services/migration/excludedZipService';
import type { DocEntry } from '../../repositories/types';

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
    return c.json({ error: 'folderId クエリパラメータが必要です' }, 400);
  }
  if (!sharedDriveId) {
    return c.json({ error: 'VITE_SHARED_DRIVE_ID 環境変数が未設定です' }, 500);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] GET /files エラー:`, msg);
    return c.json({ error: `ファイル一覧取得失敗: ${msg}` }, 500);
  }
});

// ============================================================
// GET /preview/:fileId — フルサイズプレビュー（Phase A-4）
// オンデマンドで1枚DL。Content-Type付きバイナリ返却。
// ============================================================

app.get('/preview/:fileId', async (c) => {
  const fileId = c.req.param('fileId');

  try {
    const result = await getFilePreview(fileId);

    // キャッシュヘッダー: Drive上のファイルは変更されない前提
    c.header('Cache-Control', 'private, max-age=3600');
    c.header('Content-Type', result.mimeType);
    c.header('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);

    // Honoのc.body()はBuffer非対応のため、Uint8Arrayで渡す
    return c.body(new Uint8Array(result.buffer));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as { code?: number }).code;
    if (status === 404) {
      return c.json({ error: `ファイルが見つかりません: ${fileId}` }, 404);
    }
    console.error(`[drive/route] GET /preview/${fileId} エラー:`, msg);
    return c.json({ error: `プレビュー取得失敗: ${msg}` }, 500);
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
      return c.json({ error: 'file が必要です' }, 400);
    }
    if (!folderId) {
      return c.json({ error: 'folderId が必要です' }, 400);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[drive/route] POST /upload エラー:', msg);
    return c.json({ error: `アップロード失敗: ${msg}` }, 500);
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
      return c.json({ error: 'clientId と files が必要です' }, 400);
    }

    // jobId生成（タイムスタンプ + ランダム）
    const jobId = `mig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const queued = await enqueueMigrationJobs(jobId, body.clientId, body.files);

    console.log(`[drive/route] POST /migrate: jobId=${jobId}, queued=${queued}/${body.files.length}`);
    return c.json({ jobId, queued });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[drive/route] POST /migrate エラー:', msg);
    return c.json({ error: `移行ジョブ登録失敗: ${msg}` }, 500);
  }
});

// ============================================================
// GET /migrate/status/:jobId — 移行ジョブステータス照会（Phase D-3）
// ============================================================

app.get('/migrate/status/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    if (!jobId) {
      return c.json({ error: 'jobId が必要です' }, 400);
    }

    const status = await getJobStatus(jobId);
    return c.json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] GET /migrate/status エラー:`, msg);
    return c.json({ error: `ステータス取得失敗: ${msg}` }, 500);
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
      return c.json({ error: 'clientId が必要です' }, 400);
    }

    // 0件チェック（Streamを作る前に確認）
    const count = await getExcludedCount(clientId);
    if (!all && count === 0) {
      return c.json({ error: '未ダウンロードの仕訳外ファイルがありません', count: 0 }, 404);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[drive/route] GET /download-excluded エラー:', msg);
    return c.json({ error: `ZIPダウンロード失敗: ${msg}` }, 500);
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
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================================
// POST /folder — 顧問先フォルダ作成（新規登録時に共有ドライブ内にフォルダを自動作成）
// ============================================================

app.post('/folder', async (c) => {
  const body = await c.req.json<{ folderName: string; sharedEmail?: string }>();
  const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;

  if (!body.folderName) {
    return c.json({ error: 'folderName が必要です' }, 400);
  }
  if (!sharedDriveId) {
    return c.json({ error: 'VITE_SHARED_DRIVE_ID 環境変数が未設定です' }, 500);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] POST /folder エラー:`, msg);
    return c.json({ error: `フォルダ作成失敗: ${msg}` }, 500);
  }
});

// ============================================================
// GET /folder/check — フォルダ存在確認（削除済み検知）
// ============================================================

app.get('/folder/check', async (c) => {
  const folderId = c.req.query('folderId');

  if (!folderId) {
    return c.json({ error: 'folderId クエリパラメータが必要です' }, 400);
  }

  try {
    const result = await checkFolderExists(folderId);
    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] GET /folder/check エラー:`, msg);
    return c.json({ error: `フォルダ確認失敗: ${msg}` }, 500);
  }
});

// ============================================================
// PATCH /folder/rename — フォルダリネーム（3コード変更時）
// ============================================================

app.patch('/folder/rename', async (c) => {
  const body = await c.req.json<{ folderId: string; newName: string }>();

  if (!body.folderId || !body.newName) {
    return c.json({ error: 'folderId と newName が必要です' }, 400);
  }

  try {
    await renameDriveFolder(body.folderId, body.newName);
    console.log(`[drive/route] PATCH /folder/rename: ${body.newName} (id=${body.folderId})`);
    return c.json({ success: true, newName: body.newName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] PATCH /folder/rename エラー:`, msg);
    return c.json({ error: `フォルダリネーム失敗: ${msg}` }, 500);
  }
});

// ============================================================
// POST /process — 選択ファイルのDL+ハッシュ+サムネイル生成
// ============================================================

interface DriveProcessRequest {
  /** 処理対象のファイルID配列 */
  files: Array<{
    fileId: string;
    filename: string;
    mimeType: string;
  }>;
  /** 顧問先ID */
  clientId: string;
}

interface DriveProcessResultItem {
  fileId: string;
  filename: string;
  fileHash: string;
  sizeBytes: number;
  thumbnail: string | null;
  mimeType: string;
  isDuplicate: boolean;
}

app.post('/process', async (c) => {
  const body = await c.req.json<DriveProcessRequest>();

  if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
    return c.json({ error: 'files 配列が空です' }, 400);
  }

  console.log(`[drive/route] POST /process: ${body.files.length}件処理開始 (clientId=${body.clientId})`);

  const results: DriveProcessResultItem[] = [];
  const errors: Array<{ fileId: string; error: string }> = [];

  // 逐次処理（サーバーメモリ保護。並列はDrive APIレート制限にも配慮）
  for (const file of body.files) {
    try {
      const result = await downloadAndProcessDriveFile(
        file.fileId,
        file.filename,
        file.mimeType,
        body.clientId,
      );

      // 重複チェック（既知ハッシュと照合）
      const isDuplicate = isKnownHash(result.fileHash);

      const item = {
        fileId: file.fileId,
        filename: result.filename,
        fileHash: result.fileHash,
        sizeBytes: result.sizeBytes,
        thumbnail: result.thumbnail,
        mimeType: result.mimeType,
        isDuplicate,
        localPath: result.localPath,
      };
      results.push(item);

      // documentStoreに保存（ゴミ箱移動より先。リロードでデータ消失を防止）
      const docEntry: DocEntry = {
        id: `drive-${file.fileId}-${Date.now()}`,
        clientId: body.clientId,
        source: 'drive',
        fileName: result.filename,
        fileType: result.mimeType,
        fileSize: result.sizeBytes,
        fileHash: result.fileHash,
        driveFileId: file.fileId,
        thumbnailUrl: result.thumbnail,
        previewUrl: result.localPath,
        status: 'pending',
        receivedAt: new Date().toISOString(),
        batchId: null,
        journalId: null,
        createdBy: null,
        updatedBy: null,
        updatedAt: null,
        statusChangedBy: null,
        statusChangedAt: null,
      };
      addDocuments([docEntry]);

      // documentStore保存済み → Driveのファイルをゴミ箱に移動
      try {
        await trashDriveFile(file.fileId);
      } catch (trashErr) {
        const trashMsg = trashErr instanceof Error ? trashErr.message : String(trashErr);
        console.warn(`[drive/route] ゴミ箱移動失敗 (${file.filename}): ${trashMsg}（取り込みは成功済み）`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[drive/route] ファイル処理失敗 (${file.filename}):`, msg);
      errors.push({ fileId: file.fileId, error: msg });
    }
  }

  console.log(
    `[drive/route] POST /process 完了: 成功=${results.length} 失敗=${errors.length}`,
  );

  return c.json({
    results,
    errors,
    totalProcessed: results.length,
    totalErrors: errors.length,
  });
});

// ============================================================
// POST /grant-permission — ゲストにDrive共有フォルダの権限を付与
// Googleログイン成功後にフロントから呼び出し
// ============================================================

app.post('/grant-permission', async (c) => {
  const body = await c.req.json<{ folderId: string; email: string; role?: 'reader' | 'writer' }>();

  if (!body.folderId || !body.email) {
    return c.json({ error: 'folderIdとemailは必須です' }, 400);
  }

  try {
    const { grantFolderPermission } = await import('../services/drive/driveService');
    await grantFolderPermission(body.folderId, body.email, body.role ?? 'writer');
    console.log(`[drive/route] POST /grant-permission: ${body.email} → ${body.folderId.slice(0, 12)}...`);
    return c.json({ ok: true, email: body.email, role: body.role ?? 'writer' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] POST /grant-permission エラー:`, msg);
    return c.json({ error: `権限付与失敗: ${msg}` }, 500);
  }
});

export default app;
