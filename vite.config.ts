
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'
// Force Rebuild Trigger

// Duplicate imports removed
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    host: true,
    // LAN経由の実機テスト対応: HMR WebSocket設定
    // host:trueでViteが0.0.0.0でリッスン → WebSocketもLAN IPで接続可能に
    hmr: {
      // host指定なし = Viteがリクエスト元のHostヘッダーを使用（LAN IP自動対応）
      overlay: false,  // 実機でのエラーオーバーレイ無効化
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
