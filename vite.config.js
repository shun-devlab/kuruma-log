import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'クルマログ',
        short_name: 'クルマログ',
        description: '思いついたら即記録。シンプルな車メンテナンス記録アプリ',
        theme_color: '#FF9500',
        background_color: '#F8F8F8',
        display: 'standalone',
        start_url: '/kuruma-log/',
        scope: '/kuruma-log/',
        icons: [
          {
            src: '/kuruma-log/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/kuruma-log/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  base: '/kuruma-log/',
  build: {
    outDir: 'dist'
  }
})
