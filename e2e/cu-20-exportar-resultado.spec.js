import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { diaEnColombia, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE, USUARIOS } from './apoyo/usuarios.js'

/*
 * CU-20 · Exportar resultado de la consulta (RF-20). Pantalla 21, «Exportar CSV».
 *
 * El reportante registra una novedad por la API; el administrador filtra el historial por el
 * día de hoy y su estado, exporta y la prueba lee el archivo descargado.
 */

const ENCABEZADO =
  'Código;Registrada en finca;Finca;Razón social;Área;Prioridad;Estado;Tipo de falla;' +
  'Fecha de ejecución;Reportada por;Horas hasta la resolución'

test.describe('CU-20 · Exportar resultado', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('CU-20 1 a 3: el administrador exporta lo filtrado y el archivo trae la novedad', async ({
    browser,
    page,
  }, testInfo) => {
    const contexto = await browser.newContext()
    const reportante = await contexto.newPage()
    await ingresarComo(reportante, 'reportante')
    const novedad = await registrarPorLaApi(reportante, {
      descripcion: descripcionUnica(testInfo, 'Exportar CSV'),
      prioridad: 'bajo',
      area: 'Sistemas',
    })
    await contexto.close()

    const hoy = diaEnColombia()
    await ingresarComo(page, 'administrador')
    await page.goto(`/historial?estado=asignada&desde=${hoy}&hasta=${hoy}`)

    const descarga = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar CSV' }).click()
    const archivo = await descarga

    expect(archivo.suggestedFilename()).toBe(`historial-novedades-${hoy}.csv`)
    const bytes = await readFile(await archivo.path())
    // UTF-8 con BOM, para que la hoja de cálculo lea las tildes.
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const filas = bytes.subarray(3).toString('utf8').split('\r\n')
    expect(filas[0]).toBe(ENCABEZADO)
    const codigo = `NOV-${String(novedad.codigo).padStart(4, '0')}`
    const fila = filas.find((linea) => linea.startsWith(`${codigo};`))
    expect(fila).toMatch(
      new RegExp(
        `^${codigo};${hoy} \\d{2}:\\d{2};[^;]+;[^;]+;Sistemas;Bajo;Asignada;;;${USUARIOS.reportante.nombre};$`,
      ),
    )
    // Solo lo filtrado: todas asignadas.
    expect(filas.slice(1, -1).every((linea) => linea.includes(';Asignada;'))).toBe(true)
  })
})
