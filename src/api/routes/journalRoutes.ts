/**
 * journalRoutes.ts — 仕訳JSON永続化APIルート（Hono）
 *
 * エンドポイント:
 *   GET  /api/journals/:clientId                    — 顧問先の仕訳データ取得
 *   PUT  /api/journals/:clientId                    — 顧問先の仕訳データを全件上書き
 *   POST /api/journals/:clientId                    — 顧問先の仕訳データに追加
 *   POST /api/journals/:clientId/:journalId/validate — 1件バリデーション（Phase 1 Step 2）
 *   POST /api/journals/:clientId/validate-all        — 全件バリデーション（Phase 1 Step 3）
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */

import { Hono } from 'hono';
import { apiError } from '../helpers/apiError';
import { 配列必須 } from '../../constants/apiMessages';
import {
  getJournals,
  saveJournals,
  addJournals,
  updateJournal,
  deleteJournal,
} from '../services/journalStore';
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
import { searchSupporting } from '../services/migration/supportingSearchService';
import {
  getClientAccountsForValidation,
  getClientTaxCategoriesForValidation,
  getClientTaxCategories,
  getAccountNameMap,
  getTaxCategoryNameMap,
} from '../services/accountMasterApi';

const app = new Hono();

// ============================================================
// GET /:clientId — 顧問先の仕訳データ取得
// Phase 1 Step 4 拡張（2026-05-02）
// パラメータなし: 後方互換（raw全件返却。autoSave用）
// パラメータあり: 統合一覧（ソート・フィルタ・検索・過去仕訳CSV統合・ページング）
// ============================================================
app.get('/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const url = new URL(c.req.url);
  const hasQueryParams = url.searchParams.has('sort') || url.searchParams.has('search')
    || url.searchParams.has('showImported') || url.searchParams.has('page')
    || url.searchParams.has('filter') || url.searchParams.has('view');

  // パラメータなし → 後方互換（既存のautoSave等で使用）
  if (!hasQueryParams) {
    const journals = getJournals(clientId);
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
  const result = getJournalList(clientId, query);
  return c.json(result);
});

// ============================================================
// POST /:clientId/list — 統合一覧API（科目名ソート対応版）
// Phase 1 Step 5 追加（2026-05-02）
// Phase 2 改修（2026-05-03）: accountMap/taxMapがPOSTボディにない場合、
// サーバー側マスタから自動生成する。
// ============================================================
interface ListRequestBody {
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  showImported?: boolean
  showUnexported?: boolean
  showExported?: boolean
  showExcluded?: boolean
  showTrashed?: boolean
  voucherFilter?: string
  /** 期間フィルタ: 開始日（YYYY-MM-DD） */
  dateFrom?: string
  /** 期間フィルタ: 終了日（YYYY-MM-DD） */
  dateTo?: string
  /** 月フィルタ: 表示対象の月番号配列（1-12） */
  filterMonths?: number[]
  page?: number
  pageSize?: number
  accountMap?: Record<string, string>
  taxMap?: Record<string, string>
}

app.post('/:clientId/list', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<ListRequestBody>();

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
    accountMap: body.accountMap ?? getAccountNameMap(),
    taxMap: body.taxMap ?? getTaxCategoryNameMap(),
  };

  const result = getJournalList(clientId, query);
  return c.json(result);
});

// ============================================================
// PUT /:clientId — 顧問先の仕訳データを全件上書き保存
// ============================================================
app.put('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ journals: Record<string, unknown>[] }>();
  if (!body.journals || !Array.isArray(body.journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  saveJournals(clientId, body.journals);
  return c.json({ ok: true, count: body.journals.length });
});

// ============================================================
// POST /:clientId — 顧問先の仕訳データに追加
// ============================================================
app.post('/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ journals: Record<string, unknown>[] }>();
  if (!body.journals || !Array.isArray(body.journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  const added = addJournals(clientId, body.journals);
  // サーバーが上書き発番したIDリストを返す
  const serverIds = body.journals.map((j) => String(j.journalId ?? ''));
  return c.json({ ok: true, added, serverIds });
});

// ============================================================
// PATCH /:clientId/:journalId — 1件の仕訳を部分更新
// Phase C（2026-06-19）: セル編集消失バグ修正の一環
// ============================================================
app.patch('/:clientId/:journalId', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');
  const patch = await c.req.json<Record<string, unknown>>();
  // journalIdの上書きは禁止
  delete patch.journalId;
  const updated = updateJournal(clientId, journalId, patch);
  if (!updated) {
    return apiError(c, 404, `仕訳ID '${journalId}' が見つかりません`);
  }
  return c.json({ ok: true, journalId });
});

// ============================================================
// DELETE /:clientId/:journalId — 1件の仕訳をソフトデリート
// 断絶#27修正（deleteJournal APIなし）
// deleted_atに現在日時を設定。物理削除はしない。
// ============================================================
app.delete('/:clientId/:journalId', (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');
  const deleted = deleteJournal(clientId, journalId);
  if (!deleted) {
    return apiError(c, 404, `仕訳ID '${journalId}' が見つかりません`);
  }
  return c.json({ ok: true, journalId });
});

// ============================================================
// POST /:clientId/:journalId/validate — 1件バリデーション
// Phase 1 Step 2（2026-05-02）
// Phase 2 改修（2026-05-03）: accounts/taxCategories をサーバー側マスタから取得。
//   POSTボディの科目・税区分は不要。後方互換のためPOSTを維持。
// ============================================================
app.post('/:clientId/:journalId/validate', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = getClientAccountsForValidation(clientId);
  const taxCategories = getClientTaxCategoriesForValidation(clientId);

  // サーバー側ストアから仕訳データ取得
  const journals = getJournals<JournalForValidation>(clientId);
  const journal = journals.find(j => j.journalId === journalId);
  if (!journal) {
    return apiError(c, 404, `仕訳ID '${journalId}' が見つかりません`);
  }

  const result = validateJournal(journal, accounts, taxCategories);
  return c.json(result);
});

