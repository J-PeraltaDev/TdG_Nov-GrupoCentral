import { expect, test } from '@playwright/test'

// RNF-01, RNF-03 y RNF-05: la aplicación abre, es instalable y abre sin red.
test.describe('Aplicación instalable', () => {
  test('RNF-01: abre en español de Colombia y no desborda el ancho de la pantalla', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/ingresar$/)
    await expect(page).toHaveTitle('Novedades Grupo Central')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Novedades · Grupo Central' }),
    ).toBeVisible()

    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(desborda).toBe(false)
  })

  test('RNF-03: publica el manifiesto de la aplicación instalable', async ({ page, request }) => {
    await page.goto('/ingresar')

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    )

    const manifiesto = await (await request.get('/manifest.webmanifest')).json()
    expect(manifiesto).toMatchObject({
      name: 'Novedades Grupo Central',
      lang: 'es-CO',
      display: 'standalone',
      start_url: '/',
      theme_color: '#1e6b3a',
    })
    expect(manifiesto.icons.map((icono) => icono.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
  })

  test('RNF-03: invita a instalar la aplicación en el ingreso', async ({ page }) => {
    await page.goto('/ingresar')

    await expect(
      page.getByText(
        'Instala la app en este teléfono para registrar novedades aunque no haya internet',
      ),
    ).toBeVisible()
  })

  test('RNF-05: después de la primera carga abre sin red, en cualquier ruta', async ({
    page,
    context,
  }) => {
    await page.goto('/ingresar')
    // Espera a que el service worker termine de precachear.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForFunction(async () => (await caches.keys()).length > 0)

    await context.setOffline(true)
    await page.goto('/una/ruta/cualquiera')

    await expect(
      page.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible()

    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Novedades · Grupo Central' }),
    ).toBeVisible()
    await expect(page.getByText('Sin conexión', { exact: true })).toBeVisible()
  })

  test('RNF-18: el ingreso informa el tratamiento de datos (Ley 1581 de 2012)', async ({
    page,
  }) => {
    await page.goto('/ingresar')

    await expect(page.getByText('Tus datos se tratan conforme a la Ley 1581 de 2012')).toBeVisible()
  })
})
