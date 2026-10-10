import { expect, test } from '@playwright/test'
import { registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import {
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  llamarALaApi,
  MOTIVO_SIN_CLAVE,
  USUARIOS,
} from './apoyo/usuarios.js'

/*
 * CU-13 · Aprobar o rechazar la novedad escalada (RF-13). Pantallas 19 (novedades escaladas),
 * 20 y 20-B («Tu decisión», en el escritorio) y 20-C (barra y hojas, en el teléfono).
 *
 * Incluye lo que quedó pendiente del Sprint 2: la pantalla 18-C, donde el aprobador ve la
 * decisión del director antes de registrar la solución (CU-14).
 *
 * La novedad se prepara por la API con la sesión de cada rol: el reportante la registra y el
 * aprobador la toma y la escala. «staging» acumula las escaladas de otras corridas, así que
 * la lista se recorre completa y la novedad se busca por su descripción.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }

test.describe('CU-13 · Decidir sobre una novedad escalada', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  /** El reportante registra la novedad; el aprobador de Mantenimiento la toma y la escala. */
  async function escalar(browser, descripcion, justificacion) {
    const reportante = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(reportante.page, {
      descripcion,
      prioridad: 'critico',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()

    const aprobador = await sesionDe(browser, 'aprobador')
    await llamarALaApi(aprobador.page, 'tomar_novedad', { p_novedad_id: novedad.id })
    await llamarALaApi(aprobador.page, 'escalar_novedad', {
      p_novedad_id: novedad.id,
      p_justificacion: justificacion,
    })
    await aprobador.contexto.close()
    return novedad
  }

  const enTelefono = (page) => page.viewportSize().width < 1024
  const estadoEnElDetalle = (page, estado) =>
    page.getByRole('group', { name: 'Datos de la novedad' }).getByText(estado)
  const lineaDeTiempo = (page) => page.getByRole('region', { name: 'Línea de tiempo' })
  const panel = (page) => page.getByRole('region', { name: 'Tu decisión' })
  const avisosDe = (page, novedad) =>
    leerDeLaApi(
      page,
      `notificacion?select=estado_nuevo&novedad_id=eq.${novedad.id}&order=creada_en.asc`,
    )

  /** Los tres contadores de la pantalla 19, en su orden. */
  async function contadores(page) {
    const resumen = page.getByRole('list', { name: 'Resumen de tus decisiones' })
    // Mientras cargan dicen «–».
    await expect(resumen).not.toContainText('–', ESPERA_DE_SESION)
    const textos = await resumen.getByRole('listitem').allTextContents()
    const [esperan, aprobadas, rechazadas] = textos.map((texto) => Number(texto.match(/\d+$/)[0]))
    return { esperan, aprobadas, rechazadas }
  }

  /** Trae todas las páginas de la pantalla 19. */
  async function cargarTodasLasEscaladas(page) {
    const verMas = page.getByRole('button', { name: 'Ver más' })
    const tarjetas = page.getByRole('article')
    await expect(tarjetas.first()).toBeVisible(ESPERA_DE_SESION)
    while (await verMas.isVisible()) {
      const antes = await tarjetas.count()
      await verMas.click()
      await expect.poll(() => tarjetas.count()).toBeGreaterThan(antes)
      await expect(page.getByRole('button', { name: 'Cargando…' })).toHaveCount(0)
    }
  }

  /**
   * Elige la opción y deja lista la observación, sin confirmar. En el escritorio es el panel
   * «Tu decisión»; en el teléfono, la hoja que abre el botón de la barra.
   *
   * @returns El contenedor donde quedaron el campo y el botón «Confirmar decisión».
   */
  async function elegir(page, opcion, observacion) {
    let lugar
    if (enTelefono(page)) {
      await page.getByRole('button', { name: opcion, exact: true }).click()
      lugar = page.getByRole('dialog', { name: opcion })
      await expect(lugar).toBeVisible()
    } else {
      lugar = panel(page)
      // El botón de radio está oculto a la vista: se toca su tarjeta.
      await lugar.getByText(opcion, { exact: true }).click()
      await expect(lugar.getByRole('radio', { name: opcion })).toBeChecked()
    }
    if (observacion !== undefined) {
      await lugar.getByRole('textbox', { name: 'Observación' }).fill(observacion)
    }
    return lugar
  }

  test('RF-13 / CU-13: el director ve la escalada con su justificación, la aprueba con una observación y el área registra la solución (18-C)', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El puente del lote 12 está sin tablones')
    const justificacion = 'Se requiere comprar 8 tablones de 3 m; no hay material en bodega.'
    const observacion = 'Aprobado. Comprar con el proveedor habitual.'
    const novedad = await escalar(browser, descripcion, justificacion)

    // CU-13 1 y 2: su inicio es la lista de escaladas, con la novedad y su justificación.
    const { contexto, page } = await sesionDe(browser, 'director')
    await expect(page).toHaveURL(/\/escaladas$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Novedades escaladas' }),
    ).toBeAttached()
    const antes = await contadores(page)
    expect(antes.esperan).toBeGreaterThanOrEqual(1)
    await cargarTodasLasEscaladas(page)
    const tarjeta = page.getByRole('article').filter({ hasText: descripcion })
    await expect(tarjeta).toHaveCount(1)
    await expect(tarjeta.getByText('Justificación del escalamiento')).toBeVisible()
    await expect(tarjeta.getByText(justificacion)).toBeVisible()
    await expect(
      tarjeta.getByText(`Escaló: ${USUARIOS.aprobador.nombre} · Aprobador · Mantenimiento`),
    ).toBeVisible()
    await expect(tarjeta.getByText(/^Esperando decisión hace/)).toBeVisible()
    await expect(tarjeta.getByRole('link', { name: /^Ver historial/ })).toHaveAttribute(
      'href',
      `/novedades/${novedad.id}#linea-de-tiempo`,
    )

    // CU-13 3: «Revisar y decidir» abre el detalle, con la justificación arriba.
    await tarjeta.getByRole('link', { name: /^Revisar y decidir/ }).click()
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(estadoEnElDetalle(page, 'Escalada')).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Justificación del escalamiento' }).getByText(justificacion),
    ).toBeVisible()

    // CU-13 4 y 5: aprueba con una observación.
    const lugar = await elegir(page, 'Aprobar', observacion)
    await expect(lugar.getByText(/Se avisará a Mantenimiento y a la finca/)).toBeVisible()
    await lugar.getByRole('button', { name: 'Confirmar decisión' }).click()

    // CU-13 6 y 7: queda aprobada, con la observación en la línea de tiempo y sin más
    // decisiones que tomar.
    await expect(
      page.getByText('Novedad aprobada. Vuelve a Mantenimiento para ejecutar la solución.'),
    ).toBeVisible()
    await expect(estadoEnElDetalle(page, 'Aprobada')).toBeVisible()
    await expect(
      lineaDeTiempo(page).getByRole('listitem').first().getByText(observacion),
    ).toBeVisible()
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Aprobar', exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Justificación del escalamiento' })).toHaveCount(
      0,
    )

    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.aprobada`,
    )
    expect(historial).toEqual([{ estado_anterior: 'escalada', observacion }])
    // Tabla 29: ya no está escalada, así que no admite otra decisión.
    await expect(
      llamarALaApi(page, 'decidir_escalamiento', {
        p_novedad_id: novedad.id,
        p_aprobar: false,
        p_observacion: 'Segundo intento',
      }),
    ).rejects.toThrow(/TRANSICION_INVALIDA/)

    // De vuelta en la lista ya no está, y cuenta entre las aprobadas del mes. Otras pruebas
    // deciden a la vez con el mismo director: el contador sube al menos en uno.
    await page.goto('/escaladas')
    const despues = await contadores(page)
    expect(despues.aprobadas).toBeGreaterThanOrEqual(antes.aprobadas + 1)
    if (despues.esperan > 0) await cargarTodasLasEscaladas(page)
    await expect(page.getByRole('article').filter({ hasText: descripcion })).toHaveCount(0)
    // CU-13 8: a quien decide no se le avisa de su propia decisión.
    expect(await avisosDe(page, novedad)).toEqual([{ estado_nuevo: 'escalada' }])
    await contexto.close()

    // CU-13 8: el reportante recibe su aviso.
    const reportante = await sesionDe(browser, 'reportante')
    expect(await avisosDe(reportante.page, novedad)).toEqual([
      { estado_nuevo: 'en_atencion' },
      { estado_nuevo: 'escalada' },
      { estado_nuevo: 'aprobada' },
    ])
    await reportante.contexto.close()

    // Y el área, el suyo. CU-14 (18-C): el aprobador ve la decisión del director y registra
    // la solución de la novedad aprobada.
    const aprobador = await sesionDe(browser, 'aprobador')
    expect((await avisosDe(aprobador.page, novedad)).at(-1)).toEqual({ estado_nuevo: 'aprobada' })
    await aprobador.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(aprobador.page, 'Aprobada')).toBeVisible(ESPERA_DE_SESION)
    await aprobador.page.getByRole('link', { name: 'Registrar solución' }).click()
    const aprobacion = aprobador.page.getByRole('region', { name: 'Aprobación del director' })
    await expect(aprobacion.getByText('Aprobada por el director de agricultura')).toBeVisible()
    await expect(aprobacion.getByText(new RegExp(`^${USUARIOS.director.nombre} · `))).toBeVisible()
    await expect(aprobacion.getByText(`«${observacion}»`)).toBeVisible()

    await aprobador.page
      .getByRole('textbox', { name: '¿Qué se hizo?' })
      .fill('Se compraron los tablones y se instalaron en el puente.')
    // El tipo de falla no es lo que se prueba aquí: se reutiliza uno de los que dejó el CU-14
    // en otras corridas y, si todavía no hay ninguno, se crea.
    const [conocido] = await llamarALaApi(aprobador.page, 'sugerir_tipos_falla', {
      p_texto: 'Tipo e2e',
    })
    const tipo = conocido?.nombre ?? `Tipo e2e ${testInfo.project.name} ${Date.now()}`
    await aprobador.page.getByRole('combobox', { name: 'Tipo de falla' }).fill(tipo)
    await aprobador.page
      .getByRole('option', { name: conocido ? tipo : `Crear tipo nuevo «${tipo}»` })
      .first()
      .click()
    await aprobador.page.getByRole('button', { name: 'Marcar como resuelta' }).click()
    await expect(aprobador.page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(estadoEnElDetalle(aprobador.page, 'Resuelta')).toBeVisible()
    const resolucion = await leerDeLaApi(
      aprobador.page,
      `historial_transicion?select=estado_anterior&novedad_id=eq.${novedad.id}&estado_nuevo=eq.resuelta`,
    )
    expect(resolucion).toEqual([{ estado_anterior: 'aprobada' }])
    await aprobador.contexto.close()
  })

  test('RF-13 / CU-13 5a: para rechazar hace falta la observación; con ella la novedad queda Rechazada y nadie más puede decidir', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La bomba de drenaje del lote 9 se apaga')
    const justificacion = 'Hay que cambiar los rodamientos; requiere compra de repuestos.'
    const observacion = 'No hay presupuesto este mes; se reprograma para noviembre.'
    const novedad = await escalar(browser, descripcion, justificacion)

    // RNF-11: la decisión es del director. El área que escaló no ve cómo decidir, y si lo
    // intenta por la API el servidor no la deja.
    const aprobador = await sesionDe(browser, 'aprobador')
    await aprobador.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(aprobador.page, 'Escalada')).toBeVisible(ESPERA_DE_SESION)
    await expect(panel(aprobador.page)).toHaveCount(0)
    await expect(aprobador.page.getByRole('button', { name: 'Aprobar', exact: true })).toHaveCount(
      0,
    )
    await expect(
      llamarALaApi(aprobador.page, 'decidir_escalamiento', {
        p_novedad_id: novedad.id,
        p_aprobar: true,
        p_observacion: null,
      }),
    ).rejects.toThrow(/SIN_PERMISO/)
    await aprobador.contexto.close()

    // «Ver historial» abre el detalle en la línea de tiempo.
    const { contexto, page } = await sesionDe(browser, 'director')
    await page.goto(`/novedades/${novedad.id}#linea-de-tiempo`)
    await expect(lineaDeTiempo(page)).toBeFocused(ESPERA_DE_SESION)
    await expect(lineaDeTiempo(page)).toBeInViewport()

    // CU-13 5a: con «Rechazar» elegido y sin observación, o solo con espacios, no se confirma.
    const lugar = await elegir(page, 'Rechazar')
    const campo = lugar.getByRole('textbox', { name: 'Observación' })
    const confirmar = lugar.getByRole('button', { name: 'Confirmar decisión' })
    await expect(confirmar).toBeDisabled()
    if (!enTelefono(page)) {
      // 20-B: el campo dice qué falta.
      await expect(lugar.getByText('Escribe la observación para rechazar')).toBeVisible()
    }
    await campo.fill('     ')
    await expect(confirmar).toBeDisabled()
    await campo.fill(observacion)
    await expect(confirmar).toBeEnabled()
    await confirmar.click()

    // Queda rechazada (estado final), con la observación a la vista y sin acciones.
    await expect(
      page.getByText('Novedad rechazada. El área y la finca verán tu observación.'),
    ).toBeVisible()
    await expect(estadoEnElDetalle(page, 'Rechazada')).toBeVisible()
    await expect(
      lineaDeTiempo(page).getByRole('listitem').first().getByText(observacion),
    ).toBeVisible()
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rechazar', exact: true })).toHaveCount(0)

    const [vista] = await leerDeLaApi(page, `v_novedad?select=estado&id=eq.${novedad.id}`)
    expect(vista).toEqual({ estado: 'rechazada' })
    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.rechazada`,
    )
    expect(historial).toEqual([{ estado_anterior: 'escalada', observacion }])
    await contexto.close()

    // CU-13 8: el reportante recibe su aviso y ve la observación del director.
    const reportante = await sesionDe(browser, 'reportante')
    expect((await avisosDe(reportante.page, novedad)).at(-1)).toEqual({ estado_nuevo: 'rechazada' })
    await reportante.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(reportante.page, 'Rechazada')).toBeVisible(ESPERA_DE_SESION)
    await expect(lineaDeTiempo(reportante.page).getByText(observacion)).toBeVisible()
    await reportante.contexto.close()
  })
})
