import { createRouter, createWebHistory } from 'vue-router'
import InvoiceList from '../views/InvoiceList.vue'
import InvoiceCreate from '../views/InvoiceCreate.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { title: 'ログイン', public: true }
    },
    {
      path: '/',
      name: 'invoice-list',
      component: InvoiceList,
      meta: { title: '請求書一覧' }
    },
    {
      path: '/create',
      name: 'invoice-create',
      component: InvoiceCreate,
      meta: { title: '請求書作成' }
    },
    {
      path: '/edit/:id',
      name: 'invoice-edit',
      component: InvoiceCreate,
      meta: { title: '請求書編集' }
    },
    {
      path: '/view/:id',
      name: 'invoice-view',
      component: InvoiceCreate,
      meta: { title: '請求書詳細' }
    }
  ]
})

const isAuthenticated = () => {
  return localStorage.getItem('auth') !== null
}

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '請求書システム'} | 請求書作成システム`

  if (!to.meta.public && !isAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'login' && isAuthenticated()) {
    next({ name: 'invoice-list' })
    return
  }

  next()
})

export default router
