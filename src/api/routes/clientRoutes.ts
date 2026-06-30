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
import type { ClientStatus } from '../../repositories/types';
import { createMockRepositories } from '../../repositories/mock';

const repos = createMockRepositories()
const clientRepo = repos.client
const staffRepo = repos.staff
const accountMasterRepo = repos.accountMaster
const taxMasterRepo = repos.taxMaster

const app = new Hono();

// ============================================================
// POST /list — 顧問先一覧（フィルタ+ソート+ページネーション）
// staffNameソートが必要な場合はRoute層で結合（Repositoryは単一ドメイン）
// ============================================================
app.post('/list', async (c) => {
  const body = await c.req.json();
  const sorts = body.sorts as { key: string; order: 'asc' | 'desc' }[] | undefined
  const hasStaffSort = sorts?.some(s => s.key === 'staffId')

  if (hasStaffSort) {
    // staffNameソート: 全件取得→staffMapで結合ソート→自前ページネーション
    const allResult = await clientRepo.list({
      ...body,
      sorts: sorts!.filter(s => s.key !== 'staffId'), // staffId以外のソートはRepoで
      page: undefined,
      pageSize: undefined,
    })
    const staffAll = await staffRepo.getAll()
    const staffMap = new Map(staffAll.map(s => [s.uuid, s.name]))

    // staffNameソート適用
    const staffSortDef = sorts!.find(s => s.key === 'staffId')!
    allResult.rows.sort((a, b) => {
      const sa = (a.staffId ? staffMap.get(a.staffId) : '') ?? ''
      const sb = (b.staffId ? staffMap.get(b.staffId) : '') ?? ''
      const cmp = sa.localeCompare(sb, 'ja')
      return staffSortDef.order === 'asc' ? cmp : -cmp
    })

    // 自前ページネーション
    const page = body.page ?? 1
    const pageSize = body.pageSize ?? 50
    const totalCount = allResult.rows.length
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const start = (page - 1) * pageSize
    const paged = allResult.rows.slice(start, start + pageSize)

    return c.json({ rows: paged, totalCount, page, pageSize, totalPages })
  }

  const result = await clientRepo.list(body);
  return c.json(result);
});

// ============================================================
// GET / — 全顧問先取得
// ============================================================
app.get('/', async (c) => {
  const status = c.req.query('status');
  const staffId = c.req.query('staffId');

  if (status === 'active') {
    const list = await clientRepo.getActiveClients();
    return c.json({ clients: list, count: list.length });
  }
  if (status) {
    const list = await clientRepo.getByStatus(status as ClientStatus);
    return c.json({ clients: list, count: list.length });
  }
  if (staffId) {
    const list = await clientRepo.getByStaffId(staffId);
    return c.json({ clients: list, count: list.length });
  }
  const list = await clientRepo.getAll();
  return c.json({ clients: list, count: list.length });
});

// ============================================================
// GET /:clientId — 1件取得
// ============================================================
app.get('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const client = await clientRepo.getById(clientId);
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
  const existing = await clientRepo.getAll();
  const dup = existing.find(cl => cl.threeCode === body.threeCode && cl.clientId !== body.clientId);
  if (dup) {
    return apiError(c, 409, コード重複(body.threeCode, dup.companyName, dup.clientId));
  }
  body.clientId = await clientRepo.generateClientId();
  const client = await clientRepo.create(body);
  // 勘定科目マスタ・税区分マスタを即時コピー（遅延初期化を廃止）
  await accountMasterRepo.getClientAccountsFull(client.clientId);
  await taxMasterRepo.getClient(client.clientId);
  return c.json({ ok: true, client });
});

// ============================================================
// POST /bulk — 顧問先一括追加（インポート用）
// ============================================================
app.post('/bulk', async (c) => {
  const body = await c.req.json<{ items: Record<string, unknown>[] }>();
  const result = await clientRepo.bulkCreate(body.items);
  return c.json(result);
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
    const existing = await clientRepo.getAll();
    const dup = existing.find(cl => cl.threeCode === body.threeCode && cl.clientId !== clientId);
    if (dup) {
      return apiError(c, 409, コード重複(body.threeCode, dup.companyName, dup.clientId));
    }
  }
  await clientRepo.update(clientId, body);
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/staff — 担当者変更
// ============================================================
app.put('/:clientId/staff', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ staffId: string | null }>();
  await clientRepo.update(clientId, { staffId: body.staffId });
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-folder — Drive共有フォルダ設定
// ============================================================
app.put('/:clientId/shared-folder', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ folderId: string }>();
  await clientRepo.update(clientId, { sharedFolderId: body.folderId });
  return c.json({ ok: true });
});

// ============================================================
// PUT /:clientId/shared-email — 顧問先メール設定
// ============================================================
app.put('/:clientId/shared-email', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ email: string }>();
  await clientRepo.update(clientId, { sharedEmail: body.email });
  return c.json({ ok: true });
});

export default app;
