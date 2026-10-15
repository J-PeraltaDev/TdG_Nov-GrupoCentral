import { createClient } from '@supabase/supabase-js'
import { informarFalloDeRed, informarRespuesta } from '../conexion/monitor.js'

const url = import.meta.env.VITE_SUPABASE_URL
const clavePublicable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !clavePublicable) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copia .env.example como .env.local y completa los valores (ver README).',
  )
}

/**
 * Cliente único de Supabase (C-03, SDD 4.2.3). Todo el acceso a Auth, a la API de datos y a
 * Storage pasa por esta instancia: no crees otra.
 *
 * La sesión se guarda en el almacenamiento por defecto de supabase-js y se renueva sola
 * (RNF-10). Los datos sin conexión no van aquí, sino en IndexedDB (`core/offline`).
 *
 * Cada solicitud le cuenta al monitor de conexión si llegó al servidor (RF-23): un `TypeError`
 * de `fetch` es la red; un `AbortError` lo pidió quien llama y no dice nada de la red.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient<import('./database.types').Database>}
 */
export const supabase = createClient(url, clavePublicable, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...argumentos) =>
      fetch(...argumentos).then(
        (respuesta) => {
          informarRespuesta()
          return respuesta
        },
        (error) => {
          if (error?.name === 'TypeError') informarFalloDeRed()
          throw error
        },
      ),
  },
})
