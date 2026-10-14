import { expect, test } from '@playwright/test'
import { enTelefono, registrarPorLaApi, resolverPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, llamarALaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * RF-25 / CU-25 · Restringir acciones sin conexión, sobre el build y contra «staging». Cada rol
 * abre una novedad con red; al cortarse la red, sus acciones se ven pero no se pueden usar y
 * dicen por qué (14-B, 09-D); al volver, se habilitan solas. La novedad se prepara por la API
 * con la sesión de cada rol.
 */

const MOTIVO_WEBKIT =
  'Playwright WebKit no abre la aplicación sin red («WebKit encountered an internal error»): se verifica en un iPhone real (plan del Sprint 4, decisión 29)'

const AVISO_14B =
  'Puedes consultar, pero tomar, rechazar, escalar, aprobar, resolver, cerrar y reasignar necesitan internet, porque dependen del estado actual en el servidor.'

test.describe('CU-25 · Restringir acciones sin conexión', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)
  test.beforeEach(({ browserName }) => {
    test.fixme(browserName === 'webkit', MOTIVO_WEBKIT)
  })

  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  /** El reportante registra una novedad para Mantenimiento; el aprobador hace `luego` con ella. */
  async function preparar(browser, descripcion, luego = async () => {}) {
    const reportante = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(reportante.page, {
      descripcion,
      prioridad: 'alto',
      area: 'Mantenimiento',
    })
    await reportante.contexto.close()
    const aprobador = await sesionDe(browser, 'aprobador')
    await luego(aprobador.page, novedad)
    await aprobador.contexto.close()
    return novedad
  }

  /** Abre el detalle con red y espera a que cargue. */
  async function abrirDetalle(browser, rol, novedad) {
    const sesion = await sesionDe(browser, rol)
    await sesion.page.goto(`/novedades/${novedad.id}`)
    await expect(sesion.page.getByText(/^Registrada en finca$/).first()).toBeVisible()
    return sesion
  }

  test('RF-25 / CU-25 y CU-10 2a (14-B): el aprobador no puede tomarla sin red; al volver la red, sí', async ({
    browser,
  }, testInfo) => {
    const novedad = await preparar(browser, descripcionUnica(testInfo, 'El portón no abre'))
    const { contexto, page } = await abrirDetalle(browser, 'aprobador', novedad)
    const tomar = page.getByRole('button', { name: 'Tomar para atención' })
    await expect(tomar).not.toHaveAttribute('aria-disabled')

    await contexto.setOffline(true)

    await expect(page.getByText(AVISO_14B)).toBeVisible()
    await expect(tomar).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByText('Se habilitan al volver la conexión')).toBeVisible()
    // Playwright no pulsa lo que tiene `aria-disabled` si no se le fuerza: aquí se prueba
    // justamente que pulsarlo no hace nada.
    await tomar.click({ force: true })
    await expect(page.getByText('Novedad tomada. Ya está En atención.')).toHaveCount(0)

    // CU-25 4: vuelve la red y la acción se habilita sola.
    await contexto.setOffline(false)
    await expect(tomar).not.toHaveAttribute('aria-disabled')
    await tomar.click()
    await expect(page.getByText('Novedad tomada. Ya está En atención.')).toBeVisible()
    await contexto.close()
  })

  test('RF-25 / CU-15 1a (09-D): la finca no puede confirmar ni devolver sin red', async ({
    browser,
  }, testInfo) => {
    const novedad = await preparar(
      browser,
      descripcionUnica(testInfo, 'La impresora no imprime'),
      async (aprobador, { id }) => {
        await llamarALaApi(aprobador, 'tomar_novedad', { p_novedad_id: id })
        await resolverPorLaApi(aprobador, id, 'Se cambió el cartucho.')
      },
    )
    const { contexto, page } = await abrirDetalle(browser, 'reportante', novedad)
    await expect(page.getByRole('button', { name: 'Confirmar cierre' })).toBeVisible()

    await contexto.setOffline(true)

    await expect(
      page.getByText(
        'Confirmar o devolver la novedad necesita internet, porque depende de su estado actual en el servidor.',
      ),
    ).toBeVisible()
    for (const nombre of ['La falla persiste', 'Confirmar cierre']) {
      await expect(page.getByRole('button', { name: nombre })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
    await contexto.close()
  })

  test('RF-25 / CU-13 3a: el director no puede decidir sin red', async ({ browser }, testInfo) => {
    const novedad = await preparar(
      browser,
      descripcionUnica(testInfo, 'Hay que cambiar el techo'),
      async (aprobador, { id }) => {
        await llamarALaApi(aprobador, 'tomar_novedad', { p_novedad_id: id })
        await llamarALaApi(aprobador, 'escalar_novedad', {
          p_novedad_id: id,
          p_justificacion: 'Requiere compra.',
        })
      },
    )
    const { contexto, page } = await abrirDetalle(browser, 'director', novedad)

    await contexto.setOffline(true)

    await expect(page.getByText(AVISO_14B)).toBeVisible()
    const botones = enTelefono(page) ? ['Rechazar', 'Aprobar'] : ['Confirmar decisión']
    for (const nombre of botones) {
      await expect(page.getByRole('button', { name: nombre, exact: true })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
    await contexto.close()
  })
})
