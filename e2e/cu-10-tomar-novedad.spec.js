import { expect, test } from '@playwright/test'
import { cargarTodaLaLista, novedadesDeLaLista, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-10 · Tomar una novedad para atención (RF-10). Pantallas 13 (asignada), 13-B (tomada) y
 * 14 (en atención).
 *
 * El aviso al reportante y el estado se comprueban leyendo la API con la sesión de cada uno:
 * la pantalla de avisos llega en el Sprint 5.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

test.describe('CU-10 · Tomar novedad para atención', () => {
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

  test('RF-10 / CU-10: el aprobador abre la novedad desde su bandeja y la toma; queda en atención y el reportante recibe su aviso', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La puerta del cuarto frío no cierra')
    const novedad = await registrar(browser, descripcion)

    // CU-10 1: la selecciona en su bandeja.
    const { contexto, page } = await sesionDe(browser, 'aprobador')
    await cargarTodaLaLista(page)
    const enLaLista = novedadesDeLaLista(page).filter({ hasText: descripcion })
    // En el teléfono la tarjeta abre el detalle; en el escritorio se elige la fila y se abre
    // desde la vista previa.
    if (await page.getByRole('table').isVisible()) {
      await enLaLista.getByRole('button').click()
      await page.getByRole('link', { name: 'Ver detalle completo' }).click()
    } else {
      await enLaLista.getByRole('link').click()
    }
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))

    // CU-10 2 y 3: la toma y queda en atención (pantalla 13-B).
    await page.getByRole('button', { name: 'Tomar para atención' }).click()
    await expect(page.getByText('Novedad tomada. Ya está En atención.')).toBeVisible()
    await expect(
      page.getByRole('group', { name: 'Datos de la novedad' }).getByText('En atención'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tomar para atención' })).toHaveCount(0)

    // CU-10 4: la línea de tiempo muestra la transición y quién la tomó.
    const pasos = page.getByRole('region', { name: 'Línea de tiempo' }).getByRole('listitem')
    await expect(pasos).toHaveCount(3)
    await expect(
      pasos.nth(0).getByText('Aprobador de prueba Mantenimiento · Aprobador · Mantenimiento'),
    ).toBeVisible()
    await expect(page.getByText(/Tomada por Aprobador de prueba Mantenimiento/)).toBeVisible()
    await contexto.close()

    // CU-10 5: el reportante tiene su aviso, y ve la novedad en atención.
    const reportante = await sesionDe(browser, 'reportante')
    const avisos = await leerDeLaApi(
      reportante.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${novedad.id}`,
    )
    expect(avisos).toEqual([{ estado_nuevo: 'en_atencion', leida: false }])
    const [vista] = await leerDeLaApi(
      reportante.page,
      `v_novedad?select=estado&id=eq.${novedad.id}`,
    )
    expect(vista).toEqual({ estado: 'en_atencion' })
    await reportante.contexto.close()
  })

  test('RF-10 / CU-10: si la novedad ya fue tomada en otra ventana, la segunda avisa que cambió de estado y se actualiza', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El extractor de la empacadora hace ruido')
    const novedad = await registrar(browser, descripcion)

    // El mismo aprobador tiene el detalle abierto en dos ventanas, las dos con la novedad
    // asignada.
    const { contexto, page: primera } = await sesionDe(browser, 'aprobador')
    await primera.goto(`/novedades/${novedad.id}`)
    await expect(primera.getByRole('button', { name: 'Tomar para atención' })).toBeVisible(
      ESPERA_DE_SESION,
    )
    const segunda = await contexto.newPage()
    await segunda.goto(`/novedades/${novedad.id}`)
    await expect(segunda.getByRole('button', { name: 'Tomar para atención' })).toBeVisible(
      ESPERA_DE_SESION,
    )

    // La primera la toma.
    await primera.getByRole('button', { name: 'Tomar para atención' }).click()
    await expect(primera.getByText('Novedad tomada. Ya está En atención.')).toBeVisible()

    // La segunda llega tarde: el servidor responde TRANSICION_INVALIDA y el detalle se recarga.
    await segunda.getByRole('button', { name: 'Tomar para atención' }).click()
    await expect(segunda.getByRole('alert')).toHaveText('La novedad cambió de estado.')
    await expect(
      segunda.getByRole('group', { name: 'Datos de la novedad' }).getByText('En atención'),
    ).toBeVisible()
    await expect(segunda.getByRole('button', { name: 'Tomar para atención' })).toHaveCount(0)

    // Quedó una sola transición a en atención.
    const tomas = await leerDeLaApi(
      segunda,
      `historial_transicion?select=id&novedad_id=eq.${novedad.id}&estado_nuevo=eq.en_atencion`,
    )
    expect(tomas).toHaveLength(1)
    await contexto.close()
  })
})
