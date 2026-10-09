import { expect, test } from '@playwright/test'
import {
  cargarTodaLaLista,
  elegirDecision,
  novedadesDeLaLista,
  registrarPorLaApi,
  resolverPorLaApi,
} from './apoyo/novedades.js'
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
 * CU-15 · Confirmar resolución o indicar que la falla persiste (RF-15). Pantallas 09 (novedad
 * resuelta, con su barra de acciones), 09-B (hoja «La falla persiste») y 09-C (diálogo de
 * confirmación).
 *
 * La novedad se prepara por la API con la sesión de cada rol: el reportante la registra y el
 * aprobador la toma y registra la solución. La última prueba es el incremento completo del
 * Sprint 3: las dos instancias y el cierre, cada paso en la pantalla de su rol.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }
const SOLUCION = 'Se reinstaló el controlador de la impresora y se cambió el cable.'

test.describe('CU-15 · Confirmar resolución', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  /** El reportante registra la novedad; el aprobador de Mantenimiento la toma y la resuelve. */
  async function resolver(browser, descripcion) {
    const reportante = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(reportante.page, {
      descripcion,
      prioridad: 'normal',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()

    const aprobador = await sesionDe(browser, 'aprobador')
    await llamarALaApi(aprobador.page, 'tomar_novedad', { p_novedad_id: novedad.id })
    await resolverPorLaApi(aprobador.page, novedad.id, SOLUCION)
    await aprobador.contexto.close()
    return novedad
  }

  const estadoEnElDetalle = (page, estado) =>
    page.getByRole('group', { name: 'Datos de la novedad' }).getByText(estado)
  const lineaDeTiempo = (page) => page.getByRole('region', { name: 'Línea de tiempo' })
  const confirmarCierre = (page) => page.getByRole('button', { name: 'Confirmar cierre' })
  const fallaPersiste = (page) => page.getByRole('button', { name: 'La falla persiste' })
  const avisosDe = (page, novedad) =>
    leerDeLaApi(
      page,
      `notificacion?select=estado_nuevo&novedad_id=eq.${novedad.id}&order=creada_en.asc`,
    )

  /** El reportante confirma el cierre desde el diálogo 09-C. */
  async function cerrar(page, observacion) {
    await confirmarCierre(page).click()
    const dialogo = page.getByRole('dialog', { name: '¿Confirmas que la novedad quedó resuelta?' })
    await expect(dialogo.getByText('Al cerrarla ya no admite más cambios.')).toBeVisible()
    if (observacion) {
      await dialogo.getByRole('textbox', { name: 'Observación (opcional)' }).fill(observacion)
    }
    await dialogo.getByRole('button', { name: 'Sí, cerrar' }).click()
    await expect(page.getByText('Cierre confirmado. La novedad queda Cerrada.')).toBeVisible()
    await expect(dialogo).toBeHidden()
  }

  test('RF-15 / CU-15: el reportante abre la novedad resuelta desde «Por confirmar», confirma el cierre y el área recibe su aviso', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El computador no reconoce la impresora')
    const observacion = 'Quedó imprimiendo bien.'
    const novedad = await resolver(browser, descripcion)

    // CU-15 1 y 2: la encuentra en «Por confirmar» y ve la solución con sus dos acciones.
    const { contexto, page } = await sesionDe(browser, 'reportante')
    await page.goto('/novedades?lista=por_confirmar')
    await page
      .getByRole('listitem')
      .filter({ hasText: descripcion })
      .getByRole('link')
      .click(ESPERA_DE_SESION)
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(estadoEnElDetalle(page, 'Resuelta')).toBeVisible()
    await expect(page.getByText(SOLUCION).first()).toBeVisible()
    await expect(fallaPersiste(page)).toBeVisible()

    // CU-15 3: el diálogo pregunta antes de cerrar; «Cancelar» no cambia nada.
    await confirmarCierre(page).click()
    const dialogo = page.getByRole('dialog', { name: '¿Confirmas que la novedad quedó resuelta?' })
    await dialogo.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialogo).toBeHidden()
    await expect(estadoEnElDetalle(page, 'Resuelta')).toBeVisible()

    // CU-15 3 a 5: confirma con una observación; queda cerrada y sin acciones.
    await cerrar(page, observacion)
    await expect(estadoEnElDetalle(page, 'Cerrada')).toBeVisible()
    await expect(
      lineaDeTiempo(page).getByRole('listitem').first().getByText(observacion),
    ).toBeVisible()
    await expect(confirmarCierre(page)).toHaveCount(0)
    await expect(fallaPersiste(page)).toHaveCount(0)

    // En la base quedó cerrada, con su solución, y el historial guarda la observación.
    const [vista] = await leerDeLaApi(page, `v_novedad?select=estado,solucion&id=eq.${novedad.id}`)
    expect(vista).toEqual({ estado: 'cerrada', solucion: SOLUCION })
    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,observacion&novedad_id=eq.${novedad.id}&estado_nuevo=eq.cerrada`,
    )
    expect(historial).toEqual([{ estado_anterior: 'resuelta', observacion }])
    // Tabla 29: cerrada es final.
    await expect(
      llamarALaApi(page, 'reportar_falla_persiste', {
        p_novedad_id: novedad.id,
        p_observacion: 'Volvió a fallar',
      }),
    ).rejects.toThrow(/TRANSICION_INVALIDA/)

    // Ya no espera confirmación: sale de «Por confirmar» y aparece en «Cerradas».
    await page.goto('/novedades?lista=cerradas')
    await expect(page.getByText(descripcion)).toBeVisible(ESPERA_DE_SESION)
    await contexto.close()

    // CU-15 6: el área recibe el aviso del cierre.
    const aprobador = await sesionDe(browser, 'aprobador')
    expect((await avisosDe(aprobador.page, novedad)).at(-1)).toEqual({ estado_nuevo: 'cerrada' })
    await aprobador.contexto.close()
  })

  test('RF-15 / CU-15 3a y 3b: «la falla persiste» exige decir qué sigue fallando; la novedad vuelve a En atención, sin la solución, y al área', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El biométrico de la portería no marca')
    const observacion = 'Sigue sin marcar la salida del turno de la tarde.'
    const novedad = await resolver(browser, descripcion)

    const { contexto, page } = await sesionDe(browser, 'reportante')
    await page.goto(`/novedades/${novedad.id}`)

    // CU-15 3b: sin la observación, o solo con espacios, no se puede devolver.
    await fallaPersiste(page).click(ESPERA_DE_SESION)
    const hoja = page.getByRole('dialog', { name: 'La falla persiste' })
    await expect(
      hoja.getByText('La novedad volverá a En atención para Mantenimiento, con tu observación.'),
    ).toBeVisible()
    const campo = hoja.getByRole('textbox', { name: '¿Qué sigue fallando?' })
    const devolver = hoja.getByRole('button', { name: 'Devolver a atención' })
    await expect(devolver).toBeDisabled()
    await campo.fill('     ')
    await expect(devolver).toBeDisabled()

    // CU-15 3a: con la observación, vuelve al área.
    await campo.fill(observacion)
    await devolver.click()
    await expect(
      page.getByText('Novedad devuelta a Mantenimiento. Vuelve a estar En atención.'),
    ).toBeVisible()
    await expect(hoja).toBeHidden()
    await expect(estadoEnElDetalle(page, 'En atención')).toBeVisible()
    await expect(
      lineaDeTiempo(page).getByRole('listitem').first().getByText(observacion),
    ).toBeVisible()
    await expect(confirmarCierre(page)).toHaveCount(0)
    // SDD 6.1.3: «Tomada por» sigue siendo el aprobador, no el reportante que la devolvió.
    await expect(page.getByText(`Tomada por ${USUARIOS.aprobador.nombre}`)).toBeVisible()

    // La novedad ya no trae la solución que no sirvió; su texto sigue en el historial.
    const [vista] = await leerDeLaApi(
      page,
      `v_novedad?select=estado,solucion,fecha_ejecucion,tipo_falla&id=eq.${novedad.id}`,
    )
    expect(vista).toEqual({
      estado: 'en_atencion',
      solucion: null,
      fecha_ejecucion: null,
      tipo_falla: null,
    })
    const historial = await leerDeLaApi(
      page,
      `historial_transicion?select=estado_anterior,estado_nuevo,observacion&novedad_id=eq.${novedad.id}&order=id.desc&limit=2`,
    )
    expect(historial).toEqual([
      { estado_anterior: 'resuelta', estado_nuevo: 'en_atencion', observacion },
      { estado_anterior: 'en_atencion', estado_nuevo: 'resuelta', observacion: SOLUCION },
    ])
    await contexto.close()

    // CU-15 6: el área recibe el aviso y vuelve a tenerla en su pestaña «En atención», lista
    // para registrar la solución otra vez.
    const aprobador = await sesionDe(browser, 'aprobador')
    expect((await avisosDe(aprobador.page, novedad)).at(-1)).toEqual({
      estado_nuevo: 'en_atencion',
    })
    await aprobador.page.goto('/bandeja?pestana=en_atencion')
    await cargarTodaLaLista(aprobador.page)
    await expect(novedadesDeLaLista(aprobador.page).filter({ hasText: descripcion })).toHaveCount(1)
    await aprobador.page.goto(`/novedades/${novedad.id}`)
    await expect(aprobador.page.getByRole('link', { name: 'Registrar solución' })).toBeVisible(
      ESPERA_DE_SESION,
    )
    await aprobador.contexto.close()
  })

  test('Incremento del Sprint 3: registrar, tomar, escalar, aprobar, resolver y confirmar, cada paso en la pantalla de su rol', async ({
    browser,
  }, testInfo) => {
    // Seis pantallas con cuatro usuarios contra un servidor remoto.
    test.setTimeout(150_000)
    const descripcion = descripcionUnica(testInfo, 'El puente del lote 14 está sin tablones')

    // 1. La finca registra la novedad (RF-05; su pantalla se prueba en el CU-05).
    const finca = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(finca.page, {
      descripcion,
      prioridad: 'alto',
      area: 'Mantenimiento',
    })

    // 2 y 3. El área la toma y la escala al director (RF-10 y RF-12).
    const area = await sesionDe(browser, 'aprobador')
    await area.page.goto(`/novedades/${novedad.id}`)
    await area.page.getByRole('button', { name: 'Tomar para atención' }).click(ESPERA_DE_SESION)
    await expect(estadoEnElDetalle(area.page, 'En atención')).toBeVisible()
    await area.page.getByRole('button', { name: 'Escalar al director' }).click()
    const hojaDeEscalar = area.page.getByRole('dialog', {
      name: 'Escalar al director de agricultura',
    })
    await hojaDeEscalar
      .getByRole('textbox', { name: 'Justificación' })
      .fill('Se requiere comprar 8 tablones de 3 m; no hay material en bodega.')
    await hojaDeEscalar.getByRole('button', { name: 'Escalar novedad' }).click()
    await expect(estadoEnElDetalle(area.page, 'Escalada')).toBeVisible()

    // 4. El director la aprueba (RF-13).
    const director = await sesionDe(browser, 'director')
    await director.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(director.page, 'Escalada')).toBeVisible(ESPERA_DE_SESION)
    const decision = await elegirDecision(
      director.page,
      'Aprobar',
      'Aprobado. Comprar con el proveedor habitual.',
    )
    await decision.getByRole('button', { name: 'Confirmar decisión' }).click()
    await expect(estadoEnElDetalle(director.page, 'Aprobada')).toBeVisible()
    await director.contexto.close()

    // 5. El área ejecuta lo aprobado y registra la solución (RF-14).
    await area.page.reload()
    await area.page.getByRole('link', { name: 'Registrar solución' }).click(ESPERA_DE_SESION)
    await expect(
      area.page
        .getByRole('region', { name: 'Aprobación del director' })
        .getByText('«Aprobado. Comprar con el proveedor habitual.»'),
    ).toBeVisible()
    await area.page
      .getByRole('textbox', { name: '¿Qué se hizo?' })
      .fill('Se compraron los tablones y se instalaron en el puente.')
    const [conocido] = await llamarALaApi(area.page, 'sugerir_tipos_falla', {
      p_texto: 'Tipo e2e',
    })
    const tipo = conocido?.nombre ?? `Tipo e2e ${testInfo.project.name} ${Date.now()}`
    await area.page.getByRole('combobox', { name: 'Tipo de falla' }).fill(tipo)
    await area.page
      .getByRole('option', { name: conocido ? tipo : `Crear tipo nuevo «${tipo}»` })
      .first()
      .click()
    await area.page.getByRole('button', { name: 'Marcar como resuelta' }).click()
    await expect(estadoEnElDetalle(area.page, 'Resuelta')).toBeVisible()
    await area.contexto.close()

    // 6. La finca confirma el cierre (RF-15).
    await finca.page.goto(`/novedades/${novedad.id}`)
    await expect(estadoEnElDetalle(finca.page, 'Resuelta')).toBeVisible(ESPERA_DE_SESION)
    await cerrar(finca.page, 'El puente quedó firme.')
    await expect(estadoEnElDetalle(finca.page, 'Cerrada')).toBeVisible()

    // El historial guarda el ciclo completo, en orden, con quién hizo cada paso (RF-16).
    const pasos = lineaDeTiempo(finca.page).getByRole('listitem')
    await expect(pasos).toHaveCount(7)
    const historial = await leerDeLaApi(
      finca.page,
      `historial_transicion?select=estado_nuevo&novedad_id=eq.${novedad.id}&order=id.asc`,
    )
    expect(historial.map((transicion) => transicion.estado_nuevo)).toEqual([
      'registrada',
      'asignada',
      'en_atencion',
      'escalada',
      'aprobada',
      'resuelta',
      'cerrada',
    ])
    await expect(pasos.first()).toContainText(USUARIOS.reportante.nombre)
    await expect(pasos.nth(2)).toContainText(USUARIOS.director.nombre)
    await finca.contexto.close()
  })
})
