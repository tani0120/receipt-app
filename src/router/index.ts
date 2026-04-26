import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import ScreenB_Restore_Mock from '@/views/debug/ScreenB_Restore_Mock.vue';
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
    component: () => import('../mocks/views/MockHomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mode-select',
    redirect: '/'
  },
  {
    path: '/legacy',
    redirect: '/old/journals/demo'
  },
  // --- 旧パス互換リダイレクト → /old/ 配下に統一 ---
  // Phase B で旧レイアウト廃止後に一括削除する
  { path: '/journal-status', redirect: '/old/journals/demo' },
  { path: '/collection-status', redirect: '/old/collection/demo' },
  { path: '/collection-status/:code', redirect: '/old/collection/demo' },
  // 旧ai-rulesは廃止。学習ページ(/learning/:clientId)に移行
  { path: '/data-conversion', redirect: '/old/data-conversion/demo' },
  { path: '/task-dashboard', redirect: '/old/tasks/demo' },
  { path: '/admin-settings', redirect: '/old/admin' },
  { path: '/settings', redirect: '/client-settings/ABC-00001' },
  { path: '/settings/accounts', redirect: '/client-settings/accounts/ABC-00001' },
  { path: '/journal-list', redirect: '/old/journals/demo' },
  {
    path: '/old/screen-b-mock',
    name: 'ScreenB_Restore_Mock',
    component: ScreenB_Restore_Mock
  },
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
    component: () => import('../mocks/views/MockSettingsPage.vue'),
    props: true
  },
  // 旧パス互換: /settings/:clientId → /client/settings/:clientId
  // 旧パス互換: /settings/:clientId, /client/settings/:clientId → /client-settings/:clientId
  { path: '/settings/:clientId', redirect: (to) => `/client-settings/${to.params.clientId}` },
  { path: '/client/settings/:clientId', redirect: (to) => `/client-settings/${to.params.clientId}` },
  {
    path: '/old/journals/:clientId',
    name: 'ClientJournals',
    component: () => import('../views/ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/old/jobs/:clientId/:jobId',
    name: 'ClientJob',
    component: () => import('../views/ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/old/collection/:clientId',
    name: 'ClientCollection',
    component: () => import('../components/ScreenC_CollectionStatus.vue'),
    props: true
  },
  // 旧ScreenD_AIRulesは廃止・削除済み。学習ページ(/learning/:clientId)に移行
  {
    path: '/old/journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../components/ScreenE_JournalEntry.vue'),
    props: true
  },
  // --- 新型仕訳エントリー画面（ScreenE_Workbench。?mode=work対応） ---
  {
    path: '/journal-entry/:id',
    name: 'JournalEntry',
    component: () => import('@/views/ScreenE_Workbench.vue'),
    props: true
  },



  // 旧パス互換: /old/settings-accounts → /client/settings/accounts/ABC-00001
  { path: '/old/settings-accounts', redirect: '/client/settings/accounts/ABC-00001' },
  {
    path: '/old/admin',
    name: 'AdminSettings',
    component: () => import('../views/ScreenZ_AdminSettings.vue')
  },
  {
    path: '/old/data-conversion/:clientId',
    name: 'ClientDataConversion',
    component: () => import('@/views/ScreenG_DataConversion.vue'),
    props: true
  },
  {
    path: '/old/tasks/:clientId',
    name: 'ClientTasks',
    component: () => import('@/views/ScreenH_TaskDashboard.vue'),
    props: true
  },
  // --- Phase 2: Isolation Debug Route (Authorized) ---
  {
    path: '/debug/version-check/screen-e',
    name: 'ScreenE_VersionCheck',
    component: () => import('../views/debug/ScreenE_VersionCheck.vue')
  },

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
    component: () => import('@/mocks/components/JournalListLevel3Mock.vue'),
  },
  // --- 顧問先詳細（ScreenA_ClientDetail） ---
  {
    path: '/detail/:clientId',
    name: 'ClientDetail',
    component: () => import('@/components/ScreenA_ClientDetail.vue'),
    props: true
  },
  // --- 仕訳ワークベンチ（ScreenE_Workbench。新型JournalEntry対応） ---
  {
    path: '/workbench/:clientId',
    name: 'ClientWorkbench',
    component: () => import('@/views/ScreenE_Workbench.vue'),
    props: true
  },
  // --- ScreenE_LogicMaster（旧URL互換。将来廃止予定） ---
  {
    path: '/screen-e/:clientId',
    name: 'ScreenELogicMaster',
    component: () => import('@/components/ScreenE_LogicMaster.vue'),
    props: true
  },

  {
    path: '/output/:clientId',
    name: 'MockOutputPortal',
    component: () => import('@/mocks/views/MockOutputPortalPage.vue'),
    props: true
  },
  {
    path: '/export/:clientId',
    name: 'MockExport',
    component: () => import('@/mocks/views/MockExportPage.vue'),
    props: true
  },
  {
    path: '/export-history/:clientId',
    name: 'MockExportHistory',
    component: () => import('@/mocks/views/MockExportHistoryPage.vue'),
    props: true
  },
  {
    path: '/export-detail/:clientId/:historyId',
    name: 'MockExportDetail',
    component: () => import('@/mocks/views/MockExportDetailPage.vue'),
    props: true
  },
  {
    path: '/excluded-history/:clientId',
    name: 'MockExcludedHistory',
    component: () => import('@/mocks/views/MockExcludedHistoryPage.vue'),
    props: true
  },
  {
    path: '/drive-select/:clientId',
    name: 'MockDriveSelect',
    component: () => import('@/mocks/views/MockDriveSelectPage.vue'),
    props: true
  },
  // 旧パス互換（/client/ 付き旧URL → 新URLにリダイレクト）
  { path: '/client/journal-list/:clientId', redirect: (to) => `/journal-list/${to.params.clientId}` },
  { path: '/client/export/:clientId', redirect: (to) => `/export/${to.params.clientId}` },
  { path: '/client/export-history/:clientId', redirect: (to) => `/export-history/${to.params.clientId}` },
  { path: '/client/export-detail/:clientId/:historyId', redirect: (to) => `/export-detail/${to.params.clientId}/${to.params.historyId}` },
  { path: '/client/drive-select/:clientId', redirect: (to) => `/drive-select/${to.params.clientId}` },
  { path: '/client/detail/:clientId', redirect: (to) => `/detail/${to.params.clientId}` },
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
    component: () => import('../mocks/views/MockClientAccountsPage.vue'),
    props: true
  },
  {
    path: '/client-settings/tax/:clientId',
    name: 'ClientTaxSettings',
    component: () => import('../mocks/views/MockClientTaxPage.vue'),
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
    component: () => import('@/mocks/views/MockUploadSelectorUnifiedPage.vue'),
  },
  // ===== 管理者ダッシュボード（事務所横断・顧問先ID不要） =====
  {
    path: '/admin-dashboard',
    name: 'AdminDashboard',
    component: () => import('@/mocks/views/MockAdminDashboardPage.vue'),
  },
  // ===== 過去仕訳CSV取込 =====
  {
    path: '/history-import/:clientId',
    name: 'HistoryImport',
    component: () => import('@/mocks/views/MockHistoryImportPage.vue'),
  },
  // スタッフ用アップロード（PC/モバイル自動判定）
  {
    path: '/upload/:clientId/staff',
    name: 'UploadStaff',
    component: () => import('@/mocks/views/MockUploadUnifiedPage.vue'),
  },
  // ゲスト用アップロード（PC/モバイル自動判定）
  {
    path: '/upload/:clientId/guest',
    name: 'UploadGuest',
    component: () => import('@/mocks/views/MockUploadUnifiedPage.vue'),
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
    component: () => import('@/mocks/views/MockLearningPage.vue'),
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
    component: () => import('@/mocks/views/MockUploadDocsPage.vue')
  },
  // 顧問先ゲスト用資料アップロード
  {
    path: '/upload-docs/:clientId/guest',
    name: 'UploadDocsGuest',
    component: () => import('@/mocks/views/MockUploadDocsPage.vue'),
    meta: { guestAllowed: true },
  },
  { path: '/client/upload-docs/:clientId', redirect: (to) => `/upload-docs/${to.params.clientId}` },
  // ===== Driveアップロード（スマホ用: ファイルIDのみ送信。メモリゼロ） =====
  {
    path: '/drive-upload/:clientId',
    name: 'DriveUpload',
    component: () => import('@/mocks/views/MockDriveUploadPage.vue'),
  },
  // ゲスト用Driveアップロード
  {
    path: '/drive-upload/:clientId/guest',
    name: 'DriveUploadGuest',
    component: () => import('@/mocks/views/MockDriveUploadPage.vue'),
    meta: { guestAllowed: true },
  },
  { path: '/client/drive-upload/:clientId', redirect: (to) => `/drive-upload/${to.params.clientId}` },
  // --- 事務所共通マスタ（顧問先ID不要） ---
  {
    path: '/master/accounts',
    name: 'MasterAccounts',
    component: () => import('@/mocks/views/MockMasterAccountsPage.vue')
  },
  {
    path: '/master/tax',
    name: 'MasterTaxCategories',
    component: () => import('@/mocks/views/MockMasterTaxCategoriesPage.vue')
  },
  {
    path: '/master/vendors',
    name: 'MasterVendors',
    component: () => import('@/mocks/views/MockMasterManagementPage.vue')
  },
  {
    path: '/master/vendors/list',
    name: 'MasterVendorsList',
    component: () => import('@/mocks/views/MockMasterVendorsPage.vue')
  },
  {
    path: '/master/vendors/non-vendor',
    name: 'MasterNonVendor',
    component: () => import('@/mocks/views/MockMasterNonVendorPage.vue')
  },
  // 旧パスリダイレクト
  { path: '/settings/accounts', redirect: '/client-settings/accounts/ABC-00001' },
  { path: '/master/tax-categories', redirect: '/master/tax' },
  { path: '/accounts/:clientId', redirect: (to) => `/client-settings/accounts/${to.params.clientId}` },
  { path: '/tax/:clientId', redirect: (to) => `/client-settings/tax/${to.params.clientId}` },
  {
    path: '/master/clients',
    name: 'MasterClients',
    component: () => import('@/mocks/views/MockMasterClientsPage.vue')
  },
  // 旧パスリダイレクト（/clients/list → /master/clients）
  { path: '/clients/list', redirect: '/master/clients' },
  // /master ハブ（勘定科目マスタ + 税区分マスタの分岐ページ）
  {
    path: '/master',
    name: 'MasterHub',
    component: () => import('@/mocks/views/MockMasterHubPage.vue')
  },
  {
    path: '/master/costs',
    name: 'MasterCosts',
    component: () => import('@/mocks/views/MockCostsPage.vue')
  },
  {
    path: '/master/settings',
    name: 'MasterSettings',
    component: () => import('@/mocks/views/MockSettingsHubPage.vue')
  },
  {
    path: '/master/progress/:code?',
    name: 'ProgressDetail',
    component: () => import('@/mocks/views/MockProgressDetailPage.vue')
  },
  // 旧パス互換: /progress → /master/progress
  { path: '/progress/:code?', redirect: (to) => `/master/progress${to.params.code ? '/' + to.params.code : ''}` },
  {
    path: '/master/staff',
    name: 'MasterStaff',
    component: () => import('@/mocks/views/MockMasterStaffPage.vue')
  },
  // --- 顧問先ゲストポータル（ナビバーなし・顧問先専用UI） ---
  {
    path: '/guest/:clientId',
    name: 'GuestPortal',
    component: () => import('@/mocks/views/MockPortalPage.vue'),
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
    component: () => import('@/mocks/views/MockPortalLoginPage.vue'),
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
    component: () => import('@/mocks/views/MockPortalLoginPage.vue'),
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
    component: () => import('@/mocks/views/MockNotFoundPage.vue'),
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

export default router

