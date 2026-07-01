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
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { apiError } from '../helpers/apiError';
import { 未検出, 必須, コード重複, リソース_見込先 } from '../../constants/apiMessages';
import type { LeadStatus, Lead, Client } from '../../repositories/types';
import { createMockRepositories } from '../../repositories/mock'

const repos = createMockRepositories()
const leadRepo = repos.lead
const staffRepo = repos.staff
const clientRepo = repos.client
const accountMasterRepo = repos.accountMaster
const taxMasterRepo = repos.taxMaster

/** Lead部分更新用zodスキーマ（全フィールドoptional。Client型と同一構造） */
const leadPartialSchema = z.object({
  threeCode: z.string().optional(),
  companyName: z.string().optional(),
  companyNameKana: z.string().optional(),
  type: z.enum(['corp', 'individual', 'sole_proprietor']).optional(),
  repName: z.string().optional(),
  repNameKana: z.string().optional(),
  contact: z.object({
    type: z.enum(['email', 'chatwork', 'none']),
    value: z.string(),
  }).optional(),
  fiscalMonth: z.number().optional(),
  fiscalDay: z.union([z.string(), z.number()]).optional(),
  industry: z.string().optional(),
  establishedDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'converted', 'suspension']).optional(),
  accountingSoftware: z.enum(['mf', 'freee', 'yayoi', 'tkc', 'other']).optional(),
  taxFilingType: z.enum(['blue', 'white']).optional(),
  consumptionTaxMode: z.enum(['individual', 'proportional', 'simplified', 'exempt']).optional(),
  simplifiedTaxCategory: z.number().optional(),
  taxMethod: z.enum(['tax_included', 'tax_excluded_included', 'tax_excluded_separate']).optional(),
  calculationMethod: z.enum(['accrual', 'cash', 'interim_cash']).optional(),
  defaultPaymentMethod: z.enum(['cash', 'owner_loan', 'accounts_payable']).optional(),
  isInvoiceRegistered: z.boolean().optional(),
  invoiceRegistrationNumber: z.string().optional(),
  hasDepartmentManagement: z.boolean().optional(),
  hasRentalIncome: z.boolean().optional(),
  staffId: z.string().nullable().optional(),
  sharedFolderId: z.string().optional(),
  sharedEmail: z.string().optional(),
  advisoryFee: z.number().optional(),
  bookkeepingFee: z.number().optional(),
  settlementFee: z.number().optional(),
  taxFilingFee: z.number().optional(),
}).passthrough()  // Kintone拡張フィールド・ニーズ・報酬拡張等を許容

/** POST /list のリクエストbody */
const listQuerySchema = z.object({
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.union([z.string(), z.array(z.string())]),
  })).optional(),
  logic: z.enum(['and', 'or']).optional(),
  sorts: z.array(z.object({
    key: z.string(),
    order: z.enum(['asc', 'desc']),
  })).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough()

