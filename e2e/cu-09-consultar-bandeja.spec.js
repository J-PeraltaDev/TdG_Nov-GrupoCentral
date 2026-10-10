import { expect, test } from '@playwright/test'
import {
  cargarTodaLaLista,
  novedadesDeLaLista,
  posicionesEnLaLista,
  registrarPorLaApi,
} from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-09 · Consultar la bandeja del área (RF-09). Pantallas 11 (teléfono), 12 (escritorio) y
 * 11-C (bandeja vacía).
 *
 * Lo que cada aprobador puede ver lo decide la base de datos (RNF-11): además de mirar la
 * pantalla, se lee la API con la sesión de cada uno.
 */
test.describe('CU-09 · Consultar la bandeja del área', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-09 / CU-09: el aprobador ve las novedades de su área, primero la de mayor prioridad', async ({
    browser,
  }, testInfo) => {
    const baja = descripcionUnica(testInfo, 'La puerta de la bodega no cierra bien')
    const critica = descripcionUnica(testInfo, 'El torniquete de la entrada no gira')
    const sesionDe = async (rol) => {
      const contexto = await browser.newContext()
      const page = await contexto.newPage()
      await ingresarComo(page, rol)
      return { contexto, page }
    }

    // El reportante registra para Mantenimiento una novedad baja y, después, una crítica.
    const reportante = await sesionDe('reportante')
    await registrarPorLaApi(reportante.page, {
      descripcion: baja,
      prioridad: 'bajo',
      area: 'Mantenimiento',
    })
    const laCritica = await registrarPorLaApi(reportante.page, {
      descripcion: critica,
      prioridad: 'critico',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()

    // El aprobador de Mantenimiento entra a su bandeja: están las dos en «Por atender».
    const mantenimiento = await sesionDe('aprobador')
    await expect(mantenimiento.page).toHaveURL(/\/bandeja$/)
    await expect(
      mantenimiento.page.getByRole('heading', { level: 1, name: 'Bandeja · Mantenimiento' }),
    ).toBeAttached()
    await expect(mantenimiento.page.getByRole('tab', { name: /^Por atender/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await cargarTodaLaLista(mantenimiento.page)

    // CU-09 2: la crítica va antes que la baja, aunque se registró después.
    const [posicionCritica, posicionBaja] = await posicionesEnLaLista(mantenimiento.page, [
      critica,
      baja,
    ])
    expect(posicionCritica).toBeGreaterThanOrEqual(0)
    expect(posicionBaja).toBeGreaterThan(posicionCritica)

    // CU-09 3: código, finca, prioridad, estado y tiempo desde el registro.
    const codigo = `NOV-${String(laCritica.codigo).padStart(4, '0')}`
    const laNovedad = novedadesDeLaLista(mantenimiento.page).filter({ hasText: critica })
    await expect(laNovedad.getByText(codigo, { exact: true })).toBeVisible()
    await expect(laNovedad.getByText('Finca de prueba 01')).toBeVisible()
    await expect(laNovedad.getByText('Crítico')).toBeVisible()
    await expect(laNovedad.getByText('Asignada')).toBeVisible()
    await expect(laNovedad.locator('time')).toBeVisible()
    await mantenimiento.contexto.close()

    // RNF-11: el aprobador de Sistemas no las ve, ni en su bandeja ni por la API.
    const sistemas = await sesionDe('aprobadorSistemas')
    await expect(
      sistemas.page.getByRole('heading', { level: 1, name: 'Bandeja · Sistemas' }),
    ).toBeAttached()
    await cargarTodaLaLista(sistemas.page)
    expect(await posicionesEnLaLista(sistemas.page, [critica, baja])).toEqual([-1, -1])
    expect(
      await leerDeLaApi(sistemas.page, `v_novedad?select=id&codigo=eq.${laCritica.codigo}`),
    ).toEqual([])
    await sistemas.contexto.close()
  })

  test('RF-09 / CU-09 2b: sin novedades pendientes, la bandeja lo informa (pantalla 11-C)', async ({
    page,
  }) => {
    // «staging» nunca está vacío: la consulta de la bandeja se responde con una lista vacía.
    await page.route(/\/rest\/v1\/v_novedad/, (ruta) =>
      ruta.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
          'access-control-expose-headers': 'content-range',
          'content-range': '*/0',
        },
        contentType: 'application/json',
        body: ruta.request().method() === 'GET' ? '[]' : '',
      }),
    )

    await ingresarComo(page, 'aprobador')

    await expect(page.getByText('No hay novedades pendientes en Mantenimiento')).toBeVisible()
    await expect(page.getByText('Te avisaremos cuando llegue una nueva.')).toBeVisible()
    await expect(novedadesDeLaLista(page)).toHaveCount(0)
  })
})
