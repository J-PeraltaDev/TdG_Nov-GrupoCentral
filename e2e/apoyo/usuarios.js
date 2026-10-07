import { existsSync } from 'node:fs'

/*
 * Usuarios de prueba del seed (supabase/seed.sql) y ayudas para ingresar.
 *
 * La contraseña no está en el repositorio: cada persona define la suya en .env.local
 * (CLAVE_USUARIOS_DE_PRUEBA) y la aplica con `npm run staging:usuarios`. Las pruebas que
 * necesitan ingresar se omiten si no está. El CI todavía no corre estas pruebas.
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
    inicio: '/panel',
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
 * Ingresa con un usuario de prueba y espera su pantalla de inicio.
 *
 * @param {import('@playwright/test').Page} page
 * @param {keyof typeof USUARIOS} rol
 */
export async function ingresarComo(page, rol) {
  const usuario = USUARIOS[rol]
  await llenarIngreso(page, usuario.correo)
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
