import { expect, test } from '@playwright/test'
import { registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import {
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  llamarALaApi,
  MOTIVO_SIN_CLAVE,
} from './apoyo/usuarios.js'

/*
 * CU-14 · Registrar solución aplicada (RF-14). Pantallas 18 (registrar solución y tipo de
 * falla) y 18-B (fecha posterior a hoy).
 *
 * La pantalla 18-C (novedad aprobada por el director) se cubre con pruebas unitarias: hasta
 * el Sprint 3 la aplicación no tiene cómo aprobar un escalamiento.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

/** `AAAA-MM-DD` de hoy en Colombia más los días indicados. */
function diaEnColombia(masDias = 0) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  const fecha = new Date(`${hoy}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + masDias)
  return fecha.toISOString().slice(0, 10)
}

test.describe('CU-14 · Registrar solución aplicada', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  /** El reportante registra una novedad para Mantenimiento y cierra su sesión. */
  async function registrar(browser, descripcion) {
    const reportante = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(reportante.page, {
      descripcion,
      prioridad: 'alto',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()
    return novedad
  }

  /** El aprobador abre el detalle, toma la novedad y pasa a la pantalla de la solución. */
  async function abrirLaSolucion(page, novedad) {
    await page.goto(`/novedades/${novedad.id}`)
    await page.getByRole('button', { name: 'Tomar para atención' }).click(ESPERA_DE_SESION)
    await page.getByRole('link', { name: 'Registrar solución' }).click()
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}/solucion$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Registrar solución' })).toBeVisible()
  }

  const estadoEnElDetalle = (page, estado) =>
    page.getByRole('group', { name: 'Datos de la novedad' }).getByText(estado)

  test('RF-14 / CU-14: el aprobador toma una novedad y registra la solución con un tipo de falla nuevo; queda Resuelta y la finca la ve por confirmar', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El biométrico no deja marcar la salida')
    // Un tipo que no existe todavía: «staging» acumula los de otras corridas.
    const tipo = `Tipo e2e ${testInfo.project.name} ${Date.now()}`
    const solucion = 'Se actualizó el firmware del biométrico y se reinició el equipo.'
    const novedad = await registrar(browser, descripcion)

    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await abrirLaSolucion(page, novedad)

    // CU-14 2: pide qué se hizo, la fecha (hoy, sin dejar pasar de hoy) y el tipo de falla.
    const fecha = page.getByLabel(/^Fecha de ejecución/)
    await expect(fecha).toHaveValue(diaEnColombia())
    await expect(fecha).toHaveAttribute('max', diaEnColombia())
    await page.getByRole('textbox', { name: '¿Qué se hizo?' }).fill(solucion)

    // CU-14 3 a 5: escribe el tipo; como no existe, confirma uno nuevo.
    await page.getByRole('combobox', { name: 'Tipo de falla' }).fill(tipo)
    await page.getByRole('option', { name: `Crear tipo nuevo «${tipo}»` }).click()
    const elegido = page.getByRole('group', { name: 'Tipo de falla' })
    await expect(elegido.getByText(tipo)).toBeVisible()
    await expect(elegido.getByText('Tipo nuevo', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Marcar como resuelta' }).click()

    // CU-14 6 y 7: vuelve al detalle, ya resuelta, con la solución y el tipo.
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(
      page.getByText('Solución registrada. La finca debe confirmar el cierre.'),
    ).toBeVisible()
    await expect(estadoEnElDetalle(page, 'Resuelta')).toBeVisible()
    await expect(page.getByText(solucion)).toBeVisible()
    await expect(page.getByText(tipo).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registrar solución' })).toHaveCount(0)
    await expect(
      page.getByRole('region', { name: 'Línea de tiempo' }).getByRole('listitem'),
    ).toHaveCount(4)

    // En la base quedó resuelta con sus tres datos y una transición sin observación.
    const [vista] = await leerDeLaApi(
      page,
      `v_novedad?select=estado,solucion,fecha_ejecucion,tipo_falla&id=eq.${novedad.id}`,
    )
    expect(vista).toEqual({
      estado: 'resuelta',
      solucion,
      fecha_ejecucion: diaEnColombia(),
      tipo_falla: tipo,
    })
    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.resuelta`,
    )
    expect(historial).toEqual([{ estado_anterior: 'en_atencion', observacion: null }])

    // CU-14 5a: el tipo recién creado ya se sugiere, aunque se escriba en mayúsculas y con
    // espacios de más, y es coincidencia exacta.
    const sugerencias = await llamarALaApi(page, 'sugerir_tipos_falla', {
      p_texto: `  ${tipo.toUpperCase()}  `,
    })
    expect(sugerencias).toEqual([
      expect.objectContaining({ nombre: tipo, cantidad_novedades: 1, coincidencia_exacta: true }),
    ])
    await contexto.close()

    // CU-14 8: el reportante tiene su aviso y ve la novedad en «Por confirmar».
    const reportante = await sesionDe(browser, 'reportante')
    const avisos = await leerDeLaApi(
      reportante.page,
      `notificacion?select=estado_nuevo&novedad_id=eq.${novedad.id}&order=creada_en.asc`,
    )
    expect(avisos).toEqual([{ estado_nuevo: 'en_atencion' }, { estado_nuevo: 'resuelta' }])
    await reportante.page.goto('/novedades?lista=por_confirmar')
    await expect(reportante.page.getByText(descripcion)).toBeVisible(ESPERA_DE_SESION)
    await reportante.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(reportante.page, 'Resuelta')).toBeVisible(ESPERA_DE_SESION)
    await expect(reportante.page.getByText(solucion)).toBeVisible()
    await reportante.contexto.close()

    // Y el administrador, el suyo, porque se creó un tipo de falla.
    const administrador = await sesionDe(browser, 'administrador')
    const avisosDelAdministrador = await leerDeLaApi(
      administrador.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${novedad.id}`,
    )
    expect(avisosDelAdministrador).toEqual([{ estado_nuevo: 'resuelta', leida: false }])
    await administrador.contexto.close()
  })

  test('RF-14 / CU-14 6a (18-B): con datos faltantes o con la fecha de mañana no se registra; lo señala y la novedad sigue en atención', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La bomba del lote 7 gotea')
    // Este tipo no llega a crearse: la solución nunca se registra.
    const tipo = `Tipo e2e sin crear ${testInfo.project.name} ${Date.now()}`
    const novedad = await registrar(browser, descripcion)

    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await abrirLaSolucion(page, novedad)
    const marcar = page.getByRole('button', { name: 'Marcar como resuelta' })
    const solucion = page.getByRole('textbox', { name: '¿Qué se hizo?' })
    const fecha = page.getByLabel(/^Fecha de ejecución/)

    // Sin datos: señala lo que falta y lleva el foco al primer campo.
    await marcar.click()
    await expect(page.getByText('Describe qué se hizo.')).toBeVisible()
    await expect(page.getByText('Elige un tipo de falla o crea uno nuevo.')).toBeVisible()
    await expect(solucion).toBeFocused()

    // Con la fecha de mañana: pantalla 18-B.
    await solucion.fill('Se cambió el empaque de la bomba.')
    await page.getByRole('combobox', { name: 'Tipo de falla' }).fill(tipo)
    await page.getByRole('option', { name: `Crear tipo nuevo «${tipo}»` }).click()
    await fecha.fill(diaEnColombia(1))
    await marcar.click()
    await expect(
      page.getByText(/^La fecha de ejecución no puede ser posterior a hoy \(/),
    ).toBeVisible()
    await expect(fecha).toHaveAttribute('aria-invalid', 'true')

    // No se registró nada: sigue en atención, sin solución, y el tipo no se creó.
    const [vista] = await leerDeLaApi(page, `v_novedad?select=estado,solucion&id=eq.${novedad.id}`)
    expect(vista).toEqual({ estado: 'en_atencion', solucion: null })
    expect(await llamarALaApi(page, 'sugerir_tipos_falla', { p_texto: tipo })).toEqual([])

    // Al salir sin registrar, el detalle sigue ofreciendo la acción. En el teléfono se sale
    // con «Cerrar»; en el escritorio, con «Cancelar».
    await page.getByRole('link', { name: /^(Cerrar sin registrar la solución|Cancelar)$/ }).click()
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(page.getByRole('link', { name: 'Registrar solución' })).toBeVisible()
    await contexto.close()
  })
})
