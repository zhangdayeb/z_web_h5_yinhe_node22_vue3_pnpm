import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * PC端个人中心路由配置
 */

const routes: RouteRecordRaw[] = [
  // ========== 主要页面 ==========
  {
    path: '/',
    name: 'main',
    component: () => import('@/views/web/home/main.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/supplier/:supplier_code?/:category_code?',
    name: 'supplier',
    component: () => import('@/views/web/home/supplier.vue'),
    meta: { title: '供应商' },
    props: true  // 启用 props 传参
  },
  {
    path: '/to_game/:game?/:code?',
    name: 'to_game',
    component: () => import('@/views/web/home/to_game.vue'),
    meta: { title: '游戏入口' },
    props: true  // 启用 props 传参
  },
  {
    path: '/kf',
    name: 'kf',
    component: () => import('@/views/web/common/kf.vue'),
    meta: { title: '客服地址' }
  },
  {
    path: '/mine',
    name: 'mine',
    component: () => import('@/views/web/user/mine.vue'),
    meta: { title: '个人中心' }
  },
  {
    path: '/gift',
    name: 'gift',
    component: () => import('@/views/web/common/gift.vue'),
    meta: { title: '活动优惠' }
  },
  {
    path: '/activity/:id',
    name: 'activity',
    component: () => import('@/views/web/common/activity.vue'),
    meta: { title: '活动详情' },
    props: true
  },
  {
    path: '/register/:invite_code?',
    name: 'register',
    component: () => import('@/views/web/user/register.vue'),
    meta: { title: '注册' }
  },
  // ========== 404 处理 ==========
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/web/common/404.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// ========== 路由守卫 ==========
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  const defaultTitle = 'Home'
  document.title = to.meta.title ? `${to.meta.title} - ${defaultTitle}` : defaultTitle

  // 从localStorage获取token判断登录状态
  const token = localStorage.getItem('access_token')
  const isAuthenticated = !!token

  // 需要认证的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 保存原本要访问的路由
    next({
      path: '/',
      query: { redirect: to.fullPath }
    })
    return
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

// 导出路由实例
export default router
