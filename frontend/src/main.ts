import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import views
import Home from './views/Home.vue'
import BookReader from './views/BookReader.vue'
import Settings from './views/Settings.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/book/:bookId', name: 'BookReader', component: BookReader, props: true },
  { path: '/settings', name: 'Settings', component: Settings },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
