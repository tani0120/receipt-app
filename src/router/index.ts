import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import ScreenB_Restore_Mock from '@/views/debug/ScreenB_Restore_Mock.vue';
import { mvpRoutes } from './routes/mvp';

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
    redirect: '/mode-select'
  },
  {
    path: '/mode-select',
    name: 'ModeSelect',
    component: () => import('../views/ModeSelect.vue'),
    meta: { requiresAuth: true }
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
  { path: '/ai-rules', redirect: '/old/ai-rules/demo' },
  { path: '/data-conversion', redirect: '/old/data-conversion/demo' },
  { path: '/task-dashboard', redirect: '/old/tasks/demo' },
  { path: '/admin-settings', redirect: '/old/admin' },
  { path: '/settings', redirect: '/client/settings/ABC-00001' },
  { path: '/settings/accounts', redirect: '/client/settings/accounts/ABC-00001' },
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
    redirect: (to) => `/client/settings/${to.params.clientId}`
  },
  {
    path: '/client/settings/:clientId',
    name: 'ClientSettings',
    component: () => import('../mocks/views/MockSettingsPage.vue'),
    props: true
  },
  // 旧パス互換: /settings/:clientId → /client/settings/:clientId
  { path: '/settings/:clientId', redirect: (to) => `/client/settings/${to.params.clientId}` },
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
  {
    path: '/old/ai-rules/:clientId',
    name: 'ClientAIRules',
    component: () => import('@/views/ScreenD_AIRules.vue'),
    props: true
  },
  {
    path: '/old/journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../components/ScreenE_JournalEntry.vue'),
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
  // --- 顧問先個別ページ（/client/xxx/:clientId） ---
  {
    path: '/client/journal-list/:clientId',
    name: 'MockJournalList',
    component: () => import('@/mocks/components/JournalListLevel3Mock.vue'),
    props: true
  },
  {
    path: '/client/export/:clientId',
    name: 'MockExport',
    component: () => import('@/mocks/views/MockExportPage.vue'),
    props: true
  },
  {
    path: '/client/export-history/:clientId',
    name: 'MockExportHistory',
    component: () => import('@/mocks/views/MockExportHistoryPage.vue'),
    props: true
  },
  {
    path: '/client/export-detail/:clientId/:historyId',
    name: 'MockExportDetail',
    component: () => import('@/mocks/views/MockExportDetailPage.vue'),
    props: true
  },
  {
    path: '/client/drive-select/:clientId',
    name: 'MockDriveSelect',
    component: () => import('@/mocks/views/MockDriveSelectPage.vue'),
    props: true
  },
  // 旧パス互換（/client/ なしの旧URL → /client/ 付きにリダイレクト）
  { path: '/journal-list/:clientId', redirect: (to) => `/client/journal-list/${to.params.clientId}` },
  { path: '/export/:clientId', redirect: (to) => `/client/export/${to.params.clientId}` },
  { path: '/export-history/:clientId', redirect: (to) => `/client/export-history/${to.params.clientId}` },
  { path: '/drive-select/:clientId', redirect: (to) => `/client/drive-select/${to.params.clientId}` },
  // --- 旧URL互換リダイレクト ---
  { path: '/mock/journal-list', redirect: '/client/journal-list/ABC-00001' },
  { path: '/mock/drive-select', redirect: '/client/drive-select/ABC-00001' },
  { path: '/mock/export', redirect: '/client/export/ABC-00001' },
  { path: '/mock/export-history', redirect: '/client/export-history/ABC-00001' },
  // --- 顧問先別設定（独立コンポーネント） ---
  {
    path: '/client/settings/accounts/:clientId',
    name: 'ClientAccountSettings',
    component: () => import('../mocks/views/MockClientAccountsPage.vue'),
    props: true
  },
  {
    path: '/client/settings/tax/:clientId',
    name: 'ClientTaxSettings',
    component: () => import('../mocks/views/MockClientTaxPage.vue'),
    props: true
  },
  // 旧パス互換: /settings/accounts or tax/:clientId → /client/...
  { path: '/settings/accounts/:clientId', redirect: (to) => `/client/settings/accounts/${to.params.clientId}` },
  { path: '/settings/tax/:clientId', redirect: (to) => `/client/settings/tax/${to.params.clientId}` },
  // アップロード・学習（仮ページ）
  {
    path: '/client/upload/:clientId',
    name: 'Upload',
    component: () => import('@/mocks/views/MockUploadPage.vue'),
    props: true
  },
  {
    path: '/client/learning/:clientId',
    name: 'Learning',
    component: () => import('@/mocks/views/MockLearningPage.vue'),
    props: true
  },
  // 旧パス互換
  { path: '/upload/:clientId', redirect: (to) => `/client/upload/${to.params.clientId}` },
  { path: '/learning/:clientId', redirect: (to) => `/client/learning/${to.params.clientId}` },
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
  // 旧パスリダイレクト
  { path: '/settings/accounts', redirect: '/client/settings/accounts/ABC-00001' },
  { path: '/master/tax-categories', redirect: '/master/tax' },
  { path: '/accounts/:clientId', redirect: (to) => `/client/settings/accounts/${to.params.clientId}` },
  { path: '/tax/:clientId', redirect: (to) => `/client/settings/tax/${to.params.clientId}` },
  {
    path: '/master/clients',
    name: 'MasterClients',
    component: () => import('@/mocks/views/MockMasterClientsPage.vue')
  },
  // 旧パスリダイレクト（/clients/list → /master/clients）
  { path: '/clients/list', redirect: '/master/clients' },
  // /master ハブは廃止 → 事務所共通マスタ/勘定科目にリダイレクト
  {
    path: '/master',
    redirect: '/master/accounts'
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
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Firebase認証状態の読み込みを待つPromise
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
  // 開発環境: 認証ガード無効化（直接URLアクセス可能）
  if (to.path === '/login') {
    return;
  }
  return true;
})

export default router

