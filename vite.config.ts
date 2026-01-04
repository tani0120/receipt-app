
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import devServer from '@hono/vite-dev-server'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/api/index.ts',
      exclude: [
        /.*\.vue$/,
        /.*\.ts$/,
        /.*\.tsx$/,
        /^\/@.+$/,
        /^\/node_modules\/.*/,
        /^\/src\/.*/,
        /^\/favicon\.ico$/,
      ]
    }),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
