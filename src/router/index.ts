import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import ScreenB_Restore_Mock from '@/views/debug/ScreenB_Restore_Mock.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
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
    component: () => import('../components/ScreenB_JournalStatus.vue')
  },
  {
    path: '/jobs/:code',
    name: 'ScreenB_JournalStatus',
    component: () => import('../components/ScreenB_JournalStatus.vue'),
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
  {
    path: '/debug/screen-a-spec-test',
    name: 'ScreenA_Spec_Test',
    component: () => import('../views/debug/ScreenA_TestPage_Strict.vue')
  },
  {
    path: '/debug/screen-c-spec-test',
    name: 'ScreenC_Spec_Test',
    component: () => import('../views/debug/ScreenC_TestPage_Strict.vue')
  },
  {
    path: '/debug/screen-d-spec-test',
    name: 'ScreenD_Spec_Test',
    component: () => import('../views/debug/ScreenD_TestPage_Strict.vue')
  },
  {
    path: '/debug/screen-g-spec-test',
    name: 'ScreenG_Spec_Test',
    component: () => import('../views/debug/ScreenG_TestPage_Strict.vue')
  },
  {
    path: '/debug/screen-h-spec-test',
    name: 'ScreenH_Spec_Test',
    component: () => import('../views/debug/ScreenH_TestPage_Strict.vue')
  },
  {
    path: '/debug/admin-spec-test',
    name: 'Admin_Spec_Test',
    component: () => import('../views/debug/Admin_TestPage_Strict.vue')
  },
  {
    path: '/debug/screen-a-kill',
    name: 'aaa_debug_screen_a_kill',
    component: () => import('../views/debug/ScreenA_KillTest.vue')
  },
  {
    path: '/debug/screen-b-kill',
    name: 'aaa_debug_screen_b_kill',
    component: () => import('../components/ScreenB_KillTest.vue')
  },
  {
    path: '/debug/screen-g-kill',
    name: 'aaa_debug_screen_g_kill',
    component: () => import('../components/ScreenG_KillTest.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

