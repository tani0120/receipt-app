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
    redirect: '/clients/demo/journals'
  },
  // --- 旧パス互換リダイレクト（App.vue, AaaLayout.vue等から参照） ---
  // Phase B で旧レイアウト廃止後に削除する
  { path: '/journal-status', redirect: '/clients/demo/journals' },
  { path: '/collection-status', redirect: '/clients/demo/collection' },
  { path: '/collection-status/:code', redirect: '/clients/demo/collection' },
  { path: '/ai-rules', redirect: '/clients/demo/ai-rules' },
  { path: '/data-conversion', redirect: '/clients/demo/data-conversion' },
  { path: '/task-dashboard', redirect: '/clients/demo/tasks' },
  { path: '/admin-settings', redirect: '/settings/admin' },
  { path: '/settings', redirect: '/clients/demo/settings' },
  { path: '/journal-list', redirect: '/clients/demo/journals' },
  {
    path: '/screen_b_mock',
    name: 'ScreenB_Restore_Mock',
    component: ScreenB_Restore_Mock
  },
  // 旧Screen Aは廃止。新構造: /master/clients（一覧）および /clients/:clientId/settings（個別）に統合。
  {
    path: '/clients',
    redirect: '/master/clients'
  },
  {
    path: '/clients/:clientId/settings',
    name: 'ClientSettings',
    component: () => import('../mocks/views/MockSettingsPage.vue'),
    props: true
  },
  {
    path: '/clients/:clientId/journals',
    name: 'ClientJournals',
    component: () => import('../views/ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/clients/:clientId/jobs/:jobId',
    name: 'ClientJob',
    component: () => import('../views/ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/clients/:clientId/collection',
    name: 'ClientCollection',
    component: () => import('../components/ScreenC_CollectionStatus.vue'),
    props: true
  },
  {
    path: '/clients/:clientId/ai-rules',
    name: 'ClientAIRules',
    component: () => import('@/views/ScreenD_AIRules.vue'),
    props: true
  },
  {
    path: '/journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../components/ScreenE_JournalEntry.vue'),
    props: true
  },


  {
    path: '/settings/accounts',
    name: 'AccountSettings',
    component: () => import('../views/ScreenS_AccountSettings.vue')
  },
  {
    path: '/settings/admin',
    name: 'AdminSettings',
    component: () => import('../views/ScreenZ_AdminSettings.vue')
  },
  {
    path: '/clients/:clientId/data-conversion',
    name: 'ClientDataConversion',
    component: () => import('@/views/ScreenG_DataConversion.vue'),
    props: true
  },
  {
    path: '/clients/:clientId/tasks',
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
    path: '/clients/:clientId/documents/:documentId',
    name: 'ClientDocument',
    component: () => import('@/views/DocumentDetail.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  // 旧パス互換（Phase Bで削除）
  { path: '/receipts/:id', redirect: '/clients/demo/documents/:id' },
  // Phase 5 Mock
  {
    path: '/journal-list',
    name: 'JournalListMock',
    component: () => import('@/mocks/components/JournalListLevel3Mock.vue')
  },
  {
    path: '/settings-accounts',
    name: 'SettingsAccountsMock',
    component: () => import('@/views/ScreenS_AccountSettings.vue'),
    props: { defaultTab: 'accounts' }
  },
  {
    path: '/settings-tax',
    name: 'SettingsTaxMock',
    component: () => import('@/views/ScreenS_AccountSettings.vue'),
    props: { defaultTab: 'tax' }
  },
  {
    path: '/master',
    redirect: '/master/accounts'
  },
  {
    path: '/master/accounts',
    name: 'MasterAccounts',
    component: () => import('@/mocks/views/MockMasterAccountsPage.vue')
  },
  {
    path: '/master/tax-categories',
    name: 'MasterTaxCategories',
    component: () => import('@/mocks/views/MockMasterTaxCategoriesPage.vue')
  },
  {
    path: '/master/clients',
    name: 'MasterClients',
    component: () => import('@/mocks/views/MockMasterClientsPage.vue')
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
  // ログインページへのアクセスは常に許可
  if (to.path === '/login') {
    return;
  }

  // Firebase認証状態の読み込みを待つ
  await authReadyPromise;

  // 認証状態をチェック
  const { getCurrentUser } = await import('@/utils/auth');
  const user = getCurrentUser();

  if (!user) {
    // 未ログインの場合、ログインページにリダイレクト
    console.log('[router] 未認証のため、ログインページにリダイレクトします');
    return '/login';
  }
  // ログイン済みの場合、通常通りアクセス許可
  return true;
})

export default router

