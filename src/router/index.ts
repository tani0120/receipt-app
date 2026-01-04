import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/journal-status'
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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

