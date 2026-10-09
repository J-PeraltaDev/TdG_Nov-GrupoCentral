import { expect, test } from '@playwright/test'

// RNF-18: la política de tratamiento de datos personales se consulta sin sesión, desde la
// pantalla de ingreso. No necesita usuarios de prueba.
test.describe('Política de tratamiento de datos', () => {
  test('RNF-18: se abre desde el ingreso, sin sesión, y se vuelve a él', async ({ page }) => {
    await page.goto('/ingresar')
    await page.getByRole('link', { name: 'Política de tratamiento de datos' }).click()

    await expect(page).toHaveURL(/\/tratamiento-de-datos$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Política de tratamiento de datos personales' }),
    ).toBeVisible()
    await expect(page.getByText(/Ley 1581 de 2012/).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(10)

    await page.getByRole('link', { name: 'Volver al ingreso' }).click()
    await expect(page).toHaveURL(/\/ingresar$/)
  })

  test('RNF-01: la política no desborda el ancho de la pantalla', async ({ page }) => {
    await page.goto('/tratamiento-de-datos')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const desborda = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(desborda).toBe(false)
  })
})
