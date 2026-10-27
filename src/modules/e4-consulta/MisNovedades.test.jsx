import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarPendientes } from '../../core/offline/bd.js'
import {
  listarRechazosSinLeer,
  marcarAvisosLeidos,
} from '../../core/supabase/repositorios/avisos.js'
import { contarNovedades, listarNovedades } from '../../core/supabase/repositorios/novedades.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import MisNovedades from './MisNovedades.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  NOVEDADES_POR_PAGINA: 20,
  listarNovedades: vi.fn(),
  contarNovedades: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/avisos.js', () => ({
  listarRechazosSinLeer: vi.fn(),
  marcarAvisosLeidos: vi.fn().mockResolvedValue(0),
}))
// La cola de pendientes del dispositivo (RF-21): aquí solo importa cómo se ven.
vi.mock('../../core/offline/bd.js', async (original) => ({
  ...(await original()),
  listarPendientes: vi.fn().mockResolvedValue([]),
}))

const ABIERTAS = ['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada']

const haceHoras = (horas) => new Date(Date.now() - horas * 3_600_000).toISOString()

const NOVEDADES = [
  {
    id: 'n-153',
    codigo: 153,
    descripcion: 'El puente de la entrada se cayó',
    prioridad: 'critico',
    estado: 'asignada',
    area: 'Mantenimiento',
    fecha_registro: haceHoras(3),
  },
  {
    id: 'n-149',
    codigo: 149,
    descripcion: 'El biométrico de la portería no marca',
    prioridad: 'normal',
    estado: 'en_atencion',
    area: 'Sistemas',
    fecha_registro: haceHoras(26),
  },
]

/** Simula el servidor: cuántas novedades hay en cada grupo de estados. */
function conNovedades({ abiertas = NOVEDADES, porConfirmar = [] } = {}) {
  const grupo = (estados) => {
    if (estados.includes('asignada')) return abiertas
    if (estados.includes('resuelta')) return porConfirmar
    return []
  }
  vi.mocked(listarNovedades).mockImplementation(async ({ estados }) => ({
    novedades: grupo(estados),
    total: grupo(estados).length,
  }))
  vi.mocked(contarNovedades).mockImplementation(async (estados) => grupo(estados).length)
}

function abrir() {
  return pintarConSesion(
    <Routes>
      <Route path="/novedades" element={<MisNovedades />} />
      <Route path="/registrar" element={<h1>Registrar novedad</h1>} />
    </Routes>,
    { ruta: '/novedades', rol: 'reportante' },
  )
}

