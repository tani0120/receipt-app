import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import { mvpRoutes } from './routes/mvp';
import { useShareStatus } from '@/composables/useShareStatus';

export const routes: RouteRecordRaw[] = [
  // ログインページ（認証不要）
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/MockHomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mode-select',
    redirect: '/'
  },
  {
    path: '/legacy',
    redirect: '/'
  },
  // --- 旧パス互換リダイレクト → /old/ 配下に統一 ---
  // Phase B で旧レイアウト廃止後に一括削除する
  { path: '/journal-status', redirect: '/' },
  { path: '/collection-status', redirect: '/old/collection/demo' },
  { path: '/collection-status/:code', redirect: '/old/collection/demo' },
  // 旧ai-rulesは廃止。学習ページ(/learning/:clientId)に移行
  { path: '/data-conversion', redirect: '/old/data-conversion/demo' },
  { path: '/task-dashboard', redirect: '/old/tasks/demo' },

  { path: '/settings', redirect: '/client-settings/ABC-00001' },
  { path: '/settings/accounts', redirect: '/client-settings/accounts/ABC-00001' },
  { path: '/journal-list', redirect: '/' },
  // 旧Screen Aは廃止。新構造: /master/clients（一覧）および /settings/:clientId（個別）に統合。
  {
    path: '/clients',
    redirect: '/master/clients'
  },
  // 旧URL互換: /clients/:clientId/settings → /settings/:clientIdリダイレクト
  {
    path: '/clients/:clientId/settings',
    redirect: (to) => `/client-settings/${to.params.clientId}`
  },
  {
    path: '/client-settings/:clientId',
    name: 'ClientSettings',
    component: () => import('../views/MockSettingsPage.vue'),
    props: true
  },
  // 旧パス互換: /settings/:clientId → /client/settings/:clientId
  // 旧パス互換: /settings/:clientId, /client/settings/:clientId → /client-settings/:clientId
  { path: '/settings/:clientId', redirect: (to) => `/client-settings/${to.params.clientId}` },
  { path: '/client/settings/:clientId', redirect: (to) => `/client-settings/${to.params.clientId}` },
  // --- 旧Screen E 削除済み → ホームにリダイレクト ---
  { path: '/journal-entry/:id', redirect: '/' },
  // --- 資料回収 ---
  {
    path: '/collection',
    name: 'ClientCollection',
    component: () => import('../components/ScreenC_CollectionStatus.vue'),
  },
  // 旧パス互換
  { path: '/old/collection/:clientId', redirect: '/collection' },
  { path: '/collection/:clientId', redirect: '/collection' },



  // 旧パス互換: /old/settings-accounts → /client/settings/accounts/ABC-00001
  { path: '/old/settings-accounts', redirect: '/client/settings/accounts/ABC-00001' },

  // --- CSV変換 ---
  {
    path: '/csv-convert',
    name: 'ClientDataConversion',
    component: () => import('@/views/ScreenG_DataConversion.vue'),
  },
  // 旧パス互換
  { path: '/old/data-conversion/:clientId', redirect: '/csv-convert' },
  { path: '/csv-convert/:clientId', redirect: '/csv-convert' },
  // --- タスク管理 ---
  {
    path: '/task-board',
    name: 'ClientTasks',
    component: () => import('@/views/admin/ScreenH_TaskDashboard.vue'),
  },
  // 旧パス互換
  { path: '/old/tasks/:clientId', redirect: '/task-board' },
  { path: '/task-board/:clientId', redirect: '/task-board' },
  // --- 旧debug Screen E 削除済み → ホームにリダイレクト ---
  { path: '/debug/version-check/screen-e', redirect: '/' },

  // --- Phase 6: MVP Routes (完全分離) ---
  ...mvpRoutes,

  // --- Phase 6.2-A: Gemini OCR Test (Browser) ---
  {
    path: '/test-ocr',
    name: 'TestOCR',
    component: () => import('@/views/TestOCRPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- 証票詳細（receipt → document に統一済み） ---
  {
    path: '/old/documents/:clientId/:documentId',
    name: 'ClientDocument',
    component: () => import('@/views/DocumentDetail.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  // 旧パス互換（Phase Bで削除）
  { path: '/receipts/:id', redirect: '/old/documents/demo/:id' },
  // /journal-list ルート定義は削除（L38のリダイレクトで /old/journals/demo に転送済み）
  // --- 顧問先個別ページ ---
  {
    path: '/journal-list/:clientId',
    name: 'MockJournalList',
    component: () => import('@/components/JournalListLevel3Mock.vue'),
  },

  // --- 旧ワークベンチ(ScreenE)削除済み → ホームにリダイレクト ---
  { path: '/workbench/:clientId', redirect: '/' },


  {
    path: '/output/:clientId',
    name: 'MockOutputPortal',
    component: () => import('@/views/export/MockOutputPortalPage.vue'),
    props: true
  },
  {
    path: '/export/:clientId',
    name: 'MockExport',
    component: () => import('@/views/export/MockExportPage.vue'),
    props: true
  },
  {
    path: '/export-history/:clientId',
    name: 'MockExportHistory',
    component: () => import('@/views/export/MockExportHistoryPage.vue'),
    props: true
  },
  {
    path: '/export-detail/:clientId/:historyId',
    name: 'MockExportDetail',
    component: () => import('@/views/export/MockExportDetailPage.vue'),
    props: true
  },
  {
    path: '/excluded-history/:clientId',
    name: 'MockExcludedHistory',
    component: () => import('@/views/history/MockExcludedHistoryPage.vue'),
    props: true
  },
  {
    path: '/supporting-history/:clientId',
    name: 'MockSupportingHistory',
    component: () => import('@/views/history/MockSupportingHistoryPage.vue'),
    props: true
  },
  {
    path: '/drive-select/:clientId',
    name: 'MockDriveSelect',
    component: () => import('@/views/upload/MockDriveSelectPage.vue'),
    props: true
  },
  // 旧パス互換（/client/ 付き旧URL → 新URLにリダイレクト）
  { path: '/client/journal-list/:clientId', redirect: (to) => `/journal-list/${to.params.clientId}` },
  { path: '/client/export/:clientId', redirect: (to) => `/export/${to.params.clientId}` },
  { path: '/client/export-history/:clientId', redirect: (to) => `/export-history/${to.params.clientId}` },
  { path: '/client/export-detail/:clientId/:historyId', redirect: (to) => `/export-detail/${to.params.clientId}/${to.params.historyId}` },
  { path: '/client/drive-select/:clientId', redirect: (to) => `/drive-select/${to.params.clientId}` },

  { path: '/client/workbench/:clientId', redirect: (to) => `/workbench/${to.params.clientId}` },
  // --- 旧URL互換リダイレクト ---
  { path: '/mock/journal-list', redirect: '/journal-list/ABC-00001' },
  { path: '/mock/drive-select', redirect: '/drive-select/ABC-00001' },
  { path: '/mock/export', redirect: '/export/ABC-00001' },
  { path: '/mock/export-history', redirect: '/export-history/ABC-00001' },
  // --- 顧問先別設定（独立コンポーネント） ---
  {
    path: '/client-settings/accounts/:clientId',
    name: 'ClientAccountSettings',
    component: () => import('../views/client/MockClientAccountsPage.vue'),
    props: true
  },
  {
    path: '/client-settings/tax/:clientId',
    name: 'ClientTaxSettings',
    component: () => import('../views/client/MockClientTaxPage.vue'),
    props: true
  },
  {
    path: '/client-settings/vectors/:clientId',
    name: 'ClientVectorSettings',
    component: () => import('../views/client/MockClientIndustryVectorPage.vue'),
    props: true
  },
  // 旧パス互換
  { path: '/client/settings/accounts/:clientId', redirect: (to) => `/client-settings/accounts/${to.params.clientId}` },
  { path: '/client/settings/tax/:clientId', redirect: (to) => `/client-settings/tax/${to.params.clientId}` },
  { path: '/settings/accounts/:clientId', redirect: (to) => `/client-settings/accounts/${to.params.clientId}` },
  { path: '/settings/tax/:clientId', redirect: (to) => `/client-settings/tax/${to.params.clientId}` },
  // ===== 統合アップロード（レスポンシブ自動判定） =====
  // セレクター（統合版: 1ボタン化）
  {
    path: '/upload-v2/:clientId',
    name: 'UploadSelectorUnified',
    component: () => import('@/views/upload/MockUploadSelectorUnifiedPage.vue'),
  },
  // ===== 管理者ダッシュボード（事務所横断・顧問先ID不要） =====
  {
    path: '/admin-dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/MockAdminDashboardPage.vue'),
  },
  // ===== 過去仕訳CSV取込 =====
  {
    path: '/history-import/:clientId',
    name: 'HistoryImport',
    component: () => import('@/views/history/MockHistoryImportPage.vue'),
  },
  // スタッフ用アップロード（PC/モバイル自動判定）
  {
    path: '/upload/:clientId/staff',
    name: 'UploadStaff',
    component: () => import('@/views/upload/MockUploadUnifiedPage.vue'),
  },
  // ゲスト用アップロード（PC/モバイル自動判定）
  {
    path: '/upload/:clientId/guest',
    name: 'UploadGuest',
    component: () => import('@/views/upload/MockUploadUnifiedPage.vue'),
    meta: { guestAllowed: true },
  },

  // ===== 旧アップロード → 統合版リダイレクト =====
  // 旧セレクター → 統合セレクター
  { path: '/upload/:clientId', redirect: (to) => `/upload-v2/${to.params.clientId}` },
  // 旧スタッフ（mobile/pc分岐）→ 統合スタッフ（レスポンシブ自動判定）
  { path: '/upload/:clientId/staff/mobile', redirect: (to) => `/upload/${to.params.clientId}/staff` },
  { path: '/upload/:clientId/staff/pc', redirect: (to) => `/upload/${to.params.clientId}/staff` },
  // 旧ゲスト（mobile/pc分岐）→ 統合ゲスト（レスポンシブ自動判定）
  { path: '/upload/:clientId/guest/mobile', redirect: (to) => `/upload/${to.params.clientId}/guest` },
  { path: '/upload/:clientId/guest/pc', redirect: (to) => `/upload/${to.params.clientId}/guest` },
  {
    path: '/learning/:clientId',
    name: 'Learning',
    component: () => import('@/views/MockLearningPage.vue'),
    props: true
  },
  // 旧パス互換（/client/upload → 統合版）
  { path: '/client/upload/:clientId', redirect: (to) => `/upload-v2/${to.params.clientId}` },
  { path: '/client/upload/:clientId/mobile', redirect: (to) => `/upload/${to.params.clientId}/staff` },
  { path: '/client/upload/:clientId/pc', redirect: (to) => `/upload/${to.params.clientId}/staff` },
  { path: '/client/learning/:clientId', redirect: (to) => `/learning/${to.params.clientId}` },
  // 資料アップロード（バリデーションなし: 謄本・CSV・Excel等）
  {
    path: '/upload-docs/:clientId',
    name: 'UploadDocs',
    component: () => import('@/views/upload/MockUploadDocsPage.vue')
  },
  // 顧問先ゲスト用資料アップロード
  {
    path: '/upload-docs/:clientId/guest',
    name: 'UploadDocsGuest',
    component: () => import('@/views/upload/MockUploadDocsPage.vue'),
    meta: { guestAllowed: true },
  },
  { path: '/client/upload-docs/:clientId', redirect: (to) => `/upload-docs/${to.params.clientId}` },
  // ===== Driveアップロード（スマホ用: ファイルIDのみ送信。メモリゼロ） =====
  {
    path: '/drive-upload/:clientId',
    name: 'DriveUpload',
    component: () => import('@/views/upload/MockDriveUploadPage.vue'),
  },
  // ゲスト用Driveアップロード
  {
    path: '/drive-upload/:clientId/guest',
    name: 'DriveUploadGuest',
    component: () => import('@/views/upload/MockDriveUploadPage.vue'),
    meta: { guestAllowed: true },
  },
  { path: '/client/drive-upload/:clientId', redirect: (to) => `/drive-upload/${to.params.clientId}` },
  // --- 事務所共通マスタ（顧問先ID不要） ---
  {
    path: '/master/accounts',
    name: 'MasterAccounts',
    component: () => import('@/views/master/MockMasterAccountsPage.vue')
  },
  {
    path: '/master/tax',
    name: 'MasterTaxCategories',
    component: () => import('@/views/master/MockMasterTaxCategoriesPage.vue')
  },
  {
    path: '/master/vectors',
    name: 'MasterIndustryVectors',
    component: () => import('@/views/master/MockMasterIndustryVectorPage.vue')
  },
  // /master/vendors → /master にリダイレクト（統合済み）
  { path: '/master/vendors', redirect: '/master' },
  {
    path: '/master/vendors/list',
    name: 'MasterVendorsList',
    component: () => import('@/views/master/MockMasterVendorsPage.vue')
  },
  {
    path: '/master/vendors/non-vendor',
    name: 'MasterNonVendor',
    component: () => import('@/views/master/MockMasterNonVendorPage.vue')
  },
  // 旧パスリダイレクト
  { path: '/settings/accounts', redirect: '/client-settings/accounts/ABC-00001' },
  { path: '/master/tax-categories', redirect: '/master/tax' },
  { path: '/accounts/:clientId', redirect: (to) => `/client-settings/accounts/${to.params.clientId}` },
  { path: '/tax/:clientId', redirect: (to) => `/client-settings/tax/${to.params.clientId}` },
  {
    path: '/master/clients',
    name: 'MasterClients',
    component: () => import('@/views/master/MockMasterClientsPage.vue')
  },
  // 顧問先 新規追加（/newは/:clientIdより先に定義してマッチ優先）
  {
    path: '/master/clients/new',
    name: 'ClientNew',
    component: () => import('@/views/master/ClientEditPage.vue')
  },
  // 顧問先 編集ページ
  {
    path: '/master/clients/:clientId',
    name: 'ClientEdit',
    component: () => import('@/views/master/ClientEditPage.vue')
  },
  // 旧パスリダイレクト（/clients/list → /master/clients）
  { path: '/clients/list', redirect: '/master/clients' },
  // 見込先一覧
  {
    path: '/master/leads',
    name: 'MasterLeads',
    component: () => import('@/views/master/LeadListPage.vue')
  },
  // 見込先 新規追加
  {
    path: '/master/leads/new',
    name: 'LeadNew',
    component: () => import('@/views/master/LeadEditPage.vue')
  },
  // 見込先 編集ページ
  {
    path: '/master/leads/:leadId',
    name: 'LeadEdit',
    component: () => import('@/views/master/LeadEditPage.vue')
  },
  // /master ハブ（勘定科目マスタ + 税区分マスタの分岐ページ）
  {
    path: '/master',
    name: 'MasterHub',
    component: () => import('@/views/master/MockMasterManagementPage.vue')
  },
  {
    path: '/master/costs',
    name: 'MasterCosts',
    component: () => import('@/views/MockCostsPage.vue')
  },
  {
    path: '/master/settings',
    name: 'MasterSettings',
    component: () => import('@/views/MockSettingsHubPage.vue')
  },
  {
    path: '/master/progress/:code?',
    name: 'ProgressDetail',
    component: () => import('@/views/admin/MockProgressDetailPage.vue')
  },
  // 旧パス互換: /progress → /master/progress
  { path: '/progress/:code?', redirect: (to) => `/master/progress${to.params.code ? '/' + to.params.code : ''}` },
  {
    path: '/master/staff',
    name: 'MasterStaff',
    component: () => import('@/views/master/MockMasterStaffPage.vue')
  },
  // --- 顧問先ゲストポータル（ナビバーなし・顧問先専用UI） ---
  {
    path: '/guest/:clientId',
    name: 'GuestPortal',
    component: () => import('@/views/portal/MockPortalPage.vue'),
    meta: { guestAllowed: true },
    beforeEnter: async (to) => {
      const clientId = to.params.clientId as string;
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (!res.ok) {
          console.warn(`[guest] 顧問先 ${clientId} が見つかりません`);
          return '/404';
        }
        const { client } = await res.json();
        if (client.status !== 'active') {
          console.warn(`[guest] 顧問先 ${clientId} は ${client.status} です`);
          return '/404';
        }
      } catch (err) {
        console.error('[guest] 顧問先ステータス確認エラー:', err);
        return '/404';
      }
      return undefined;
    },
  },
  {
    path: '/guest/:clientId/login',
    name: 'GuestLogin',
    component: () => import('@/views/portal/MockPortalLoginPage.vue'),
    meta: { guestAllowed: true },
    beforeEnter: (to) => {
      const clientId = to.params.clientId as string;
      // 招待リンク経由フラグ（/invite/:code → resolveInviteCode → リダイレクト時にセット）
      const inviteRef = sessionStorage.getItem(`invite_ref_${clientId}`);
      // ゲストログイン済みフラグ
      const guestAuth = localStorage.getItem(`guest_google_${clientId}`);
      if (!inviteRef && !guestAuth) {
        console.warn(`[guest] /guest/${clientId}/login への直接アクセスを拒否`);
        return '/404';
      }
      return undefined;
    },
  },
  // 旧パス互換（/portal/ → /guest/ or Drive方式）
  { path: '/portal/:clientId', redirect: (to) => `/guest/${to.params.clientId}` },
  { path: '/portal/:clientId/login', redirect: (to) => `/guest/${to.params.clientId}/login` },
  { path: '/portal/:clientId/mobile', redirect: (to) => `/drive-upload/${to.params.clientId}/guest` },
  { path: '/portal/:clientId/pc', redirect: (to) => `/upload-docs/${to.params.clientId}/guest` },
  { path: '/portal/:clientId/docs', redirect: (to) => `/upload-docs/${to.params.clientId}/guest` },
  // --- 招待リンク（コード→clientId逆引き→ゲストログインにリダイレクト） ---
  {
    path: '/invite/:code',
    name: 'InviteRedirect',
    // リダイレクト専用ルート。beforeEnterでサーバー問い合わせ→ゲストログインに転送。
    component: () => import('@/views/portal/MockPortalLoginPage.vue'),
    meta: { guestAllowed: true },
    beforeEnter: async (to) => {
      const { resolveInviteCode, loadAll, getStatusFromCache } = useShareStatus()
      const code = to.params.code as string
      const clientId = await resolveInviteCode(code)
      if (!clientId) {
        console.warn(`[invite] 招待コード「${code}」に対応する顧問先が見つかりません`)
        return '/404'
      }
      // 共有停止中 → 404
      await loadAll()
      const status = getStatusFromCache(clientId)
      if (status === 'revoked') {
        console.warn(`[invite] 顧問先 ${clientId} は共有停止中です`)
        return '/404'
      }
      // 招待経由フラグをセット（/guest/:clientId/loginのbeforeEnterで検証）
      sessionStorage.setItem(`invite_ref_${clientId}`, code);
      return `/guest/${clientId}/login`
    },
  },
  // --- 404ページ ---
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/MockNotFoundPage.vue'),
    meta: { guestAllowed: true },
  },
  // 未定義ルート → 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Supabase Auth 認証状態の読み込みを待つPromise
let authInitialized = false;
const authReadyPromise = new Promise<void>((resolve) => {
  import('@/utils/auth').then(({ onAuthStateChanged }) => {
    const unsubscribe = onAuthStateChanged(() => {
      if (!authInitialized) {
        authInitialized = true;
        resolve();
        unsubscribe();
      }
    });
  });
});

// 認証ガード（全環境で有効）

router.beforeEach(async (to) => {
  // 認証初期化を待つ（Supabase Auth読み込み完了まで）
  await authReadyPromise;

  // ログインページ・ゲスト許可ルートは認証不要
  if (to.path === '/login' || to.meta.guestAllowed) {
    return;
  }

  // スタッフ認証チェック（Supabase Auth JWT）
  // ※ validateStaffAccess()はログイン時に1回実行済み。
  //   ここではJWTセッションの存在のみ確認する。
  const { getCurrentUserAsync } = await import('@/utils/auth');
  const user = await getCurrentUserAsync();
  if (!user) {
    return '/404';
  }
  return true;
})

// ============================================================
// 活動トラッキング（ページ遷移時に自動計測）
// ============================================================
import { startTracking, stopTracking } from '@/composables/useActivityTracker';

router.afterEach((to) => {
  // 前のページの計測を停止
  stopTracking();
  // 新しいページの計測を開始（対象外ページは内部でスキップ）
  startTracking(to.path);
});

export default router

