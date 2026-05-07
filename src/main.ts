import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fontsource/noto-sans-jp/400.css'
import '@fontsource/noto-sans-jp/600.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index'

// Supabase Auth テストユーザー自動ログイン（開発環境用）
import('./utils/auth').then(({ signInTestUser }) => {
  signInTestUser().catch(error => {
    console.error('[main.ts] テストユーザーの自動ログインに失敗しました:', error);
  });
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
