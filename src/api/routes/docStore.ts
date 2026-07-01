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

import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { apiError } from "../helpers/apiError";
import { 未検出, 必須 } from "../../constants/apiMessages";
import { createMockRepositories } from "../../repositories/mock";
import type { DocEntry } from "../../repositories/types";

const documentRepo = createMockRepositories().document;

/** DocEntry専用zodスキーマ（必須フィールド + オプショナルフィールド） */
const docEntrySchema = z.object({
  id: z.string(),
  clientId: z.string(),
  source: z.enum(['drive', 'upload', 'staff-upload', 'guest-upload']),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  fileHash: z.string().nullable(),
  driveFileId: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  status: z.enum(['pending', 'target', 'supporting', 'excluded', 'completed', 'exported']),
  receivedAt: z.string(),
  batchId: z.string().nullable(),
  journalId: z.string().nullable(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  statusChangedBy: z.string().nullable().optional(),
  statusChangedAt: z.string().nullable().optional(),
}).passthrough()  // AI関連フィールド（aiDate, aiAmount等）を許可

const route = new Hono()
// GET / — ドキュメント一覧取得
.get("/", async (c) => {
  const clientId = c.req.query("clientId");
  const docs = clientId
    ? await documentRepo.getByClientId(clientId)
    : await documentRepo.getAll();
  return c.json({ documents: docs, count: docs.length });
})
// POST / — ドキュメント一括追加
.post("/",
  zValidator('json', z.object({ documents: z.array(docEntrySchema) })),
  async (c) => {
  const body = c.req.valid('json');
  const result = await documentRepo.saveBatch(body.documents as DocEntry[]);
  return c.json({ ok: true, ...result });
})
// PUT /:id — ステータス更新
.put("/:id",
  zValidator('json', z.object({
    status: z.string(),
    statusChangedBy: z.string().nullable().optional(),
    statusChangedAt: z.string().nullable().optional(),
    updatedBy: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })),
  async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid('json');
  if (!body.status) {
    return apiError(c, 400, 必須("status"));
  }
  await documentRepo.updateStatus(id, body as Partial<DocEntry>);
  return c.json({ ok: true });
})
// POST /batch — 選別完了→batchId/journalId付与
.post("/batch",
  zValidator('json', z.object({ clientId: z.string() })),
  async (c) => {
  const body = c.req.valid('json');
  const result = await documentRepo.assignBatch(body.clientId);
  return c.json({ ok: true, ...result });
})
// DELETE /client/:clientId — 顧問先の全資料削除
.delete("/client/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  await documentRepo.removeByClientId(clientId);
  return c.json({ ok: true });
})
// POST /clear-ai/:clientId — firstAiデータ一括削除（確定送信後）
.post("/clear-ai/:clientId", async (c) => {
  const clientId = c.req.param("clientId");
  await documentRepo.clearAiFields(clientId);
  return c.json({ ok: true });
})
// GET /count — 件数取得（DL-042追加）
.get("/count", async (c) => {
  const clientId = c.req.query("clientId");
  const cnt = await documentRepo.countDocuments(clientId);
  return c.json({ count: cnt });
})
// GET /:id — 1件取得（DL-042追加）
.get("/:id", async (c) => {
  const id = c.req.param("id");
  const doc = await documentRepo.getById(id);
  if (!doc) {
    return apiError(c, 404, 未検出(`ドキュメント ${id}`));
  }
  return c.json({ document: doc });
})
// DELETE /:id — 個別削除（DL-042追加）
.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const ok = await documentRepo.deleteById(id);
  if (!ok) {
    return apiError(c, 404, 未検出(`ドキュメント ${id}`));
  }
  return c.json({ ok: true });
});

export default route;

