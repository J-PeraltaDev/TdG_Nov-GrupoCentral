import { expect, test } from '@playwright/test'
import { diaEnColombia, enTelefono, registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, llamarALaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-32 · Gestionar el catálogo de tipos de falla (RF-32). Pantallas 31, 31-B y 31-C, y
 * «Corregir tipo» en el detalle (22).
 *
 * Nunca toca los tipos del seed (decisión 54): cada prueba crea los suyos al resolver novedades
 * propias («Tipo e2e …» con un sufijo único) y los deja desactivados.
 */

test.describe('CU-32 · Tipos de falla', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  /**
   * Una novedad por cada nombre de tipo: el reportante las registra y el aprobador de
   * Mantenimiento las toma y las resuelve con ese tipo, que así se crea.
   *
   * @returns {Promise<{ id: string, tipo_falla_id: string }[]>}
   */
  async function resolverConTiposNuevos(browser, testInfo, nombres) {
    const reportante = await sesionDe(browser, 'reportante')
    const novedades = []
    for (const nombre of nombres) {
      novedades.push(
        await registrarPorLaApi(reportante.page, {
          descripcion: descripcionUnica(testInfo, `Novedad para ${nombre}`),
          prioridad: 'bajo',
          area: 'Mantenimiento',
        }),
      )
    }
    await reportante.contexto.close()

    const aprobador = await sesionDe(browser, 'aprobador')
    const resueltas = []
    for (const [i, novedad] of novedades.entries()) {
      await llamarALaApi(aprobador.page, 'tomar_novedad', { p_novedad_id: novedad.id })
      resueltas.push(
        await llamarALaApi(aprobador.page, 'registrar_solucion', {
          p_novedad_id: novedad.id,
          p_solucion: 'Solución de la prueba de tipos de falla.',
          p_fecha_ejecucion: diaEnColombia(),
          p_tipo_falla_id: null,
          p_tipo_falla_nombre: nombres[i],
        }),
      )
    }
    await aprobador.contexto.close()
    return resueltas
  }

  const sufijo = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

  test('CU-32 3, 3a, 4 y 4a: renombra, ve 31-B y 31-C, fusiona y desactiva lo que queda', async ({
    browser,
    page,
  }, testInfo) => {
    const marca = sufijo()
    const primero = `Tipo e2e ${marca} uno`
    const segundo = `Tipo e2e ${marca} dos`
    const renombrado = `Tipo e2e ${marca} único`
    await resolverConTiposNuevos(browser, testInfo, [primero, segundo])

    await ingresarComo(page, 'administrador')
    await page.goto('/tipos-de-falla')
    await expect(page.getByRole('heading', { level: 1, name: 'Tipos de falla' })).toBeVisible()
    // Quien lo creó al resolver (decisión 52).
    const suyo = enTelefono(page)
      ? page.getByRole('article', { name: primero })
      : page.getByRole('row', { name: new RegExp(`^${primero}`) })
    await expect(suyo).toContainText('Aprobador de prueba Mantenimiento')

    // Renombrar (CU-32 3).
    await page.getByRole('button', { name: `Renombrar ${primero}` }).click()
    let dialogo = page.getByRole('dialog', { name: 'Renombrar tipo de falla' })
    await dialogo.getByRole('textbox', { name: 'Nombre nuevo' }).fill(renombrado)
    await dialogo.getByRole('button', { name: 'Renombrar' }).click()
    await expect(page.getByText('Tipo de falla renombrado.')).toBeVisible()
    await expect(page.getByRole('button', { name: `Renombrar ${renombrado}` })).toBeVisible()
    await expect(page.getByText(`«${primero}» → «${renombrado}»`)).toBeVisible()

    // 31-B: el nombre de otro tipo activo, sin tilde ni mayúsculas.
    await page.getByRole('button', { name: `Renombrar ${segundo}` }).click()
    dialogo = page.getByRole('dialog', { name: 'Renombrar tipo de falla' })
    await dialogo.getByRole('textbox', { name: 'Nombre nuevo' }).fill(`tipo E2E ${marca} unico`)
    await expect(
      dialogo.getByText(`Ya existe «${renombrado}». ¿Quieres fusionar los dos tipos?`),
    ).toBeVisible()
    await dialogo.getByRole('button', { name: 'Fusionar en su lugar' }).click()

    // 31 con los dos elegidos; 31-C si el destino es el mismo origen.
    dialogo = page.getByRole('dialog', { name: 'Fusionar tipos de falla' })
    const destino = dialogo.getByRole('combobox', { name: 'Tipo de destino' })
    await destino.selectOption({ label: `${segundo} (1 novedad)` })
    await expect(
      dialogo.getByText('El tipo de origen y el de destino deben ser distintos'),
    ).toBeVisible()
    await expect(dialogo.getByRole('button', { name: 'Fusionar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await destino.selectOption({ label: `${renombrado} (1 novedad)` })
    await expect(
      dialogo.getByText(
        `La novedad de «${segundo}» pasará a «${renombrado}», que quedará con 2. «${segundo}» saldrá de la lista.`,
      ),
    ).toBeVisible()
    await dialogo.getByRole('button', { name: 'Fusionar' }).click()
    await expect(page.getByText('Tipos de falla fusionados.')).toBeVisible()
    await expect(page.getByRole('button', { name: `Renombrar ${segundo}` })).toHaveCount(0)
    await expect(page.getByText(`«${segundo}» → «${renombrado}»`)).toBeVisible()

    // Desactivar el que queda: sus acciones quedan deshabilitadas.
    await page.getByRole('button', { name: `Desactivar ${renombrado}` }).click()
    dialogo = page.getByRole('dialog', { name: 'Desactivar tipo de falla' })
    await expect(dialogo).toContainText(
      `«${renombrado}» saldrá de las sugerencias. Sus 2 novedades lo conservan.`,
    )
    await dialogo.getByRole('button', { name: 'Desactivar' }).click()
    await expect(page.getByText('Tipo de falla desactivado.')).toBeVisible()
    await expect(page.getByRole('button', { name: `Renombrar ${renombrado}` })).toBeDisabled()
  })

  test('CU-32 1a: corrige el tipo de una novedad cerrada y lo ve en la línea de tiempo', async ({
    browser,
    page,
  }, testInfo) => {
    const marca = sufijo()
    const equivocado = `Tipo e2e ${marca} equivocado`
    const correcto = `Tipo e2e ${marca} correcto`
    const [cerrada, otra] = await resolverConTiposNuevos(browser, testInfo, [equivocado, correcto])

    const reportante = await sesionDe(browser, 'reportante')
    await llamarALaApi(reportante.page, 'confirmar_resolucion', { p_novedad_id: cerrada.id })
    await reportante.contexto.close()

    await ingresarComo(page, 'administrador')
    await page.goto(`/novedades/${cerrada.id}`)
    await page.getByRole('button', { name: 'Corregir tipo' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Corregir tipo de falla' })
    await expect(dialogo).toContainText(`Tipo actual: ${equivocado}`)
    await dialogo.getByRole('combobox', { name: 'Tipo correcto' }).selectOption({ label: correcto })
    await dialogo.getByRole('button', { name: 'Corregir' }).click()

    await expect(page.getByText('Tipo de falla corregido.')).toBeVisible()
    const linea = page.getByRole('region', { name: 'Línea de tiempo' })
    await expect(linea.getByText('Tipo de falla corregido')).toBeVisible()
    await expect(linea.getByText(`"${equivocado}" → "${correcto}"`)).toBeVisible()

    // Los tipos de la prueba no quedan en las sugerencias de nadie.
    for (const tipoId of [cerrada.tipo_falla_id, otra.tipo_falla_id]) {
      await llamarALaApi(page, 'desactivar_tipo_falla', { p_tipo_id: tipoId })
    }
  })
})