// ============================================================
// POST /:clientId/validate-all — 全件バリデーション
// Phase 1 Step 3（2026-05-02）
// Phase 2 改修（2026-05-03）: accounts/taxCategories をサーバー側マスタから取得。
// ============================================================
app.post('/:clientId/validate-all', async (c) => {
  const clientId = c.req.param('clientId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = getClientAccountsForValidation(clientId);
  const taxCategories = getClientTaxCategoriesForValidation(clientId);

  const journals = getJournals<JournalForValidation>(clientId);
  const results = journals.map(journal =>
    validateJournal(journal, accounts, taxCategories)
  );

  return c.json({ results, count: results.length });
});

// ============================================================
// POST /:clientId/:journalId/hints — ヒント・修正候補生成
// Phase 1 Step 6-A2（2026-05-03）
// Phase 2 改修（2026-05-03）: accounts/taxCategories をサーバー側マスタから取得。
//   POSTボディの科目・税区分は不要。
// ============================================================
app.post('/:clientId/:journalId/hints', async (c) => {
  const clientId = c.req.param('clientId');
  const journalId = c.req.param('journalId');

  // 顧問先別の科目・税区分を取得（データ駆動）
  const accounts = getClientAccountsForValidation(clientId);
  const taxCategories = getClientTaxCategories(clientId);

  // サーバー側ストアから仕訳データ取得
  const journals = getJournals<JournalForHint>(clientId);
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
  });
});

// ============================================================
// GET /:clientId/supporting-match — 証票マッチング（全件一括）
// Phase 1 Step 6-B2（2026-05-03）
// サーバー側で仕訳ストア + 根拠メタデータを取得し、
// N×Mマッチングを実行して紐づけ結果を返す。
// ============================================================
app.get('/:clientId/supporting-match', async (c) => {
  const clientId = c.req.param('clientId');

  // 仕訳データ取得
  const journals = getJournals<JournalForMatching>(clientId);

  // 根拠資料メタデータ取得（search-supportingと同じサービスを使用）
  const supportingMeta = searchSupporting(clientId, '') as SupportingMetaItem[];

  const result = getSupportingMatches(journals, supportingMeta);

  return c.json(result);
});

// ============================================================
// POST /:clientId/generate — 仕訳生成（サーバーサイド実行）
// #28: lineItemToJournalMockをフロントからサーバーに移動（2026-06-28）
//
// リクエスト: { documentIds: string[] }
// 処理:
//   1. documentIdsからDocEntryを取得（doc-store）
//   2. 各DocEntryのaiLineItemsをLineItem[]に変換
//   3. lineItemToJournalMock()をサーバー側で実行
//   4. addJournals()で永続化
//   5. 生成件数をレスポンスで返却
// ============================================================
app.post('/:clientId/generate', async (c) => {
  const clientId = c.req.param('clientId');
  const body = await c.req.json<{ documentIds: string[] }>();

  if (!body.documentIds || !Array.isArray(body.documentIds) || body.documentIds.length === 0) {
    return apiError(c, 400, 配列必須('documentIds'));
  }

  // 動的importで循環参照を回避
  const { getDocuments } = await import('../services/documentsApi');
  const { lineItemToJournalMock } = await import('../../utils/lineItemToJournalMock');
  const { getClientAccounts } = await import('../services/accountMasterApi');

  const allDocs = getDocuments(clientId);
  const accountMaster = getClientAccounts(clientId).accounts.map(a => ({
    accountId: a.accountId,
    defaultTaxCategoryId: a.defaultTaxCategoryId,
  }));

  let generatedCount = 0;

  for (const docId of body.documentIds) {
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

    addJournals(clientId, newJournals);
    generatedCount += newJournals.length;
    console.log(`[journals/generate] ${docEntry.fileName}: ${newJournals.length}件生成 (source_type=${sourceType}, isCreditCardPayment=${isCreditCardPayment})`);
  }

  console.log(`[journals/generate] 合計${generatedCount}件の仕訳を生成・永続化`);
  return c.json({ ok: true, generated: generatedCount });
});

export default app;
