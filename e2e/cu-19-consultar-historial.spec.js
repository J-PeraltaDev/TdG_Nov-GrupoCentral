import { expect, test } from '@playwright/test'
import {
  diaEnColombia,
  enTelefono,
  registrarPorLaApi,
  resolverPorLaApi,
} from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, llamarALaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-19 · Consultar el historial (RF-19). Pantallas 21, 21-B, 21-C y 21-D, y el buscador por
 * código de la barra del escritorio (plan del Sprint 5, decisión 15).
 *
 * «staging» acumula las novedades de otras corridas: la de cada prueba se registra y se resuelve
 * por la API con la sesión de cada rol, y se busca por su código.
 */

const codigoDe = (novedad) => `NOV-${String(novedad.codigo).padStart(4, '0')}`

/** Registra una novedad de Mantenimiento y la deja resuelta, con la sesión de cada rol. */
async function novedadResuelta(browser, testInfo) {
  const contexto = await browser.newContext()
  const pagina = await contexto.newPage()
  await ingresarComo(pagina, 'reportante')
  const novedad = await registrarPorLaApi(pagina, {
    descripcion: descripcionUnica(testInfo, 'El biométrico del acopio no lee'),
    prioridad: 'alto',
    area: 'Mantenimiento',
  })
  await ingresarComo(pagina, 'aprobador')
  await llamarALaApi(pagina, 'tomar_novedad', { p_novedad_id: novedad.id })
  await resolverPorLaApi(pagina, novedad.id, 'Se limpió el lector y se volvió a enrolar.')
  await contexto.close()
  return novedad
}

