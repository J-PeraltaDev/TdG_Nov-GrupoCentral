// Entrada de Deno de restablecer-contrasena (SDD 5.3.4). No exige sesión: en config.toml lleva
// verify_jwt = false. Solo arma las dependencias reales; la lógica está en manejar.js, que se
// prueba con Vitest (docs/adr/0012).
import { createClient } from '@supabase/supabase-js'
import { atender } from '../_shared/servir.js'
import { manejar } from './manejar.js'
import { crearRecuperacion } from './recuperacion.js'

// La plataforma inyecta estas variables. La clave secreta salta las políticas RLS: vive solo
// aquí, nunca en el cliente ni en el repositorio (CLAUDE.md, regla 8).
const url = Deno.env.get('SUPABASE_URL')!
const claveSecreta = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']

const admin = createClient(url, claveSecreta, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// La base de datos y Auth, como las necesita la función.
const recuperacion = crearRecuperacion(admin)

Deno.serve((peticion) => atender(peticion, (cuerpo) => manejar(cuerpo, recuperacion)))
