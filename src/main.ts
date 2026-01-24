import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index'

// Firebase テストユーザー自動ログイン（全環境で有効）
import('./utils/testAuth').then(({ signInTestUser }) => {
  signInTestUser().catch(error => {
    console.error('[main.ts] テストユーザーの自動ログインに失敗しました:', error);
  });
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
