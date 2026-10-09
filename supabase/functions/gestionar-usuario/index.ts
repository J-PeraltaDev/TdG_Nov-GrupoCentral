// Entrada de Deno de gestionar-usuario (SDD 5.3.4). Solo arma las dependencias reales; la
// lógica está en manejar.js, que se prueba con Vitest (docs/adr/0012).
import { createClient } from '@supabase/supabase-js'
import { atender, tokenDe } from '../_shared/servir.js'
import { crearCuentas } from './cuentas.js'
import { manejar } from './manejar.js'

// La plataforma inyecta estas variables. La clave secreta salta las políticas RLS: vive solo
// aquí, nunca en el cliente ni en el repositorio (CLAUDE.md, regla 8).
const url = Deno.env.get('SUPABASE_URL')!
const claveSecreta = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']

const admin = createClient(url, claveSecreta, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** `id` del usuario del token, verificado contra las claves de firma de Auth. */
async function identificar(token: string): Promise<string | null> {
  const { data, error } = await admin.auth.getClaims(token)
  return error ? null : (data?.claims?.sub ?? null)
}

// Auth y la base de datos, como las necesitan las acciones.
const cuentas = crearCuentas(admin)

Deno.serve((peticion) =>
  atender(peticion, (cuerpo) =>
    manejar(cuerpo, {
      token: tokenDe(peticion),
      identificar,
      leerPerfil: cuentas.leerUsuario,
      cuentas,
    }),
  ),
)
