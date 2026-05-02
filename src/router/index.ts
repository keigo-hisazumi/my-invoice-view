import { createRouter, createWebHistory } from 'vue-router'
import InvoiceList from '../views/InvoiceList.vue'
import InvoiceCreate from '../views/InvoiceCreate.vue'
import Login from '../views/Login.vue'
import BillingAddressList from '../views/BillingAddressList.vue'
import BillingAddressForm from '../views/BillingAddressForm.vue'
import BillingSourceList from '../views/BillingSourceList.vue'
import BillingSourceForm from '../views/BillingSourceForm.vue'
import ItemMasterList from '../views/ItemMasterList.vue'
import ItemMasterForm from '../views/ItemMasterForm.vue'

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
    },
    {
      path: '/billing-addresses',
      name: 'billing-address-list',
      component: BillingAddressList,
      meta: { title: '請求先一覧' }
    },
    {
      path: '/billing-addresses/create',
      name: 'billing-address-create',
      component: BillingAddressForm,
      meta: { title: '請求先追加' }
    },
    {
      path: '/billing-addresses/edit/:id',
      name: 'billing-address-edit',
      component: BillingAddressForm,
      meta: { title: '請求先編集' }
    },
    {
      path: '/billing-sources',
      name: 'billing-source-list',
      component: BillingSourceList,
      meta: { title: '請求元一覧' }
    },
    {
      path: '/billing-sources/create',
      name: 'billing-source-create',
      component: BillingSourceForm,
      meta: { title: '請求元追加' }
    },
    {
      path: '/billing-sources/edit/:id',
      name: 'billing-source-edit',
      component: BillingSourceForm,
      meta: { title: '請求元編集' }
    },
    {
      path: '/items',
      name: 'item-master-list',
      component: ItemMasterList,
      meta: { title: '品目管理' }
    },
    {
      path: '/items/create',
      name: 'item-master-create',
      component: ItemMasterForm,
      meta: { title: '品目追加' }
    },
    {
      path: '/items/edit/:id',
      name: 'item-master-edit',
      component: ItemMasterForm,
      meta: { title: '品目編集' }
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
