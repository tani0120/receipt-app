import { createRouter, createWebHistory } from 'vue-router'
import { realRoutes } from './Real_index'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: realRoutes
})

export default router
