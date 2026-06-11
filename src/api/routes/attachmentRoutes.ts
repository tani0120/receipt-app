/**
 * attachmentRoutes.ts — 添付ファイルAPIルート（Hono）
 *
 * エンドポイント:
 *   POST   /api/attachments/:clientId              — ファイルアップロード
 *   GET    /api/attachments/:clientId              — 添付ファイル一覧取得
 *   DELETE /api/attachments/:clientId/:fileId      — ファイル削除
 *   GET    /api/attachments/:clientId/:fileId/download — ファイルダウンロード
 *
 * ファイル本体: data/attachments/{clientId}/{fileId}{ext}
 * メタデータ:   data/attachments/{clientId}/{fileId}.meta.json
 *
 * clientオブジェクトへの書き込みは一切行わない。
 * フロント側が form[fieldKey] で管理し、saveClient時にextraFieldsとして保存。
 */

import { Hono } from 'hono';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import crypto from 'crypto';
import { apiError, apiCatchError } from '../helpers/apiError';
import { ファイル必須, 未検出, リソース_顧問先 } from '../../constants/apiMessages';
import { getById } from '../services/clientsApi';
import type { AttachmentFile } from '../../repositories/types';

const ATTACHMENTS_DIR = join(process.cwd(), 'data', 'attachments');

/** 保存先ディレクトリを確保 */
function ensureDir(clientId: string): string {
  const dir = join(ATTACHMENTS_DIR, clientId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** メタデータの読み書き */
function readMeta(dir: string, fileId: string): AttachmentFile | null {
  const metaPath = join(dir, `${fileId}.meta.json`);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeMeta(dir: string, fileId: string, meta: AttachmentFile): void {
  writeFileSync(join(dir, `${fileId}.meta.json`), JSON.stringify(meta, null, 2), 'utf-8');
}

function deleteMeta(dir: string, fileId: string): void {
  const metaPath = join(dir, `${fileId}.meta.json`);
  if (existsSync(metaPath)) unlinkSync(metaPath);
}

const app = new Hono();

// ============================================================
// POST /:clientId — ファイルアップロード
// ============================================================
app.post('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return apiError(c, 400, ファイル必須);
    }

    // ファイルID生成
    const fileId = `att_${crypto.randomBytes(8).toString('hex')}`;
    const ext = extname(file.name);
    const savedName = `${fileId}${ext}`;

    // ファイル本体を保存
    const dir = ensureDir(clientId);
    const filePath = join(dir, savedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    // メタデータ作成・保存
    const attachment: AttachmentFile = {
      id: fileId,
      name: file.name,
      url: `/api/attachments/${clientId}/${fileId}/download`,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
    writeMeta(dir, fileId, attachment);

    console.log(`[attachment] アップロード: ${file.name} (${(file.size / 1024).toFixed(1)}KB) → ${clientId}`);
    return c.json({ ok: true, attachment });
  } catch (err) {
    return apiCatchError(c, err);
  }
});

// ============================================================
// GET /:clientId — 添付ファイル一覧（ディスクのメタJSONから生成）
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }

  const dir = join(ATTACHMENTS_DIR, clientId);
  if (!existsSync(dir)) {
    return c.json({ files: [], count: 0 });
  }

  const diskFiles = readdirSync(dir);
  const files: AttachmentFile[] = [];
  for (const f of diskFiles) {
    if (f.endsWith('.meta.json')) {
      const meta = readMeta(dir, f.replace('.meta.json', ''));
      if (meta) files.push(meta);
    }
  }

  return c.json({ files, count: files.length });
});

// ============================================================
// DELETE /:clientId/:fileId — ファイル削除
// ============================================================
app.delete('/:clientId/:fileId', (c) => {
  const clientId = c.req.param('clientId');
  const fileId = c.req.param('fileId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }

  const dir = join(ATTACHMENTS_DIR, clientId);

  // メタデータ確認
  const meta = readMeta(dir, fileId);
  if (!meta) {
    return apiError(c, 404, 未検出(`添付ファイル ${fileId}`));
  }

  // ファイル本体を削除
  if (existsSync(dir)) {
    const diskFiles = readdirSync(dir);
    const target = diskFiles.find(f => f.startsWith(fileId) && !f.endsWith('.meta.json'));
    if (target) {
      unlinkSync(join(dir, target));
    }
  }

  // メタデータ削除
  deleteMeta(dir, fileId);

  console.log(`[attachment] 削除: ${fileId} from ${clientId}`);
  return c.json({ ok: true });
});

// ============================================================
// GET /:clientId/:fileId/download — ファイルダウンロード
// ============================================================
app.get('/:clientId/:fileId/download', (c) => {
  const clientId = c.req.param('clientId');
  const fileId = c.req.param('fileId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }

  // メタデータからファイル名を取得
  const dir = join(ATTACHMENTS_DIR, clientId);
  const meta = readMeta(dir, fileId);

  // ディスクからファイルを検索
  if (!existsSync(dir)) {
    return apiError(c, 404, 未検出(`添付ファイル ${fileId}`));
  }
  const diskFiles = readdirSync(dir);
  const target = diskFiles.find(f => f.startsWith(fileId) && !f.endsWith('.meta.json'));
  if (!target) {
    return apiError(c, 404, 未検出(`添付ファイル ${fileId}`));
  }

  const filePath = join(dir, target);
  const buffer = readFileSync(filePath);
  const fileName = meta?.name ?? target;
  const ext = extname(fileName).toLowerCase();

  // Content-Type判定
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    },
  });
});

export default app;
