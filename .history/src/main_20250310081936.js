import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { Quasar } from 'quasar'
import App from './App.vue'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Define tus rutas
const routes = [
  // Ejemplo:
  // { path: '/', component: () => import('./components/Home.vue') },
  // { path: '/about', component: () => import('./components/About.vue') },
]

// Crea la instancia del router
const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)

// Usa Quasar
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
})

// Usa el router
app.use(router)

app.mount('#app')