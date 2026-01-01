import { type RouteRecordRaw } from 'vue-router'

import Mirror_ScreenB_Restore_Mock from '@/Mirror_sandbox/Mirror_views/Mirror_debug/Mirror_ScreenB_Restore_Mock.vue';

export const mirrorRoutes: RouteRecordRaw[] = [
  {
    path: '/mirror_screen_b_mock',
    name: 'Mirror_ScreenB_Restore_Mock',
    component: Mirror_ScreenB_Restore_Mock
  },
  {
    path: '/mirror_dashboard',
    component: () => import('../Mirror_components/Mirror_AdminDashboard.vue')
  },
  {
    path: '/mirror_clients',
    name: 'ScreenA',
    component: () => import('../Mirror_components/Mirror_ScreenA_ClientList.vue')
  },
  {
    path: '/mirror_clients/:code',
    name: 'ScreenA_Detail',
    component: () => import('../Mirror_components/Mirror_ScreenA_ClientDetail.vue'),
    props: true
  },
  {
    path: '/mirror_journal-status',
    name: 'ScreenB_Status',
    component: () => import('../Mirror_components/Mirror_ScreenB_JournalStatus.vue')
  },
  {
    path: '/mirror_jobs/:code',
    name: 'Mirror_ScreenB_JournalStatus',
    component: () => import('../Mirror_components/Mirror_ScreenB_JournalStatus.vue'),
    props: true
  },
  {
    path: '/mirror_collection-status',
    name: 'ScreenC',
    component: () => import('../Mirror_components/Mirror_ScreenC_CollectionStatus.vue')
  },
  {
    path: '/mirror_collection-status/:code',
    name: 'ScreenC_Detail',
    component: () => import('../Mirror_components/Mirror_ScreenC_CollectionStatus.vue'),
    props: true
  },
  {
    path: '/mirror_ai-rules',
    name: 'ScreenD',
    component: () => import('../Mirror_components/Mirror_ScreenD_AIRules.vue')
  },
  {
    path: '/mirror_journal-entry/:jobId',
    name: 'ScreenE',
    component: () => import('../Mirror_components/Mirror_ScreenE_JournalEntry.vue'),
    props: true
  },

  {
    path: '/mirror_admin-settings',
    name: 'ScreenZ',
    component: () => import('../Mirror_views/Mirror_ScreenZ_AdminSettings.vue')
  },
  {
    path: '/mirror_data-conversion',
    name: 'DataConversion',
    component: () => import('@/Mirror_sandbox/Mirror_views/Mirror_ScreenG_DataConversion.vue')
  },
  {
    path: '/mirror_task-dashboard',
    name: 'TaskDashboard',
    component: () => import('@/Mirror_sandbox/Mirror_views/Mirror_ScreenH_TaskDashboard.vue')
  },
  // --- Phase 2: Isolation Debug Route (Authorized) ---
  {
    path: '/mirror_debug/version-check/screen-e',
    name: 'ScreenE_VersionCheck',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenE_VersionCheck.vue')
  },
  {
    path: '/mirror_debug/screen-a-spec-test',
    name: 'ScreenA_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenA_TestPage_Strict.vue')
  },
  {
    path: '/mirror_debug/screen-c-spec-test',
    name: 'ScreenC_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenC_TestPage_Strict.vue')
  },
  {
    path: '/mirror_debug/screen-d-spec-test',
    name: 'ScreenD_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenD_TestPage_Strict.vue')
  },
  {
    path: '/mirror_debug/screen-g-spec-test',
    name: 'ScreenG_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenG_TestPage_Strict.vue')
  },
  {
    path: '/mirror_debug/screen-h-spec-test',
    name: 'ScreenH_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_ScreenH_TestPage_Strict.vue')
  },
  {
    path: '/mirror_debug/admin-spec-test',
    name: 'Admin_Spec_Test',
    component: () => import('../Mirror_views/Mirror_debug/Mirror_Admin_TestPage_Strict.vue')
  }
]

