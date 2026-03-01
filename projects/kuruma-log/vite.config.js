import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/kuruma-log/',
  build: {
    outDir: 'dist'
  }
})
