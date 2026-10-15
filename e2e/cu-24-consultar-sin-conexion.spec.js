import { expect, test } from '@playwright/test'
import { esperarQueFuncioneSinRed } from './apoyo/registro.js'
import { simularIngresoAnterior } from './apoyo/sesionFabricada.js'
import { HAY_CLAVE, MOTIVO_SIN_CLAVE, ingresarComo } from './apoyo/usuarios.js'

/*
 * RF-24 / CU-24 · Consultar novedades sin conexión, sobre el build con service worker. Lo que
 * se ve con red queda en el dispositivo; sin red se ve lo descargado, con su fecha. Las dos
 * primeras van contra «staging» con los usuarios de prueba; la de 3a, con una sesión fabricada.
 */

const MOTIVO_WEBKIT =
  'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)'

const CODIGO = /^NOV-\d{4,}$/

test('RF-24 / CU-24 y CU-18 3a: lo que el reportante abrió con red lo ve sin red, con la fecha de la descarga', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await ingresarComo(page, 'reportante')
  await esperarQueFuncioneSinRed(page)

  // Con red: «Mis novedades» y el detalle de la primera.
  const primera = page.getByRole('link', { name: CODIGO }).first()
  const codigo = (await primera.textContent()).trim()
  await primera.click()
  await expect(page.getByRole('heading', { level: 1, name: codigo })).toBeVisible()
  await expect(page.getByText(/^Registrada en finca$/).first()).toBeVisible()
  await page.goto('/novedades')
  await expect(page.getByRole('link', { name: codigo })).toBeVisible()

  // Sin red: 04-B, y el detalle descargado con su fecha y su línea de tiempo.
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText(/^Estás viendo lo descargado hoy \d/)).toBeVisible()
  await page.getByRole('link', { name: codigo }).click()
  await expect(page.getByRole('heading', { level: 1, name: codigo })).toBeVisible()
  await expect(page.getByText(/^Datos del \d/).first()).toBeVisible()
  await expect(
    page.getByText('La línea de tiempo se descarga cuando abres la novedad con conexión.'),
  ).toHaveCount(0)
})

test('RF-24 / CU-24 (11-B): el aprobador ve sin red la bandeja que abrió con red', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await ingresarComo(page, 'aprobador')
  await esperarQueFuncioneSinRed(page)
  await expect(page.getByText('Cargando…')).toHaveCount(0, { timeout: 20_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(
    page.getByText(/^Bandeja descargada hoy .+ Las acciones se habilitan al volver el internet\.$/),
  ).toBeVisible()
})

test('RF-24 / CU-24 3a: sin nada descargado, la primera consulta necesita conexión', async ({
  page,
  context,
  browserName,
}) => {
  test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  await page.goto('/ingresar')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await simularIngresoAnterior(page, 3600)

  await context.setOffline(true)
  await page.goto('/novedades')

  await expect(page.getByRole('alert')).toHaveText(
    'La primera consulta necesita conexión. Abre esta pantalla con internet para descargar tus novedades.Reintentar',
  )
})
