import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa' 

// https://vite.dev/config/
export default defineConfig({
  base: 'https://rzeiler.github.io/ConfigurationToClass/',
  plugins: [
    vue(),
    VitePWA({
      baseUrl:'/',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'PWA Router',
        short_name: 'PWA Router',
        theme_color: '#ffffff',
      }
    })
  ],
})
