/**
 * driveService.ts — Google Drive API v3 ファイル取得サービス（サービスアカウント認証）
 *
 * 責務:
 *   - サービスアカウント（SA）認証でDrive APIにアクセス
 *   - 共有ドライブのファイル一覧取得
 *   - ファイルダウンロード（サーバー間通信）
 *   - SHA-256 ハッシュ計算
 *   - sharp でサムネイル生成（200px JPEG）
 *   - スマホブラウザを一切経由しない
 *
 * 認証方式:
 *   - サービスアカウント秘密鍵（JSON）で自動認証
 *   - 顧問先にGoogleログインは不要
 *   - 環境変数 GOOGLE_SA_KEY_PATH でキーファイルパスを指定
 */

import { createHash } from 'crypto';
import { google } from 'googleapis';

// ===== 型定義 =====

/** Drive ファイル一覧のアイテム（フロントに返す） */
export interface DriveFileItem {
  /** Google Drive ファイルID */
  id: string;
  /** ファイル名 */
  name: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 作成日時（ISO8601） */
  createdTime: string;
  /** Drive APIが返すサムネイルURL（有効期限あり） */
  thumbnailLink: string | null;
}

/** Drive からダウンロードしたファイルの処理結果 */
export interface DriveDownloadResult {
  /** SHA-256 ハッシュ（16進/hex） */
  fileHash: string;
  /** ファイルサイズ（バイト） */
  sizeBytes: number;
  /** sharpで生成したサムネイル（data:image/jpeg;base64,...） */
  thumbnail: string | null;
  /** ファイル名 */
  filename: string;
  /** MIMEタイプ */
  mimeType: string;
}

// ===== 認証（サービスアカウント） =====

/**
 * SA認証済みドライブクライアントを取得（シングルトン）
 * 初回呼出時にキーファイルを読み込み、以降はキャッシュ
 */
let driveClient: ReturnType<typeof google.drive> | null = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const keyPath = process.env.GOOGLE_SA_KEY_PATH;
  if (!keyPath) {
    throw new Error(
      'GOOGLE_SA_KEY_PATH 環境変数が未設定です。'
      + 'サービスアカウントのJSON秘密鍵ファイルパスを指定してください。'
      + '例: GOOGLE_SA_KEY_PATH=./sa-key.json',
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive'],  // フォルダ作成+ファイル読み取り
  });

  driveClient = google.drive({ version: 'v3', auth });
  console.log('[driveService] サービスアカウント認証完了');
  return driveClient;
}

// ===== 公開関数 =====

/**
 * 共有ドライブにフォルダを作成
 *
 * @param folderName - フォルダ名（例: 'LDI_株式会社LDIデジタル'）
 * @param sharedDriveId - 共有ドライブのID
 * @returns 作成されたフォルダのID
 */
export async function createDriveFolder(
  folderName: string,
  sharedDriveId: string,
): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [sharedDriveId],
    },
    fields: 'id',
  });

  const folderId = response.data.id;
  if (!folderId) {
    throw new Error(`フォルダ作成失敗: レスポンスにIDがありません (name=${folderName})`);
  }

  console.log(
    `[driveService] フォルダ作成完了: ${folderName} (id=${folderId})`,
  );

  return folderId;
}

/**
 * フォルダの存在確認（削除済みかどうかも検知）
 *
 * @param folderId - 確認対象のフォルダID
 * @returns { exists: boolean, trashed: boolean }
 */
export async function checkFolderExists(
  folderId: string,
): Promise<{ exists: boolean; trashed: boolean }> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.get({
      fileId: folderId,
      supportsAllDrives: true,
      fields: 'id,trashed',
    });

    return {
      exists: true,
      trashed: response.data.trashed === true,
    };
  } catch (err: unknown) {
    // 404 = フォルダが存在しない（完全削除済み）
    const status = (err as { code?: number }).code;
    if (status === 404) {
      return { exists: false, trashed: false };
    }
    throw err;
  }
}

/**
 * 共有ドライブの指定フォルダ内のファイル一覧を取得
 *
 * @param folderId - 顧問先フォルダのDrive ID
 * @param sharedDriveId - 共有ドライブのID（環境変数から取得）
 * @param pageSize - 取得件数（デフォルト200）
 * @returns ファイル一覧
 */
export async function listDriveFiles(
  folderId: string,
  sharedDriveId: string,
  pageSize = 200,
): Promise<DriveFileItem[]> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    driveId: sharedDriveId,
    corpora: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id,name,mimeType,size,createdTime,thumbnailLink)',
    orderBy: 'createdTime desc',
    pageSize,
  });

  const files = response.data.files ?? [];

  console.log(
    `[driveService] listDriveFiles: ${files.length}件取得`
    + ` (folderId=${folderId.slice(0, 12)}...)`
  );

  return files.map(f => ({
    id: f.id ?? '',
    name: f.name ?? '不明',
    mimeType: f.mimeType ?? 'application/octet-stream',
    size: parseInt(String(f.size ?? '0'), 10),
    createdTime: f.createdTime ?? '',
    thumbnailLink: f.thumbnailLink ?? null,
  }));
}

/**
 * Drive API でファイルをダウンロードし、ハッシュ+サムネイルを生成
 *
 * @param fileId - Google Drive ファイルID
 * @param filename - ファイル名
 * @param mimeType - MIMEタイプ
 * @returns ハッシュ・サムネイル・ファイル情報
 */
export async function downloadAndProcessDriveFile(
  fileId: string,
  filename: string,
  mimeType: string,
): Promise<DriveDownloadResult> {
  const drive = getDriveClient();

  // 1. Drive API でファイルダウンロード（バイナリ）
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'arraybuffer' },
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);

  // 2. SHA-256 ハッシュ計算
  const fileHash = createHash('sha256').update(buffer).digest('hex');

  // 3. サムネイル生成（sharp 200px JPEG。画像のみ）
  let thumbnail: string | null = null;
  if (mimeType.startsWith('image/')) {
    try {
      const sharp = (await import('sharp')).default;
      const thumbBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
    } catch (err) {
      console.warn(`[driveService] サムネイル生成失敗 (${filename}):`, err);
    }
  }

  console.log(
    `[driveService] ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`
    + ` hash=${fileHash.slice(0, 12)}...`
    + ` thumb=${thumbnail ? `${(thumbnail.length / 1024).toFixed(1)}KB` : 'なし'}`,
  );

  return {
    fileHash,
    sizeBytes: buffer.length,
    thumbnail,
    filename,
    mimeType,
  };
}
