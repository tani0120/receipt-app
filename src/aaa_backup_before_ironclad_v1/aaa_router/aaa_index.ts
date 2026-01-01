import { type RouteRecordRaw } from 'vue-router'

import aaa_ScreenB_Restore_Mock from '@/aaa/aaa_views/aaa_debug/aaa_ScreenB_Restore_Mock.vue';

export const aaaRoutes: RouteRecordRaw[] = [
  {
    path: '/aaa_screen_b_mock',
    name: 'aaa_ScreenB_Restore_Mock',
    component: aaa_ScreenB_Restore_Mock
  },
  {
    path: '/aaa_dashboard',
    component: () => import('../aaa_components/aaa_AdminDashboard.vue')
  },
  {
    path: '/aaa_clients',
    name: 'aaa_ScreenA',
    component: () => import('../aaa_components/aaa_ScreenA_ClientList.vue')
  },
  {
    path: '/aaa_clients/:code',
    name: 'aaa_ScreenA_Detail',
    component: () => import('../aaa_components/aaa_ScreenA_ClientDetail.vue'),
    props: true
  },
  {
    path: '/aaa_journal-status',
    name: 'aaa_ScreenB_Status',
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
    name: 'aaa_ScreenC',
    component: () => import('../aaa_components/aaa_ScreenC_CollectionStatus.vue')
  },
  {
    path: '/aaa_collection-status/:code',
    name: 'aaa_ScreenC_Detail',
    component: () => import('../aaa_components/aaa_ScreenC_CollectionStatus.vue'),
    props: true
  },
  {
    path: '/aaa_ai-rules',
    name: 'aaa_ScreenD',
    component: () => import('../aaa_components/aaa_ScreenD_AIRules.vue')
  },
  {
    path: '/aaa_journal-entry/:jobId',
    name: 'aaa_ScreenE',
    component: () => import('../aaa_components/aaa_ScreenE_JournalEntry.vue'),
    props: true
  },

  {
    path: '/aaa_admin-settings',
    name: 'aaa_ScreenZ',
    component: () => import('../aaa_views/aaa_ScreenZ_AdminSettings.vue')
  },
  {
    path: '/aaa_data-conversion',
    name: 'aaa_DataConversion',
    component: () => import('@/aaa/aaa_views/aaa_ScreenG_DataConversion.vue')
  },
  {
    path: '/aaa_task-dashboard',
    name: 'aaa_TaskDashboard',
    component: () => import('@/aaa/aaa_views/aaa_ScreenH_TaskDashboard.vue')
  },
  // --- Phase 2: Isolation Debug Route (Authorized) ---
  {
    path: '/aaa_debug/version-check/screen-e',
    name: 'aaa_ScreenE_VersionCheck',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenE_VersionCheck.vue')
  },
  {
    path: '/aaa_debug/screen-a-spec-test',
    name: 'aaa_ScreenA_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenA_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-c-spec-test',
    name: 'aaa_ScreenC_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenC_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-d-spec-test',
    name: 'aaa_ScreenD_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenD_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-g-spec-test',
    name: 'aaa_ScreenG_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenG_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/screen-h-spec-test',
    name: 'aaa_ScreenH_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_ScreenH_TestPage_Strict.vue')
  },
  {
    path: '/aaa_debug/admin-spec-test',
    name: 'aaa_Admin_Spec_Test',
    component: () => import('../aaa_views/aaa_debug/aaa_Admin_TestPage_Strict.vue')
  }
]

