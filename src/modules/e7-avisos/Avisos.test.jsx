import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAvisos, marcarAvisosLeidos } from '../../core/supabase/repositorios/avisos.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import { pedirConteoDeInsignias } from '../../app/insignias.js'
import Avisos from './Avisos.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/avisos.js', () => ({
  AVISOS_POR_PAGINA: 20,
  listarAvisos: vi.fn(),
  marcarAvisosLeidos: vi.fn(),
}))
vi.mock('../../app/insignias.js', () => ({ pedirConteoDeInsignias: vi.fn() }))
// 10-B tiene sus propias pruebas: aquí el navegador no admite push.
vi.mock('../../core/push/suscripcion.js', () => ({
  estadoDelPush: vi.fn().mockResolvedValue('no-disponible'),
  activarPush: vi.fn(),
}))

const novedad = (codigo, area = 'Sistemas') => ({
  codigo,
  prioridad: 'alto',
  finca: 'La Mónica',
  area,
  tipo_falla: null,
})

// Como en Figma 10, el jueves 24 sep 2026 a las 9:30 a. m.
const AHORA = new Date('2026-09-24T14:30:00Z')
const AVISOS = [
  {
    id: 'a1',
    estado_nuevo: 'asignada',
    leida: false,
    creada_en: '2026-09-24T12:40:00Z',
    novedad_id: 'n-153',
    novedad: novedad(153),
  },
  {
    id: 'a2',
    estado_nuevo: 'resuelta',
    leida: false,
    creada_en: '2026-09-23T20:40:00Z',
    novedad_id: 'n-145',
    novedad: novedad(145),
  },
  {
    id: 'a3',
    estado_nuevo: 'aprobada',
    leida: true,
    creada_en: '2026-09-22T15:00:00Z',
    novedad_id: 'n-147',
    novedad: novedad(147, 'Mantenimiento'),
  },
]

function Detalle() {
  const { pathname, state } = useLocation()
  return (
    <p>
      Detalle {pathname} desde {state?.origen}
    </p>
  )
}

function abrir() {
  return pintarConSesion(
    <Routes>
      <Route path="/avisos" element={<Avisos />} />
      <Route path="/novedades/:id" element={<Detalle />} />
    </Routes>,
    { ruta: '/avisos', rol: 'reportante' },
  )
}

const aviso = (codigo) => screen.getByRole('button', { name: new RegExp(`^${codigo}`) })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: AHORA })
  vi.mocked(listarAvisos).mockResolvedValue({ avisos: AVISOS, total: 3 })
  vi.mocked(marcarAvisosLeidos).mockResolvedValue(1)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('Pantalla 10 · Avisos (RF-30 / CU-30)', () => {
  it('RF-30 / CU-30 3: agrupa los avisos por día, con el código, la hora y el texto de la Tabla 33', async () => {
    abrir()

    const hoy = await screen.findByRole('list', { name: 'Hoy' })
    expect(within(hoy).getByText('NOV-0153')).toBeVisible()
    expect(within(hoy).getByText('7:40 a. m.')).toBeVisible()
    expect(within(hoy).getByText('Tu novedad fue reasignada a Sistemas.')).toBeVisible()

    const ayer = screen.getByRole('list', { name: 'Ayer' })
    expect(within(ayer).getByText('3:40 p. m.')).toBeVisible()
    expect(
      within(ayer).getByText('Sistemas registró la solución. Confirma si quedó resuelta.'),
    ).toBeVisible()

    const semana = screen.getByRole('list', { name: 'Esta semana' })
    expect(within(semana).getByText('mar 22 sep')).toBeVisible()
    expect(
      within(semana).getByText(
        'El director de agricultura aprobó la novedad; vuelve a Mantenimiento para ejecutarla.',
      ),
    ).toBeVisible()

    expect(screen.getByText('Toca un aviso para abrir la novedad.')).toBeVisible()
  })

  it('RF-30: un aviso sin leer se distingue con texto, no solo con el color y el punto', async () => {
    abrir()

    expect(await screen.findByRole('button', { name: /^NOV-0153.*Sin leer/ })).toBeVisible()
    expect(aviso('NOV-0147')).not.toHaveAccessibleName(/Sin leer/)
  })

  it('RF-30 / CU-30 4–5: tocar un aviso sin leer lo marca leído y abre el detalle, con «Volver a los avisos»', async () => {
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: /^NOV-0153/ }))

    expect(marcarAvisosLeidos).toHaveBeenCalledWith(['a1'])
    expect(await screen.findByText('Detalle /novedades/n-153 desde /avisos')).toBeVisible()
    await waitFor(() => expect(pedirConteoDeInsignias).toHaveBeenCalled())
  })

  it('RF-30: un aviso ya leído abre el detalle sin volver a marcarlo', async () => {
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: /^NOV-0147/ }))

    expect(marcarAvisosLeidos).not.toHaveBeenCalled()
    expect(await screen.findByText('Detalle /novedades/n-147 desde /avisos')).toBeVisible()
  })

  it('RF-30: si no se pudo marcar (la red), igual abre la novedad', async () => {
    vi.mocked(marcarAvisosLeidos).mockRejectedValue(new TypeError('Failed to fetch'))
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: /^NOV-0145/ }))

    expect(await screen.findByText('Detalle /novedades/n-145 desde /avisos')).toBeVisible()
  })

  it('RF-30: «Marcar todas como leídas» las marca de una vez y desaparece', async () => {
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }))

    expect(marcarAvisosLeidos).toHaveBeenCalledWith(null)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Marcar todas como leídas' })).toBeNull(),
    )
    expect(screen.queryByRole('button', { name: /Sin leer/ })).toBeNull()
    expect(pedirConteoDeInsignias).toHaveBeenCalled()
  })

  it('RF-30: «Ver más» trae los avisos anteriores', async () => {
    vi.mocked(listarAvisos)
      .mockResolvedValueOnce({ avisos: AVISOS, total: 4 })
      .mockResolvedValueOnce({
        avisos: [
          {
            id: 'a4',
            estado_nuevo: 'en_atencion',
            leida: true,
            creada_en: '2026-09-15T15:00:00Z',
            novedad_id: 'n-142',
            novedad: novedad(142),
          },
        ],
        total: 4,
      })
    const usuario = userEvent.setup()
    abrir()

    await usuario.click(await screen.findByRole('button', { name: 'Ver más' }))

    const anteriores = await screen.findByRole('list', { name: 'Anteriores' })
    expect(within(anteriores).getByText('15 sep')).toBeVisible()
    expect(listarAvisos).toHaveBeenLastCalledWith({ pagina: 1 })
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull()
  })

  it('RF-30: un aviso de una novedad que pasó a otra área lo dice', async () => {
    vi.mocked(listarAvisos).mockResolvedValue({
      avisos: [{ ...AVISOS[0], id: 'a9', novedad: null }],
      total: 1,
    })
    abrir()

    expect(await screen.findByText('La novedad pasó a otra área.')).toBeVisible()
  })

  it('RF-30: sin avisos, lo dice', async () => {
    vi.mocked(listarAvisos).mockResolvedValue({ avisos: [], total: 0 })
    abrir()

    expect(await screen.findByText('No tienes avisos.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Marcar todas como leídas' })).toBeNull()
  })

  it('RF-30 (decisión 35): sin conexión no pide nada y lo explica', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir()

    expect(
      await screen.findByText('Los avisos necesitan conexión. Ábrelos cuando tengas internet.'),
    ).toBeVisible()
    expect(listarAvisos).not.toHaveBeenCalled()
  })
})
