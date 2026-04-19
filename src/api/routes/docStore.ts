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
  const result = addDocuments(body.documents as any);
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
  const ok = updateDocumentStatus(id, body.status as any);
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

export default app;
