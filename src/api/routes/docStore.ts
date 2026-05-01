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
import { apiError } from "../helpers/apiError";
import { 未検出, 必須, 配列必須 } from "../helpers/apiMessages";
import {
  getDocuments,
  addDocuments,
  updateDocumentStatus,
  assignBatchAndJournalIds,
  removeByClientId,
  getById,
  deleteById,
  countDocuments,
  clearAiFieldsByClientId,
} from "../services/documentStore";

const app = new Hono();

// ============================================================
// GET / — ドキュメント一覧取得
// ============================================================
app.get("/", (c) => {
  const clientId = c.req.query("clientId");
  const docs = getDocuments(clientId);
  return c.json({ documents: docs, count: docs.length });
});

// ============================================================
// POST / — ドキュメント一括追加
// ============================================================
app.post("/", async (c) => {
  const body = await c.req.json<{ documents: unknown[] }>();
  if (!body.documents || !Array.isArray(body.documents)) {
    return apiError(c, 400, 配列必須("documents"));
  }
  const result = addDocuments(body.documents as import("../../repositories/types").DocEntry[]);
  return c.json({ ok: true, ...result });
});

// ============================================================
// PUT /:id — ステータス更新
// ============================================================
app.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    status: string;
    statusChangedBy?: string | null;
    statusChangedAt?: string | null;
    updatedBy?: string | null;
    updatedAt?: string | null;
  }>();
  if (!body.status) {
    return apiError(c, 400, 必須("status"));
  }
  const ok = updateDocumentStatus(id, body.status as import("../../repositories/types").DocStatus, {
    statusChangedBy: body.statusChangedBy,
    statusChangedAt: body.statusChangedAt,
    updatedBy: body.updatedBy,
    updatedAt: body.updatedAt,
  });
  if (!ok) {
    return apiError(c, 404, 未検出(`ドキュメント ${id}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// POST /batch — 選別完了→batchId/journalId付与
// ============================================================
app.post("/batch", async (c) => {
  const body = await c.req.json<{ clientId: string }>();
  if (!body.clientId) {
    return apiError(c, 400, 必須("clientId"));
  }
  const result = assignBatchAndJournalIds(body.clientId);
  return c.json({ ok: true, ...result });
});

// ============================================================
// DELETE /client/:clientId — 顧問先の全資料削除
// ============================================================
app.delete("/client/:clientId", (c) => {
  const clientId = c.req.param("clientId");
  const removed = removeByClientId(clientId);
  return c.json({ ok: true, removed });
});

// ============================================================
// POST /clear-ai/:clientId — previewExtractデータ一括削除（確定送信後）
// 設計方針: previewExtract.service.ts ヘッダー参照
// ============================================================
app.post("/clear-ai/:clientId", (c) => {
  const clientId = c.req.param("clientId");
  const cleared = clearAiFieldsByClientId(clientId);
  return c.json({ ok: true, cleared });
});

// ============================================================
// GET /count — 件数取得（DL-042追加）※ /:id より前に配置必須
// ============================================================
app.get("/count", (c) => {
  const clientId = c.req.query("clientId");
  const cnt = countDocuments(clientId);
  return c.json({ count: cnt });
});

// ============================================================
// GET /:id — 1件取得（DL-042追加）
// ============================================================
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const doc = getById(id);
  if (!doc) {
    return apiError(c, 404, 未検出(`ドキュメント ${id}`));
  }
  return c.json({ document: doc });
});

// ============================================================
// DELETE /:id — 個別削除（DL-042追加）
// ============================================================
app.delete("/:id", (c) => {
  const id = c.req.param("id");
  const ok = deleteById(id);
  if (!ok) {
    return apiError(c, 404, 未検出(`ドキュメント ${id}`));
  }
  return c.json({ ok: true });
});

export default app;
