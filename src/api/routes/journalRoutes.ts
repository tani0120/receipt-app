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
import { 配列必須 } from '../helpers/apiMessages';
import {
  getJournals,
  saveJournals,
  addJournals,
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
  getAccountsForValidation,
  getTaxCategoriesForValidation,
  getAccountNameMap,
  getTaxCategoryNameMap,
} from '../services/accountMasterStore';

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
    || url.searchParams.has('showPastCsv') || url.searchParams.has('page')
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
    showPastCsv: url.searchParams.get('showPastCsv') === 'true',
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
  showPastCsv?: boolean
  showUnexported?: boolean
  showExported?: boolean
  showExcluded?: boolean
  showTrashed?: boolean
  voucherFilter?: string
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
    showPastCsv: body.showPastCsv ?? false,
    showUnexported: body.showUnexported ?? true,
    showExported: body.showExported ?? true,
    showExcluded: body.showExcluded ?? false,
    showTrashed: body.showTrashed ?? false,
    voucherFilter: body.voucherFilter || undefined,
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
  const body = await c.req.json<{ journals: unknown[] }>();
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
  const body = await c.req.json<{ journals: unknown[] }>();
  if (!body.journals || !Array.isArray(body.journals)) {
    return apiError(c, 400, 配列必須('journals'));
  }
  const added = addJournals(clientId, body.journals);
  return c.json({ ok: true, added });
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

  // サーバー側マスタから科目・税区分を取得（Phase 2）
  const accounts = getAccountsForValidation();
  const taxCategories = getTaxCategoriesForValidation();

  // サーバー側ストアから仕訳データ取得
  const journals = getJournals(clientId) as JournalForValidation[];
  const journal = journals.find(j => j.id === journalId);
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

  // サーバー側マスタから科目・税区分を取得（Phase 2）
  const accounts = getAccountsForValidation();
  const taxCategories = getTaxCategoriesForValidation();

  const journals = getJournals(clientId) as JournalForValidation[];
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

  // サーバー側マスタから科目・税区分を取得（Phase 2）
  const accounts = getAccountsForValidation();
  const taxCategories = getTaxCategoriesForValidation();

  // サーバー側ストアから仕訳データ取得
  const journals = getJournals(clientId) as JournalForHint[];
  const journal = journals.find(j => j.id === journalId);
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
  const journals = getJournals(clientId) as JournalForMatching[];

  // 根拠資料メタデータ取得（search-supportingと同じサービスを使用）
  const supportingMeta = searchSupporting(clientId, '') as SupportingMetaItem[];

  const result = getSupportingMatches(journals, supportingMeta);

  return c.json(result);
});

export default app;
