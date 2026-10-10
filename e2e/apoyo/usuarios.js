import { randomInt } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/*
 * Usuarios de prueba del seed (supabase/seed.sql) y ayudas para ingresar.
 *
 * La contraseña no está en el repositorio: cada persona define la suya en .env.local
 * (CLAVE_USUARIOS_DE_PRUEBA) y la aplica con `npm run staging:usuarios`. Las pruebas que
 * necesitan ingresar se omiten si no está. El CI todavía no corre estas pruebas.
 *
 * Cada usuario ingresa por el formulario una sola vez por corrida (e2e/sesiones.setup.js) y
 * las pruebas reutilizan esa sesión: Auth limita los ingresos por minuto y, con cada prueba
 * ingresando varias veces, «staging» empezó a responder 429.
 */

// Las variables ya definidas (por ejemplo, las del CI) no se reemplazan.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

export const CLAVE = process.env.CLAVE_USUARIOS_DE_PRUEBA ?? ''
export const HAY_CLAVE = CLAVE.length >= 8
export const MOTIVO_SIN_CLAVE =
  'Falta CLAVE_USUARIOS_DE_PRUEBA en .env.local (y correr npm run staging:usuarios).'

export const USUARIOS = {
  reportante: {
    correo: 'reportante.01@novedades.test',
    nombre: 'Reportante de prueba 01',
    inicio: '/novedades',
    menu: ['Novedades', 'Registrar', 'Avisos', 'Cuenta'],
  },
  // De otra finca y otra razón social: no ve las novedades del primero.
  reportanteOtraFinca: {
    correo: 'reportante.03@novedades.test',
    nombre: 'Reportante de prueba 03',
    inicio: '/novedades',
    menu: ['Novedades', 'Registrar', 'Avisos', 'Cuenta'],
  },
  aprobador: {
    correo: 'aprobador.mantenimiento@novedades.test',
    nombre: 'Aprobador de prueba Mantenimiento',
    inicio: '/bandeja',
    menu: ['Bandeja', 'Historial', 'Avisos', 'Cuenta'],
  },
  aprobadorSistemas: {
    correo: 'aprobador.sistemas@novedades.test',
    nombre: 'Aprobador de prueba Sistemas',
    inicio: '/bandeja',
    menu: ['Bandeja', 'Historial', 'Avisos', 'Cuenta'],
  },
  director: {
    correo: 'director@novedades.test',
    nombre: 'Director de prueba',
    inicio: '/escaladas',
    menu: ['Escaladas', 'Historial', 'Panel', 'Avisos'],
  },
  administrador: {
    correo: 'administrador@novedades.test',
    nombre: 'Administrador de prueba',
    // Hasta que llegue el panel de reportes (Sprint 5).
    inicio: '/usuarios',
    menu: ['Panel', 'Historial', 'Usuarios', 'Avisos'],
  },
  desactivado: { correo: 'desactivado@novedades.test' },
}

/** El menú visible: barra inferior en el teléfono, barra lateral en el escritorio. */
export function menuVisible(page) {
  return page.getByRole('navigation', { name: 'Principal' }).filter({ visible: true })
}

/**
 * Llena el formulario de ingreso y lo envía.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} correo
 * @param {string} [contrasena]
 */
