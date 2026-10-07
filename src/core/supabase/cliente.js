import { createClient } from '@supabase/supabase-js'

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
 * @type {import('@supabase/supabase-js').SupabaseClient<import('./database.types').Database>}
 */
export const supabase = createClient(url, clavePublicable, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
