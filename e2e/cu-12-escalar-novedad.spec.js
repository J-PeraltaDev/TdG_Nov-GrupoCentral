import { expect, test } from '@playwright/test'
import { cargarTodaLaLista, novedadesDeLaLista, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-12 · Escalar novedad a segunda instancia (RF-12). Pantalla 15 (hoja «Escalar al director
 * de agricultura»).
 *
 * El aviso al director se comprueba leyendo la API con su sesión: la pantalla de avisos llega
 * en el Sprint 5. Su lista de escaladas (pantalla 19) se prueba con el CU-13.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

test.describe('CU-12 · Escalar novedad', () => {
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
      prioridad: 'critico',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()
    return novedad
  }

  const estadoEnElDetalle = (page, estado) =>
    page.getByRole('group', { name: 'Datos de la novedad' }).getByText(estado)
  const escalar = (page) => page.getByRole('button', { name: 'Escalar al director' })

  test('RF-12 / CU-12: el aprobador escala una novedad en atención con su justificación; queda Escalada, pasa a «En espera» y el director y el reportante reciben su aviso', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La bomba de riego del lote 4 no enciende')
    const justificacion = 'El motor se quemó. Hay que comprar uno nuevo; no hay repuesto en bodega.'
    const novedad = await registrar(browser, descripcion)

    // Precondición: la novedad está en atención.
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await page.getByRole('button', { name: 'Tomar para atención' }).click(ESPERA_DE_SESION)
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()

    // CU-12 1 y 2: pide escalarla y la hoja solicita la justificación.
    await escalar(page).click()
    const hoja = page.getByRole('dialog', { name: 'Escalar al director de agricultura' })
    await expect(hoja).toBeVisible()
    await expect(
      hoja.getByText('Se avisará al director de agricultura y a la finca.'),
    ).toBeVisible()

    // CU-12 3: escribe la justificación y confirma.
    await hoja.getByRole('textbox', { name: 'Justificación' }).fill(justificacion)
    await hoja.getByRole('button', { name: 'Escalar novedad' }).click()

    // CU-12 4 y 5: queda escalada, con la justificación en la línea de tiempo; el aprobador
    // ya no tiene acciones sobre ella.
    await expect(page.getByText('Novedad escalada. Queda en espera del director.')).toBeVisible()
    await expect(hoja).toBeHidden()
    await expect(estadoEnElDetalle(page, 'Escalada')).toBeVisible()
    await expect(
      page
        .getByRole('region', { name: 'Línea de tiempo' })
        .getByRole('listitem')
        .first()
        .getByText(justificacion),
    ).toBeVisible()
    await expect(escalar(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rechazar', exact: true })).toHaveCount(0)

    // En la bandeja pasa a «En espera».
    await page.goto('/bandeja?pestana=en_espera')
    await cargarTodaLaLista(page)
    await expect(novedadesDeLaLista(page).filter({ hasText: descripcion })).toHaveCount(1)
    await contexto.close()

    // CU-12 6: el director tiene su aviso y ya puede ver la novedad escalada.
    const director = await sesionDe(browser, 'director')
    const avisosDelDirector = await leerDeLaApi(
      director.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${novedad.id}`,
    )
    expect(avisosDelDirector).toEqual([{ estado_nuevo: 'escalada', leida: false }])
    const [vista] = await leerDeLaApi(director.page, `v_novedad?select=estado&id=eq.${novedad.id}`)
    expect(vista).toEqual({ estado: 'escalada' })
    await director.contexto.close()

    // Y el reportante, el suyo (después del de «en atención»).
    const reportante = await sesionDe(browser, 'reportante')
    const avisosDelReportante = await leerDeLaApi(
      reportante.page,
      `notificacion?select=estado_nuevo&novedad_id=eq.${novedad.id}&order=creada_en.asc`,
    )
    expect(avisosDelReportante).toEqual([
      { estado_nuevo: 'en_atencion' },
      { estado_nuevo: 'escalada' },
    ])
    await reportante.contexto.close()
  })

  test('RF-12 / CU-12 3a: una novedad asignada no se puede escalar, y sin justificación no se confirma; al cancelar no cambia nada', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El portón de la entrada quedó descolgado')
    const novedad = await registrar(browser, descripcion)

    // Asignada: todavía no ofrece escalar (primero hay que tomarla).
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await page.goto(`/novedades/${novedad.id}`)
    await expect(page.getByRole('button', { name: 'Tomar para atención' })).toBeVisible(
      ESPERA_DE_SESION,
    )
    await expect(escalar(page)).toHaveCount(0)
    await page.getByRole('button', { name: 'Tomar para atención' }).click()
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()

    // CU-12 3a: con la justificación vacía, o solo con espacios, no se puede confirmar.
    await escalar(page).click()
    const hoja = page.getByRole('dialog', { name: 'Escalar al director de agricultura' })
    const campo = hoja.getByRole('textbox', { name: 'Justificación' })
    const confirmar = hoja.getByRole('button', { name: 'Escalar novedad' })
    await expect(confirmar).toBeDisabled()
    await campo.fill('     ')
    await expect(confirmar).toBeDisabled()
    await campo.fill('Hay que comprar la bisagra')
    await expect(confirmar).toBeEnabled()

    // Al cancelar, la novedad sigue en atención y nadie recibe aviso de escalamiento.
    await hoja.getByRole('button', { name: 'Cancelar' }).click()
    await expect(hoja).toBeHidden()
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()
    const escalamientos = await leerDeLaApi(
      page,
      `historial_transicion?select=id&novedad_id=eq.${novedad.id}&estado_nuevo=eq.escalada`,
    )
    expect(escalamientos).toEqual([])
    await contexto.close()
  })
})
