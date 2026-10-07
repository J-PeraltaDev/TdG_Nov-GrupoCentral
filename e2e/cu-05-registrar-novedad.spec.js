import { expect, test } from '@playwright/test'
import {
  abrirRegistro,
  codigoDeLaConstancia,
  descripcionUnica,
  enviarNovedad,
  llenarNovedad,
} from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

// CU-05 · Registrar novedad y CU-06 · Constancia de recepción (RF-05, RF-06). Corre contra una
// base con el seed de prueba; cada corrida deja novedades nuevas en esa base.
test.describe('CU-05 · Registrar novedad', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test.beforeEach(async ({ page }) => {
    await ingresarComo(page, 'reportante')
    await abrirRegistro(page)
  })

  test('RF-05 / CU-05 curso normal y RF-06 / CU-06: registra la novedad y recibe la constancia con su código', async ({
    page,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El puente de la entrada se cayó')

    // Paso 2: la finca viene precargada y bloqueada.
    await expect(page.getByText('Finca de prueba 01 · Razón social de prueba A')).toBeVisible()

    // Pasos 3 a 5: llena, envía y recibe la constancia.
    await llenarNovedad(page, { descripcion, prioridad: 'Crítico', area: 'Mantenimiento' })
    await enviarNovedad(page)

    const codigo = await codigoDeLaConstancia(page)
    const constancia = page.getByRole('definition')
    await expect(constancia.filter({ hasText: 'Finca de prueba 01' })).toBeVisible()
    await expect(constancia.filter({ hasText: /\(Sem \d{1,2}\)$/ })).toBeVisible()
    await expect(constancia.filter({ hasText: 'Crítico' })).toBeVisible()
    await expect(constancia.filter({ hasText: 'Asignada' })).toBeVisible()
    await expect(constancia.filter({ hasText: 'Mantenimiento' })).toBeVisible()

    // La novedad queda en la lista de la finca, con el mismo código.
    await page.getByRole('link', { name: 'Ver novedad' }).click()
    await expect(page).toHaveURL(/\/novedades$/)
    const tarjeta = page.getByRole('listitem').filter({ hasText: descripcion })
    await expect(tarjeta.getByRole('heading', { name: codigo })).toBeVisible()
    await expect(tarjeta.getByText('Asignada')).toBeVisible()
  })

  test('RF-05 / CU-05 4a (05-C): sin los datos obligatorios señala los campos y no registra', async ({
    page,
  }) => {
    await enviarNovedad(page)

    await expect(page.getByRole('alert')).toHaveText('Faltan 3 datos obligatorios')
    await expect(page.getByText('Describe la novedad', { exact: true })).toBeVisible()
    await expect(page.getByText('Elige la prioridad')).toBeVisible()
    await expect(page.getByText('Elige el área')).toBeVisible()
    await expect(page.getByLabel('¿Qué está pasando?')).toBeFocused()
    await expect(page).toHaveURL(/\/registrar$/)

    // Al completar un dato, el resumen se actualiza.
    await llenarNovedad(page, { prioridad: 'Bajo' })
    await expect(page.getByRole('alert')).toHaveText('Faltan 2 datos obligatorios')
  })

  test('RNF-08 / RNF-09: si la respuesta se pierde y se reintenta, no se duplica la novedad', async ({
    page,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La bomba de la empacadora no enciende')

    // El primer envío llega al servidor y se registra, pero la respuesta nunca vuelve.
    let perdidas = 0
    const enviados = []
    await page.route('**/rest/v1/rpc/registrar_novedad', async (ruta) => {
      enviados.push(ruta.request().postDataJSON())
      if (perdidas > 0) return ruta.fallback()
      perdidas += 1
      await ruta.fetch()
      return ruta.abort('connectionreset')
    })

    await llenarNovedad(page, { descripcion, prioridad: 'Alto', area: 'Mantenimiento' })
    await enviarNovedad(page)

    // Se informa, y el formulario conserva lo escrito.
    await expect(page.getByRole('alert')).toContainText('La novedad no se envió')
    await expect(page.getByLabel('¿Qué está pasando?')).toHaveValue(descripcion)

    // El reintento usa el mismo identificador local y la misma fecha de registro.
    await enviarNovedad(page)
    const codigo = await codigoDeLaConstancia(page)
    expect(enviados).toHaveLength(2)
    expect(enviados[1].p_id_local).toBe(enviados[0].p_id_local)
    expect(enviados[1].p_fecha_registro).toBe(enviados[0].p_fecha_registro)

    // En la finca hay una sola novedad con esa descripción.
    await page.getByRole('link', { name: 'Ver novedad' }).click()
    const tarjetas = page.getByRole('listitem').filter({ hasText: descripcion })
    await expect(tarjetas).toHaveCount(1)
    await expect(tarjetas.getByRole('heading', { name: codigo })).toBeVisible()
  })
})
