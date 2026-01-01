
import { type RouteRecordRaw } from 'vue-router'

export const realRoutes: RouteRecordRaw[] = [
    {
        path: '/dashboard',
        alias: '/',
        name: 'Real_Dashboard',
        component: () => import('@/components/AdminDashboard.vue')
    },
    {
        path: '/clients',
        name: 'Real_ScreenA',
        component: () => import('@/views/ScreenA_Clients.vue')
    },
    {
        path: '/journal-status',
        name: 'Real_ScreenB',
        component: () => import('@/views/ScreenB_Dashboard.vue')
    },
    {
        path: '/collection-status',
        name: 'Real_ScreenC',
        component: () => import('@/components/ScreenC_CollectionStatus.vue')
    },
    // ScreenC missing in views list, checking find results... using placeholder if needed
    {
        path: '/ai-rules',
        name: 'Real_ScreenD',
        component: () => import('@/views/ScreenD_AIRules.vue')
    },
    {
        path: '/workbench',
        name: 'Real_ScreenE',
        component: () => import('@/views/ScreenE_Workbench.vue')
    },
    {
        path: '/data-conversion',
        name: 'Real_ScreenG',
        component: () => import('@/views/ScreenG_DataConversion.vue')
    },
    {
        path: '/task-dashboard',
        name: 'Real_ScreenH',
        component: () => import('@/views/ScreenH_TaskDashboard.vue')
    },
    {
        path: '/admin-settings',
        name: 'Real_ScreenZ',
        component: () => import('@/views/ScreenZ_AdminSettings.vue')
    }
]
