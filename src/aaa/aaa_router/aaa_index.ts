import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import aaa_ScreenB_Restore_Mock from '@/aaa/aaa_views/aaa_debug/aaa_ScreenB_Restore_Mock.vue';
import aaa_ScreenB_Dashboard from '@/aaa/aaa_views/aaa_ScreenB_Dashboard.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/aaa_dashboard'
  },
  {
    path: '/aaa_screen_b_mock',
    name: 'aaa_ScreenB_Restore_Mock',
    component: aaa_ScreenB_Restore_Mock
  },
  {
    path: '/aaa_dashboard',
    name: 'Dashboard',
    component: aaa_ScreenB_Dashboard
  },
  {
    path: '/aaa_clients',
    name: 'ScreenA',
    component: () => import('../aaa_components/aaa_ScreenA_ClientList.vue')
  },
  {
    path: '/aaa_clients/:code',
    name: 'ScreenA_Detail',
    component: () => import('../aaa_components/aaa_ScreenA_ClientDetail.vue'),
    props: true
  },
  {
    path: '/aaa_journal-status',
    name: 'ScreenB_Status',
    component: () => import('../aaa_components/aaa_ScreenB_JournalStatus.vue')
  },
  {
    path: '/aaa_jobs/:code',
    name: 'aaa_ScreenB_JournalStatus',
    component: () => import('../aaa_components/aaa_ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/aaa_collection-status',
    name: 'ScreenC',
    component: () => import('../aaa_components/aaa_ScreenC_CollectionStatus.vue')
  },
  {
    path: '/aaa_collection-status/:code',
    name: 'ScreenC_Detail',
    component: () => import('../aaa_components/aaa_ScreenC_CollectionStatus.vue'),
    props: true
  },
  {
    path: '/aaa_ai-rules',
    name: 'ScreenD',
    component: () => import('../aaa_components/aaa_ScreenD_AIRules.vue')
  },
  {
    path: '/aaa_journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../aaa_components/aaa_ScreenE_JournalEntry.vue'),
    props: true
  },

  {
    path: '/aaa_admin-settings',
    name: 'ScreenZ',
    component: () => import('../aaa_views/aaa_ScreenZ_AdminSettings.vue')
  },
  {
    path: '/aaa_data-conversion',
    name: 'DataConversion',
    component: () => import('@/aaa/aaa_views/aaa_ScreenG_DataConversion.vue')
  },
  {
    path: '/aaa_task-dashboard',
    name: 'TaskDashboard',
    component: () => import('@/aaa/aaa_views/aaa_ScreenH_TaskDashboard.vue')
  },
  // --- Phase 2: Isolation Debug Route (Authorized) ---
  {
    path: '/aaa_debug/version-check/screen-e',
    name: 'ScreenE_VersionCheck',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenE_VersionCheck.vue')
  },
  {
    path: '/aaa_debug/screen-a-spec-test',
    name: 'ScreenA_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenA_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-c-spec-test',
    name: 'ScreenC_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenC_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-d-spec-test',
    name: 'ScreenD_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenD_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-g-spec-test',
    name: 'ScreenG_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenG_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-h-spec-test',
    name: 'ScreenH_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenH_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/admin-spec-test',
    name: 'Admin_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_Admin_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-a-kill',
    name: 'aaa_debug_screen_a_kill',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenA_KillTest.vue')
  },
  {
    path: '/aaa_debug/screen-b-kill',
    name: 'aaa_debug_screen_b_kill',
    component: () => import('../aaa_components/aaa_ScreenB_KillTest.vue')
  },
  {
    path: '/aaa_debug/screen-g-kill',
    name: 'aaa_debug_screen_g_kill',
    component: () => import('../aaa_components/aaa_ScreenG_KillTest.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

