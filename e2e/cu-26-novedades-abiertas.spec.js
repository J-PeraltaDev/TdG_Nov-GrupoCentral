import { expect, test } from '@playwright/test'
import { enTelefono, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-26 · Consultar las novedades abiertas (RF-26). Pantalla 23. «staging» acumula novedades de
 * otras corridas: se comprueban la estructura y la navegación, no los números (decisión 27).
 */

test.describe('CU-26 · Novedades abiertas', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-26 / CU-26 1: el administrador entra al panel al ingresar, en «Novedades abiertas»', async ({
    page,
  }) => {
    await ingresarComo(page, 'administrador')

    await expect(page).toHaveURL(/\/panel$/)
    const pestana = page.getByRole('tab', {
      name: enTelefono(page) ? 'Abiertas' : 'Novedades abiertas',
    })
    await expect(pestana).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: 'Abiertas por finca' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Abiertas por estado' })).toBeVisible()
    await expect(page.getByRole('table', { name: 'Novedades abiertas por finca' })).toBeVisible()
    if (!enTelefono(page)) await expect(page.getByText(/^Datos al /)).toBeVisible()
  })

  test('RF-26 / CU-26 4–5: el director toca una finca y llega al historial con ese filtro y las abiertas', async ({
    page,
    browser,
  }, testInfo) => {
    // Una abierta en la finca del reportante de prueba, para que la finca tenga su fila.
    const contexto = await browser.newContext()
    const reportante = await contexto.newPage()
    await ingresarComo(reportante, 'reportante')
    await registrarPorLaApi(reportante, {
      descripcion: descripcionUnica(testInfo, 'La cerca del potrero se cayó'),
      prioridad: 'bajo',
      area: 'Mantenimiento',
    })
    await contexto.close()

    await ingresarComo(page, 'director')
    await page.goto('/panel')
    await page.getByRole('link', { name: 'Ver en historial de Finca de prueba 01' }).click()

    await expect(page).toHaveURL(/\/historial\?finca=[0-9a-f-]{36}&estado=abiertas$/)
    const chips = page.getByRole('list', { name: 'Filtros aplicados' })
    await expect(
      chips.getByText(enTelefono(page) ? 'Finca de prueba 01' : 'Finca: Finca de prueba 01'),
    ).toBeVisible()
    await expect(chips.getByText(enTelefono(page) ? 'Abiertas' : 'Estado: Abiertas')).toBeVisible()
  })
})
