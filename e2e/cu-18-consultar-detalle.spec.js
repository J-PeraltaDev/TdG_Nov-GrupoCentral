import { expect, test } from '@playwright/test'
import { registrarPorLaApi } from './apoyo/novedades.js'
import { descripcionUnica } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-18 · Consultar el detalle y la línea de tiempo de una novedad (RF-18). Pantallas 13 y 14
 * (teléfono), 22 (escritorio) y 22-B (sin permiso).
 *
 * El alcance lo decide la base de datos (RNF-11): quien no puede ver la novedad recibe una
 * consulta sin filas y la aplicación muestra 22-B.
 */

// Al abrir una dirección, la aplicación recupera la sesión antes de pintar: misma espera que
// el ingreso.
const ESPERA_DE_SESION = { timeout: 20_000 }

const SIN_PERMISO = { level: 1, name: 'No puedes ver esta novedad' }

test.describe('CU-18 · Consultar el detalle y la línea de tiempo', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  /** Abre una sesión aparte para un rol. */
  const sesionDe = async (browser, rol) => {
    const contexto = await browser.newContext()
    const page = await contexto.newPage()
    await ingresarComo(page, rol)
    return { contexto, page }
  }

  test('RF-18 / CU-18: el reportante abre su novedad desde Mis novedades y ve su línea de tiempo; el de otra finca no', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'La bomba de riego del lote 4 no enciende')

    // El reportante registra la novedad y la abre desde su lista.
    const { contexto, page } = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(page, {
      descripcion,
      prioridad: 'alto',
      area: 'Mantenimiento',
    })
    const codigo = `NOV-${String(novedad.codigo).padStart(4, '0')}`
    await page.reload()
    await page.getByRole('listitem').filter({ hasText: descripcion }).getByRole('link').click()

    // CU-18 3: código, estado, prioridad, área y descripción.
    await expect(page).toHaveURL(new RegExp(`/novedades/${novedad.id}$`))
    await expect(page.getByRole('heading', { level: 1, name: codigo })).toBeVisible()
    const datos = page.getByRole('group', { name: 'Datos de la novedad' })
    await expect(datos.getByText('Asignada')).toBeVisible()
    await expect(datos.getByText('Alto')).toBeVisible()
    await expect(datos.getByText('Mantenimiento')).toBeVisible()
    await expect(page.getByText(descripcion)).toBeVisible()

    // CU-18 4: la línea de tiempo trae la creación y el enrutamiento, del más reciente al
    // más antiguo.
    const pasos = page.getByRole('region', { name: 'Línea de tiempo' }).getByRole('listitem')
    await expect(pasos).toHaveCount(2)
    await expect(pasos.nth(0).getByText('Sistema')).toBeVisible()
    await expect(pasos.nth(0).getByText(/Área: Mantenimiento$/)).toBeVisible()
    await expect(pasos.nth(1).getByText('Reportante de prueba 01 · Reportante')).toBeVisible()

    // Vuelve a la lista de la que salió.
    await page.getByRole('link', { name: 'Volver a mis novedades' }).click()
    await expect(page).toHaveURL(/\/novedades$/)
    await contexto.close()

    // CU-18 2a: el reportante de otra finca, con la misma dirección, no puede verla.
    const otro = await sesionDe(browser, 'reportanteOtraFinca')
    await otro.page.goto(`/novedades/${novedad.id}`)
    await expect(otro.page.getByRole('heading', SIN_PERMISO)).toBeVisible(ESPERA_DE_SESION)
    await expect(
      otro.page.getByText('Solo puedes consultar las novedades de tu finca.'),
    ).toBeVisible()
    await expect(otro.page.getByText(descripcion)).toHaveCount(0)
    await otro.page.getByRole('link', { name: 'Volver a mis novedades' }).click()
    await expect(otro.page).toHaveURL(/\/novedades$/)
    await otro.contexto.close()
  })

  test('RF-18 / CU-18 2 y 5: el aprobador del área y el director la consultan; el aprobador de la otra área no', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El computador de la báscula no enciende')

    const reportante = await sesionDe(browser, 'reportante')
    const novedad = await registrarPorLaApi(reportante.page, {
      descripcion,
      prioridad: 'normal',
      area: 'Sistemas',
    })
    const codigo = `NOV-${String(novedad.codigo).padStart(4, '0')}`
    await reportante.contexto.close()

    // El aprobador del área (Sistemas) la ve, con su línea de tiempo.
    const sistemas = await sesionDe(browser, 'aprobadorSistemas')
    await sistemas.page.goto(`/novedades/${novedad.id}`)
    await expect(sistemas.page.getByRole('heading', { level: 1, name: codigo })).toBeVisible(
      ESPERA_DE_SESION,
    )
    await expect(sistemas.page.getByText(descripcion)).toBeVisible()
    await expect(
      sistemas.page.getByRole('region', { name: 'Línea de tiempo' }).getByRole('listitem'),
    ).toHaveCount(2)
    await sistemas.contexto.close()

    // CU-18 2a: el aprobador de la otra área (Mantenimiento) recibe 22-B.
    const mantenimiento = await sesionDe(browser, 'aprobador')
    await mantenimiento.page.goto(`/novedades/${novedad.id}`)
    await expect(mantenimiento.page.getByRole('heading', SIN_PERMISO)).toBeVisible(ESPERA_DE_SESION)
    await expect(
      mantenimiento.page.getByText('Solo puedes consultar las novedades de tu área.'),
    ).toBeVisible()
    await expect(mantenimiento.page.getByText(descripcion)).toHaveCount(0)
    await mantenimiento.contexto.close()

    // El director la consulta, pero sobre una asignada no tiene acciones (SDD, Tabla 35).
    const director = await sesionDe(browser, 'director')
    await director.page.goto(`/novedades/${novedad.id}`)
    await expect(director.page.getByRole('heading', { level: 1, name: codigo })).toBeVisible(
      ESPERA_DE_SESION,
    )
    await expect(director.page.getByText(descripcion)).toBeVisible()
    await expect(director.page.getByRole('main').getByRole('button')).toHaveCount(0)
    await director.contexto.close()
  })

  test('RF-18 / CU-18 2a: una dirección que no corresponde a ninguna novedad muestra 22-B', async ({
    page,
  }) => {
    await ingresarComo(page, 'aprobador')

    await page.goto('/novedades/00000000-0000-4000-8000-000000000000')
    await expect(page.getByRole('heading', SIN_PERMISO)).toBeVisible(ESPERA_DE_SESION)

    await page.goto('/novedades/no-es-un-identificador')
    await expect(page.getByRole('heading', SIN_PERMISO)).toBeVisible(ESPERA_DE_SESION)
    await page.getByRole('link', { name: 'Volver a la bandeja' }).click()
    await expect(page).toHaveURL(/\/bandeja$/)
  })
})
