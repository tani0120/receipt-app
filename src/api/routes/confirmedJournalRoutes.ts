/**
 * confirmedJournalRoutes.ts — 確定済み仕訳APIルート（Hono）
 *
 * レイヤー: ★route★ → confirmedJournalStore + mfCsvParser
 * 責務: リクエスト受付・CSVパース・永続化・レスポンス返却
 *
 * エンドポイント:
 *   GET    /api/confirmed-journals/:clientId         — 顧問先の全件取得
 *   POST   /api/confirmed-journals/:clientId/import  — MF CSVインポート
 *   GET    /api/confirmed-journals/:clientId/batches  — バッチ一覧
 *   GET    /api/confirmed-journals/:clientId/search   — match_key検索
 *   DELETE /api/confirmed-journals/batch/:batchId     — バッチ削除
 *
 * 設計根拠: docs/genzai/25_past_journal.md §5, §6
 */

import { Hono } from "hono";
import { apiError } from "../helpers/apiError";
import { 必須 } from "../helpers/apiMessages";
import { parseMfCsv } from "../../mocks/utils/pipeline/mfCsvParser";
import {
  getByClientId,
  findByMatchKey,
  importJournals,
  deleteByBatchId,
  deleteByClientId,
  getByBatchId,
  getImportBatches,
  countByClientId,
  loadConfirmedJournals,
} from "../services/confirmedJournalStore";

const app = new Hono();

// ============================================================
// GET /:clientId — 顧問先の確定済み仕訳全件取得
// ============================================================
app.get("/:clientId", (c) => {
  const client_id = c.req.param("clientId");
  const journals = getByClientId(client_id);
  return c.json({ journals, count: journals.length });
});

// ============================================================
// POST /:clientId/import — MF CSVインポート
// ============================================================
app.post("/:clientId/import", async (c) => {
  const client_id = c.req.param("clientId");
  const body = await c.req.json<{ csv_text: string }>();

  if (!body.csv_text || typeof body.csv_text !== "string") {
    return apiError(c, 400, 必須("csv_text"));
  }

  // バッチID生成
  const import_batch_id = crypto.randomUUID();

  // CSVパース
  const parse_result = parseMfCsv(body.csv_text, client_id, import_batch_id);

  if (parse_result.journals.length === 0) {
    return c.json({
      ok: false,
      added: 0,
      skipped: 0,
      warnings: parse_result.warnings,
      total_rows: parse_result.total_rows,
    });
  }

  // 永続化（重複排除付き）
  const import_result = importJournals(parse_result.journals);

  return c.json({
    ok: true,
    import_batch_id,
    added: import_result.added,
    skipped: import_result.skipped,
    total_rows: parse_result.total_rows,
    warnings: parse_result.warnings,
    total_in_db: countByClientId(client_id),
  });
});

// ============================================================
// GET /:clientId/batches — インポートバッチ一覧
// ============================================================
app.get("/:clientId/batches", (c) => {
  const client_id = c.req.param("clientId");
  const batches = getImportBatches(client_id);
  return c.json({ batches });
});

// ============================================================
// GET /:clientId/search — match_keyで検索（過去仕訳照合）
// ============================================================
app.get("/:clientId/search", (c) => {
  const client_id = c.req.param("clientId");
  const match_key = c.req.query("match_key");

  if (!match_key) {
    return apiError(c, 400, 必須("match_key"));
  }

  const journals = findByMatchKey(client_id, match_key);
  return c.json({ journals, count: journals.length });
});

// ============================================================
// DELETE /batch/:batchId — インポートバッチ削除
// ============================================================
app.delete("/batch/:batchId", (c) => {
  const batch_id = c.req.param("batchId");
  const removed = deleteByBatchId(batch_id);
  return c.json({ ok: true, removed });
});

// ============================================================
// GET /batch/:batchId/journals — バッチの仕訳取得（CSVダウンロード用）
// ============================================================
app.get("/batch/:batchId/journals", (c) => {
  const batch_id = c.req.param("batchId");
  const journals = getByBatchId(batch_id);
  return c.json({ journals, count: journals.length });
});

// ============================================================
// DELETE /:clientId — 顧問先の全件削除
// ============================================================
app.delete("/:clientId", (c) => {
  const client_id = c.req.param("clientId");
  const removed = deleteByClientId(client_id);
  return c.json({ ok: true, removed });
});

// ============================================================
// POST /reload — インメモリキャッシュをJSONから再読み込み
// ============================================================
app.post("/reload", (c) => {
  loadConfirmedJournals();
  return c.json({ ok: true, message: 'JSONから再読み込み完了' });
});

export default app;

