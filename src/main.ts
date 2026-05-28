import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fontsource/noto-sans-jp/400.css'
import '@fontsource/noto-sans-jp/600.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router/index'

// Supabase Auth テストユーザー自動ログイン（開発環境用）
import('./utils/auth').then(({ signInTestUser }) => {
  signInTestUser().catch(error => {
    console.error('[main.ts] テストユーザーの自動ログインに失敗しました:', error);
  });
});

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')

// ローダーフェードアウト（ルート確定後に消去）
router.isReady().then(() => {
  const loader = document.getElementById('app-loader')
  if (loader) {
    loader.classList.add('fade-out')
    setTimeout(() => {
      loader.remove()
      document.body.style.overflow = ''
    }, 500)
  }
})
