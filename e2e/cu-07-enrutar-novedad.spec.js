import { expect, test } from '@playwright/test'
import {
  abrirRegistro,
  codigoDeLaConstancia,
  descripcionUnica,
  enviarNovedad,
  llenarNovedad,
} from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, leerDeLaApi, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * CU-07 · Enrutar la novedad al área (RF-07). El enrutamiento ocurre dentro del registro.
 *
 * La bandeja del área (pantalla 11) llega en el Sprint 2. Mientras tanto, lo que recibe cada
 * aprobador se comprueba leyendo la API con su propia sesión, que es lo mismo que hará la
 * bandeja: sin claves privilegiadas, las políticas de la base deciden qué ve cada quien.
 */
test.describe('CU-07 · Enrutar la novedad al área', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test('RF-07 / CU-07: la novedad queda asignada al área elegida y solo esa área la recibe', async ({
    browser,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El biométrico de la portería no marca')
    const sesionDe = async (rol) => {
      const contexto = await browser.newContext()
      const page = await contexto.newPage()
      await ingresarComo(page, rol)
      return { contexto, page }
    }

    // El reportante registra una novedad para Sistemas.
    const reportante = await sesionDe('reportante')
    await abrirRegistro(reportante.page)
    await llenarNovedad(reportante.page, { descripcion, prioridad: 'Normal', area: 'Sistemas' })
    await enviarNovedad(reportante.page)

    const codigo = await codigoDeLaConstancia(reportante.page)
    await expect(
      reportante.page.getByText(
        'Sistemas ya la tiene en su bandeja. Te avisaremos cada vez que cambie de estado.',
      ),
    ).toBeVisible()
    await reportante.contexto.close()

    const numero = Number(codigo.replace('NOV-', ''))
    const laNovedad = `v_novedad?select=id,estado,area&codigo=eq.${numero}`

    // El aprobador de Sistemas la recibe, ya asignada a su área y con su aviso.
    const sistemas = await sesionDe('aprobadorSistemas')
    const recibidas = await leerDeLaApi(sistemas.page, laNovedad)
    expect(recibidas).toHaveLength(1)
    expect(recibidas[0]).toMatchObject({ estado: 'asignada', area: 'Sistemas' })

    const avisos = await leerDeLaApi(
      sistemas.page,
      `notificacion?select=estado_nuevo,leida&novedad_id=eq.${recibidas[0].id}`,
    )
    expect(avisos).toEqual([{ estado_nuevo: 'asignada', leida: false }])
    await sistemas.contexto.close()

    // El aprobador de Mantenimiento no la ve.
    const mantenimiento = await sesionDe('aprobador')
    expect(await leerDeLaApi(mantenimiento.page, laNovedad)).toEqual([])
    await mantenimiento.contexto.close()
  })
})
