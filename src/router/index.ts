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
    redirect: '/journal-status'
  },
  {
    path: '/screen_b_mock',
    name: 'ScreenB_Restore_Mock',
    component: ScreenB_Restore_Mock
  },
  {
    path: '/clients',
    name: 'ScreenA',
    component: () => import('../views/ScreenA_Clients.vue')
  },
  {
    path: '/clients/:code',
    name: 'ScreenA_Detail',
    component: () => import('../components/ScreenA_ClientDetail.vue'),
    props: true
  },
  {
    path: '/journal-status',
    name: 'ScreenB_Status',
    component: () => import('../views/ScreenB_JournalStatus.vue')
  },
  {
    path: '/jobs/:code',
    name: 'ScreenB_JournalStatus',
    component: () => import('../views/ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/collection-status',
    name: 'ScreenC',
    component: () => import('../components/ScreenC_CollectionStatus.vue')
  },
  {
    path: '/collection-status/:code',
    name: 'ScreenC_Detail',
    component: () => import('../components/ScreenC_CollectionStatus.vue'),
    props: true
  },
  {
    path: '/ai-rules',
    name: 'ScreenD',
    component: () => import('@/views/ScreenD_AIRules.vue')
  },
  {
    path: '/journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../components/ScreenE_JournalEntry.vue'),
    props: true
  },

  {
    path: '/admin-settings',
    name: 'ScreenZ',
    component: () => import('../views/ScreenZ_AdminSettings.vue')
  },
  {
    path: '/data-conversion',
    name: 'DataConversion',
    component: () => import('@/views/ScreenG_DataConversion.vue')
  },
  {
    path: '/task-dashboard',
    name: 'TaskDashboard',
    component: () => import('@/views/ScreenH_TaskDashboard.vue')
  },
  // --- Phase 2: Isolation Debug Route (Authorized) ---
  {
    path: '/debug/version-check/screen-e',
    name: 'ScreenE_VersionCheck',
    component: () => import('../views/debug/ScreenE_VersionCheck.vue')
  },

  // --- Phase 6: MVP Routes (完全分離) ---
  ...mvpRoutes,
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
router.beforeEach(async (to, from, next) => {
  // ログインページへのアクセスは常に許可
  if (to.path === '/login') {
    next();
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
    next('/login');
  } else {
    // ログイン済みの場合、通常通りアクセス許可
    next();
  }
})

export default router

