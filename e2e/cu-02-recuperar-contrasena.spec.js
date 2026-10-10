import { randomInt } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import {
  abrirCuentaDesdeElAvatar,
  crearUsuarioDePrueba,
  desactivarUsuarioDePrueba,
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  llamarAFuncion,
  llamarALaApi,
  llenarIngreso,
  MOTIVO_SIN_CLAVE,
  USUARIOS,
} from './apoyo/usuarios.js'

/*
 * CU-02 · Recuperar contraseña (RF-02). Pantallas 02 (solicitar), 02-B (solicitud enviada),
 * 32 (el administrador genera el código), 03 (crear la contraseña), 03-B (código vencido) y
 * 01-E (contraseña actualizada).
 *
 * Cada prueba que cambia una contraseña crea su propio usuario (`e2e-…@novedades.test`) con
 * la sesión del administrador y lo deja desactivado al terminar: un usuario no se puede
 * borrar. A los usuarios del seed no se les cambia la contraseña ni el estado; del usuario
 * desactivado del seed solo se usa el correo, para comprobar que su solicitud no se crea.
 *
 * El código vencido por tiempo no se prueba aquí (son 30 minutos): lo cubren pgTAP, que mueve
 * el vencimiento, y Vitest. Aquí se cubre la otra mitad de 9a: el código ya usado.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }
const MENSAJE_02B =
  'Si el correo corresponde a un usuario activo, un administrador te entregará un código temporal. El código tiene una vigencia limitada.'
const CODIGO_INVALIDO = 'El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.'
const CODIGO_VENCIDO = 'El código venció. Pide uno nuevo al administrador.'

/** Una contraseña que cumple la regla, distinta en cada corrida. */
const contrasenaNueva = () => `Nueva-${randomInt(1000, 10_000)}x`
/** Un código de seis dígitos distinto del verdadero. */
const otroCodigo = (codigo) => String((Number(codigo) + 1) % 1_000_000).padStart(6, '0')

/** Una persona sin sesión, en su propio navegador. */
async function sinSesion(browser) {
  const contexto = await browser.newContext()
  return { contexto, page: await contexto.newPage() }
}

