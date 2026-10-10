import { esErrorDeRed } from '../errores/traducir.js'
import { borrarDatosDeSesion, guardarCatalogo, guardarMeta, leerMeta } from '../offline/bd.js'
import { supabase } from '../supabase/cliente.js'

/*
 * Sesión y perfil (C-02, SDD 6.1.10 · RF-01, CU-01, RNF-10).
 *
 * El perfil se guarda en el almacén `meta` de IndexedDB al ingresar: con él la aplicación
 * pinta el menú del rol sin red y sabe quién ingresó en este dispositivo.
 */

/**
 * @typedef {object} Perfil
 * @property {string} id
 * @property {string} nombre
 * @property {number} rol_id
 * @property {string | null} finca_id
 * @property {string | null} area_id
 * @property {boolean} activo
 * @property {{ id: string, nombre: string, razon_social: { id: string, nombre: string } | null } | null} finca
 * @property {{ id: string, nombre: string } | null} area
 */

/** @typedef {'credenciales' | 'desactivado' | 'demasiados_intentos' | 'sin_conexion' | 'error'} MotivoDeRechazo */

// La API no expone el correo: nunca `select *` sobre usuario (ADR 0010).
const COLUMNAS_DEL_PERFIL = 'id, nombre, rol_id, finca_id, area_id, activo'

