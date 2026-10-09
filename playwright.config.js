import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// El mismo entorno de la app: URL del proyecto de Supabase y clave de los usuarios de prueba.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const PUERTO = 4173
const URL_BASE = `http://localhost:${PUERTO}`

const TELEFONO = { width: 360, height: 800 }
const ESCRITORIO = { width: 1280, height: 800 }

// Pruebas de extremo a extremo: un archivo por caso de uso en e2e/.
// Corren contra el build real (con service worker), en Chromium y WebKit (RNF-04),
// a 360 × 800 y a 1280 × 800 (RNF-01).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Cada prueba abre uno o varios navegadores y habla con «staging». Con el valor por defecto
  // (la mitad de los núcleos: ocho en estos equipos) el equipo se queda sin memoria y las
  // páginas tardan segundos en pintar una respuesta que el servidor entregó en milisegundos.
  workers: process.env.CI ? 2 : 4,
  // Mismo motivo: 5 s es poco para una pantalla que depende de un servidor remoto.
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: URL_BASE,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-telefono', use: { ...devices['Desktop Chrome'], viewport: TELEFONO } },
    { name: 'chromium-escritorio', use: { ...devices['Desktop Chrome'], viewport: ESCRITORIO } },
    { name: 'webkit-telefono', use: { ...devices['Desktop Safari'], viewport: TELEFONO } },
    { name: 'webkit-escritorio', use: { ...devices['Desktop Safari'], viewport: ESCRITORIO } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PUERTO} --strictPort`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
