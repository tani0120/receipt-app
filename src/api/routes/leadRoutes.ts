/**
 * leadRoutes.ts — 見込先JSON永続化APIルート（Hono）
 *
 * clientRoutes.tsと同一構成。Client→Leadに置換。
 *
 * エンドポイント:
 *   GET  /api/leads                      — 全見込先取得
 *   GET  /api/leads/:leadId              — 1件取得
 *   POST /api/leads                      — 見込先追加
 *   PUT  /api/leads/:leadId              — 見込先更新
 *   PUT  /api/leads/:leadId/staff        — 担当者変更
 *   PUT  /api/leads/:leadId/shared-folder — Drive共有フォルダ設定
 *   PUT  /api/leads/:leadId/shared-email  — メール設定
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須, リソース_見込先 } from '../../constants/apiMessages';
import type { LeadStatus, Lead } from '../../repositories/types';
import {
  getAll,
  getById,
  create,
  updateLead,
  getByStaffId,
  getActiveLeads,
  getByStatus,
  updateStaffAssignment,
  updateSharedFolderId,
  updateSharedEmail,
  generateLeadId,
} from '../services/leadStore';

const app = new Hono();

// GET / — 全見込先取得
app.get('/', (c) => {
  const status = c.req.query('status');
  const staffId = c.req.query('staffId');

  if (status === 'active') {
    const list = getActiveLeads();
    return c.json({ leads: list, count: list.length });
  }
  if (status) {
    const list = getByStatus(status as LeadStatus);
    return c.json({ leads: list, count: list.length });
  }
  if (staffId) {
    const list = getByStaffId(staffId);
    return c.json({ leads: list, count: list.length });
  }
  const list = getAll();
  return c.json({ leads: list, count: list.length });
});

// GET /:leadId — 1件取得
app.get('/:leadId', (c) => {
  const leadId = c.req.param('leadId');
  const lead = getById(leadId);
  if (!lead) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ lead });
});

// POST / — 見込先追加（サーバーが常にID発番）
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.threeCode || !body.companyName) {
    return apiError(c, 400, 必須('threeCode と companyName'));
  }
  // サーバーが常にIDを発番。フロントからのIDは無視。
  body.leadId = generateLeadId();
  const lead = create(body);
  return c.json({ ok: true, lead });
});

// POST /bulk — 見込先一括追加（インポート用）
app.post('/bulk', async (c) => {
  const { items } = await c.req.json<{ items: Record<string, unknown>[] }>();
  if (!Array.isArray(items)) {
    return apiError(c, 400, 必須('items（配列）'));
  }
  const existing = getAll();
  const existingCodes = new Set(existing.map(l => (l as Lead).threeCode?.toUpperCase()).filter(Boolean));
  const existingNames = new Set(existing.map(l => (l as Lead).companyName).filter(Boolean));
  const results: { index: number; ok: boolean; leadId?: string; threeCode?: string; companyName?: string; error?: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    try {
      if (!item.companyName) {
        results.push({ index: i, ok: false, error: 'companyNameが必須' });
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
      item.leadId = generateLeadId();
      const saved = create(item as unknown as Lead);
      if (code) existingCodes.add(code);
      if (name) existingNames.add(name);
      results.push({ index: i, ok: true, leadId: saved.leadId, threeCode: saved.threeCode, companyName: saved.companyName });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err) });
    }
  }
  return c.json({ ok: true, results, total: items.length });
});

// PUT /:leadId — 見込先更新
app.put('/:leadId', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json();
  const ok = updateLead(leadId, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/staff — 担当者変更
app.put('/:leadId/staff', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ staffId: string | null }>();
  const ok = updateStaffAssignment(leadId, body.staffId);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/shared-folder — Drive共有フォルダ設定
app.put('/:leadId/shared-folder', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ folderId: string }>();
  const ok = updateSharedFolderId(leadId, body.folderId);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/shared-email — メール設定
app.put('/:leadId/shared-email', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ email: string }>();
  const ok = updateSharedEmail(leadId, body.email);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
});

export default app;
