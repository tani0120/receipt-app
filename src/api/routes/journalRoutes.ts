/**
 * journalRoutes.ts — 仕訳JSON永続化APIルート（Hono）
 *
 * エンドポイント:
 *   GET  /api/journals/:clientId                    — 顧問先の仕訳データ取得
 *   POST /api/journals/:clientId                    — 顧問先の仕訳データに追加
 *   POST /api/journals/:clientId/:journalId/validate — 1件バリデーション（Phase 1 Step 2）
 *   POST /api/journals/:clientId/validate-all        — 全件バリデーション（Phase 1 Step 3）
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 * Phase 3-3: PUT /:clientId（全件上書き）廃止。journalStore直接import全廃。
 *   全操作をJournalRepository経由に統一。
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { apiError } from '../helpers/apiError';
import { 配列必須 } from '../../constants/apiMessages';
import { journalSchema } from '../../types/journal.schema';
import type { Journal } from '../../types/journal.type';
import { createMockRepositories } from '../../repositories/mock';
import {
  validateJournal,
  type JournalForValidation,
} from '../services/journalValidation';
import { getJournalList, type JournalListQuery } from '../services/journalListService';
import {
  generateHintValidations,
  generateHintSuggestions,
  type JournalForHint,
} from '../services/journalHintService';
import {
  getSupportingMatches,
  type SupportingMetaItem,
  type JournalForMatching,
} from '../services/journalSupportingService';

const repos = createMockRepositories();
const journalRepo = repos.journal;
const accountMasterRepo = repos.accountMaster;
const taxMasterRepo = repos.taxMaster;
const documentRepo = repos.document;
const supportingSearchRepo = repos.supportingSearch;

const route = new Hono()
.get('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const url = new URL(c.req.url);
  const hasQueryParams = url.searchParams.has('sort') || url.searchParams.has('search')
    || url.searchParams.has('showImported') || url.searchParams.has('page')
    || url.searchParams.has('filter') || url.searchParams.has('view');

  // パラメータなし → 後方互換（既存のautoSave等で使用）
  if (!hasQueryParams) {
    const journals = await journalRepo.list(clientId);
    return c.json({ journals, count: journals.length });
  }

  // パラメータあり → 統合一覧API
  const query: JournalListQuery = {
    sort: url.searchParams.get('sort') || undefined,
    order: (url.searchParams.get('order') as 'asc' | 'desc') || undefined,
    search: url.searchParams.get('search') || undefined,
    showImported: url.searchParams.get('showImported') === 'true',
    showUnexported: url.searchParams.get('showUnexported') !== 'false', // デフォルトtrue
    showExported: url.searchParams.get('showExported') !== 'false',     // デフォルトtrue
    showExcluded: url.searchParams.get('showExcluded') === 'true',      // デフォルトfalse
    showTrashed: url.searchParams.get('showTrashed') === 'true',        // デフォルトfalse
    voucherFilter: url.searchParams.get('filter') || undefined,
    page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined,
    pageSize: url.searchParams.has('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined,
  };

  // view=list を統合一覧モード判定に使用（将来用のフラグ）
  const result = await getJournalList(clientId, query);
  return c.json(result);
})
// POST /:clientId/list
.post('/:clientId/list',
  zValidator('json', z.object({
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    showImported: z.boolean().optional(),
    showUnexported: z.boolean().optional(),
    showExported: z.boolean().optional(),
    showExcluded: z.boolean().optional(),
    showTrashed: z.boolean().optional(),
    voucherFilter: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    filterMonths: z.array(z.number()).optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
    accountMap: z.record(z.string(), z.string()).optional(),
    taxMap: z.record(z.string(), z.string()).optional(),
  })),
  async (c) => {
  const clientId = c.req.param('clientId');
  const body = c.req.valid('json');

  const query: JournalListQuery = {
    sort: body.sort || undefined,
    order: body.order || undefined,
    search: body.search || undefined,
    showImported: body.showImported ?? false,
    showUnexported: body.showUnexported ?? true,
    showExported: body.showExported ?? true,
    showExcluded: body.showExcluded ?? false,
    showTrashed: body.showTrashed ?? false,
    voucherFilter: body.voucherFilter || undefined,
    dateFrom: body.dateFrom || undefined,
    dateTo: body.dateTo || undefined,
    filterMonths: body.filterMonths?.length ? body.filterMonths : undefined,
    page: body.page,
    pageSize: body.pageSize,
    // Phase 2: フロントからのマップがなければサーバー側マスタから自動生成
    accountMap: body.accountMap ?? await accountMasterRepo.getAccountNameMap(),
    taxMap: body.taxMap ?? await taxMasterRepo.getNameMap(),
  };

  const result = await getJournalList(clientId, query);
  return c.json(result);
})
.post('/:clientId',
  zValidator('json', z.object({ journals: z.array(journalSchema) })),
  async (c) => {
  const clientId = c.req.param('clientId');
  const { journals } = c.req.valid('json');
  if (!journals || !Array.isArray(journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  const result = await journalRepo.createMany(clientId, journals as unknown as Journal[]);
  // Repository が上書き発番後のIDリストと追加件数を返す
  return c.json({ ok: true, added: result.added, serverIds: result.ids })
})
// PATCH /:clientId/:journalId
.patch('/:clientId/:journalId', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');
  const patch = await c.req.json<Record<string, unknown>>();
  // journalIdの上書きは禁止
  delete patch.journalId;
  const updated = await journalRepo.update(clientId, journalId, patch as Partial<Journal>);
  if (!updated) {
    return apiError(c, 404, `仕訳が見つかりません: ${journalId}`);
  }
  return c.json({ ok: true, journalId })
})
// DELETE /:clientId/:journalId
.delete('/:clientId/:journalId', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');
  const deleted = await journalRepo.delete(clientId, journalId);
  if (!deleted) {
    return apiError(c, 404, `仕訳が見つかりません: ${journalId}`);
  }
  return c.json({ ok: true, journalId })
})
// POST /:clientId/:journalId/validate
.post('/:clientId/:journalId/validate', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = await accountMasterRepo.getClientAccountsForValidation(clientId);
  const taxCategories = await taxMasterRepo.getClientTaxCategoriesForValidation(clientId);

  // Repository経由で仕訳データ取得
  const journals = await journalRepo.list(clientId) as unknown as JournalForValidation[];
  const journal = journals.find(j => j.journalId === journalId);
  if (!journal) {
    return apiError(c, 404, `仕訳ID '${journalId}' が見つかりません`);
  }

  const result = validateJournal(journal, accounts, taxCategories);
  return c.json(result);
})
// POST /:clientId/validate-all
.post('/:clientId/validate-all', async (c) => {
  const clientId = c.req.param('clientId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = await accountMasterRepo.getClientAccountsForValidation(clientId);
  const taxCategories = await taxMasterRepo.getClientTaxCategoriesForValidation(clientId);

  const journals = await journalRepo.list(clientId) as unknown as JournalForValidation[];
  const results = journals.map(journal =>
    validateJournal(journal, accounts, taxCategories)
  );

  return c.json({ results, count: results.length })
})
// POST /:clientId/:journalId/hints
.post('/:clientId/:journalId/hints', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = await accountMasterRepo.getClientAccountsForValidation(clientId);
  const taxCategoriesData = await taxMasterRepo.getClient(clientId);
  const taxCategories = taxCategoriesData.taxCategories;

  // Repository経由で仕訳データ取得
  const journals = await journalRepo.list(clientId) as unknown as JournalForHint[];
  const journal = journals.find(j => j.journalId === journalId);
  if (!journal) {
    return apiError(c, 404, `仕訳ID '${journalId}' が見つかりません`);
  }

  const validations = generateHintValidations(journal, accounts);
  const suggestions = generateHintSuggestions(journal, accounts, taxCategories);

  return c.json({
    journalId,
    validations,
    suggestions,
  })
})
// GET /:clientId/supporting-match
.get('/:clientId/supporting-match', async (c) => {
  const clientId = c.req.param('clientId');

  // Repository経由で仕訳データ取得
  const journals = await journalRepo.list(clientId) as unknown as JournalForMatching[];

  // 根拠資料メタデータ取得（Repository経由）
  const supportingMeta = await supportingSearchRepo.searchSupporting(clientId, '') as SupportingMetaItem[];

  const result = getSupportingMatches(journals, supportingMeta);

  return c.json(result);
})
// POST /:clientId/generate
.post('/:clientId/generate',
  zValidator('json', z.object({ documentIds: z.array(z.string()) })),
  async (c) => {
  const clientId = c.req.param('clientId');
  const { documentIds } = c.req.valid('json');

  if (!documentIds || documentIds.length === 0) {
    return apiError(c, 400, 配列必須('documentIds'));
  }

  // 動的importで循環参照を回避
  const { lineItemToJournalMock } = await import('../../utils/lineItemToJournalMock');

  const allDocs = await documentRepo.getByClientId(clientId);
  const accountData = await accountMasterRepo.getClientAccountsFull(clientId);
  const accountMaster = accountData.accounts.map(a => ({
    accountId: a.accountId,
    defaultTaxCategoryId: a.defaultTaxCategoryId,
  }));

  let generatedCount = 0;

  for (const docId of documentIds) {
    const docEntry = allDocs.find(d => d.id === docId);
    if (!docEntry?.aiLineItems || docEntry.aiLineItems.length === 0) {
      console.log(`[journals/generate] ${docId}: aiLineItemsなし（スキップ）`);
      continue;
    }

    // DocEntry.aiLineItems → LineItem[] に変換
    const lineItems = docEntry.aiLineItems.map(li => ({
      date: li.date,
      description: li.description,
      amount: li.amount,
      direction: li.direction,
      balance: li.balance,
      line_index: li.line_index,
      determined_account: li.determined_account ?? null,
      tax_category: li.tax_category ?? null,
      sub_account: li.sub_account ?? null,
      vendor_name: li.vendor_name ?? null,
      level: li.level,
      candidates: li.candidates,
    }));

    const sourceType = (docEntry.aiSourceType as import('../../types/pipeline/source_type.type').SourceType) || 'receipt';
    // クレカ払い判定: DocEntryのaiIsCreditCardPaymentを使用（#28: AI判定結果）
    const isCreditCardPayment = docEntry.aiIsCreditCardPayment ?? false;

    const newJournals = lineItemToJournalMock(
      lineItems,
      sourceType,
      clientId,
      isCreditCardPayment,
      docEntry.id,
      null,           // accountResults（学習ルールは既にfirstAiで適用済み）
      accountMaster,
    );

    const result = await journalRepo.createMany(clientId, newJournals);
    generatedCount += result.added;
    console.log(`[journals/generate] ${docEntry.fileName}: ${newJournals.length}件生成 (source_type=${sourceType}, isCreditCardPayment=${isCreditCardPayment})`);
  }

  console.log(`[journals/generate] 合計${generatedCount}件の仕訳を生成・永続化`);
  return c.json({ ok: true, generated: generatedCount });
});

export default route;
