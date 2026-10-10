import { expect, test } from '@playwright/test'
import { cargarTodaLaLista, novedadesDeLaLista, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-11 · Rechazar novedad (RF-11). Pantalla 16 (hoja «Rechazar novedad»).
 *
 * El aviso al reportante y el historial se comprueban leyendo la API con la sesión de cada
 * uno: la pantalla de avisos llega en el Sprint 5.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

test.describe('CU-11 · Rechazar novedad', () => {
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
      prioridad: 'normal',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()
    return novedad
  }

  const estadoEnElDetalle = (page, estado) =>
    page.getByRole('group', { name: 'Datos de la novedad' }).getByText(estado)
  const primerPaso = (page) =>
    page.getByRole('region', { name: 'Línea de tiempo' }).getByRole('listitem').first()

  test('RF-11 / CU-11: el aprobador rechaza una novedad asignada con su motivo; queda Rechazada, sale de la bandeja y la finca ve el motivo', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'Se necesitan dos cajas de guantes')
    const motivo = 'Es una solicitud de insumos: se pide por compras, no por novedades.'
    const novedad = await registrar(browser, descripcion)

    // CU-11 1 y 2: pide rechazarla y la hoja solicita el motivo.
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click(ESPERA_DE_SESION)
    const hoja = page.getByRole('dialog', { name: 'Rechazar novedad' })
    await expect(hoja).toBeVisible()
    await expect(hoja.getByText('Esta acción no se puede deshacer.')).toBeVisible()

    // CU-11 3: elige un motivo frecuente, completa el detalle y confirma.
    await hoja.getByRole('button', { name: 'Es una solicitud de insumos' }).click()
    const campo = hoja.getByRole('textbox', { name: 'Motivo del rechazo' })
    await expect(campo).toHaveValue('Es una solicitud de insumos')
    await campo.pressSequentially(': se pide por compras, no por novedades.')
    await hoja.getByRole('button', { name: 'Rechazar novedad' }).click()

    // CU-11 4 y 5: queda rechazada, con el motivo en la línea de tiempo y sin acciones.
    await expect(page.getByText('Novedad rechazada. La finca verá el motivo.')).toBeVisible()
    await expect(hoja).toBeHidden()
    await expect(estadoEnElDetalle(page, 'Rechazada')).toBeVisible()
    await expect(primerPaso(page).getByText(motivo)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rechazar', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tomar para atención' })).toHaveCount(0)

    // Sale de la bandeja: rechazada es un estado final.
    await page.goto('/bandeja')
    await cargarTodaLaLista(page)
    await expect(novedadesDeLaLista(page).filter({ hasText: descripcion })).toHaveCount(0)
    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,estado_nuevo,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.rechazada`,
    )
    expect(historial).toEqual([
      { estado_anterior: 'asignada', estado_nuevo: 'rechazada', observacion: motivo },
    ])
    await contexto.close()

    // CU-11 6: el reportante tiene su aviso y ve el motivo en el detalle.
    const reportante = await sesionDe(browser, 'reportante')
    const avisos = await leerDeLaApi(
      reportante.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${novedad.id}`,
    )
    expect(avisos).toEqual([{ estado_nuevo: 'rechazada', leida: false }])
    await reportante.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(reportante.page, 'Rechazada')).toBeVisible(ESPERA_DE_SESION)
    await expect(primerPaso(reportante.page).getByText(motivo)).toBeVisible()
    await reportante.contexto.close()
  })

  test('RF-11 / CU-11 3a: sin motivo no se puede confirmar; al cancelar no cambia nada, y una novedad en atención también se rechaza', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La chapa de la bodega está dura')
    const novedad = await registrar(browser, descripcion)

    // La toma primero: el rechazo también se admite desde en atención.
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await page.getByRole('button', { name: 'Tomar para atención' }).click(ESPERA_DE_SESION)
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()

    // CU-11 3a: con el motivo vacío, o solo con espacios, no se puede confirmar.
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
    const hoja = page.getByRole('dialog', { name: 'Rechazar novedad' })
    const campo = hoja.getByRole('textbox', { name: 'Motivo del rechazo' })
    const confirmar = hoja.getByRole('button', { name: 'Rechazar novedad' })
    await expect(confirmar).toBeDisabled()
    await campo.fill('     ')
    await expect(confirmar).toBeDisabled()

    // Al cancelar, la novedad sigue como estaba.
    await campo.fill('Duplicada')
    await hoja.getByRole('button', { name: 'Cancelar' }).click()
    await expect(hoja).toBeHidden()
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()
    const [antes] = await leerDeLaApi(page, `v_novedad?select=estado&id=eq.${novedad.id}`)
    expect(antes).toEqual({ estado: 'en_atencion' })

    // La hoja vuelve a abrir en blanco; con un motivo, se rechaza.
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click()
    await expect(campo).toHaveValue('')
    await campo.fill('Duplicada: es la misma chapa de otra novedad.')
    await confirmar.click()
    await expect(estadoEnElDetalle(page, 'Rechazada')).toBeVisible()

    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.rechazada`,
    )
    expect(historial).toEqual([
      {
        estado_anterior: 'en_atencion',
        observacion: 'Duplicada: es la misma chapa de otra novedad.',
      },
    ])
    await contexto.close()
  })
})
