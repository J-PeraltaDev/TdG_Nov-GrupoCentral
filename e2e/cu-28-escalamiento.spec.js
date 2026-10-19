import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-28 · Consultar el escalamiento (RF-28). Pantallas 25 y 25-B. Estructura y navegación, no
 * números (decisión 27): «staging» acumula las novedades de otras corridas.
 */

test.describe('CU-28 · Escalamiento', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-28 / CU-28: la pestaña con sus bloques; un período en 2001 no tiene novedades (25-B)', async ({
    page,
  }) => {
    await ingresarComo(page, 'director')
    await page.goto('/panel?indicador=escalamiento')

    await expect(page.getByRole('tab', { name: 'Escalamiento' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const periodo = page.getByRole('combobox', { name: 'Período' })
    await expect(periodo.locator('option:checked')).toHaveText(/^Últimos 3 meses/)
    await expect(page.getByText('Novedades escaladas al director')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Proporción escalada por área' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Decisiones del director' })).toBeVisible()

    // CU-28 2a: «Personalizado» en 2001, que no tiene novedades.
    await periodo.selectOption('personalizado')
    await page.getByLabel('Desde', { exact: true }).fill('2001-01-01')
    await page.getByLabel('Hasta', { exact: true }).fill('2001-12-31')
    await page.getByLabel('Hasta', { exact: true }).blur()

    await expect(page).toHaveURL(/indicador=escalamiento&desde=2001-01-01&hasta=2001-12-31$/)
    await expect(page.getByText('No hay novedades registradas en este período')).toBeVisible()
    await expect(page.getByText('Elige otro período.')).toBeVisible()
    if (!enTelefono(page)) await expect(page.getByText(/^Datos al /)).toBeVisible()
  })
})
