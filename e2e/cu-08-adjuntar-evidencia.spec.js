import { expect, test } from '@playwright/test'
import { abrirRegistro, descripcionUnica, enviarNovedad, llenarNovedad } from './apoyo/registro.js'
import { HAY_CLAVE, ingresarComo, MOTIVO_SIN_CLAVE } from './apoyo/usuarios.js'

/*
 * RF-08 / CU-08 · Adjuntar evidencia fotográfica, sobre el build y contra «staging». En el
 * repositorio no hay fotos reales: cada prueba dibuja la suya en la página (Canvas) y la entrega
 * al selector de archivos. Mide 2400 × 1800: la aplicación la reduce a 1600 de ancho.
 */

/** Una imagen PNG dibujada por la prueba, como la entregaría el selector de archivos. */
async function imagenDePrueba(page, nombre) {
  const base64 = await page.evaluate(() => {
    const lienzo = document.createElement('canvas')
    lienzo.width = 2400
    lienzo.height = 1800
    const contexto = lienzo.getContext('2d')
    contexto.fillStyle = '#1e6b3a'
    contexto.fillRect(0, 0, 2400, 1800)
    contexto.fillStyle = '#fff4e0'
    contexto.fillRect(300, 300, 1800, 1200)
    return lienzo.toDataURL('image/png').split(',')[1]
  })
  return { name: nombre, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

test.describe('CU-08 · Adjuntar evidencia fotográfica', () => {
  test.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  test.beforeEach(async ({ page }) => {
    await ingresarComo(page, 'reportante')
    await abrirRegistro(page)
  })

  test('RF-08 / CU-08: registra con una foto, la ve en el detalle reducida y adjunta otra desde ahí', async ({
    page,
  }, testInfo) => {
    const descripcion = descripcionUnica(testInfo, 'El tablero eléctrico echa chispas')
    await llenarNovedad(page, { descripcion, prioridad: 'Alto', area: 'Mantenimiento' })
    await page
      .getByLabel('Elegir de la galería')
      .setInputFiles(await imagenDePrueba(page, 'tablero.png'))
    const elegidas = page.getByRole('list', { name: 'Fotos elegidas' })
    await expect(elegidas.getByText('tablero.png')).toBeVisible()
    await expect(elegidas.getByText(/^Reducida a \d+ KB$/)).toBeVisible()

    await enviarNovedad(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
    await expect(page.getByText('La foto no se pudo subir')).toHaveCount(0)
    await page.getByRole('link', { name: 'Ver novedad' }).click()

    // La foto está en el detalle, reducida a 1600 de ancho.
    const primera = page.getByRole('img', { name: /^Foto 1 de NOV-\d{4,}$/ })
    await expect(primera).toBeVisible()
    await expect.poll(() => primera.evaluate((foto) => foto.naturalWidth)).toBe(1600)

    // CU-08 desde el detalle: otra foto.
    await page
      .getByLabel('Adjuntar foto', { exact: true })
      .setInputFiles(await imagenDePrueba(page, 'tablero-2.png'))
    await expect(page.getByRole('img', { name: /^Foto 2 de NOV-\d{4,}$/ })).toBeVisible()
  })

  test('RF-08 / CU-08 4a y 4b: un archivo que no es imagen se señala; sin red, las fotos no están disponibles', async ({
    page,
    context,
    browserName,
  }) => {
    await page.getByLabel('Elegir de la galería').setInputFiles({
      name: 'notas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('no soy una foto'),
    })
    await expect(page.getByRole('alert')).toHaveText(
      'El archivo no es una imagen o supera el tamaño permitido. Elige otra foto.',
    )

    test.skip(browserName === 'webkit', 'Playwright WebKit no corta la red de forma fiable aquí')
    await context.setOffline(true)
    await expect(page.getByRole('button', { name: 'Tomar foto' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(
      page.getByText(
        'Las fotos necesitan conexión. Podrás adjuntarla desde el detalle cuando la novedad se sincronice.',
      ),
    ).toBeVisible()
  })
})
