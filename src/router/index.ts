import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'


// Screen Components
import ScreenA from '../views/ScreenA_Clients.vue'
import ScreenB from '../views/ScreenB_JournalStatus.vue'
import ScreenC from '../components/ScreenC_CollectionStatus.vue'
import ScreenE from '../components/ScreenE_JournalEntry.vue'
import ScreenZ from '../views/ScreenZ_AdminSettings.vue'

// Import logger for navigation tracking
import { addLog } from '../api/lib/globalLogger'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/',
    redirect: '/journal-status'
  },
  {
    path: '/clients',
    name: 'ScreenA',
    component: ScreenA
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
    component: ScreenB
  },
  {
    path: '/jobs/:code',
    name: 'ScreenB_JournalStatus',
    component: ScreenB,
    props: true
  },
  {
    path: '/collection-status',
    name: 'ScreenC',
    component: ScreenC
  },
  {
    path: '/collection-status/:code',
    name: 'ScreenC_Detail',
    component: ScreenC,
    props: true
  },
  {
    path: '/workbench/:id',
    name: 'JournalEditor',
    component: ScreenE,
    props: true
  },
  {
    path: '/admin-settings',
    name: 'AdminSettings',
    component: ScreenZ
  },
  {
    path: '/ai-rules',
    name: 'ScreenD_AIRules',
    component: () => import('../views/ScreenD_AIRules.vue')
  },
  {
    path: '/data-conversion',
    name: 'ScreenG_DataConversion',
    component: () => import('../views/ScreenG_DataConversion.vue')
  },
  // Task Dashboard (Mirror World)
  {
    path: '/task-dashboard',
    name: 'TaskDashboard',
    component: () => import('../views/ScreenH_TaskDashboard.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation Guard for Global Logging and Authentication
router.beforeEach((to, from, next) => {
  // 1. Logging
  addLog(`[Router] Navigating to: ${to.fullPath}`);



  next();
});

export default router
