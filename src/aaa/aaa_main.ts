import './aaa_assets/aaa_main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './aaa_App.vue'
import router from './aaa_router/aaa_index'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
