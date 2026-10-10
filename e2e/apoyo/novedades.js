import { expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { leerDeLaApi, llamarALaApi } from './usuarios.js'

/*
 * Ayudas para preparar y encontrar novedades en las pruebas del Sprint 2.
 *
 * «staging» acumula las novedades de otras corridas: ninguna prueba puede suponer que una
 * lista está vacía ni que su novedad sale en la primera página. Por eso las novedades se
 * crean con una descripción única y se buscan por ella.
 */

/**
 * Registra una novedad por la API con la sesión del reportante que ingresó en `page`.
 *
 * @param {import('@playwright/test').Page} page Página con la sesión de un reportante.
 * @param {{ descripcion: string, prioridad: 'critico' | 'alto' | 'normal' | 'bajo', area: string }} datos
 *   `area` es el nombre: «Mantenimiento» o «Sistemas».
 * @returns {Promise<{ id: string, codigo: number, estado: string }>}
 */
export async function registrarPorLaApi(page, { descripcion, prioridad, area }) {
  const [destino] = await leerDeLaApi(page, `area?select=id&nombre=eq.${area}`)
  return llamarALaApi(page, 'registrar_novedad', {
    p_id_local: randomUUID(),
    p_descripcion: descripcion,
    p_prioridad: prioridad,
    p_area_id: destino.id,
    p_fecha_registro: new Date().toISOString(),
  })
}

/** Las novedades de la lista visible: tarjetas en el teléfono, filas en el escritorio. */
export function novedadesDeLaLista(page) {
  return page.getByRole('tabpanel').locator('li, tbody tr')
}

/**
 * Trae todas las páginas de la lista: pulsa «Ver más» hasta que no quede nada por cargar.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function cargarTodaLaLista(page) {
  const panel = page.getByRole('tabpanel')
  const verMas = page.getByRole('button', { name: 'Ver más' })
  const novedades = novedadesDeLaLista(page)
  // Primero tiene que estar la pantalla: recién llegada la página, todavía no hay panel ni
  // «Cargando…», y sin esta espera la lista se daba por cargada antes de pedirla.
  await expect(panel).toBeVisible()
  // La primera página ya llegó cuando desaparece «Cargando…».
  await expect(panel.getByRole('status')).toHaveCount(0)
  while (await verMas.isVisible()) {
    const antes = await novedades.count()
    await verMas.click()
    await expect.poll(() => novedades.count()).toBeGreaterThan(antes)
    // Mientras trae la página siguiente el botón dice «Cargando…»: se espera a que vuelva a
    // decir «Ver más» o a que desaparezca, para no dar la lista por terminada antes de tiempo.
    await expect(page.getByRole('button', { name: 'Cargando…' })).toHaveCount(0)
  }
}

/**
 * Posición de cada descripción en la lista visible; -1 si no está.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} descripciones
 * @returns {Promise<number[]>}
 */
export function posicionesEnLaLista(page, descripciones) {
  return novedadesDeLaLista(page).evaluateAll(
    (elementos, textos) =>
      textos.map((texto) => elementos.findIndex((el) => el.textContent.includes(texto))),
    descripciones,
  )
}

/** El teléfono usa la barra inferior y las hojas; desde 1024 px es el escritorio. */
export const enTelefono = (page) => page.viewportSize().width < 1024

/**
 * `AAAA-MM-DD` de hoy en Colombia más los días indicados.
 *
 * @param {number} [masDias]
 */
export function diaEnColombia(masDias = 0) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  const fecha = new Date(`${hoy}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + masDias)
  return fecha.toISOString().slice(0, 10)
}

/**
 * Registra por la API la solución de una novedad, con la sesión del aprobador que ingresó en
 * `page`. El tipo de falla no es lo que prueban quienes la usan: reutiliza uno de los que dejó
 * el CU-14 en otras corridas y, si todavía no hay ninguno, lo crea.
 *
 * @param {import('@playwright/test').Page} page Página con la sesión de un aprobador del área.
 * @param {string} novedadId
 * @param {string} solucion
 */
export async function resolverPorLaApi(page, novedadId, solucion) {
  const [conocido] = await llamarALaApi(page, 'sugerir_tipos_falla', { p_texto: 'Tipo e2e' })
  return llamarALaApi(page, 'registrar_solucion', {
    p_novedad_id: novedadId,
    p_solucion: solucion,
    p_fecha_ejecucion: diaEnColombia(),
    p_tipo_falla_id: conocido?.id ?? null,
    p_tipo_falla_nombre: conocido ? null : `Tipo e2e ${Date.now()}`,
  })
}

/**
 * El director elige «Aprobar» o «Rechazar» sobre la escalada que tiene abierta y deja lista
 * la observación, sin confirmar. En el escritorio es el panel «Tu decisión» (pantalla 20); en
 * el teléfono, la hoja que abre el botón de la barra (20-C).
 *
 * @param {import('@playwright/test').Page} page
 * @param {'Aprobar' | 'Rechazar'} opcion
 * @param {string} [observacion]
 * @returns El contenedor donde quedaron el campo y el botón «Confirmar decisión».
 */
export async function elegirDecision(page, opcion, observacion) {
  let lugar
  if (enTelefono(page)) {
    await page.getByRole('button', { name: opcion, exact: true }).click()
    lugar = page.getByRole('dialog', { name: opcion })
    await expect(lugar).toBeVisible()
  } else {
    lugar = page.getByRole('region', { name: 'Tu decisión' })
    // El botón de radio está oculto a la vista: se toca su tarjeta.
    await lugar.getByText(opcion, { exact: true }).click()
    await expect(lugar.getByRole('radio', { name: opcion })).toBeChecked()
  }
  if (observacion !== undefined) {
    await lugar.getByRole('textbox', { name: 'Observación' }).fill(observacion)
  }
  return lugar
}
