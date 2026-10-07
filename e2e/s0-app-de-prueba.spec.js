import { expect, test } from '@playwright/test'

// Sprint 0 · RNF-01, RNF-03 y RNF-05: la app de prueba abre, es instalable y abre sin red.
test.describe('S0 · app de prueba', () => {
  test('RNF-01: abre en español de Colombia y no desborda el ancho de la pantalla', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Novedades Grupo Central')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(page.getByRole('heading', { level: 1, name: 'Novedades' })).toBeVisible()

    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(desborda).toBe(false)
  })

  test('RNF-03: publica el manifiesto de la aplicación instalable', async ({ page, request }) => {
    await page.goto('/')

    const enlace = page.locator('link[rel="manifest"]')
    await expect(enlace).toHaveAttribute('href', '/manifest.webmanifest')

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

  test('RNF-05: después de la primera carga abre sin red, en cualquier ruta', async ({
    page,
    context,
  }) => {
    await page.goto('/')
    // Espera a que el service worker termine de precachear y quede activo.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()

    await context.setOffline(true)
    await page.goto('/una/ruta/cualquiera')

    await expect(
      page.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible()

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Novedades' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Sin conexión' })).toBeVisible()
  })
})
