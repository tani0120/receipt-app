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

/** サムネイルbase64付きファイルアイテム（Drive借景方式で使用） */
export interface DriveFileItemWithThumbnail extends DriveFileItem {
  /** サムネイル画像のbase64データURI（data:image/jpeg;base64,...）。取得失敗時はnull */
  thumbnailBase64: string | null;
}

/** フルサイズプレビュー取得結果 */
export interface DrivePreviewResult {
  /** ファイルのバイナリデータ */
  buffer: Buffer;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイル名 */
  fileName: string;
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
  /** ローカル保存パス（/api/uploads/{clientId}/{safeName}） */
  localPath: string;
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
 * 共有ドライブにフォルダを作成（同名フォルダが存在すれば既存IDを返す）
 *
 * @param folderName - フォルダ名（例: 'LDI_株式会社LDIデジタル'）
 * @param sharedDriveId - 共有ドライブのID
 * @returns 作成された（または既存の）フォルダのID
 */
export async function createDriveFolder(
  folderName: string,
  sharedDriveId: string,
): Promise<string> {
  const drive = getDriveClient();

  // --- 同名フォルダの重複チェック ---
  const existing = await drive.files.list({
    q: `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${sharedDriveId}' in parents and trashed = false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'drive',
    driveId: sharedDriveId,
    fields: 'files(id, name)',
  });

  if (existing.data.files && existing.data.files.length > 0) {
    const existingId = existing.data.files[0]?.id;
    if (existingId) {
      console.log(
        `[driveService] 同名フォルダ検出（新規作成スキップ）: ${folderName} (id=${existingId})`,
      );
      return existingId;
    }
  }

  // --- 既存なし → 新規作成 ---
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
    `[driveService] フォルダ新規作成完了: ${folderName} (id=${folderId})`,
  );

  return folderId;
}

/**
 * 共有ドライブのフォルダ名を変更
 *
 * @param folderId - 対象フォルダID
 * @param newName - 新しいフォルダ名（例: 'XYZ_株式会社サンプル'）
 */
export async function renameDriveFolder(
  folderId: string,
  newName: string,
): Promise<void> {
  const drive = getDriveClient();

  await drive.files.update({
    fileId: folderId,
    supportsAllDrives: true,
    requestBody: { name: newName },
  });

  console.log(
    `[driveService] フォルダリネーム完了: ${newName} (id=${folderId})`,
  );
}

/**
 * フォルダに指定メールアドレスへの共有権限を付与
 *
 * @param folderId - 対象フォルダID
 * @param email - 共有先メールアドレス
 * @param role - 権限（'reader' | 'writer' | 'commenter'）
 */
export async function shareFolderWithEmail(
  folderId: string,
  email: string,
  role: 'reader' | 'writer' | 'commenter' = 'writer',
): Promise<void> {
  const drive = getDriveClient();

  await drive.permissions.create({
    fileId: folderId,
    supportsAllDrives: true,
    sendNotificationEmail: false,
    requestBody: {
      type: 'user',
      role,
      emailAddress: email,
    },
  });

  console.log(
    `[driveService] 共有権限付与完了: ${email} → ${folderId} (role=${role})`,
  );
}

/**
 * DriveファイルをDriveのゴミ箱に移動
 * 取り込み成功後に呼び出し、フォルダ内のファイルをクリーンアップ
 *
 * @param fileId - ゴミ箱に移動するファイルID
 */
export async function trashDriveFile(fileId: string): Promise<void> {
  const drive = getDriveClient();

  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: { trashed: true },
  });

  console.log(`[driveService] ゴミ箱移動完了: ${fileId}`);
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
 * Drive API でファイルをダウンロードし、ハッシュ+サムネイル+ローカル保存
 *
 * @param fileId - Google Drive ファイルID
 * @param filename - ファイル名
 * @param mimeType - MIMEタイプ
 * @param clientId - 顧問先ID（ローカル保存先ディレクトリ）
 * @returns ハッシュ・サムネイル・ローカルパス・ファイル情報
 */
export async function downloadAndProcessDriveFile(
  fileId: string,
  filename: string,
  mimeType: string,
  clientId: string,
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

  // 3. ローカルに保存（リロード後も表示可能にする）
  const { mkdirSync, writeFileSync } = await import('fs');
  const { join } = await import('path');
  const dir = join('data', 'uploads', clientId);
  mkdirSync(dir, { recursive: true });
  // ファイル名衝突防止: hash先頭8文字を付与
  const safeName = `${fileHash.slice(0, 8)}_${filename}`;
  const filePath = join(dir, safeName);
  writeFileSync(filePath, buffer);
  const localPath = `/api/uploads/${clientId}/${encodeURIComponent(safeName)}`;

  // 4. サムネイル生成（sharp 200px JPEG。画像のみ）
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
    + ` thumb=${thumbnail ? `${(thumbnail.length / 1024).toFixed(1)}KB` : 'なし'}`
    + ` local=${localPath ?? 'なし'}`,
  );

  return {
    fileHash,
    sizeBytes: buffer.length,
    thumbnail,
    filename,
    mimeType,
    localPath,
  };
}

/**
 * 共有フォルダにユーザー権限を付与
 *
 * ゲストのGoogleログイン時に呼び出し、
 * ゲストのメールアドレスに対して共有フォルダの書き込み権限を付与する。
 *
 * 権限レベル:
 *   - writer（編集者）: ファイル追加・編集が可能。共有ドライブではフォルダ削除は不可。
 *   - reader（閲覧者）: 閲覧のみ。ファイル追加不可。
 *
 * @param folderId - 共有フォルダのDrive ID
 * @param email - ゲストのGoogleアカウントメールアドレス（Gmail以外も可）
 * @param role - 権限レベル（デフォルト: writer = 編集者）
 */
export async function grantFolderPermission(
  folderId: string,
  email: string,
  role: 'reader' | 'writer' = 'writer',
): Promise<void> {
  const drive = getDriveClient();

  await drive.permissions.create({
    fileId: folderId,
    supportsAllDrives: true,
    sendNotificationEmail: false,
    requestBody: {
      type: 'user',
      role,
      emailAddress: email,
    },
  });

  console.log(
    `[driveService] 権限付与完了: ${email} → ${role}`
    + ` (folderId=${folderId.slice(0, 12)}...)`,
  );
}
// ===== Drive借景方式（Phase C: PC版アップロード） =====

/** Drive アップロード結果 */
export interface DriveUploadResult {
  /** アップロードされたファイルのDrive ID */
  driveFileId: string;
  /** ファイル名 */
  name: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  size: number;
}

/**
 * 共有ドライブの指定フォルダにファイルをアップロード（Phase C-1）
 *
 * createDriveFolder() L137-145 と同じ supportsAllDrives パターンで実装。
 *
 * @param folderId - アップロード先フォルダのDrive ID
 * @param buffer - ファイルのバイナリデータ
 * @param fileName - ファイル名
 * @param mimeType - MIMEタイプ
 * @returns アップロード結果（driveFileId, name, mimeType, size）
 */
export async function uploadToDrive(
  folderId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const { Readable } = await import('stream');

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id,name,mimeType,size',
  });

  const driveFileId = response.data.id;
  if (!driveFileId) {
    throw new Error(`アップロード失敗: レスポンスにIDがありません (name=${fileName})`);
  }

  const size = parseInt(String(response.data.size ?? '0'), 10);

  console.log(
    `[driveService] uploadToDrive: ${fileName}`
    + ` (${(buffer.length / 1024).toFixed(0)}KB, ${mimeType})`
    + ` → driveFileId=${driveFileId}`,
  );

  return {
    driveFileId,
    name: response.data.name ?? fileName,
    mimeType: response.data.mimeType ?? mimeType,
    size: size || buffer.length,
  };
}

// ===== Drive借景方式（Phase A） =====

/**
 * サムネイルbase64付きファイル一覧を取得（Phase A-1）
 *
 * listDriveFiles() でメタデータを取得した後、
 * 各ファイルの thumbnailLink からSA認証トークンでサムネイル画像をDLし、
 * base64データURIに変換してレスポンスに埋め込む。
 *
 * パフォーマンス: 200枚 × 10KB = 約2MB。逐次DLで3-5秒程度。
 *
 * @param folderId - 顧問先フォルダのDrive ID
 * @param sharedDriveId - 共有ドライブのID
 * @param pageSize - 取得件数（デフォルト200）
 * @returns サムネイルbase64付きファイル一覧
 */
export async function getFilesWithThumbnails(
  folderId: string,
  sharedDriveId: string,
  pageSize = 200,
): Promise<DriveFileItemWithThumbnail[]> {
  // 1. 既存のlistDriveFilesでメタデータを取得
  const files = await listDriveFiles(folderId, sharedDriveId, pageSize);

  // 2. SA認証トークンを取得（thumbnailLinkへのHTTPリクエストに必要）
  const keyPath = process.env.GOOGLE_SA_KEY_PATH;
  if (!keyPath) {
    // SA鍵がない場合はサムネイルなしで返す（フォールバック）
    console.warn('[driveService] SA鍵未設定のためサムネイルDLをスキップ');
    return files.map(f => ({ ...f, thumbnailBase64: null }));
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const accessToken = await auth.getAccessToken();

  // 3. 各ファイルのサムネイルをDL → base64変換（逐次。並列はAPIレート制限に配慮）
  const results: DriveFileItemWithThumbnail[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    let thumbnailBase64: string | null = null;

    if (file.thumbnailLink && accessToken) {
      try {
        // thumbnailLinkにSA認証トークンを付与してHTTPリクエスト
        const thumbUrl = file.thumbnailLink.replace(/=s\d+$/, '=s200');
        const response = await fetch(thumbUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = response.headers.get('content-type') ?? 'image/jpeg';
          thumbnailBase64 = `data:${contentType};base64,${base64}`;
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    results.push({ ...file, thumbnailBase64 });
  }

  console.log(
    `[driveService] getFilesWithThumbnails: ${files.length}件`
    + ` (サムネイル成功=${successCount} 失敗=${failCount})`
    + ` (folderId=${folderId.slice(0, 12)}...)`,
  );

  return results;
}

/**
 * フルサイズプレビュー取得（Phase A-3）
 *
 * downloadAndProcessDriveFile のDL部分を抽出。
 * ハッシュ計算・ローカル保存・サムネイル生成は行わない（プレビュー専用）。
 *
 * @param fileId - Google Drive ファイルID
 * @returns ファイルのバイナリデータ・MIMEタイプ・ファイル名
 */
export async function getFilePreview(
  fileId: string,
): Promise<DrivePreviewResult> {
  const drive = getDriveClient();

  // ファイルメタデータ取得（MIMEタイプとファイル名）
  const metaResponse = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: 'name,mimeType',
  });

  const fileName = metaResponse.data.name ?? '不明';
  const mimeType = metaResponse.data.mimeType ?? 'application/octet-stream';

  // ファイル実体をバイナリでDL
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'arraybuffer' },
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);

  console.log(
    `[driveService] getFilePreview: ${fileName}`
    + ` (${(buffer.length / 1024).toFixed(0)}KB, ${mimeType})`,
  );

  return { buffer, mimeType, fileName };
}
