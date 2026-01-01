import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './Mirror_App.vue'
import router from './Mirror_router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
