import { expect } from '@playwright/test'
import { menuVisible } from './usuarios.js'

/*
 * Ayudas para el formulario de registro (pantalla 05) y su constancia (pantalla 06).
 */

/** Descripción única por prueba: permite encontrar después la novedad en las listas. */
export function descripcionUnica(testInfo, texto) {
  return `${texto} · e2e ${testInfo.project.name} ${Date.now()}`
}

/** Abre el formulario desde el menú, como lo haría el reportante. */
export async function abrirRegistro(page) {
  await menuVisible(page).getByRole('link', { name: 'Registrar' }).click()
  await expect(page).toHaveURL(/\/registrar$/)
}

/**
 * Llena los campos que se indiquen. La prioridad y el área se eligen tocando su tarjeta.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ descripcion?: string, prioridad?: string, area?: string }} datos
 */
export async function llenarNovedad(page, { descripcion, prioridad, area }) {
  if (descripcion) await page.getByLabel('¿Qué está pasando?').fill(descripcion)
  if (prioridad) {
    await page
      .getByRole('group', { name: 'Prioridad' })
      .getByText(prioridad, { exact: true })
      .click()
    await expect(page.getByRole('radio', { name: new RegExp(`^${prioridad}`) })).toBeChecked()
  }
  if (area) {
    await page
      .getByRole('group', { name: 'Área que debe atenderla' })
      .getByText(area, { exact: true })
      .click()
    await expect(page.getByRole('radio', { name: new RegExp(`^${area}`) })).toBeChecked()
  }
}

export const enviarNovedad = (page) => page.getByRole('button', { name: 'Enviar novedad' }).click()

/**
 * Espera la constancia y devuelve el código asignado (`NOV-0001`).
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
export async function codigoDeLaConstancia(page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
  const codigo = page.getByText(/^NOV-\d{4,}$/)
  await expect(codigo).toBeVisible()
  return (await codigo.textContent()).trim()
}
