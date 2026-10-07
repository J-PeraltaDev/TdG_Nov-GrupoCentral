/// <reference lib="webworker" />
/*
 * Service worker propio (C-04, SDD 4.2.4) · estrategia injectManifest de vite-plugin-pwa.
 *
 * Hace solo cuatro cosas:
 *   1. precachea los archivos de la aplicación (self.__WB_MANIFEST);
 *   2. responde las navegaciones con index.html, para que la app abra sin red (RNF-05);
 *   3. se actualiza únicamente cuando la persona acepta el aviso de nueva versión;
 *   4. deja listos los manejadores de push para el Sprint 5 (RF-31).
 *
 * NO cachea nada de Supabase ni de ningún otro origen: los datos sin conexión viven en
 * IndexedDB (core/offline), no en Cache Storage. No agregues reglas para *.supabase.co.
 */

/**
 * Archivos de la versión publicada, sin repetidos (el plugin puede listar dos veces los
 * íconos del manifiesto).
 *
 * @type {{ url: string, revision: string | null }[]}
 */
const MANIFIESTO = [
  ...new Map(self.__WB_MANIFEST.map((archivo) => [archivo.url, archivo])).values(),
]

const PREFIJO = 'novedades-app-'
const CACHE = PREFIJO + huella(JSON.stringify(MANIFIESTO))
const INICIO = '/index.html'

/** Rutas precacheadas (pathname absoluto). */
const RUTAS = new Set(MANIFIESTO.map(({ url }) => new URL(url, self.location.origin).pathname))

/** Huella corta y estable del manifiesto: cada versión publicada usa su propia caché. */
function huella(texto) {
  let h = 5381
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0
  return h.toString(36)
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        MANIFIESTO.map(async ({ url, revision }) => {
          // Los archivos sin hash en el nombre (index.html, íconos) se piden sin caché HTTP.
          const respuesta = await fetch(url, { cache: revision ? 'reload' : 'default' })
          if (!respuesta.ok) throw new Error(`No se pudo precachear ${url}: ${respuesta.status}`)
          await cache.put(
            new URL(url, self.location.origin).pathname,
            await sinRedireccion(respuesta),
          )
        }),
      ),
    ),
  )
})

/**
 * Cloudflare Pages redirige /index.html a /. El navegador rechaza una respuesta redirigida
 * como respuesta de una navegación, así que se guarda una copia limpia.
 */
async function sinRedireccion(respuesta) {
  if (!respuesta.redirected) return respuesta
  return new Response(await respuesta.blob(), {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: respuesta.headers,
  })
}

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => nombre.startsWith(PREFIJO) && nombre !== CACHE)
            .map((nombre) => caches.delete(nombre)),
        ),
      ),
  )
})

// El cliente lo envía cuando la persona pulsa «Actualizar» (registerType: 'prompt').
self.addEventListener('message', (evento) => {
  if (evento.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    evento.respondWith(desdeCache(INICIO, request))
    return
  }

  if (RUTAS.has(url.pathname)) {
    evento.respondWith(desdeCache(url.pathname, request))
  }
})

async function desdeCache(ruta, request) {
  const cache = await caches.open(CACHE)
  return (await cache.match(ruta)) ?? fetch(request)
}

// Sprint 5 (RF-31): notificaciones push. Vacíos a propósito.
self.addEventListener('push', () => {})
self.addEventListener('notificationclick', () => {})
