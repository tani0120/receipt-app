/**
 * docStore.ts — ドキュメントJSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → documentStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/doc-store          — ドキュメント一覧取得（clientIdフィルタ任意）
 *   POST /api/doc-store          — ドキュメント一括追加
 *   PUT  /api/doc-store/:id      — ステータス更新
 *   POST /api/doc-store/batch    — 選別完了→batchId/journalId付与
 *   DELETE /api/doc-store/client/:clientId — 顧問先の全資料削除
 *
 * 【移行時】
 *   Supabase接続時にdocumentStoreの中身をDB操作に差し替え。
 *   フロント側のAPI呼び出しは変更不要。
 */

import { Hono } from 'hono';
import {
  getDocuments,
  addDocuments,
  updateDocumentStatus,
  assignBatchAndJournalIds,
  removeByClientId,
  getById,
  deleteById,
  countDocuments,
} from '../services/documentStore';

const app = new Hono();

// ============================================================
// GET / — ドキュメント一覧取得
// ============================================================
app.get('/', (c) => {
  const clientId = c.req.query('clientId');
  const docs = getDocuments(clientId);
  return c.json({ documents: docs, count: docs.length });
});

// ============================================================
// POST / — ドキュメント一括追加
// ============================================================
app.post('/', async (c) => {
  const body = await c.req.json<{ documents: unknown[] }>();
  if (!body.documents || !Array.isArray(body.documents)) {
    return c.json({ error: 'documents配列が必要です' }, 400);
  }
  const result = addDocuments(body.documents as import('../../repositories/types').DocEntry[]);
  return c.json({ ok: true, ...result });
});

// ============================================================
// PUT /:id — ステータス更新
// ============================================================
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ status: string }>();
  if (!body.status) {
    return c.json({ error: 'statusが必要です' }, 400);
  }
  const ok = updateDocumentStatus(id, body.status as import('../../repositories/types').DocStatus);
  if (!ok) {
    return c.json({ error: `ドキュメント ${id} が見つかりません` }, 404);
  }
  return c.json({ ok: true });
});

// ============================================================
// POST /batch — 選別完了→batchId/journalId付与
// ============================================================
app.post('/batch', async (c) => {
  const body = await c.req.json<{ clientId: string }>();
  if (!body.clientId) {
    return c.json({ error: 'clientIdが必要です' }, 400);
  }
  const result = assignBatchAndJournalIds(body.clientId);
  return c.json({ ok: true, ...result });
});

// ============================================================
// DELETE /client/:clientId — 顧問先の全資料削除
// ============================================================
app.delete('/client/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const removed = removeByClientId(clientId);
  return c.json({ ok: true, removed });
});

// ============================================================
// GET /count — 件数取得（DL-042追加）※ /:id より前に配置必須
// ============================================================
app.get('/count', (c) => {
  const clientId = c.req.query('clientId');
  const cnt = countDocuments(clientId);
  return c.json({ count: cnt });
});

// ============================================================
// GET /:id — 1件取得（DL-042追加）
// ============================================================
app.get('/:id', (c) => {
  const id = c.req.param('id');
  const doc = getById(id);
  if (!doc) {
    return c.json({ error: `ドキュメント ${id} が見つかりません` }, 404);
  }
  return c.json({ document: doc });
});

// ============================================================
// DELETE /:id — 個別削除（DL-042追加）
// ============================================================
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const ok = deleteById(id);
  if (!ok) {
    return c.json({ error: `ドキュメント ${id} が見つかりません` }, 404);
  }
  return c.json({ ok: true });
});
// ============================================================
// POST /upload-file — ファイルをサーバーにローカル保存（P3対応）
// 独自アップロードのblob URL問題を解消。
// Drive取り込みと同じdata/uploads/{clientId}/に保存。
// @deprecated Phase C以降は POST /api/drive/upload を使用。Phase Fで削除予定。
// ============================================================
app.post('/upload-file', async (c) => {
  console.warn('[docStore] POST /upload-file は非推奨です。POST /api/drive/upload を使用してください。');
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const clientId = formData.get('clientId') as string | null;

  if (!file || !clientId) {
    return c.json({ error: 'file と clientId が必要です' }, 400);
  }

  const { mkdirSync, writeFileSync, existsSync } = await import('fs');
  const { join } = await import('path');
  const { createHash } = await import('crypto');

  // ファイルをBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // SHA-256ハッシュ
  const fileHash = createHash('sha256').update(buffer).digest('hex');

  // 保存先
  const dir = join('data', 'uploads', clientId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const safeName = `${fileHash.slice(0, 8)}_${file.name}`;
  const filePath = join(dir, safeName);
  writeFileSync(filePath, buffer);

  const localPath = `/api/uploads/${clientId}/${encodeURIComponent(safeName)}`;
  console.log(`[docStore] ファイル保存: ${file.name} → ${localPath} (${(buffer.length / 1024).toFixed(0)}KB)`);

  return c.json({ ok: true, localPath, fileHash, sizeBytes: buffer.length });
});

export default app;
