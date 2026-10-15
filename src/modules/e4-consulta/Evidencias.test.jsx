import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { subirEvidencia } from '../../core/supabase/repositorios/evidencias.js'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import { reducirFoto } from '../e2-registro/reducirFoto.js'
import { Evidencias, Fotos } from './Evidencias.jsx'

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
  transicion_id: null,
  url,
})

const abrir = ({
  fotos = [evidencia(1), evidencia(2)],
  puedeAdjuntar = true,
  rol = 'reportante',
  alAdjuntar = vi.fn(),
} = {}) =>
  pintarConSesion(
    <Evidencias
      novedad={NOVEDAD}
      fotos={fotos}
      puedeAdjuntar={puedeAdjuntar}
      alAdjuntar={alAdjuntar}
    />,
    { ruta: '/novedades/n-145', rol },
  )

const adjuntar = () =>
  userEvent.upload(
    screen.getByLabelText('Adjuntar foto', { selector: 'input' }),
    new File(['foto'], 'IMG_0413.jpg', { type: 'image/jpeg' }),
  )

describe('Bloque «Evidencias» del detalle (RF-08 / CU-08 y CU-18)', () => {
  /** @type {import('vitest').MockInstance | undefined} */
  let enLinea

  beforeEach(() => {
    vi.mocked(subirEvidencia).mockReset().mockResolvedValue({ id: 'e-3' })
    vi.mocked(reducirFoto)
      .mockReset()
      .mockResolvedValue(new Blob(['foto']))
  })
  afterEach(() => {
    enLinea?.mockRestore()
  })

  it('RF-08 / CU-18: muestra cada foto, con su texto alternativo, y abre la foto completa', () => {
    abrir({ puedeAdjuntar: false, rol: 'aprobador' })

    const region = within(screen.getByRole('region', { name: 'Evidencias' }))
    const foto = region.getByRole('img', { name: 'Foto 1 de NOV-0145' })
    expect(foto).toHaveAttribute('src', 'https://firmada/1')
    expect(foto.closest('a')).toHaveAttribute('href', 'https://firmada/1')
    expect(region.getByRole('img', { name: 'Foto 2 de NOV-0145' })).toBeVisible()
    expect(region.queryByRole('button', { name: 'Adjuntar foto' })).not.toBeInTheDocument()
  })

  it('RF-08 / CU-08: el reportante adjunta otra foto: se reduce, se sube a su nombre y se piden de nuevo', async () => {
    const alAdjuntar = vi.fn()
    abrir({ alAdjuntar })
    expect(screen.getByRole('button', { name: 'Adjuntar foto' })).toBeEnabled()

    await adjuntar()

    expect(subirEvidencia).toHaveBeenCalledExactlyOnceWith(
      'n-145',
      expect.any(Blob),
      PERFILES.reportante.id,
    )
    expect(alAdjuntar).toHaveBeenCalledOnce()
  })

  it('RF-08: con 3 fotos ya no se puede adjuntar otra', () => {
    abrir({ fotos: [evidencia(1), evidencia(2), evidencia(3)] })

    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Adjuntar foto' })).not.toBeInTheDocument()
  })

  it('RF-08: si el servidor dice que ya tiene 3, se explica', async () => {
    vi.mocked(subirEvidencia).mockRejectedValue(new Error('LIMITE_DE_FOTOS'))
    abrir()

    await adjuntar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta novedad ya tiene 3 fotos.')
  })

  it('RF-24 y RF-25 (09-D, 14-B): sin conexión, recuadros sin la foto y sin poder adjuntar', () => {
    enLinea = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir({ fotos: [evidencia(1, null)] })

    expect(screen.getByRole('img', { name: 'Foto 1 de NOV-0145' })).not.toHaveAttribute('src')
    const boton = screen.getByRole('button', { name: 'Adjuntar foto' })
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    expect(boton).toHaveAccessibleDescription('Las fotos necesitan conexión.')
  })

  it('sin fotos y sin poder adjuntar, el bloque no se muestra; mientras cargan, tampoco', () => {
    abrir({ fotos: [], puedeAdjuntar: false, rol: 'aprobador' })
    expect(screen.queryByRole('region', { name: 'Evidencias' })).not.toBeInTheDocument()

    document.body.innerHTML = ''
    abrir({ fotos: null })
    expect(screen.queryByRole('region', { name: 'Evidencias' })).not.toBeInTheDocument()
  })
})

describe('Fotos de la solución (RF-08; cambio 23)', () => {
  beforeEach(() => {
    vi.mocked(subirEvidencia).mockReset().mockResolvedValue({ id: 'e-9' })
    vi.mocked(reducirFoto)
      .mockReset()
      .mockResolvedValue(new Blob(['foto']))
  })

  it('RF-08 (cambio 23): dicen que son de la solución, y el aprobador del área agrega otra', async () => {
    const alAdjuntar = vi.fn()
    pintarConSesion(
      <Fotos
        novedad={NOVEDAD}
        fotos={[{ ...evidencia(1), transicion_id: 7 }]}
        deLaSolucion
        puedeAdjuntar
        alAdjuntar={alAdjuntar}
      />,
      { ruta: '/novedades/n-145', rol: 'aprobador' },
    )

    const lista = within(screen.getByRole('list', { name: 'Fotos de la solución' }))
    expect(lista.getByRole('img', { name: 'Foto 1 de la solución de NOV-0145' })).toBeVisible()
    await adjuntar()

    expect(subirEvidencia).toHaveBeenCalledExactlyOnceWith(
      'n-145',
      expect.any(Blob),
      PERFILES.aprobador.id,
    )
    expect(alAdjuntar).toHaveBeenCalledOnce()
  })
})
