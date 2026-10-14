import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarEvidencias, subirEvidencia } from '../../core/supabase/repositorios/evidencias.js'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import { reducirFoto } from '../e2-registro/reducirFoto.js'
import { Evidencias } from './Evidencias.jsx'

vi.mock('../../core/supabase/repositorios/evidencias.js', () => ({
  listarEvidencias: vi.fn(),
  subirEvidencia: vi.fn(),
}))
// La codificación necesita el navegador: se prueba en la e2e.
vi.mock('../e2-registro/reducirFoto.js', () => ({ reducirFoto: vi.fn() }))

const NOVEDAD = { id: 'n-145', codigo: 145 }
const evidencia = (n, url = `https://firmada/${n}`) => ({
  id: `e-${n}`,
  ruta_storage: `n-145/${n}.jpg`,
  subida_en: '2026-09-22T13:00:00Z',
  url,
})

const abrir = ({ puedeAdjuntar = true, rol = 'reportante' } = {}) =>
  pintarConSesion(<Evidencias novedad={NOVEDAD} puedeAdjuntar={puedeAdjuntar} />, {
    ruta: '/novedades/n-145',
    rol,
  })

describe('Bloque «Evidencias» del detalle (RF-08 / CU-08 y CU-18)', () => {
  /** @type {import('vitest').MockInstance | undefined} */
  let enLinea

  beforeEach(() => {
    vi.mocked(listarEvidencias)
      .mockReset()
      .mockResolvedValue([evidencia(1), evidencia(2)])
    vi.mocked(subirEvidencia).mockReset().mockResolvedValue({ id: 'e-3' })
    vi.mocked(reducirFoto)
      .mockReset()
      .mockResolvedValue(new Blob(['foto']))
  })
  afterEach(() => {
    enLinea?.mockRestore()
  })

  it('RF-08 / CU-18: muestra cada foto, con su texto alternativo, y abre la foto completa', async () => {
    abrir({ puedeAdjuntar: false, rol: 'aprobador' })

    const region = within(await screen.findByRole('region', { name: 'Evidencias' }))
    const foto = region.getByRole('img', { name: 'Foto 1 de NOV-0145' })
    expect(foto).toHaveAttribute('src', 'https://firmada/1')
    expect(foto.closest('a')).toHaveAttribute('href', 'https://firmada/1')
    expect(region.getByRole('img', { name: 'Foto 2 de NOV-0145' })).toBeVisible()
    expect(region.queryByRole('button', { name: 'Adjuntar foto' })).not.toBeInTheDocument()
  })

  it('RF-08 / CU-08: el reportante adjunta otra foto: se reduce, se sube a su nombre y aparece', async () => {
    abrir()
    const adjuntar = await screen.findByRole('button', { name: 'Adjuntar foto' })
    expect(adjuntar).toBeEnabled()
    vi.mocked(listarEvidencias).mockResolvedValue([evidencia(1), evidencia(2), evidencia(3)])

    await userEvent.upload(
      screen.getByLabelText('Adjuntar foto', { selector: 'input' }),
      new File(['foto'], 'IMG_0413.jpg', { type: 'image/jpeg' }),
    )

    expect(subirEvidencia).toHaveBeenCalledExactlyOnceWith(
      'n-145',
      expect.any(Blob),
      PERFILES.reportante.id,
    )
    expect(await screen.findByRole('img', { name: 'Foto 3 de NOV-0145' })).toBeVisible()
    // Con 3 ya no se puede adjuntar otra.
    expect(screen.queryByRole('button', { name: 'Adjuntar foto' })).not.toBeInTheDocument()
  })

  it('RF-08: si el servidor dice que ya tiene 3, se explica', async () => {
    vi.mocked(subirEvidencia).mockRejectedValue(new Error('LIMITE_DE_FOTOS'))
    abrir()
    await screen.findByRole('button', { name: 'Adjuntar foto' })

    await userEvent.upload(
      screen.getByLabelText('Adjuntar foto', { selector: 'input' }),
      new File(['foto'], 'IMG_0413.jpg', { type: 'image/jpeg' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta novedad ya tiene 3 fotos.')
  })

  it('RF-24 y RF-25 (09-D, 14-B): sin conexión, recuadros sin la foto y sin poder adjuntar', async () => {
    enLinea = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    vi.mocked(listarEvidencias).mockResolvedValue([evidencia(1, null)])
    abrir()

    expect(await screen.findByRole('img', { name: 'Foto 1 de NOV-0145' })).not.toHaveAttribute(
      'src',
    )
    const adjuntar = screen.getByRole('button', { name: 'Adjuntar foto' })
    expect(adjuntar).toHaveAttribute('aria-disabled', 'true')
    expect(adjuntar).toHaveAccessibleDescription('Las fotos necesitan conexión.')
  })

  it('sin fotos y sin poder adjuntar, el bloque no se muestra', async () => {
    vi.mocked(listarEvidencias).mockResolvedValue([])
    abrir({ puedeAdjuntar: false, rol: 'aprobador' })

    await vi.waitFor(() => expect(listarEvidencias).toHaveBeenCalled())
    expect(screen.queryByRole('region', { name: 'Evidencias' })).not.toBeInTheDocument()
  })
})
