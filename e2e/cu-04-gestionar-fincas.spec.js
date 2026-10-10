import { expect, test } from '@playwright/test'
import { enTelefono } from './apoyo/novedades.js'
import {
  abrirCuentaDesdeElAvatar,
  HAY_CLAVE,
  ingresarComo,
  leerDeLaApi,
  menuVisible,
  MOTIVO_SIN_CLAVE,
} from './apoyo/usuarios.js'

/*
 * CU-04 · Gestionar fincas (RF-04). Pantallas 30 (lista y diálogo de desactivar) y 30-B
 * (nueva finca y editar finca).
 *
 * La prueba crea su propia finca, con un nombre único, y la deja desactivada al terminar: así
 * no aparece en los filtros de las demás pantallas. Las fincas del seed nunca se desactivan:
 * sobre ellas solo se abre el diálogo y se cancela.
 */

const ESPERA_DE_SESION = { timeout: 20_000 }
const RAZON_SOCIAL = 'Razón social de prueba A'
const FINCA_DEL_SEED = 'Finca de prueba 01'

test.describe('CU-04 · Gestionar fincas', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  /** El administrador abre la pantalla como lo haría en su formato. */
  async function abrirFincas(page) {
    await ingresarComo(page, 'administrador')
    if (enTelefono(page)) {
      // En el teléfono no cabe en la barra inferior: se llega desde «Cuenta», que el
      // administrador abre con su avatar.
      await abrirCuentaDesdeElAvatar(page)
      await page
        .getByRole('navigation', { name: 'Administración' })
        .getByRole('link', { name: 'Fincas' })
        .click(ESPERA_DE_SESION)
    } else {
      await menuVisible(page).getByRole('link', { name: 'Fincas' }).click(ESPERA_DE_SESION)
    }
    await expect(page).toHaveURL(/\/fincas$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Fincas' })).toBeVisible()
    // La lista ya llegó cuando aparece el rango de la página.
    await expect(page.getByText(/^\d+–\d+ de \d+ fincas?$/)).toBeVisible(ESPERA_DE_SESION)
  }

  /** La fila de la tabla (escritorio) o la tarjeta (teléfono) de una finca. */
  const filaDe = (page, nombre) =>
    page
      .getByRole(enTelefono(page) ? 'article' : 'row')
      .filter({ has: page.getByRole('button', { name: `Editar ${nombre}`, exact: true }) })
  const buscar = (page, texto) => page.getByRole('searchbox', { name: 'Buscar finca' }).fill(texto)
  const estadoDe = async (page, nombre) => {
    const [finca] = await leerDeLaApi(
      page,
      `finca?select=activo&nombre=eq.${encodeURIComponent(nombre)}`,
    )
    return finca
  }

  test('RF-04 / CU-04: el administrador crea una finca, no puede repetir su nombre, la edita y la desactiva', async ({
    page,
  }, testInfo) => {
    const nombre = `Finca e2e ${testInfo.project.name} ${Date.now()}`
    const editada = `${nombre} editada`
    await abrirFincas(page)

    // CU-04 4 a 6: la crea con su nombre y su razón social.
    await page.getByRole('button', { name: 'Nueva finca' }).click()
    const nueva = page.getByRole('dialog', { name: 'Nueva finca' })
    // Sin datos no guarda, y señala lo que falta.
    await nueva.getByRole('button', { name: 'Guardar finca' }).click()
    await expect(nueva.getByText('Escribe el nombre de la finca.')).toBeVisible()
    await expect(nueva.getByText('Elige la razón social.')).toBeVisible()

    await nueva.getByRole('textbox', { name: 'Nombre de la finca' }).fill(nombre)
    await nueva
      .getByRole('combobox', { name: 'Razón social' })
      .selectOption({ label: RAZON_SOCIAL })
    await nueva.getByRole('button', { name: 'Guardar finca' }).click()
    await expect(page.getByText('Finca creada.')).toBeVisible()
    await expect(nueva).toBeHidden()

    await buscar(page, nombre)
    const fila = filaDe(page, nombre)
    await expect(fila).toHaveCount(1)
    await expect(fila.getByText(RAZON_SOCIAL)).toBeVisible()
    await expect(fila.getByText('Activa', { exact: true })).toBeVisible()
    expect(await estadoDe(page, nombre)).toEqual({ activo: true })

    // CU-04 6a: el mismo nombre en la misma razón social no se admite, aunque cambien las
    // mayúsculas.
    await page.getByRole('button', { name: 'Nueva finca' }).click()
    const repetida = page.getByRole('dialog', { name: 'Nueva finca' })
    await repetida.getByRole('textbox', { name: 'Nombre de la finca' }).fill(nombre.toUpperCase())
    await repetida
      .getByRole('combobox', { name: 'Razón social' })
      .selectOption({ label: RAZON_SOCIAL })
    await repetida.getByRole('button', { name: 'Guardar finca' }).click()
    await expect(
      repetida.getByText('Ya existe una finca con ese nombre en esta razón social'),
    ).toBeVisible()
    await repetida.getByRole('button', { name: 'Cancelar' }).click()
    await expect(repetida).toBeHidden()

    // CU-04 5: la edita.
    await page.getByRole('button', { name: `Editar ${nombre}`, exact: true }).click()
    const edicion = page.getByRole('dialog', { name: 'Editar finca' })
    await expect(edicion.getByRole('textbox', { name: 'Nombre de la finca' })).toHaveValue(nombre)
    await edicion.getByRole('textbox', { name: 'Nombre de la finca' }).fill(editada)
    await edicion.getByRole('button', { name: 'Guardar finca' }).click()
    await expect(page.getByText('Finca actualizada.')).toBeVisible()
    await expect(filaDe(page, editada)).toHaveCount(1)

    // CU-04 3 y 3a: la desactiva, con su confirmación. Sin novedades abiertas no hay advertencia.
    await page.getByRole('button', { name: `Desactivar ${editada}`, exact: true }).click()
    const confirmacion = page.getByRole('dialog', { name: `¿Desactivar la finca ${editada}?` })
    await expect(
      confirmacion.getByText('No aparecerá para nuevos registros, pero conserva su historial.'),
    ).toBeVisible()
    await expect(confirmacion.getByText(/novedades? abiertas?/)).toHaveCount(0)
    await confirmacion.getByRole('button', { name: 'Desactivar finca' }).click()
    await expect(page.getByText('Finca desactivada.')).toBeVisible()

    // Sale de las activas y queda entre las inactivas, con «Reactivar».
    await expect(page.getByText('No hay fincas que coincidan.')).toBeVisible()
    await page
      .getByRole('combobox', { name: 'Estado' })
      .selectOption({ label: 'Estado: Inactivas' })
    await expect(filaDe(page, editada).getByText('Inactiva', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: `Reactivar ${editada}`, exact: true }),
    ).toBeVisible()
    expect(await estadoDe(page, editada)).toEqual({ activo: false })
  })

  test('RF-04 / CU-04 3b: al desactivar una finca con novedades abiertas, advierte cuántas son; al cancelar, la finca sigue activa', async ({
    page,
  }) => {
    await abrirFincas(page)
    await buscar(page, FINCA_DEL_SEED)
    await expect(filaDe(page, FINCA_DEL_SEED)).toHaveCount(1)

    await page.getByRole('button', { name: `Desactivar ${FINCA_DEL_SEED}`, exact: true }).click()
    const confirmacion = page.getByRole('dialog', {
      name: `¿Desactivar la finca ${FINCA_DEL_SEED}?`,
    })
    // Las pruebas de los demás casos de uso dejan novedades abiertas en esta finca.
    await expect(
      confirmacion.getByText(
        /^Tiene \d+ novedades abiertas\. Seguirán su curso, pero no se podrán registrar novedades nuevas para esta finca\.$/,
      ),
    ).toBeVisible()
    await expect(confirmacion.getByText(/dejarán? de poder registrar\.$/)).toBeVisible()

    // Las fincas del seed no se desactivan: se cancela.
    await confirmacion.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirmacion).toBeHidden()
    await expect(filaDe(page, FINCA_DEL_SEED).getByText('Activa', { exact: true })).toBeVisible()
    expect(await estadoDe(page, FINCA_DEL_SEED)).toEqual({ activo: true })
  })

  test('RNF-11: quien no es administrador no entra a la pantalla ni puede escribir en las fincas', async ({
    page,
  }) => {
    await ingresarComo(page, 'director')
    await page.goto('/fincas')
    // El guardián lo devuelve a su inicio.
    await expect(page).toHaveURL(/\/escaladas$/, ESPERA_DE_SESION)

    // Y la base de datos tampoco lo deja: la política de inserción es solo del administrador.
    const respuesta = await page.evaluate(
      async ({ url, clave }) => {
        const guardada = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
        const { access_token: token } = JSON.parse(localStorage.getItem(guardada))
        const razones = await fetch(`${url}/rest/v1/razon_social?select=id&limit=1`, {
          headers: { apikey: clave, Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        const insercion = await fetch(`${url}/rest/v1/finca`, {
          method: 'POST',
          headers: {
            apikey: clave,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre: 'Finca del director', razon_social_id: razones[0].id }),
        })
        return { estado: insercion.status, cuerpo: await insercion.json() }
      },
      {
        url: process.env.VITE_SUPABASE_URL,
        clave: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    )
    expect(respuesta.estado).toBe(403)
    expect(respuesta.cuerpo.code).toBe('42501')
  })
})