/** 02 → 02-B: deja la solicitud desde el ingreso. */
async function solicitar(page, correo) {
  await page.goto('/ingresar')
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click()
  await expect(page).toHaveURL(/\/recuperar$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Recuperar contraseña' })).toBeVisible()
  await page.getByLabel('Correo registrado').fill(correo)
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible()
  await expect(page.getByText(MENSAJE_02B)).toBeVisible()
}

/** 03: escribe el código y la contraseña nueva, y guarda. */
async function crearContrasena(page, { codigo, contrasena }) {
  await page.getByLabel('Código temporal').fill(codigo)
  await page.getByLabel('Contraseña nueva').fill(contrasena)
  await page.getByLabel('Confirmar contraseña').fill(contrasena)
  await page.getByRole('button', { name: 'Guardar contraseña' }).click()
}

/** Las solicitudes de un usuario, de la más reciente a la más antigua, como las ve el administrador. */
const solicitudesDe = (page, usuarioId) =>
  leerDeLaApi(
    page,
    `solicitud_recuperacion?select=id,expira_en,usado,intentos_fallidos&usuario_id=eq.${usuarioId}&order=creada_en.desc`,
  )

/** El administrador abre la pantalla 32 por donde la tiene: el menú o, en el teléfono, «Cuenta». */
async function abrirRecuperaciones(page) {
  if (enTelefono(page)) {
    await abrirCuentaDesdeElAvatar(page)
    await page
      .getByRole('navigation', { name: 'Administración' })
      .getByRole('link', { name: /^Recuperación de contraseñas/ })
      .click()
  } else {
    await page
      .getByRole('navigation', { name: 'Principal' })
      .filter({ visible: true })
      .getByRole('link', { name: /^Recuperación de contraseñas/ })
      .click()
  }
  await expect(page).toHaveURL(/\/recuperacion$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Recuperación de contraseñas' }),
  ).toBeVisible()
  await expect(page.getByRole('tab', { name: /^Pendientes \(\d+\)$/ })).toBeVisible(
    ESPERA_DE_SESION,
  )
}

/** La fila de la tabla (escritorio) o la tarjeta (teléfono) de la solicitud de alguien. */
const solicitudDe = (page, nombre) =>
  page.getByRole(enTelefono(page) ? 'article' : 'row').filter({ hasText: nombre })

test.describe('CU-02 · Recuperar contraseña', () => {
  test('RF-02 / CU-02 4a: con un correo que no existe la pantalla responde lo mismo', async ({
    page,
  }) => {
    await solicitar(page, `nadie-${Date.now()}@novedades.test`)

    await expect(page.getByRole('alert')).toHaveCount(0)
    // Desde 02-B se sigue a la pantalla del código, con el correo puesto y fuera de la dirección.
    await page.getByRole('button', { name: 'Ingresar código' }).click()
    await expect(page).toHaveURL(/\/recuperar\/codigo$/)
    await expect(page.getByLabel('Correo', { exact: true })).toHaveValue(/^nadie-\d+@/)
  })

  test('RF-02 / CU-02 8: sin el código completo o con las contraseñas distintas no se envía nada', async ({
    page,
  }) => {
    const peticiones = []
    page.on('request', (peticion) => {
      if (peticion.url().includes('/functions/v1/')) peticiones.push(peticion.url())
    })
    await page.goto('/recuperar/codigo')
    await page.getByLabel('Correo', { exact: true }).fill('alguien@novedades.test')

    await page.getByLabel('Código temporal').fill('4827')
    await page.getByLabel('Contraseña nueva').fill('Banano-4821')
    await page.getByLabel('Confirmar contraseña').fill('Banano-4822')
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()

    await expect(page.getByText('Escribe los seis dígitos del código.')).toBeVisible()
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible()
    await expect(page.getByLabel('Código temporal')).toBeFocused()
    expect(peticiones).toEqual([])
  })

  test.describe('con los usuarios de prueba', () => {
    test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

    test('RF-02 / CU-02: la persona solicita, el administrador genera el código, ella crea su contraseña e ingresa con la nueva', async ({
      page,
      browser,
    }, testInfo) => {
      // Dos navegadores y dos ingresos por el formulario, además de las pantallas del administrador.
      test.setTimeout(120_000)
      await ingresarComo(page, 'administrador')
      const usuario = await crearUsuarioDePrueba(page, `${testInfo.project.name}-${Date.now()}`)
      const nueva = contrasenaNueva()
      const persona = await sinSesion(browser)

      try {
        // CU-02 1 a 4: deja la solicitud, sin sesión.
        await solicitar(persona.page, usuario.correo)

        // CU-02 5: el administrador la ve entre las pendientes, con la insignia en su menú.
        await abrirRecuperaciones(page)
        const pendiente = solicitudDe(page, usuario.nombre)
        await expect(pendiente).toHaveCount(1)
        await expect(pendiente.getByText('Pendiente', { exact: true })).toBeVisible()
        await expect(pendiente.getByText('Reportante · Finca de prueba 01')).toBeVisible()
        if (!enTelefono(page)) {
          await expect(
            page.getByRole('link', { name: /^Recuperación de contraseñas\s*, \d+ solicitud/ }),
          ).toBeVisible()
        }

        // CU-02 6: genera el código. Se ve una sola vez, en el diálogo.
        await page
          .getByRole('button', { name: `Generar código para ${usuario.nombre}`, exact: true })
          .click()
        const dialogo = page.getByRole('dialog', { name: 'Código temporal generado' })
        await expect(dialogo.getByText(`${usuario.nombre} · ${usuario.correo}`)).toBeVisible()
        const mostrado = dialogo.locator('p[translate="no"]')
        await expect(mostrado).toHaveText(/^\d{3} \d{3}$/)
        // CU-02 7: es lo que el administrador le entrega a la persona por un medio propio.
        const codigo = (await mostrado.innerText()).replace(/\s/g, '')
        await expect(
          dialogo.getByText(
            /^Vence (hoy|mañana) a las \d{1,2}:\d{2} [ap]\. m\. Solo se puede usar una vez y no se volverá a mostrar\.$/,
          ),
        ).toBeVisible()
        await expect(
          dialogo.getByText('Verifica la identidad de la persona antes de entregarlo.'),
        ).toBeVisible()
        await dialogo.getByRole('button', { name: 'Listo' }).click()
        await expect(dialogo).toBeHidden()
        // El código ya no está en la pantalla, y la solicitud dice que tiene uno.
        await expect(page.getByText(`${codigo.slice(0, 3)} ${codigo.slice(3)}`)).toHaveCount(0)
        await expect(pendiente.getByText('Código generado', { exact: true })).toBeVisible()
        // En la base de datos solo queda su resumen, que ni el administrador puede leer.
        const resumen = await leerDeLaApi(page, 'solicitud_recuperacion?select=codigo_hash&limit=1')
        expect(resumen.code).toBe('42501')

        // CU-02 8: la persona escribe el código y su contraseña nueva. El correo ya viene puesto.
        await persona.page.getByRole('button', { name: 'Ingresar código' }).click()
        await expect(persona.page).toHaveURL(/\/recuperar\/codigo$/)
        await expect(persona.page.getByLabel('Correo', { exact: true })).toHaveValue(usuario.correo)
        await crearContrasena(persona.page, { codigo, contrasena: nueva })

        // CU-02 9 y 10 (01-E): vuelve al ingreso con la confirmación…
        await expect(persona.page).toHaveURL(/\/ingresar$/, ESPERA_DE_SESION)
        await expect(
          persona.page.getByText('Contraseña actualizada. Ya puedes ingresar.'),
        ).toBeVisible()
        // …e ingresa con la contraseña nueva.
        await persona.page.getByLabel('Correo', { exact: true }).fill(usuario.correo)
        await persona.page.getByLabel('Contraseña', { exact: true }).fill(nueva)
        await persona.page.getByRole('button', { name: 'Ingresar' }).click()
        await expect(persona.page).toHaveURL(/\/novedades$/, ESPERA_DE_SESION)
        await expect(
          persona.page.getByRole('heading', { level: 1, name: 'Mis novedades' }),
        ).toBeAttached()

        // La contraseña anterior ya no sirve.
        const conLaAnterior = await sinSesion(browser)
        await llenarIngreso(conLaAnterior.page, usuario.correo, usuario.contrasena)
        await expect(conLaAnterior.page.getByRole('alert')).toContainText(
          'Correo o contraseña incorrectos',
          ESPERA_DE_SESION,
        )
        await conLaAnterior.contexto.close()

        // Para el administrador, la solicitud pasó a las atendidas, como usada.
        await page.reload()
        await page.getByRole('tab', { name: 'Atendidas' }).click()
        await expect(solicitudDe(page, usuario.nombre).getByText('Usada')).toBeVisible()
        expect(await solicitudesDe(page, usuario.id)).toMatchObject([{ usado: true }])
      } finally {
        await persona.contexto.close()
        // Se deja desactivado: es de la prueba y no se puede borrar.
        await desactivarUsuarioDePrueba(page, usuario.id)
      }
    })

    test('RF-02 / CU-02 9b y 9a: un código incorrecto se puede corregir; el mismo código por segunda vez muestra 03-B', async ({
      page,
      browser,
    }, testInfo) => {
      test.setTimeout(90_000)
      await ingresarComo(page, 'administrador')
      const usuario = await crearUsuarioDePrueba(page, `${testInfo.project.name}-b-${Date.now()}`)
      const nueva = contrasenaNueva()
      const persona = await sinSesion(browser)

      try {
        await solicitar(persona.page, usuario.correo)
        // El administrador genera el código; aquí interesa la otra pantalla, así que va por la API.
        const [solicitud] = await solicitudesDe(page, usuario.id)
        const [{ codigo }] = await llamarALaApi(page, 'generar_codigo_recuperacion', {
          p_solicitud_id: solicitud.id,
        })

        // CU-02 9b: con un código incorrecto lo dice en el campo y sigue en la pantalla 03.
        await persona.page.getByRole('button', { name: 'Ingresar código' }).click()
        await crearContrasena(persona.page, { codigo: otroCodigo(codigo), contrasena: nueva })
        await expect(persona.page.getByText(CODIGO_INVALIDO)).toBeVisible()
        await expect(persona.page).toHaveURL(/\/recuperar\/codigo$/)
        await expect(persona.page.getByLabel('Código temporal')).toBeFocused()
        await expect(persona.page.getByLabel('Contraseña nueva')).toHaveValue(nueva)
        expect(await solicitudesDe(page, usuario.id)).toMatchObject([
          { usado: false, intentos_fallidos: 1 },
        ])

        // Lo corrige y guarda: 01-E.
        await persona.page.getByLabel('Código temporal').fill(codigo)
        await persona.page.getByRole('button', { name: 'Guardar contraseña' }).click()
        await expect(
          persona.page.getByText('Contraseña actualizada. Ya puedes ingresar.'),
        ).toBeVisible(ESPERA_DE_SESION)

        // CU-02 9a (03-B): el mismo código ya no sirve una segunda vez.
        await persona.page.goto('/recuperar/codigo')
        await persona.page.getByLabel('Correo', { exact: true }).fill(usuario.correo)
        await crearContrasena(persona.page, { codigo, contrasena: `${nueva}2` })
        const aviso = persona.page.getByRole('alert')
        await expect(aviso).toContainText(CODIGO_VENCIDO)
        await expect(persona.page.getByLabel('Código temporal')).toHaveAttribute(
          'aria-invalid',
          'true',
        )

        // «Solicitar otro código» vuelve a 02 con el correo puesto.
        await aviso.getByRole('button', { name: 'Solicitar otro código' }).click()
        await expect(persona.page).toHaveURL(/\/recuperar$/)
        await expect(persona.page.getByLabel('Correo registrado')).toHaveValue(usuario.correo)
        // Y la solicitud nueva sí se crea: la anterior ya se usó.
        await persona.page.getByRole('button', { name: 'Enviar solicitud' }).click()
        await expect(persona.page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible()
        await expect.poll(async () => (await solicitudesDe(page, usuario.id)).length).toBe(2)
        // La función tampoco cambió la contraseña con el código repetido: sigue siendo la nueva.
        const repetido = await llamarAFuncion(persona.page, 'restablecer-contrasena', {
          correo: usuario.correo,
          codigo,
          contrasena: `${nueva}3`,
        })
        expect(repetido).toEqual({ estado: 400, cuerpo: { codigo: 'CODIGO_VENCIDO' } })
      } finally {
        await persona.contexto.close()
        await desactivarUsuarioDePrueba(page, usuario.id)
      }
    })

    test('RF-02 / CU-02 4a: la solicitud de un usuario desactivado no se crea, y la pantalla responde igual', async ({
      page,
      browser,
    }) => {
      await ingresarComo(page, 'administrador')
      const lista = await llamarALaApi(page, 'listar_usuarios', {})
      const desactivado = lista.find(({ correo }) => correo === USUARIOS.desactivado.correo)
      expect(desactivado).toMatchObject({ activo: false })
      const antes = await solicitudesDe(page, desactivado.id)

      const persona = await sinSesion(browser)
      await solicitar(persona.page, USUARIOS.desactivado.correo)
      await expect(persona.page.getByRole('alert')).toHaveCount(0)
      await persona.contexto.close()

      expect(await solicitudesDe(page, desactivado.id)).toHaveLength(antes.length)
      // Al usuario del seed no le pasó nada.
      const despues = await llamarALaApi(page, 'listar_usuarios', {})
      expect(despues.find(({ id }) => id === desactivado.id)).toMatchObject({ activo: false })
    })

    test('RNF-11: quien no es administrador no entra a la pantalla, no ve las solicitudes ni genera códigos', async ({
      page,
      browser,
    }) => {
      await ingresarComo(page, 'director')
      await page.goto('/recuperacion')
      // El guardián lo devuelve a su inicio.
      await expect(page).toHaveURL(/\/escaladas$/, ESPERA_DE_SESION)

      // La base de datos no le muestra ninguna solicitud ni le genera un código.
      expect(await leerDeLaApi(page, 'solicitud_recuperacion?select=id')).toEqual([])
      await expect(
        llamarALaApi(page, 'generar_codigo_recuperacion', {
          p_solicitud_id: '00000000-0000-4000-8000-00000000dead',
        }),
      ).rejects.toThrow(/SIN_PERMISO/)
      // Consumir un código es solo de la función: ni con sesión se puede por la API.
      await expect(
        llamarALaApi(page, 'consumir_codigo_recuperacion', {
          p_correo: USUARIOS.reportante.correo,
          p_codigo: '000000',
        }),
      ).rejects.toThrow(/respondió 403/)

      // Sin sesión tampoco: ni leer la tabla ni generar.
      const persona = await sinSesion(browser)
      await persona.page.goto('/ingresar')
      const sinPermiso = await persona.page.evaluate(
        async ({ url, clave }) => {
          const cabeceras = { apikey: clave, 'Content-Type': 'application/json' }
          const tabla = await fetch(`${url}/rest/v1/solicitud_recuperacion?select=id`, {
            headers: cabeceras,
          })
          const generar = await fetch(`${url}/rest/v1/rpc/generar_codigo_recuperacion`, {
            method: 'POST',
            headers: cabeceras,
            body: JSON.stringify({ p_solicitud_id: '00000000-0000-4000-8000-00000000dead' }),
          })
          return [tabla.status, generar.status]
        },
        {
          url: process.env.VITE_SUPABASE_URL,
          clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      )
      expect(sinPermiso).toEqual([401, 401])
      await persona.contexto.close()
    })
  })
})
