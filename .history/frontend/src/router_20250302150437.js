import Vue from 'vue'
import VueRouter from 'vue-router'
import NewInspection from '@/views/NewInspection.vue'
import InspectionList from '@/views/InspectionList.vue'
import GuestReview from '@/views/GuestReview.vue'
import ThankYou from '@/views/ThankYou.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: InspectionList
  },
  {
    path: '/new',
    name: 'new-inspection',
    component: NewInspection
  },
  {
    path: '/review/:token',
    name: 'guest-review',
    component: GuestReview
  },
  {
    path: '/thankyou',
    name: 'thank-you',
    component: ThankYou
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router