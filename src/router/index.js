import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/users'  // 所有用户默认进入用户信息管理页面
      },
      {
        path: 'users',
        name: 'UserData',
        component: () => import('../views/UserData.vue'),
        meta: { title: '用户数据管理' }
      },
      {
        path: 'feedback',
        name: 'FeedbackManagement',
        component: () => import('../views/FeedbackManagement.vue'),
        meta: { title: '反馈管理' }
      },
      {
        path: 'admins',
        name: 'AdminList',
        component: () => import('../views/AdminList.vue'),
        meta: { title: '客服管理', requiresSuper: true }
      },
      {
        path: 'chat',
        name: 'CustomerService',
        component: () => import('../views/chat/index.vue'),
        meta: { title: '客服聊天' }
      },
      {
        path: 'analytics',
        name: 'AnalyticsDashboard',
        component: () => import('../views/AnalyticsDashboard.vue'),
        meta: { title: '数据分析中心' }
      },
      {
        path: 'responsive-test',
        name: 'ResponsiveTest',
        component: () => import('../views/ResponsiveTest.vue'),
        meta: { title: '响应式测试' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ path: '/' })
  } else if (authStore.isAuthenticated && !authStore.user) {
    // 已认证但没有用户信息，先获取用户信息
    try {
      await authStore.fetchCurrentUser()
    } catch (error) {
      // 如果获取用户信息失败，可能是 token 无效
      console.error('Failed to fetch user info:', error)
    }
    
    if (to.meta.requiresSuper && !authStore.user?.is_super) {
      // 非超级管理员访问超级管理员页面，重定向到用户管理
      next({ path: '/users' })
    } else {
      next()
    }
  } else if (to.meta.requiresSuper && !authStore.user?.is_super) {
    // 非超级管理员访问超级管理员页面，重定向到用户管理
    next({ path: '/users' })
  } else {
    next()
  }
})

export default router
