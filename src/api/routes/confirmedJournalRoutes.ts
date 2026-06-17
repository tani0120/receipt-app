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
 *
 * POST   /api/confirmed-journals/normalize           — 一括正規化（DL-050: Service経由）
 * POST   /api/confirmed-journals/reload               — インメモリ再読み込み
 */

import { Hono } from "hono";
import { apiError } from "../helpers/apiError";
import { 必須 } from "../../constants/apiMessages";
import {
  getByClientId,
  findByMatchKey,
  getByBatchId,
  getImportBatches,
  loadConfirmedJournals,
} from "../services/confirmedJournalsApi";
import { normalizeConfirmedJournals } from "../services/normalizeConfirmedJournalsService";
import {
  importFromCsv,
  deleteBatch,
  deleteByClient,
} from "../services/confirmedJournalService";

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

  // Service経由でCSVインポート（DL-050）
  const result = importFromCsv(client_id, body.csv_text);

  return c.json({
    ok: result.ok,
    import_batch_id: result.importBatchId,
    added: result.added,
    skipped: result.skipped,
    total_rows: result.totalRows,
    warnings: result.warnings,
    total_in_db: result.totalInDb,
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
  // Service経由（DL-050）
  const result = deleteBatch(batch_id);
  return c.json({ ok: true, removed: result.removed });
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
  // Service経由（DL-050）
  const result = deleteByClient(client_id);
  return c.json({ ok: true, removed: result.removed });
});

// ============================================================
// POST /reload — インメモリキャッシュをJSONから再読み込み
// ============================================================
app.post("/reload", (c) => {
  loadConfirmedJournals();
  return c.json({ ok: true, message: 'JSONから再読み込み完了' });
});

// ============================================================
// POST /normalize — 確定済み仕訳の一括正規化（DL-050: Service経由）
// ============================================================
app.post("/normalize", async (c) => {
  try {
    const body = await c.req.json<{ dryRun?: boolean }>().catch(() => ({} as { dryRun?: boolean }));
    const result = await normalizeConfirmedJournals({ dryRun: body.dryRun });
    return c.json({
      ok: true,
      result,
      message: result.dryRun
        ? `ドライラン完了（${result.journalCount}件分析、書き込みなし）`
        : `正規化完了（科目${result.accountConverted}件変換、税区分${result.taxConverted}件変換）`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[confirmedJournalRoutes] normalize失敗: ${message}`);
    return c.json({ ok: false, error: '正規化に失敗しました', detail: message }, 500);
  }
});

export default app;

