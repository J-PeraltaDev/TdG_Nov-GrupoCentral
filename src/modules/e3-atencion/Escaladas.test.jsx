import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  contarDecisionesDelMes,
  listarEscaladas,
  listarEscalamientos,
} from '../../core/supabase/repositorios/novedades.js'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Escaladas from './Escaladas.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  listarEscaladas: vi.fn(),
  listarEscalamientos: vi.fn(),
  contarDecisionesDelMes: vi.fn(),
}))

const HORA = 3_600_000
const hace = (horas) => new Date(Date.now() - horas * HORA).toISOString()

const NOVEDADES = [
  {
    id: 'n-138',
    codigo: 138,
    descripcion: 'La bomba de drenaje del lote 9 hace ruido y se apaga.',
    prioridad: 'alto',
    estado: 'escalada',
    area_id: 'area-m',
    area: 'Mantenimiento',
    finca_id: 'finca-1',
    finca: 'Finca de prueba 01',
    fecha_registro: hace(72),
  },
  {
    id: 'n-143',
    codigo: 143,
    descripcion: 'El grabador de las cámaras no guarda video.',
    prioridad: 'normal',
    estado: 'escalada',
    area_id: 'area-s',
    area: 'Sistemas',
    finca_id: 'finca-2',
    finca: 'Finca de prueba 02',
    fecha_registro: hace(30),
  },
]

const ESCALAMIENTOS = [
  // Un escalamiento anterior de la misma novedad: vale el más reciente.
  {
    id: 1,
    novedad_id: 'n-138',
    observacion: 'Justificación vieja.',
    fecha_hora: hace(200),
    usuario: { nombre: 'Otra persona', rol_id: 2, area: 'Mantenimiento' },
  },
  {
    id: 2,
    novedad_id: 'n-138',
    observacion: 'Hay que cambiar los rodamientos; requiere compra de repuestos.',
    fecha_hora: hace(48),
    usuario: { nombre: 'Aprobador de prueba', rol_id: 2, area: 'Mantenimiento' },
  },
  {
    id: 3,
    novedad_id: 'n-143',
    observacion: 'Hay que reemplazar el disco duro del grabador.',
    fecha_hora: hace(18),
    usuario: { nombre: 'Aprobador de Sistemas', rol_id: 2, area: 'Sistemas' },
  },
]

function abrir() {
  return pintarConSesion(<Escaladas />, { ruta: '/escaladas', rol: 'director' })
}