/** Los campos de los filtros: la tarjeta de 21 o, en el teléfono, la hoja de 21-D abierta. */
async function abrirFiltros(page) {
  if (!enTelefono(page)) return page.getByRole('form', { name: 'Filtros' })
  await page.getByRole('button', { name: /^Filtros/ }).click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

/** Elige el rango en los dos campos de fecha del control «Rango de fechas». */
async function elegirRango(filtros, desde, hasta) {
  await filtros.getByRole('button', { name: /^Rango de fechas/ }).click()
  await filtros.getByLabel('Desde', { exact: true }).fill(desde)
  await filtros.getByLabel('Hasta', { exact: true }).fill(hasta)
}

test.describe('CU-19 · Consultar el historial', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-19 / CU-19 1–6: el administrador filtra por estado y fechas, abre la novedad y vuelve con los filtros', async ({
    page,
    browser,
  }, testInfo) => {
    const novedad = await novedadResuelta(browser, testInfo)
    await ingresarComo(page, 'administrador')

    // CU-19 1 y 2: abre el historial.
    await page.goto('/historial')
    const filtros = await abrirFiltros(page)
    // Las opciones vienen del servidor: hay tipos de falla para elegir (decisión 9).
    await expect(filtros.getByLabel('Tipo de falla').locator('option')).not.toHaveCount(1)

    // CU-19 3: estado «Resuelta» y el día de hoy.
    await filtros.getByRole('button', { name: /^Estado/ }).click()
    await filtros.getByRole('checkbox', { name: 'Resuelta' }).check()
    await elegirRango(filtros, diaEnColombia(), diaEnColombia())
    await filtros.getByRole('button', { name: 'Aplicar filtros' }).click()

    await expect(page).toHaveURL(
      new RegExp(`/historial\\?estado=resuelta&desde=${diaEnColombia()}&hasta=${diaEnColombia()}$`),
    )
    const chips = page.getByRole('list', { name: 'Filtros aplicados' })
    await expect(chips.getByRole('listitem')).toHaveCount(2)

    // CU-19 4: la novedad de esta prueba, con su estado y, en el escritorio, cuánto tardó.
    const enlace = page.getByRole('link', { name: codigoDe(novedad), exact: true })
    if (!enTelefono(page)) {
      const fila = page.getByRole('row').filter({ has: enlace })
      await expect(fila.getByRole('cell').nth(5)).toHaveText('Resuelta')
      await expect(fila.getByRole('cell').nth(7)).not.toHaveText('—')
    }

    // CU-19 5 y 6: abre el detalle y vuelve al mismo resultado.
    await enlace.click()
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await page.getByRole('link', { name: 'Volver al historial' }).click()
    await expect(page).toHaveURL(/\/historial\?estado=resuelta&desde=/)
    await expect(chips.getByRole('listitem')).toHaveCount(2)
  })

  test('RF-19 / CU-19 3a y 4a: el rango invertido no se aplica (21-B) y sin resultados lo dice (21-C)', async ({
    page,
  }) => {
    await ingresarComo(page, 'administrador')
    await page.goto('/historial')

    // 21-B
    const filtros = await abrirFiltros(page)
    await elegirRango(filtros, diaEnColombia(), diaEnColombia(-30))
    await expect(
      filtros.getByText('La fecha inicial debe ser anterior a la final').first(),
    ).toBeVisible()
    const aplicar = filtros.getByRole('button', { name: 'Aplicar filtros' })
    await expect(aplicar).toHaveAttribute('aria-disabled', 'true')
    // No disponible, pero en el orden del teclado (RF-25): pulsarlo no hace nada.
    await aplicar.click({ force: true })
    await expect(page).toHaveURL(/\/historial$/)

    // 21-C: nada se registró en 2001.
    await page.goto('/historial?desde=2001-01-01&hasta=2001-12-31')
    await expect(page.getByText('Ninguna novedad cumple estos filtros')).toBeVisible()
    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    await expect(page).toHaveURL(/\/historial$/)
  })

  test('RF-19 / RF-20: el aprobador solo ve su área, sin filtro de área ni «Exportar CSV»', async ({
    page,
  }) => {
    await ingresarComo(page, 'aprobador')
    await page.goto('/historial')

    await expect(
      page.getByText(
        'La exportación a CSV solo está disponible para el administrador y el director de agricultura.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Exportar CSV/ })).toHaveCount(0)

    if (enTelefono(page)) {
      // 21-D: el área va bajo el título, y la hoja no la ofrece.
      await expect(page.getByRole('banner').getByText('Mantenimiento')).toBeVisible()
      const hoja = await abrirFiltros(page)
      await expect(hoja.getByLabel('Finca')).toBeVisible()
      await expect(hoja.getByLabel('Área')).toHaveCount(0)
    } else {
      await expect(page.getByLabel('Área')).toHaveCount(0)
      const areas = page.getByRole('table').getByRole('row').locator('td:nth-child(4)')
      await expect(areas.first()).toBeVisible()
      for (const area of await areas.allTextContents()) expect(area).toBe('Mantenimiento')
    }
  })

  test('RF-19 (decisión 15): el reportante busca su novedad por código en la barra del escritorio', async ({
    page,
  }, testInfo) => {
    test.skip(enTelefono(page), 'El buscador solo está en la barra del escritorio (Figma 21).')
    await ingresarComo(page, 'reportante')
    const novedad = await registrarPorLaApi(page, {
      descripcion: descripcionUnica(testInfo, 'La bomba del lavadero suena'),
      prioridad: 'normal',
      area: 'Mantenimiento',
    })

    const buscador = page.getByRole('searchbox', { name: 'Buscar por código' })
    await buscador.fill(`nov ${novedad.codigo}`)
    await buscador.press('Enter')

    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(page.getByRole('heading', { level: 1, name: codigoDe(novedad) })).toBeVisible()

    // Un código que no existe: el mismo mensaje que uno de otra finca.
    await buscador.fill('NOV-999999')
    await buscador.press('Enter')
    await expect(
      page.getByText('No encontramos NOV-999999 entre las novedades que puedes ver.'),
    ).toBeVisible()
  })
})
