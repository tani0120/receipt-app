/**
 * clientRoutes.ts — 顧問先JSON永続化APIルート（Hono）
 *
 * レイヤー: ★route★ → clientStore
 * 責務: リクエスト受付・バリデーション・レスポンス返却
 *
 * エンドポイント:
 *   GET  /api/clients                       — 全顧問先取得（?status, ?staffId フィルタ任意）
 *   GET  /api/clients/:clientId             — 1件取得
 *   POST /api/clients                       — 顧問先追加
 *   PUT  /api/clients/:clientId             — 顧問先更新
 *   PUT  /api/clients/:clientId/staff       — 担当者変更
 *   PUT  /api/clients/:clientId/shared-folder — Drive共有フォルダ設定
 *   PUT  /api/clients/:clientId/shared-email  — 顧問先メール設定
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須, コード重複, リソース_顧問先 } from '../../constants/apiMessages';
import type { ClientStatus, Client } from '../../repositories/types';
import {
  getAll,
  getById,
  create,
  updateClient,
  getByStaffId,
  getActiveClients,
  getByStatus,
  updateStaffAssignment,
  updateSharedFolderId,
  updateSharedEmail,
  generateClientId,
} from '../services/clientsApi';
import { getClientList } from '../services/clientListService';
import { getClientAccounts, getClientTaxCategories } from '../services/accountMasterApi';

const app = new Hono();

// ============================================================
// POST /list — 顧問先一覧（フィルタ+ソート+ページネーション）
// ============================================================
app.post('/list', async (c) => {
  const body = await c.req.json();
  const result = getClientList(body);
  return c.json(result);
});

// ============================================================
// GET / — 全顧問先取得
// ============================================================
app.get('/', (c) => {
  const status = c.req.query('status');
  const staffId = c.req.query('staffId');

  if (status === 'active') {
    const list = getActiveClients();
    return c.json({ clients: list, count: list.length });
  }
  if (status) {
    const list = getByStatus(status as ClientStatus);
    return c.json({ clients: list, count: list.length });
  }
  if (staffId) {
    const list = getByStaffId(staffId);
    return c.json({ clients: list, count: list.length });
  }
  const list = getAll();
  return c.json({ clients: list, count: list.length });
});

// ============================================================
// GET /:clientId — 1件取得
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const client = getById(clientId);
  if (!client) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }
  return c.json({ client });
});

// ============================================================
// POST / — 顧問先追加
// ============================================================
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.threeCode) {
    return apiError(c, 400, 必須('threeCode'));
  }
  if (!body.companyName && !body.repName) {
    return apiError(c, 400, 必須('companyName または repName'));
  }
  // threeCode重複チェック
  const existing = getAll();
  const dup = existing.find(cl => cl.threeCode === body.threeCode && cl.clientId !== body.clientId);
  if (dup) {
    return apiError(c, 409, コード重複(body.threeCode, dup.companyName, dup.clientId));
  }
  // clientIdをサーバー側で発番（フロントからのID受け取りは無視）
  body.clientId = generateClientId();
  const client = create(body);
  // 勘定科目マスタ・税区分マスタを即時コピー（遅延初期化を廃止）
  getClientAccounts(client.clientId);
  getClientTaxCategories(client.clientId);
  return c.json({ ok: true, client });
});

// ============================================================
// POST /bulk — 顧問先一括追加（インポート用）
// ============================================================
app.post('/bulk', async (c) => {
  const { items } = await c.req.json<{ items: Record<string, unknown>[] }>();
  if (!Array.isArray(items)) {
    return apiError(c, 400, 必須('items（配列）'));
  }
  const existing = getAll();
  const existingCodes = new Set(existing.map(cl => cl.threeCode?.toUpperCase()).filter(Boolean));
  const existingNames = new Set(existing.map(cl => cl.companyName).filter(Boolean));
  const results: { index: number; ok: boolean; clientId?: string; threeCode?: string; companyName?: string; error?: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    try {
      if (!item.companyName && !item.repName) {
        results.push({ index: i, ok: false, error: 'companyNameまたはrepNameが必須' });
        continue;
      }
      // threeCode重複チェック（既存 + 同一バッチ内）
      const code = String(item.threeCode || '').toUpperCase();
      if (code && existingCodes.has(code)) {
        results.push({ index: i, ok: false, error: `threeCode「${code}」が重複` });
        continue;
      }
      // 会社名重複チェック（既存 + 同一バッチ内）
      const name = String(item.companyName || '');
      if (name && existingNames.has(name)) {
        results.push({ index: i, ok: false, error: `会社名「${name}」が重複` });
        continue;
      }
      item.clientId = generateClientId();
      const saved = create(item as unknown as Client);
      // 勘定科目マスタ・税区分マスタを即時コピー（遅延初期化を廃止）
      getClientAccounts(saved.clientId);
      getClientTaxCategories(saved.clientId);
      if (code) existingCodes.add(code);
      if (name) existingNames.add(name);
      results.push({ index: i, ok: true, clientId: saved.clientId, threeCode: saved.threeCode, companyName: saved.companyName });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err) });
    }
  }
  return c.json({ ok: true, results, total: items.length });
});

// ============================================================
// PUT /:clientId — 顧問先更新
// ============================================================
app.put('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json();
  // バリデーション（フロントと一致）
  if (body.threeCode !== undefined && !body.threeCode) {
    return apiError(c, 400, 必須('threeCode'));
  }
  if (body.companyName !== undefined && body.repName !== undefined && !body.companyName && !body.repName) {
    return apiError(c, 400, 必須('companyName または repName'));
  }
  // threeCode重複チェック（変更時のみ）
  if (body.threeCode) {
    const existing = getAll();
    const dup = existing.find(cl => cl.threeCode === body.threeCode && cl.clientId !== clientId);
    if (dup) {
      return apiError(c, 409, コード重複(body.threeCode, dup.companyName, dup.clientId));
    }
  }
  const ok = updateClient(clientId, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/staff — 担当者変更
// ============================================================
app.put('/:clientId/staff', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ staffId: string | null }>();
  const ok = updateStaffAssignment(clientId, body.staffId);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-folder — Drive共有フォルダ設定
// ============================================================
app.put('/:clientId/shared-folder', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ folderId: string }>();
  const ok = updateSharedFolderId(clientId, body.folderId);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-email — 顧問先メール設定
// ============================================================
app.put('/:clientId/shared-email', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ email: string }>();
  const ok = updateSharedEmail(clientId, body.email);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_顧問先} ${clientId}`));
  }
  return c.json({ ok: true });
});

export default app;
