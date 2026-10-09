import { expect, test } from '@playwright/test'
import { cargarTodaLaLista, novedadesDeLaLista, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-17 · Reasignar novedad a otra área (RF-17). Pantalla 17 (hoja «Reasignar a otra área»).
 *
 * Los avisos se comprueban leyendo la API con la sesión de cada uno: la pantalla de avisos
 * llega en el Sprint 5.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

test.describe('CU-17 · Reasignar novedad a otra área', () => {
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

  const reasignar = (page) => page.getByRole('button', { name: 'Reasignar', exact: true })

  test('RF-17 / CU-17: Mantenimiento reasigna una novedad a Sistemas con su motivo; sale de su alcance y Sistemas la recibe como asignada', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El computador de la oficina no enciende')
    const motivo = 'Es un equipo de cómputo; lo atiende Sistemas.'
    const novedad = await registrar(browser, descripcion)

    // CU-17 1 y 2: pide reasignarla; la hoja muestra el área actual y la de destino.
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await reasignar(page).click(ESPERA_DE_SESION)
    const hoja = page.getByRole('dialog', { name: 'Reasignar a otra área' })
    await expect(hoja.getByText('Área actual')).toBeVisible()
    await expect(hoja.getByText('Destino', { exact: true })).toBeVisible()
    await expect(
      hoja.getByText('La novedad pasará a la bandeja de Sistemas como Asignada.'),
    ).toBeVisible()

    // CU-17 3a y 3: sin motivo no se confirma; con motivo, sí.
    const confirmar = hoja.getByRole('button', { name: 'Reasignar' })
    await expect(confirmar).toBeDisabled()
    await hoja.getByRole('textbox', { name: 'Motivo de la reasignación' }).fill(motivo)
    await confirmar.click()

    // CU-17 4: la novedad deja la bandeja de Mantenimiento; el aviso lo confirma.
    await expect(page).toHaveURL(/\/bandeja/)
    await expect(page.getByText('Novedad reasignada a Sistemas.')).toBeVisible()
    await cargarTodaLaLista(page)
    await expect(novedadesDeLaLista(page).filter({ hasText: descripcion })).toHaveCount(0)

    // Ya no está en su alcance: la dirección del detalle responde «No puedes ver esta novedad».
    await page.goto(`/novedades/${novedad.id}`)
    await expect(
      page.getByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
    ).toBeVisible(ESPERA_DE_SESION)
    await contexto.close()

    // El aprobador de Sistemas la ve en «Por atender», asignada.
    const sistemas = await sesionDe(browser, 'aprobadorSistemas')
    await cargarTodaLaLista(sistemas.page)
    const enLaLista = novedadesDeLaLista(sistemas.page).filter({ hasText: descripcion })
    await expect(enLaLista).toHaveCount(1)
    // La nota del origen va en la tabla del escritorio.
    if (await sistemas.page.getByRole('table').isVisible()) {
      await expect(enLaLista.getByText('Reasignada desde Mantenimiento')).toBeVisible()
    }

    // CU-17 5: la línea de tiempo deja constancia de las dos áreas y del motivo.
    await sistemas.page.goto(`/novedades/${novedad.id}`)
    const primerPaso = sistemas.page
      .getByRole('region', { name: 'Línea de tiempo' })
      .getByRole('listitem')
      .first()
    await expect(primerPaso.getByText('Área: de Mantenimiento a Sistemas')).toBeVisible(
      ESPERA_DE_SESION,
    )
    await expect(primerPaso.getByText(motivo)).toBeVisible()
    await expect(sistemas.page.getByRole('button', { name: 'Tomar para atención' })).toBeVisible()

    // CU-17 6: aviso al área nueva y al reportante.
    const avisosDeSistemas = await leerDeLaApi(
      sistemas.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${novedad.id}`,
    )
    expect(avisosDeSistemas).toEqual([{ estado_nuevo: 'asignada', leida: false }])
    await sistemas.contexto.close()

    const reportante = await sesionDe(browser, 'reportante')
    const avisosDelReportante = await leerDeLaApi(
      reportante.page,
      `notificacion?select=estado_nuevo&novedad_id=eq.${novedad.id}`,
    )
    expect(avisosDelReportante).toEqual([{ estado_nuevo: 'asignada' }])
    const [vista] = await leerDeLaApi(
      reportante.page,
      `v_novedad?select=estado,area&id=eq.${novedad.id}`,
    )
    expect(vista).toEqual({ estado: 'asignada', area: 'Sistemas' })
    await reportante.contexto.close()
  })

  test('RF-17 / CU-17 3a: sin motivo no se puede confirmar; al cancelar, la novedad sigue en su área', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La impresora de la oficina atasca el papel')
    const novedad = await registrar(browser, descripcion)

    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await reasignar(page).click(ESPERA_DE_SESION)
    const hoja = page.getByRole('dialog', { name: 'Reasignar a otra área' })
    const campo = hoja.getByRole('textbox', { name: 'Motivo de la reasignación' })
    const confirmar = hoja.getByRole('button', { name: 'Reasignar' })

    // CU-17 3a: con el motivo vacío, o solo con espacios, no se puede confirmar.
    await expect(hoja.getByText('Destino', { exact: true })).toBeVisible()
    await expect(confirmar).toBeDisabled()
    await campo.fill('     ')
    await expect(confirmar).toBeDisabled()
    await campo.fill('Parece de Sistemas')
    await expect(confirmar).toBeEnabled()

    // Al cancelar no cambia nada.
    await hoja.getByRole('button', { name: 'Cancelar' }).click()
    await expect(hoja).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    const [vista] = await leerDeLaApi(page, `v_novedad?select=estado,area&id=eq.${novedad.id}`)
    expect(vista).toEqual({ estado: 'asignada', area: 'Mantenimiento' })
    await contexto.close()
  })
})
