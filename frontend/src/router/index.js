import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '看板' } },
      { path: 'contracts', name: 'Contracts', component: () => import('../views/Contracts.vue'), meta: { title: '合同总表' } },
      { path: 'contract-details', name: 'ContractDetails', component: () => import('../views/ContractDetails.vue'), meta: { title: '合同明细表' } },
      { path: 'procurement', name: 'Procurement', component: () => import('../views/Procurement.vue'), meta: { title: '合同采购登记本' } },
      { path: 'advance', name: 'Advance', component: () => import('../views/AdvanceProcurement.vue'), meta: { title: '提前采购清单' } },
      { path: 'quotations', name: 'Quotations', component: () => import('../views/Quotations.vue'), meta: { title: '报价管理' } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { title: '用户管理', adminOnly: true } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    const userStore = useUserStore()
    if (to.meta.adminOnly && userStore.user?.role !== 'admin') {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
