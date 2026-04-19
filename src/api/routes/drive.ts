/**
 * drive.ts — Google Drive APIルート（Hono）
 *
 * レイヤー: ★route★ → driveService
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/drive/files    — 顧問先フォルダのファイル一覧取得
 *   POST /api/drive/folder   — 顧問先フォルダ作成（新規登録時）
 *   POST /api/drive/process  — 選択ファイルのDL+ハッシュ+サムネイル+AI分類
 */

import { Hono } from 'hono';
import { listDriveFiles, downloadAndProcessDriveFile, createDriveFolder, checkFolderExists, shareFolderWithEmail, trashDriveFile } from '../services/drive/driveService';
import { isKnownHash } from '../services/pipeline/classify.service';

const app = new Hono();

// ============================================================
// GET /files — 顧問先フォルダのファイル一覧取得
// ============================================================

app.get('/files', async (c) => {
  const folderId = c.req.query('folderId');
  const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;

  if (!folderId) {
    return c.json({ error: 'folderId クエリパラメータが必要です' }, 400);
  }
  if (!sharedDriveId) {
    return c.json({ error: 'VITE_SHARED_DRIVE_ID 環境変数が未設定です' }, 500);
  }

  try {
    const files = await listDriveFiles(folderId, sharedDriveId);
    console.log(`[drive/route] GET /files: ${files.length}件返却`);
    return c.json({ files });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drive/route] GET /files エラー:`, msg);
    return c.json({ error: `ファイル一覧取得失敗: ${msg}` }, 500);
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
      );

      // 重複チェック（既知ハッシュと照合）
      const isDuplicate = isKnownHash(result.fileHash);

      results.push({
        fileId: file.fileId,
        filename: result.filename,
        fileHash: result.fileHash,
        sizeBytes: result.sizeBytes,
        thumbnail: result.thumbnail,
        mimeType: result.mimeType,
        isDuplicate,
      });

      // 取り込み成功 → Driveのファイルをゴミ箱に移動（データ消失防止: 失敗時は移動しない）
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

export default app;