const route = new Hono()
// POST /list — 見込先一覧（フィルタ+ソート+ページネーション）
// staffNameソートが必要な場合はRoute層で結合（Repositoryは単一ドメイン）
.post('/list',
  zValidator('json', listQuerySchema),
  async (c) => {
  const body = c.req.valid('json');
  const sorts = body.sorts as { key: string; order: 'asc' | 'desc' }[] | undefined
  const hasStaffSort = sorts?.some(s => s.key === 'staffId')

  if (hasStaffSort) {
    // staffNameソート: 全件取得→staffMapで結合ソート→自前ページネーション
    const allResult = await leadRepo.list({
      ...body,
      sorts: sorts!.filter(s => s.key !== 'staffId'),
      page: undefined,
      pageSize: undefined,
    })
    const staffAll = await staffRepo.getAll()
    const staffMap = new Map(staffAll.map(s => [s.uuid, s.name]))

    const staffSortDef = sorts!.find(s => s.key === 'staffId')!
    allResult.rows.sort((a, b) => {
      const sa = (a.staffId ? staffMap.get(a.staffId) : '') ?? ''
      const sb = (b.staffId ? staffMap.get(b.staffId) : '') ?? ''
      const cmp = sa.localeCompare(sb, 'ja')
      return staffSortDef.order === 'asc' ? cmp : -cmp
    })

    const page = body.page ?? 1
    const pageSize = body.pageSize ?? 50
    const totalCount = allResult.rows.length
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const start = (page - 1) * pageSize
    const paged = allResult.rows.slice(start, start + pageSize)

    return c.json({ rows: paged, totalCount, page, pageSize, totalPages })
  }

  const result = await leadRepo.list(body);
  return c.json(result);
})
// GET / — 全見込先取得
.get('/', async (c) => {
  const status = c.req.query('status');
  const staffId = c.req.query('staffId');

  if (status === 'active') {
    const list = await leadRepo.getActiveLeads();
    return c.json({ leads: list, count: list.length });
  }
  if (status) {
    const list = await leadRepo.getByStatus(status as LeadStatus);
    return c.json({ leads: list, count: list.length });
  }
  if (staffId) {
    const list = await leadRepo.getByStaffId(staffId);
    return c.json({ leads: list, count: list.length });
  }
  const list = await leadRepo.getAll();
  return c.json({ leads: list, count: list.length });
})
// GET /:leadId — 1件取得
.get('/:leadId', async (c) => {
  const leadId = c.req.param('leadId');
  const lead = await leadRepo.getById(leadId);
  if (!lead) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ lead });
})
// POST / — 見込先追加（サーバーが常にID発番）
.post('/',
  zValidator('json', leadPartialSchema),
  async (c) => {
  const body = c.req.valid('json') as Record<string, unknown>;
  if (!body.threeCode) {
    return apiError(c, 400, 必須('threeCode'));
  }
  if (!body.companyName && !body.repName) {
    return apiError(c, 400, 必須('companyName または repName'));
  }
  // threeCode重複チェック
  const existing = await leadRepo.getAll();
  const dup = existing.find(l => l.threeCode === body.threeCode && l.leadId !== body.leadId);
  if (dup) {
    return apiError(c, 409, コード重複(body.threeCode as string, dup.companyName, dup.leadId));
  }
  // サーバーが常にIDを発番。フロントからのIDは無視。
  body.leadId = await leadRepo.generateLeadId();
  const lead = await leadRepo.create(body as unknown as Lead);
  return c.json({ ok: true, lead });
})
// POST /bulk — 見込先一括追加（インポート用）
.post('/bulk',
  zValidator('json', z.object({ items: z.array(leadPartialSchema) })),
  async (c) => {
  const { items } = c.req.valid('json');
  const existing = await leadRepo.getAll();
  const existingCodes = new Set(existing.map(l => l.threeCode?.toUpperCase()).filter(Boolean));
  const existingNames = new Set(existing.map(l => l.companyName).filter(Boolean));
  const results: { index: number; ok: boolean; leadId?: string; threeCode?: string; companyName?: string; error?: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]! as Record<string, unknown>;
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
      item.leadId = await leadRepo.generateLeadId();
      const saved = await leadRepo.create(item as unknown as Lead);
      if (code) existingCodes.add(code);
      if (name) existingNames.add(name);
      results.push({ index: i, ok: true, leadId: saved.leadId, threeCode: saved.threeCode, companyName: saved.companyName });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err) });
    }
  }
  return c.json({ ok: true, results, total: items.length });
})
// PUT /:leadId — 見込先更新
.put('/:leadId',
  zValidator('json', leadPartialSchema),
  async (c) => {
  const leadId = c.req.param('leadId');
  const body = c.req.valid('json');
  // バリデーション（顧問先と統一）
  if (body.threeCode !== undefined && !body.threeCode) {
    return apiError(c, 400, 必須('threeCode'));
  }
  if (body.companyName !== undefined && body.repName !== undefined && !body.companyName && !body.repName) {
    return apiError(c, 400, 必須('companyName または repName'));
  }
  // threeCode重複チェック（変更時のみ）
  if (body.threeCode) {
    const existing = await leadRepo.getAll();
    const dup = existing.find(l => l.threeCode === body.threeCode && l.leadId !== leadId);
    if (dup) {
      return apiError(c, 409, コード重複(body.threeCode, dup.companyName, dup.leadId));
    }
  }
  await leadRepo.update(leadId, body);
  return c.json({ ok: true });
})
// PUT /:leadId/staff — 担当者変更
.put('/:leadId/staff',
  zValidator('json', z.object({ staffId: z.string().nullable() })),
  async (c) => {
  const leadId = c.req.param('leadId');
  const body = c.req.valid('json');
  const ok = await leadRepo.updateStaffAssignment(leadId, body.staffId as string);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
})
// PUT /:leadId/shared-folder — Drive共有フォルダ設定
.put('/:leadId/shared-folder',
  zValidator('json', z.object({ folderId: z.string() })),
  async (c) => {
  const leadId = c.req.param('leadId');
  const body = c.req.valid('json');
  const ok = await leadRepo.updateSharedFolderId(leadId, body.folderId);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
})
// PUT /:leadId/shared-email — メール設定
.put('/:leadId/shared-email',
  zValidator('json', z.object({ email: z.string() })),
  async (c) => {
  const leadId = c.req.param('leadId');
  const body = c.req.valid('json');
  const ok = await leadRepo.updateSharedEmail(leadId, body.email);
  if (!ok) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  return c.json({ ok: true });
})
// POST /:leadId/convert — 見込先→顧問先昇格（コピー方式）
.post('/:leadId/convert', async (c) => {
  const leadId = c.req.param('leadId');
  const lead = await leadRepo.getById(leadId);
  if (!lead) {
    return apiError(c, 404, 未検出(`${リソース_見込先} ${leadId}`));
  }
  // 既にconvertedの場合はエラー
  if (lead.status === 'converted') {
    return apiError(c, 409, `見込先「${lead.companyName}」は既に顧問先化済みです`);
  }

  // 見込先の共通フィールドを顧問先にコピー（見込先固有フィールド除外）
  const clientId = await clientRepo.generateClientId();
  // Lead と Client は構造的に同一フィールドを持つ（repositories/types.ts 参照）
  // leadId/status のみ Lead 固有なので除外し、Client 固有の clientId/status/sourceLeadId を付与
  const { leadId: _lid, status: _status, ...commonFields } = lead;
  const clientData: Client = {
    ...commonFields,
    clientId,
    status: 'active',
    sourceLeadId: leadId,
  };

  // 顧問先として登録
  const saved = await clientRepo.create(clientData);

  // 勘定科目マスタ・税区分マスタを即時コピー
  await accountMasterRepo.getClientAccountsFull(saved.clientId);
  await taxMasterRepo.getClient(saved.clientId);

  // 元見込先のstatusを'converted'に変更
  await leadRepo.update(leadId, { status: 'converted' });

  console.log(`[leads] 昇格完了: ${lead.companyName} (${leadId} → ${clientId})`);
  return c.json({ ok: true, client: saved, sourceLeadId: leadId });
});

export default route;
