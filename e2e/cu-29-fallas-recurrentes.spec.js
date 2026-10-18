import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-29 · Consultar las fallas recurrentes (RF-29). Pantallas 26 y 27. Estructura y navegación,
 * no números (decisión 27). «staging» tiene resueltas y cerradas de las corridas de CU-14 y
 * CU-15 en los últimos seis meses.
 */

const HISTORIAL_FILTRADO =
  /\/historial\?finca=[0-9a-f-]{36}&estado=resuelta,cerrada&desde=\d{4}-\d{2}-\d{2}&hasta=\d{4}-\d{2}-\d{2}/

test.describe('CU-29 · Fallas recurrentes', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-29 / CU-29 4–5: una celda o una finca lleva al historial con su filtro y el período', async ({
    page,
  }) => {
    await ingresarComo(page, 'administrador')
    await page.goto('/panel?indicador=recurrencia')

    const periodo = page.getByRole('combobox', { name: 'Período' })
    await expect(periodo.locator('option:checked')).toHaveText(/^Últimos 6 meses/)

    if (enTelefono(page)) {
      // 27: la primera finca está abierta, con sus barras y «Ver en historial».
      await expect(page.getByRole('heading', { name: 'Más repetidas' })).toBeVisible()
      const primera = page.locator('button[aria-expanded]').first()
      await expect(primera).toHaveAttribute('aria-expanded', 'true')
      await page
        .getByRole('link', { name: /^Ver en historial de / })
        .first()
        .click()
      await expect(page).toHaveURL(HISTORIAL_FILTRADO)
      return
    }

    // 26: la matriz, con un enlace por celda que nombra la finca, el tipo y la cantidad.
    const matriz = page.getByRole('table', { name: /por finca y tipo de falla/ })
    await expect(page.getByRole('heading', { name: 'Combinaciones más repetidas' })).toBeVisible()
    const celda = matriz.getByRole('link').first()
    await expect(celda).toHaveAccessibleName(/^.+ · .+: \d+ novedad(es)?$/)
    await celda.click()

    await expect(page).toHaveURL(new RegExp(`${HISTORIAL_FILTRADO.source}&tipo=[0-9a-f-]{36}$`))
    await expect(page.getByRole('list', { name: 'Filtros aplicados' })).toContainText(
      'Estado: Resuelta, Cerrada',
    )
  })
})
