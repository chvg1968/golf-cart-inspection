import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 8080
  },
  build: {
    outDir: 'dist'
  }
})