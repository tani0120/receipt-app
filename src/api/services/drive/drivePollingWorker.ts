/**
 * drivePollingWorker.ts — Driveフォルダ定期ポーリングワーカー
 *
 * 責務:
 *   - setInterval(3600000) で1時間ごとに全顧問先のDriveフォルダをチェック
 *   - 新規ファイルをdoc-storeに自動登録
 *   - sharedFolderIdが設定されている顧問先のみ対象
 *   - 10社ずつチャンク処理（Drive APIレート制限対策）
 *   - 重複排除はaddDocuments()の既存ロジック（driveFileId照合）に委任
 *
 * 設計書準拠:
 *   docs/genzai/24_upload_drive_integration.md セクション9-7
 *   「本番: 1時間に1回バッチでDrive/独自を確認 → 新規資料を取り込み」
 */

import { getAll as getAllClients } from '../clientsApi';
import { listDriveFiles, downloadAndProcessDriveFile } from './driveService';
import { addDocuments, getDocuments } from '../documentsApi';
import type { DocEntry, DocSource, DocStatus } from '../../../repositories/types';

/** ポーリング間隔（ミリ秒）: 1時間 */
const ポーリング間隔 = 60 * 60 * 1000;

/** チャンクサイズ: 10社ずつ処理 */
const チャンクサイズ = 10;

/** チャンク間待機（ミリ秒） */
const チャンク間待機 = 1000;

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _processing = false;

// ===== 1社分の処理 =====

interface ポーリング結果 {
  clientId: string;
  companyName: string;
  新規件数: number;
  スキップ件数: number;
  エラー: string | null;
}

/**
 * 1社のDriveフォルダをチェックし、新規ファイルをdoc-storeに登録
 */
