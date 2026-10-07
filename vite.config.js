/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // C-04 (SDD 4.2.4): service worker propio y manifiesto. El registro y el aviso de
    // nueva versión están en src/app/AvisoNuevaVersion.jsx.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      // El manifiesto y sus íconos los agrega el plugin al precaché por su cuenta.
      includeAssets: ['iconos/apple-touch-icon.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        id: '/',
        name: 'Novedades Grupo Central',
        short_name: 'Novedades',
        description:
          'Registro, atención y seguimiento de las novedades de infraestructura de las fincas de Grupo Central.',
        lang: 'es-CO',
        dir: 'ltr',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#1e6b3a',
        background_color: '#f6f7f4',
        icons: [
          { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/iconos/icono-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/pruebas/preparacion.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