describe('Pantalla 19 · Novedades escaladas (RF-13 / CU-13)', () => {
  beforeEach(() => {
    vi.mocked(listarEscaladas).mockResolvedValue({ novedades: NOVEDADES, total: 2 })
    vi.mocked(listarEscalamientos).mockResolvedValue(ESCALAMIENTOS)
    vi.mocked(contarDecisionesDelMes).mockResolvedValue({ aprobadas: 2, rechazadas: 1 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('RF-13 / CU-13 1: muestra el título y los tres contadores', async () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Novedades escaladas' })).toBeVisible()
    const contadores = await screen.findByRole('list', { name: 'Resumen de tus decisiones' })
    await waitFor(() =>
      expect(
        within(contadores)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Esperan tu decisión2', 'Aprobadas este mes2', 'Rechazadas este mes1']),
    )
  })

  it('RF-13: cuenta las decisiones del director que consulta, desde el inicio del mes', async () => {
    abrir()

    await waitFor(() => expect(contarDecisionesDelMes).toHaveBeenCalledTimes(1))
    const [usuarioId, desde] = vi.mocked(contarDecisionesDelMes).mock.calls[0]
    expect(usuarioId).toBe(PERFILES.director.id)
    expect(desde).toMatch(/^\d{4}-\d{2}-01T00:00:00-05:00$/)
  })

  it('RF-13 / CU-13 2: cada novedad sale con su justificación, quién la escaló y hace cuánto espera', async () => {
    abrir()

    const tarjetas = await screen.findAllByRole('article')
    expect(tarjetas).toHaveLength(2)

    const primera = within(tarjetas[0])
    expect(primera.getByRole('heading', { level: 2, name: 'NOV-0138' })).toBeVisible()
    expect(primera.getByText('La bomba de drenaje del lote 9 hace ruido y se apaga.')).toBeVisible()
    // La justificación sale del historial, que llega después de la lista.
    expect(await primera.findByText('Justificación del escalamiento')).toBeVisible()
    expect(
      primera.getByText('Hay que cambiar los rodamientos; requiere compra de repuestos.'),
    ).toBeVisible()
    expect(primera.queryByText('Justificación vieja.')).not.toBeInTheDocument()
    expect(
      primera.getByText('Escaló: Aprobador de prueba · Aprobador · Mantenimiento'),
    ).toBeVisible()
    expect(primera.getByText('Esperando decisión hace 2 d')).toBeVisible()

    expect(within(tarjetas[1]).getByText('Esperando decisión hace 18 h')).toBeVisible()
    expect(listarEscalamientos).toHaveBeenCalledWith(['n-138', 'n-143'])
  })

  it('RF-13: una novedad recién escalada dice «hace menos de 1 min», no «ahora»', async () => {
    vi.mocked(listarEscaladas).mockResolvedValue({ novedades: [NOVEDADES[0]], total: 1 })
    vi.mocked(listarEscalamientos).mockResolvedValue([
      { ...ESCALAMIENTOS[1], fecha_hora: hace(20 / 3600) },
    ])
    abrir()

    expect(await screen.findByText('Esperando decisión hace menos de 1 min')).toBeVisible()
  })

  it('RF-13: mientras llega el historial, la espera se cuenta desde el registro', async () => {
    vi.mocked(listarEscalamientos).mockReturnValue(new Promise(() => {}))
    abrir()

    const [primera] = await screen.findAllByRole('article')
    // Registrada hace 72 h; la justificación todavía no está.
    expect(within(primera).getByText('Esperando decisión hace 3 d')).toBeVisible()
    expect(within(primera).queryByText('Justificación del escalamiento')).not.toBeInTheDocument()
  })

  it('RF-13 / CU-13 2: conserva el orden que entrega el servidor (prioridad y antigüedad)', async () => {
    abrir()

    const titulos = await screen.findAllByRole('heading', { level: 2 })
    expect(titulos.map((h) => h.textContent)).toEqual(['NOV-0138', 'NOV-0143'])
  })

  it('RF-13 / CU-13 3: «Revisar y decidir» abre la novedad y «Ver historial», su línea de tiempo', async () => {
    abrir()

    const [primera] = await screen.findAllByRole('article')
    expect(within(primera).getByRole('link', { name: /Revisar y decidir/ })).toHaveAttribute(
      'href',
      '/novedades/n-138',
    )
    expect(within(primera).getByRole('link', { name: /Ver historial/ })).toHaveAttribute(
      'href',
      '/novedades/n-138#linea-de-tiempo',
    )
  })

  it('RF-13: sin el historial la lista sigue sirviendo, sin el recuadro de la justificación', async () => {
    vi.mocked(listarEscalamientos).mockRejectedValue(new Error('sin historial'))
    abrir()

    const [primera] = await screen.findAllByRole('article')
    expect(within(primera).queryByText('Justificación del escalamiento')).not.toBeInTheDocument()
    expect(within(primera).getByRole('link', { name: /Revisar y decidir/ })).toBeVisible()
  })

  it('RF-13: sin escaladas lo dice', async () => {
    vi.mocked(listarEscaladas).mockResolvedValue({ novedades: [], total: 0 })
    abrir()

    expect(await screen.findByText('No hay novedades esperando tu decisión.')).toBeVisible()
    expect(listarEscalamientos).not.toHaveBeenCalled()
  })

  it('RF-13: si la consulta falla, avisa y deja reintentar', async () => {
    vi.mocked(listarEscaladas).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No hay conexión')

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findAllByRole('article')).toHaveLength(2)
  })

  it('RF-13: «Ver más» trae la página siguiente', async () => {
    vi.mocked(listarEscaladas)
      .mockResolvedValueOnce({ novedades: [NOVEDADES[0]], total: 2 })
      .mockResolvedValueOnce({ novedades: [NOVEDADES[1]], total: 2 })
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Ver más' }))

    expect(await screen.findAllByRole('article')).toHaveLength(2)
    expect(listarEscaladas).toHaveBeenLastCalledWith({ pagina: 1 })
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })
})
