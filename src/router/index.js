import VueRouter from 'vue-router'

import home from '@/pages/home.vue'

const routes = [
  {
    path: '',
    component: home
  }
]

const router = new VueRouter({
  routes
})

export default router