/** Lee del servidor el perfil y los catálogos que la aplicación necesita sin red. */
async function descargarPerfil(usuarioId) {
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select(COLUMNAS_DEL_PERFIL)
    .eq('id', usuarioId)
    .maybeSingle()
  if (error) throw error
  // Un usuario desactivado no puede leer ni su propia fila: la consulta vuelve vacía.
  if (!usuario || !usuario.activo) return null

  // El perfil ya está: los catálogos no dependen entre sí y se piden en paralelo.
  const [areas, finca] = await Promise.all([
    supabase.from('area').select('id, nombre').eq('activo', true).order('nombre'),
    usuario.finca_id
      ? supabase
          .from('finca')
          .select('id, nombre, razon_social:razon_social_id (id, nombre)')
          .eq('id', usuario.finca_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (areas.error) throw areas.error
  if (finca.error) throw finca.error

  /** @type {Perfil} */
  const perfil = {
    ...usuario,
    finca: finca.data,
    area: areas.data.find((area) => area.id === usuario.area_id) ?? null,
  }
  return { perfil, areas: areas.data }
}

/** Guarda en el dispositivo lo que la aplicación necesita para abrir sin red. */
async function guardarEnElDispositivo({ perfil, areas }) {
  await Promise.all([
    guardarMeta('perfil', perfil),
    guardarMeta('actualizado_en', new Date().toISOString()),
    guardarCatalogo('areas', areas),
    guardarCatalogo('finca', perfil.finca),
  ])
}

/**
 * Inicia sesión con correo y contraseña (CU-01, curso normal y alternos 2a, 4a y 4b).
 *
 * @param {string} correo
 * @param {string} contrasena
 * @returns {Promise<{ ok: true, perfil: Perfil } | { ok: false, motivo: MotivoDeRechazo }>}
 */
export async function iniciarSesion(correo, contrasena) {
  // CU-01 2a: el primer ingreso en un dispositivo requiere conexión.
  if (!navigator.onLine) return { ok: false, motivo: 'sin_conexion' }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  })

  if (error) {
    if (esErrorDeRed(error)) return { ok: false, motivo: 'sin_conexion' }
    if (error.code === 'user_banned') return { ok: false, motivo: 'desactivado' }
    // Auth limita los ingresos por dirección: no es que los datos estén mal, hay que esperar.
    if (error.status === 429) return { ok: false, motivo: 'demasiados_intentos' }
    if (error.code === 'invalid_credentials' || error.status === 400) {
      return { ok: false, motivo: 'credenciales' }
    }
    return { ok: false, motivo: 'error' }
  }

  try {
    const descargado = await descargarPerfil(data.user.id)
    if (!descargado) {
      // CU-01 4b: usuario desactivado o sin perfil.
      await supabase.auth.signOut({ scope: 'local' })
      return { ok: false, motivo: 'desactivado' }
    }
    await guardarEnElDispositivo(descargado)
    // RNF-07: pide al navegador que no borre los datos locales.
    navigator.storage?.persist?.().catch(() => {})
    return { ok: true, perfil: descargado.perfil }
  } catch (fallo) {
    await supabase.auth.signOut({ scope: 'local' })
    return { ok: false, motivo: esErrorDeRed(fallo) ? 'sin_conexion' : 'error' }
  }
}

// Tiempo máximo que se espera a supabase-js al abrir la aplicación.
const ESPERA_DE_SESION_MS = 4000

/** Resuelve con `null` si la promesa tarda más que el límite. */
function conLimite(promesa, milisegundos) {
  return Promise.race([
    promesa,
    new Promise((resolver) => setTimeout(() => resolver(null), milisegundos)),
  ])
}

/**
 * Recupera la sesión guardada al abrir la aplicación (CU-01 2b, RNF-10).
 *
 * El perfil guardado en el dispositivo dice quién ingresó aquí: se escribe al ingresar y se
 * borra al cerrar la sesión. Sin red se entra con él de inmediato, sin preguntarle a
 * supabase-js: con el token vencido y sin red, `getSession()` conserva la sesión, pero se
 * queda reintentando la renovación cerca de medio minuto antes de responder
 * (docs/pruebas/sesion-sin-conexion.md). La sesión se renueva sola cuando vuelve la red, y los
 * datos siempre los protege el servidor (RNF-11).
 *
 * La misma revisión se repite con la sesión viva (al volver a la pestaña, o cuando una acción
 * responde `SIN_PERMISO`): si un administrador desactivó al usuario mientras tanto, aquí se
 * cierra la sesión local, y se dice por qué, para que el ingreso muestre el aviso 01-C
 * (RF-03 / CU-01 4b). Las novedades pendientes de sincronizar se conservan.
 *
 * @returns {Promise<{ perfil: Perfil | null, desactivado: boolean }>} `desactivado`: había
 *   sesión, pero el usuario ya no está activo (o no tiene perfil) y se cerró.
 */
export async function revisarSesion() {
  const guardado = (await leerMeta('perfil')) ?? null
  const con = (perfil) => ({ perfil, desactivado: false })

  if (!navigator.onLine) return con(guardado)

  const respuesta = await conLimite(supabase.auth.getSession(), ESPERA_DE_SESION_MS)
  // El navegador dice que hay red, pero no responde: se sigue con lo guardado.
  if (!respuesta) return con(guardado)

  const { data, error } = respuesta
  if (!data.session) return con(error && esErrorDeRed(error) ? guardado : null)

  try {
    const descargado = await descargarPerfil(data.session.user.id)
    if (!descargado) {
      await cerrarSesion()
      return { perfil: null, desactivado: true }
    }
    await guardarEnElDispositivo(descargado)
    return con(descargado.perfil)
  } catch (fallo) {
    // Se cayó la red justo ahora: se sigue con lo guardado, si es del mismo usuario.
    return con(esErrorDeRed(fallo) && guardado?.id === data.session.user.id ? guardado : null)
  }
}

/**
 * El perfil de la sesión guardada, o `null` si no hay sesión. Es `revisarSesion` sin el motivo.
 *
 * @returns {Promise<Perfil | null>}
 */
export async function restaurarSesion() {
  return (await revisarSesion()).perfil
}

/**
 * Cierra la sesión en este dispositivo (CU-01, pasos 5 y 6). Borra la sesión y los datos
 * descargados, y conserva las novedades pendientes de sincronizar (CU-01 5a, RNF-07).
 */
export async function cerrarSesion() {
  // Aunque no haya red y Auth no responda, la sesión local se cierra igual.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  await borrarDatosDeSesion()
}