describe('Pantalla 04 · Mis novedades (RF-18)', () => {
  beforeEach(() => {
    vi.mocked(listarNovedades).mockReset()
    vi.mocked(contarNovedades).mockReset()
    vi.mocked(listarRechazosSinLeer).mockResolvedValue([])
  })

  it('RF-18: lista las novedades abiertas con código, estado, prioridad, área y antigüedad', async () => {
    conNovedades()
    abrir()

    const tarjetas = await screen.findAllByRole('listitem')
    expect(tarjetas).toHaveLength(2)

    const primera = within(tarjetas[0])
    expect(primera.getByRole('heading', { level: 2, name: 'NOV-0153' })).toBeVisible()
    expect(primera.getByText('Asignada')).toBeVisible()
    expect(primera.getByText('Crítico')).toBeVisible()
    expect(primera.getByText('El puente de la entrada se cayó')).toBeVisible()
    expect(primera.getByText('Mantenimiento')).toBeVisible()
    expect(primera.getByText('hace 3 h')).toBeVisible()

    expect(within(tarjetas[1]).getByText('hace 1 d')).toBeVisible()
    expect(listarNovedades).toHaveBeenCalledWith({ estados: ABIERTAS })
  })

  it('RF-18 / CU-18 1: cada tarjeta abre el detalle de su novedad', async () => {
    conNovedades()
    abrir()
    await screen.findAllByRole('listitem')

    expect(screen.getByRole('link', { name: 'NOV-0153' })).toHaveAttribute(
      'href',
      '/novedades/n-153',
    )
    expect(screen.getByRole('link', { name: 'NOV-0149' })).toHaveAttribute(
      'href',
      '/novedades/n-149',
    )
  })

  it('RF-18: los filtros muestran cuántas hay abiertas y por confirmar', async () => {
    conNovedades({
      porConfirmar: [{ ...NOVEDADES[0], id: 'n-140', codigo: 140, estado: 'resuelta' }],
    })
    abrir()

    const filtros = within(screen.getByRole('group', { name: 'Filtrar por estado' }))
    expect(await filtros.findByRole('button', { name: 'Abiertas (2)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(filtros.getByRole('button', { name: 'Por confirmar (1)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(filtros.getByRole('button', { name: 'Cerradas' })).toBeVisible()
    expect(filtros.getByRole('button', { name: 'Rechazadas' })).toBeVisible()
  })

  it('RF-15: avisa que hay una novedad resuelta por confirmar y lleva a revisarla', async () => {
    conNovedades({
      porConfirmar: [{ ...NOVEDADES[0], id: 'n-140', codigo: 140, estado: 'resuelta' }],
    })
    abrir()

    expect(await screen.findByText('1 novedad resuelta espera tu confirmación')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Revisar' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'NOV-0140' })).toBeVisible()
    expect(listarNovedades).toHaveBeenLastCalledWith({ estados: ['resuelta'] })
    expect(screen.getByRole('button', { name: 'Por confirmar (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('RF-18: cambia de lista con los filtros', async () => {
    conNovedades()
    abrir()
    await screen.findAllByRole('listitem')

    await userEvent.click(screen.getByRole('button', { name: 'Cerradas' }))

    expect(await screen.findByText('No hay novedades en esta lista.')).toBeVisible()
    expect(listarNovedades).toHaveBeenLastCalledWith({ estados: ['cerrada'] })
  })

  it('RF-18: «Rechazadas» cuenta las rechazadas sin ver y abrirla las marca vistas', async () => {
    conNovedades()
    vi.mocked(listarRechazosSinLeer).mockResolvedValue([
      { id: 'aviso-1', novedad_id: 'n-130' },
      { id: 'aviso-2', novedad_id: 'n-131' },
    ])
    abrir()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Rechazadas, 2 rechazadas sin ver' }),
    )

    expect(marcarAvisosLeidos).toHaveBeenCalledWith(['aviso-1', 'aviso-2'])
    expect(await screen.findByRole('button', { name: 'Rechazadas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('RF-18: el filtro queda en la dirección y se respeta al abrirla', async () => {
    conNovedades({
      porConfirmar: [{ ...NOVEDADES[0], id: 'n-140', codigo: 140, estado: 'resuelta' }],
    })
    pintarConSesion(
      <Routes>
        <Route path="/novedades" element={<MisNovedades />} />
      </Routes>,
      { ruta: '/novedades?lista=por_confirmar', rol: 'reportante' },
    )

    expect(await screen.findByRole('heading', { level: 2, name: 'NOV-0140' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Por confirmar (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(listarNovedades).toHaveBeenCalledWith({ estados: ['resuelta'] })
  })

  it('Pantalla 04-C: sin novedades abiertas lo dice e invita a registrar', async () => {
    conNovedades({ abiertas: [] })
    abrir()

    expect(await screen.findByText('Tu finca no tiene novedades abiertas')).toBeVisible()
    expect(screen.getByText('Cuando registres una, aquí verás en qué va.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Abiertas (0)' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Por confirmar (0)' })).toBeVisible()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('RF-05: desde la lista se llega al registro', async () => {
    conNovedades()
    abrir()
    await screen.findAllByRole('listitem')

    const [enlace] = screen.getAllByRole('link', { name: 'Registrar novedad' })
    await userEvent.click(enlace)

    expect(screen.getByRole('heading', { level: 1, name: 'Registrar novedad' })).toBeVisible()
  })

  it('RNF-06: carga por páginas y trae más cuando se pide', async () => {
    const pagina = (desde) =>
      Array.from({ length: 20 }, (_, i) => ({
        ...NOVEDADES[0],
        id: `n-${desde + i}`,
        codigo: desde + i,
      }))
    vi.mocked(contarNovedades).mockResolvedValue(25)
    vi.mocked(listarNovedades).mockImplementation(async ({ pagina: numero = 0 }) => ({
      novedades: numero === 0 ? pagina(100) : pagina(200).slice(0, 5),
      total: 25,
    }))
    abrir()

    expect(await screen.findAllByRole('listitem')).toHaveLength(20)
    await userEvent.click(screen.getByRole('button', { name: 'Ver más' }))

    expect(await screen.findAllByRole('listitem')).toHaveLength(25)
    expect(listarNovedades).toHaveBeenLastCalledWith({ estados: ABIERTAS, pagina: 1 })
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })

  it('si no hay conexión lo informa y deja reintentar', async () => {
    vi.mocked(listarNovedades).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.mocked(contarNovedades).mockResolvedValue(2)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión.')

    vi.mocked(listarNovedades).mockResolvedValue({ novedades: NOVEDADES, total: 2 })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Pantalla 04-B · Consulta sin conexión (RF-24 / CU-24)', () => {
  beforeEach(() => {
    vi.mocked(listarNovedades).mockReset()
    vi.mocked(contarNovedades).mockReset()
    vi.mocked(listarRechazosSinLeer).mockResolvedValue([])
    vi.mocked(listarPendientes).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('RF-24 / CU-24 3 y 4: muestra lo descargado y cuándo se descargó', async () => {
    // 04-B dice «hoy» si la descarga es de hoy: el reloj va a media mañana, no a la medianoche.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-14T15:00:00Z') })
    vi.mocked(listarNovedades).mockResolvedValue({
      novedades: NOVEDADES,
      total: 2,
      descargadaEn: haceHoras(1),
    })
    vi.mocked(contarNovedades).mockResolvedValue(2)
    abrir()

    expect(await screen.findAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Sin conexión')).toBeVisible()
    expect(
      screen.getByText(/^Estás viendo lo descargado hoy \d{1,2}:\d{2} [ap]\. m\.$/),
    ).toBeVisible()
  })

  it('RF-24 / CU-24 3: las pendientes van primero en «Abiertas», sin código, y abren la pantalla 08', async () => {
    conNovedades()
    vi.mocked(listarPendientes).mockResolvedValue([
      {
        id_local: '7f3a0000-0000-4000-8000-000000000001',
        descripcion: 'El rodillo del cable vía del lote 5 está suelto.',
        prioridad: 'normal',
        area: 'Mantenimiento',
        fecha_registro: haceHoras(0),
      },
    ])
    abrir()

    const [primera, ...resto] = await screen.findAllByRole('listitem')
    expect(resto).toHaveLength(2)
    const enLaPendiente = within(primera)
    expect(enLaPendiente.getByRole('link', { name: 'Sin código' })).toHaveAttribute(
      'href',
      '/pendientes',
    )
    expect(enLaPendiente.getByText('Pendiente de sincronizar')).toBeVisible()
    expect(enLaPendiente.getByText(/^hoy /)).toBeVisible()
    // Se cuentan con las abiertas, como en Figma 04-B.
    expect(screen.getByRole('button', { name: 'Abiertas (3)' })).toBeVisible()
  })

  it('RF-24 / CU-24 3a: sin nada descargado, la primera consulta necesita conexión', async () => {
    const sinDescarga = Object.assign(new Error(), { name: 'SinDescarga' })
    vi.mocked(listarNovedades).mockRejectedValue(sinDescarga)
    vi.mocked(contarNovedades).mockResolvedValue(0)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La primera consulta necesita conexión. Abre esta pantalla con internet para descargar tus novedades.',
    )
  })
})
