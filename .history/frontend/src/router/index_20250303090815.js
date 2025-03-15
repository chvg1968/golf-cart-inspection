import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/IndexPage.vue') 
      },
      { 
        path: 'new-inspection', 
        component: () => import('src/pages/NewInspectionview.vue') 
      },
      { 
        path: 'guest-review', 
        component: () => import('src/pages/GuestReview.vue') 
      },
      { 
        path: 'thank-you', 
        component: () => import('src/pages/ThankYou.vue') 
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default route(function (/* { store, ssrContext } */) {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(process.env.VUE_ROUTER_BASE)
  })

  return Router
})