async function pollOneClient(
  clientId: string,
  companyName: string,
  sharedFolderId: string,
  sharedDriveId: string,
): Promise<ポーリング結果> {
  try {
    // Drive APIでファイル一覧取得（サムネイルなし。メタデータのみ）
    const driveFiles = await listDriveFiles(sharedFolderId, sharedDriveId);

    if (driveFiles.length === 0) {
      return { clientId, companyName, 新規件数: 0, スキップ件数: 0, エラー: null };
    }

    // 既存doc-storeのdriveFileIdを取得（重複チェック用）
    const existingDocs = getDocuments(clientId);
    const existingDriveIds = new Set(
      existingDocs.map(d => d.driveFileId).filter(Boolean),
    );

    // 新規ファイルのみDocEntryに変換（DLしてfileHashを取得）
    const newDocs: DocEntry[] = [];
    for (const f of driveFiles) {
      if (existingDriveIds.has(f.id)) continue;

      // Drive APIでファイルDL + SHA-256ハッシュ計算
      let fileHash: string | null = null;
      let fileSize = f.size || 0;
      let previewUrl = `/api/drive/preview/${f.id}?clientId=${encodeURIComponent(clientId)}`;
      try {
        const dlResult = await downloadAndProcessDriveFile(f.id, f.name, f.mimeType || 'application/octet-stream', clientId);
        fileHash = dlResult.fileHash;
        fileSize = dlResult.sizeBytes;
        previewUrl = dlResult.localPath;
      } catch (err) {
        console.warn(`[drivePollingWorker] DL失敗(${f.name}):`, err instanceof Error ? err.message : err);
      }

      newDocs.push({
        id: f.id,
        clientId,
        source: 'drive' as DocSource,
        fileName: f.name,
        fileType: f.mimeType || 'application/octet-stream',
        fileSize,
        fileHash,
        driveFileId: f.id,
        thumbnailUrl: `/api/drive/preview/${f.id}?clientId=${encodeURIComponent(clientId)}`,
        previewUrl,
        status: 'pending' as DocStatus,
        receivedAt: f.createdTime || new Date().toISOString(),
        batchId: null,
        journalId: null,
        createdBy: 'system-polling',
        updatedBy: null,
        updatedAt: null,
        statusChangedBy: null,
        statusChangedAt: null,
      });
    }

    if (newDocs.length === 0) {
      return { clientId, companyName, 新規件数: 0, スキップ件数: driveFiles.length, エラー: null };
    }

    // doc-storeに登録（addDocumentsが内部で重複排除）
    const result = addDocuments(newDocs);

    return {
      clientId,
      companyName,
      新規件数: result.added,
      スキップ件数: result.skipped,
      エラー: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { clientId, companyName, 新規件数: 0, スキップ件数: 0, エラー: msg };
  }
}

// ===== ワーカーループ =====

async function tick(): Promise<void> {
  if (_processing) return;
  _processing = true;

  try {
    const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;
    if (!sharedDriveId) {
      console.warn('[drivePollingWorker] VITE_SHARED_DRIVE_ID未設定。スキップ');
      return;
    }

    // sharedFolderIdがある顧問先を抽出
    const allClients = getAllClients();
    const targets = allClients.filter(c => c.sharedFolderId);

    if (targets.length === 0) {
      console.log('[drivePollingWorker] sharedFolderId設定済み顧問先なし。スキップ');
      return;
    }

    console.log(`[drivePollingWorker] ポーリング開始: ${targets.length}社`);
    const t0 = Date.now();

    let 合計新規 = 0;
    let 合計エラー = 0;

    // チャンク分割で処理
    for (let i = 0; i < targets.length; i += チャンクサイズ) {
      const chunk = targets.slice(i, i + チャンクサイズ);

      // チャンク内は逐次処理（Drive APIレート制限対策）
      for (const client of chunk) {
        const result = await pollOneClient(
          client.clientId,
          client.companyName,
          client.sharedFolderId,
          sharedDriveId,
        );

        if (result.エラー) {
          合計エラー++;
          console.error(
            `[drivePollingWorker] エラー: ${result.companyName} (${result.clientId}): ${result.エラー}`,
          );
        } else if (result.新規件数 > 0) {
          合計新規 += result.新規件数;
          console.log(
            `[drivePollingWorker] ${result.companyName}: ${result.新規件数}件新規登録`,
          );
        }
      }

      // チャンク間待機（最後のチャンク以外）
      if (i + チャンクサイズ < targets.length) {
        await new Promise(r => setTimeout(r, チャンク間待機));
      }
    }

    const elapsed = Date.now() - t0;
    console.log(
      `[drivePollingWorker] ポーリング完了: ${targets.length}社`
      + ` (新規${合計新規}件, エラー${合計エラー}件, ${elapsed}ms)`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[drivePollingWorker] tick エラー:`, msg);
  } finally {
    _processing = false;
  }
}

// ===== 手動トリガー =====

/**
 * 特定の顧問先のDriveフォルダを手動で再チェック
 * 資料選別画面の「再取得」ボタンから呼び出す
 */
export async function pollSingleClient(
  clientId: string,
): Promise<{ 新規件数: number; エラー: string | null }> {
  const sharedDriveId = process.env.VITE_SHARED_DRIVE_ID;
  if (!sharedDriveId) {
    return { 新規件数: 0, エラー: 'VITE_SHARED_DRIVE_ID未設定' };
  }

  const allClients = getAllClients();
  const client = allClients.find(c => c.clientId === clientId);
  if (!client) {
    return { 新規件数: 0, エラー: `顧問先が見つかりません: ${clientId}` };
  }
  if (!client.sharedFolderId) {
    return { 新規件数: 0, エラー: 'Driveフォルダが未設定です' };
  }

  const result = await pollOneClient(
    client.clientId,
    client.companyName,
    client.sharedFolderId,
    sharedDriveId,
  );

  return { 新規件数: result.新規件数, エラー: result.エラー };
}

// ===== 公開API =====

/**
 * ワーカーを起動（server.tsから呼び出し）
 */
export function startDrivePollingWorker(): void {
  if (_intervalId) {
    console.warn('[drivePollingWorker] 既に起動中。二重起動を防止');
    return;
  }

  // 起動直後に1回実行（サーバー起動時に最新状態を取得）
  setTimeout(() => {
    tick().catch(err => {
      console.error('[drivePollingWorker] 初回tick未捕捉エラー:', err);
    });
  }, 10_000); // サーバー安定後10秒で初回実行

  _intervalId = setInterval(() => {
    tick().catch(err => {
      console.error('[drivePollingWorker] tick未捕捉エラー:', err);
    });
  }, ポーリング間隔);

  console.log(`[drivePollingWorker] 起動完了（${ポーリング間隔 / 60000}分間隔）`);
}

/**
 * ワーカーを停止（gracefulShutdown用）
 */
export function stopDrivePollingWorker(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log('[drivePollingWorker] 停止');
  }
}
