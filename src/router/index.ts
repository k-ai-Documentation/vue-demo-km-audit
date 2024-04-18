import { createRouter, createWebHistory } from 'vue-router'
import KMAuditPage from '@/views/KMAuditPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: KMAuditPage
    }
  ]
})

export default router
