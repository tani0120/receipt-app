import type { RouteRecordRaw } from 'vue-router';

/**
 * MVP（Phase 6）専用ルート
 * legacy との完全分離を保証
 */
export const mvpRoutes: RouteRecordRaw[] = [
    // Phase 6.1 Step 4: DriveFileListUI
    {
        path: '/mvp/drive-files',
        name: 'MvpDriveFileList',
        component: () => import('@/views/DriveFileList.vue'),
        meta: { requiresAuth: true },
    },

    // Phase 6.1 実装待ち - 以下のルートは実装完了後にコメントアウトを外す
    // {
    //     path: '/mvp/upload',
    //     name: 'MvpFileUpload',
    //     component: () => import('@/mvp/screens/FileUploadUI.vue'),
    //     meta: { requiresAuth: true }
    // },
    // {
    //     path: '/mvp/journal-entry/:jobId',
    //     name: 'MvpScreenE',
    //     component: () => import('@/mvp/screens/ScreenE_Workbench.vue'),
    //     props: true,
    //     meta: { requiresAuth: true }
    // },
];
