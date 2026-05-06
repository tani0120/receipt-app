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
import { 未検出, 必須 } from '../helpers/apiMessages';
import type { LeadStatus } from '../../repositories/types';
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
  createLeadId,
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
    return apiError(c, 404, 未検出(`見込先 ${leadId}`));
  }
  return c.json({ lead });
});

// POST / — 見込先追加
app.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.threeCode || !body.companyName) {
    return apiError(c, 400, 必須('threeCode と companyName'));
  }
  if (!body.leadId) {
    body.leadId = createLeadId(body.threeCode);
  }
  const lead = create(body);
  return c.json({ ok: true, lead });
});

// PUT /:leadId — 見込先更新
app.put('/:leadId', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json();
  const ok = updateLead(leadId, body);
  if (!ok) {
    return apiError(c, 404, 未検出(`見込先 ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/staff — 担当者変更
app.put('/:leadId/staff', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ staffId: string | null }>();
  const ok = updateStaffAssignment(leadId, body.staffId);
  if (!ok) {
    return apiError(c, 404, 未検出(`見込先 ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/shared-folder — Drive共有フォルダ設定
app.put('/:leadId/shared-folder', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ folderId: string }>();
  const ok = updateSharedFolderId(leadId, body.folderId);
  if (!ok) {
    return apiError(c, 404, 未検出(`見込先 ${leadId}`));
  }
  return c.json({ ok: true });
});

// PUT /:leadId/shared-email — メール設定
app.put('/:leadId/shared-email', async (c) => {
  const leadId = c.req.param('leadId');
  const body = await c.req.json<{ email: string }>();
  const ok = updateSharedEmail(leadId, body.email);
  if (!ok) {
    return apiError(c, 404, 未検出(`見込先 ${leadId}`));
  }
  return c.json({ ok: true });
});

export default app;
