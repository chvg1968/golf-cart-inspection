import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NewInspection from './views/NewInspection.vue'
import Home from './views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/new-inspection',
    name: 'NewInspection',
    component: NewInspection
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