export async function llenarIngreso(page, correo, contrasena = CLAVE) {
  await page.goto('/ingresar')
  await page.getByLabel('Correo', { exact: true }).fill(correo)
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

/**
 * Ingresa por el formulario con un usuario de prueba y espera su pantalla de inicio. Es un
 * ingreso real contra Auth: úsalo solo donde lo que se prueba es el ingreso mismo, o donde la
 * prueba necesita una sesión propia (porque la cierra).
 *
 * @param {import('@playwright/test').Page} page
 * @param {keyof typeof USUARIOS} rol
 */
export async function ingresarPorElFormulario(page, rol) {
  const usuario = USUARIOS[rol]
  await llenarIngreso(page, usuario.correo)
  await page.waitForURL(`**${usuario.inicio}`, { timeout: 20_000 })
  return usuario
}

/** Usuarios de prueba que pueden ingresar: todos menos el desactivado. */
export const ROLES_CON_SESION = Object.keys(USUARIOS).filter((rol) => USUARIOS[rol].inicio)

// Dentro de test-results: Playwright la limpia al empezar cada corrida y no se sube al
// repositorio. Guarda tokens de los usuarios de prueba: no hay que compartirla.
const CARPETA_DE_SESIONES = join('test-results', 'sesiones')
const archivoDeSesion = (rol) => join(CARPETA_DE_SESIONES, `${rol}.json`)

/** A una sesión con menos de este tiempo de vida no se le confía una prueba. */
const VIDA_MINIMA_MS = 10 * 60_000

/**
 * Toma la sesión de supabase-js de una página que ya ingresó (la guarda en localStorage) y la
 * deja en un archivo para las demás pruebas de la corrida.
 *
 * @param {import('@playwright/test').Page} page
 * @param {keyof typeof USUARIOS} rol
 */
export async function guardarSesion(page, rol) {
  const sesion = await page.evaluate(() => {
    const clave = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
    return clave ? { clave, valor: localStorage.getItem(clave) } : null
  })
  if (!sesion) throw new Error(`No hay sesión de ${rol} que guardar.`)
  mkdirSync(CARPETA_DE_SESIONES, { recursive: true })
  writeFileSync(archivoDeSesion(rol), JSON.stringify(sesion))
}

/**
 * La sesión guardada de un usuario, si existe y le queda vida suficiente.
 *
 * @param {keyof typeof USUARIOS} rol
 * @returns {{ clave: string, valor: string } | null}
 */
function sesionGuardada(rol) {
  if (!existsSync(archivoDeSesion(rol))) return null
  const sesion = JSON.parse(readFileSync(archivoDeSesion(rol), 'utf8'))
  const venceEn = (JSON.parse(sesion.valor).expires_at ?? 0) * 1000 - Date.now()
  return venceEn > VIDA_MINIMA_MS ? sesion : null
}

/**
 * Deja la página con la sesión de un usuario de prueba, en su pantalla de inicio.
 *
 * No pasa por el formulario: pone en el navegador la sesión que ese usuario abrió al comienzo
 * de la corrida, y la aplicación la recupera como al recargar la página (descarga el perfil y
 * decide adónde ir). Si no hay una sesión guardada, ingresa por el formulario.
 *
 * @param {import('@playwright/test').Page} page
 * @param {keyof typeof USUARIOS} rol
 */
export async function ingresarComo(page, rol) {
  const usuario = USUARIOS[rol]
  const sesion = sesionGuardada(rol)
  if (!sesion) return ingresarPorElFormulario(page, rol)

  // localStorage es del origen: hay que estar en la aplicación para escribirlo.
  await page.goto('/ingresar')
  await page.evaluate(({ clave, valor }) => localStorage.setItem(clave, valor), sesion)
  await page.goto(usuario.inicio)
  await page.waitForURL(`**${usuario.inicio}`, { timeout: 20_000 })
  return usuario
}

/**
 * Lee de la API con la sesión que tiene la página, igual que lo haría la aplicación: la clave
 * publicable y el token del usuario que ingresó. Así las pruebas comprueban lo que cada rol
 * puede ver sin usar ninguna clave privilegiada.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} consulta Ruta de PostgREST, por ejemplo `v_novedad?select=id&codigo=eq.12`.
 * @returns {Promise<any>}
 */
export function leerDeLaApi(page, consulta) {
  return page.evaluate(
    async ({ url, clave, ruta }) => {
      const guardada = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
      const { access_token: token } = JSON.parse(localStorage.getItem(guardada))
      const respuesta = await fetch(`${url}/rest/v1/${ruta}`, {
        headers: { apikey: clave, Authorization: `Bearer ${token}` },
      })
      return respuesta.json()
    },
    {
      url: process.env.VITE_SUPABASE_URL,
      clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ruta: consulta,
    },
  )
}

/**
 * Llama a una función de la base de datos con la sesión que tiene la página, igual que lo
 * haría la aplicación. Sirve para preparar los datos de una prueba (registrar una novedad,
 * tomarla…) sin recorrer otra vez las pantallas y sin ninguna clave privilegiada: la función
 * verifica el rol y el alcance de quien la llama.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} funcion Nombre de la función (SDD, Tabla 21).
 * @param {object} parametros
 * @returns {Promise<any>} El resultado; si la función falla, lanza un error con su código.
 */
export async function llamarALaApi(page, funcion, parametros) {
  const { estado, cuerpo } = await page.evaluate(
    async ({ url, clave, nombre, argumentos }) => {
      const guardada = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
      const { access_token: token } = JSON.parse(localStorage.getItem(guardada))
      const respuesta = await fetch(`${url}/rest/v1/rpc/${nombre}`, {
        method: 'POST',
        headers: {
          apikey: clave,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(argumentos),
      })
      return { estado: respuesta.status, cuerpo: await respuesta.json() }
    },
    {
      url: process.env.VITE_SUPABASE_URL,
      clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      nombre: funcion,
      argumentos: parametros,
    },
  )
  if (estado >= 400) throw new Error(`${funcion} respondió ${estado}: ${cuerpo?.message}`)
  return cuerpo
}

/**
 * Llama a una Edge Function igual que lo haría la aplicación: con la clave publicable y, si la
 * página ingresó, el token de su usuario. Sin sesión va solo la clave publicable, como en la
 * recuperación de contraseña.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} funcion `gestionar-usuario` o `restablecer-contrasena`.
 * @param {object} cuerpo
 * @returns {Promise<{ estado: number, cuerpo: any }>}
 */
export function llamarAFuncion(page, funcion, cuerpo) {
  return page.evaluate(
    async ({ url, clave, nombre, solicitud }) => {
      const guardada = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
      const token = guardada ? JSON.parse(localStorage.getItem(guardada)).access_token : null
      const respuesta = await fetch(`${url}/functions/v1/${nombre}`, {
        method: 'POST',
        headers: {
          apikey: clave,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(solicitud),
      })
      return { estado: respuesta.status, cuerpo: await respuesta.json().catch(() => null) }
    },
    {
      url: process.env.VITE_SUPABASE_URL,
      clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      nombre: funcion,
      solicitud: cuerpo,
    },
  )
}

/**
 * Crea un reportante propio de la prueba (`e2e-…@novedades.test`) con la sesión del
 * administrador que tiene la página. Las pruebas que cambian una contraseña o desactivan a
 * alguien lo hacen con un usuario así, nunca con los del seed. Un usuario no se puede borrar:
 * la prueba lo deja desactivado con `desactivarUsuarioDePrueba`.
 *
 * @param {import('@playwright/test').Page} page Con la sesión del administrador.
 * @param {string} marca Lo que distingue a este usuario: el proyecto y la hora.
 * @returns {Promise<{ id: string, nombre: string, correo: string, contrasena: string }>}
 */
export async function crearUsuarioDePrueba(page, marca) {
  const [finca] = await leerDeLaApi(
    page,
    `finca?select=id&nombre=eq.${encodeURIComponent('Finca de prueba 01')}`,
  )
  const nombre = `Usuario e2e ${marca}`
  const correo = `e2e-${marca}@novedades.test`.toLowerCase()
  // Al azar en cada corrida: no es la contraseña de nadie más ni queda escrita en ningún lado.
  const contrasena = `Inicial-${randomInt(1000, 10_000)}`
  const { estado, cuerpo } = await llamarAFuncion(page, 'gestionar-usuario', {
    accion: 'crear',
    nombre,
    correo,
    contrasena_inicial: contrasena,
    rol_id: 1,
    finca_id: finca.id,
  })
  if (estado !== 201) throw new Error(`No se creó el usuario de la prueba: ${estado}`)
  return { id: cuerpo.usuario.id, nombre, correo, contrasena }
}

/**
 * @param {import('@playwright/test').Page} page Con la sesión del administrador.
 * @param {string} usuarioId
 */
export async function desactivarUsuarioDePrueba(page, usuarioId) {
  await llamarAFuncion(page, 'gestionar-usuario', { accion: 'desactivar', usuario_id: usuarioId })
}
