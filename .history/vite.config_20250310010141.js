import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.vue', '.json']
  },
  alias: {
    "vue": "vue/dist/vue.esm-bundler.js"
  },
  server: {
    port: 8080
  },
  build: {
    outDir: 'dist'
  }
})