import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  obtenerNovedadesAbiertas,
  obtenerTiemposDeAtencion,
} from '../../core/supabase/repositorios/reportes.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Panel from './Panel.jsx'

vi.mock('../../core/supabase/repositorios/reportes.js', () => ({
  obtenerNovedadesAbiertas: vi.fn(),
  obtenerTiemposDeAtencion: vi.fn(),
}))

const MANTENIMIENTO = { id: 'a-m', nombre: 'Mantenimiento' }
const SISTEMAS = { id: 'a-s', nombre: 'Sistemas' }

const ABIERTAS = {
  datos_al: '2026-09-24T14:30:00Z',
  areas: [
    { ...MANTENIMIENTO, abiertas: 6 },
    { ...SISTEMAS, abiertas: 5 },
  ],
  fincas: [
    {
      id: 'f-juanca',
      nombre: 'Juanca',
      razon_social: 'Agropecuaria Juanca S.A.S.',
      activa: true,
      total: 2,
      por_area: { 'a-m': 1, 'a-s': 1 },
    },
    {
      id: 'f-monica',
      nombre: 'La Mónica',
      razon_social: 'Agropecuaria La Mónica S.A.S.',
      activa: true,
      total: 2,
      por_area: { 'a-s': 2 },
    },
    {
      id: 'f-vieja',
      nombre: 'Vieja',
      razon_social: 'Agropecuaria Vieja S.A.S.',
      activa: false,
      total: 1,
      por_area: { 'a-m': 1 },
    },
    {
      id: 'f-tikal',
      nombre: 'Tikal',
      razon_social: 'Agropecuaria Tikal S.A.S.',
      activa: true,
      total: 0,
      por_area: {},
    },
  ],
  estados: [
    { estado: 'registrada', abiertas: 0 },
    { estado: 'asignada', abiertas: 4 },
    { estado: 'en_atencion', abiertas: 2 },
    { estado: 'escalada', abiertas: 3 },
    { estado: 'aprobada', abiertas: 1 },
    { estado: 'resuelta', abiertas: 1 },
  ],
}

const TIEMPOS = {
  datos_al: '2026-09-24T14:30:00Z',
  desde: '2026-07-01',
  hasta: '2026-09-24',
  areas: [
    { ...MANTENIMIENTO, resueltas: 16, promedio_horas: 103.2 },
    { ...SISTEMAS, resueltas: 18, promedio_horas: 38.4 },
  ],
  meses: [
    { mes: '2026-07-01', area_id: 'a-m', resueltas: 5, promedio_horas: 124.8 },
    { mes: '2026-08-01', area_id: 'a-m', resueltas: 6, promedio_horas: 96 },
    { mes: '2026-09-01', area_id: 'a-m', resueltas: 5, promedio_horas: 91.2 },
    { mes: '2026-07-01', area_id: 'a-s', resueltas: 6, promedio_horas: 45.6 },
    { mes: '2026-09-01', area_id: 'a-s', resueltas: 12, promedio_horas: 33.6 },
  ],
  abiertas: [
    {
      id: 'n-138',
      codigo: 138,
      finca: 'Truandó',
      area_id: 'a-m',
      area: 'Mantenimiento',
      estado: 'escalada',
      prioridad: 'alto',
      fecha_registro: '2026-09-15T10:30:00Z',
      horas_abierta: 220,
    },
    {
      id: 'n-146',
      codigo: 146,
      finca: 'Truandó',
      area_id: 'a-m',
      area: 'Mantenimiento',
      estado: 'asignada',
      prioridad: 'normal',
      fecha_registro: '2026-09-22T15:30:00Z',
      horas_abierta: 47,
    },
  ],
}

function Detalle() {
  const { pathname, state } = useLocation()
  return (
    <p>
      Detalle {pathname} desde {state?.origen}
    </p>
  )
}

function Historial() {
  const { search } = useLocation()
  return <p>Historial {search}</p>
}

function abrir(ruta = '/panel', rol = 'administrador') {
  return pintarConSesion(
    <Routes>
      <Route path="/panel" element={<Panel />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/novedades/:id" element={<Detalle />} />
    </Routes>,
    { ruta, rol },
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-24T14:30:00Z') })
  simularPantalla('escritorio')
  vi.mocked(obtenerNovedadesAbiertas).mockReset().mockResolvedValue(ABIERTAS)
  vi.mocked(obtenerTiemposDeAtencion).mockReset().mockResolvedValue(TIEMPOS)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Panel de reportes (RF-26 a RF-29)', () => {
  it('RF-26 / CU-26 1: abre en «Novedades abiertas», con «Datos al» y sin pedir lo demás', async () => {
    abrir()

    expect(await screen.findByText('Datos al 24 sep 2026, 9:30 a. m.')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Panel de reportes' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Novedades abiertas' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(obtenerNovedadesAbiertas).toHaveBeenCalledOnce()
    expect(obtenerTiemposDeAtencion).not.toHaveBeenCalled()
    // Las abiertas no tienen período.
    expect(screen.queryByRole('combobox', { name: 'Período' })).toBeNull()
  })

  it('RF-27: la pestaña y el período van en la dirección; cada cambio pide solo su indicador', async () => {
    abrir()
    await screen.findByText('Datos al 24 sep 2026, 9:30 a. m.')

    await userEvent.click(screen.getByRole('tab', { name: 'Tiempos de atención' }))
    await waitFor(() =>
      expect(obtenerTiemposDeAtencion).toHaveBeenCalledWith({
        desde: '2026-07-01',
        hasta: '2026-09-24',
      }),
    )
    const periodo = screen.getByRole('combobox', { name: 'Período' })
    expect(within(periodo).getByRole('option', { selected: true })).toHaveTextContent(
      'Últimos 3 meses (jul–sep 2026)',
    )

    await userEvent.selectOptions(periodo, 'Últimos 6 meses (abr–sep 2026)')
    await waitFor(() =>
      expect(obtenerTiemposDeAtencion).toHaveBeenLastCalledWith({
        desde: '2026-04-01',
        hasta: '2026-09-24',
      }),
    )
    expect(obtenerNovedadesAbiertas).toHaveBeenCalledOnce()
  })

  it('RF-27 (decisión 23): un período personalizado se aplica al salir de la fecha, si las dos están bien', async () => {
    abrir('/panel?indicador=tiempos')
    const periodo = await screen.findByRole('combobox', { name: 'Período' })

    await userEvent.selectOptions(periodo, 'Personalizado')
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-30' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-01' } })
    expect(screen.getByText('La fecha inicial debe ser anterior a la final')).toBeVisible()
    expect(obtenerTiemposDeAtencion).toHaveBeenCalledOnce()

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-04-01' } })
    // Mientras se escribe no se pide nada; al salir del campo, sí.
    expect(obtenerTiemposDeAtencion).toHaveBeenCalledOnce()
    fireEvent.blur(screen.getByLabelText('Desde'))
    await waitFor(() =>
      expect(obtenerTiemposDeAtencion).toHaveBeenLastCalledWith({
        desde: '2026-04-01',
        hasta: '2026-09-01',
      }),
    )
  })

  it('RF-26: «Actualizar» vuelve a pedir el indicador que se ve', async () => {
    abrir()
    await screen.findByText('Datos al 24 sep 2026, 9:30 a. m.')

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))

    await waitFor(() => expect(obtenerNovedadesAbiertas).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('button', { name: 'Actualizar' })).toBeEnabled()
  })

  it('RF-26 (decisión 13): sin conexión no pide nada y lo explica', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir()

    expect(
      await screen.findByText('El panel necesita conexión. Ábrelo cuando tengas internet.'),
    ).toBeVisible()
    expect(obtenerNovedadesAbiertas).not.toHaveBeenCalled()
  })

  it('RF-26 / CU-26 1a: si el servidor dice que no, lo dice y deja reintentar', async () => {
    vi.mocked(obtenerNovedadesAbiertas).mockRejectedValueOnce({
      code: 'P0001',
      message: 'SIN_PERMISO',
    })
    abrir()

    expect(await screen.findByText('No tienes permiso para esta acción.')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Datos al 24 sep 2026, 9:30 a. m.')).toBeVisible()
  })
})

describe('Pantalla 23 · Novedades abiertas (RF-26, CU-26)', () => {
  it('RF-26 / CU-26 2: el total y una tarjeta por área, que abre el historial de sus abiertas', async () => {
    abrir()

    expect(await screen.findByText('11')).toBeVisible()
    expect(
      screen.getByText(
        'No cerradas: asignadas, en atención, escaladas, aprobadas y resueltas sin confirmar',
      ),
    ).toBeVisible()
    const area = screen.getByRole('link', {
      name: 'Mantenimiento: 6 abiertas. Verlas en el historial',
    })
    await userEvent.click(area)
    expect(await screen.findByText('Historial ?area=a-m&estado=abiertas')).toBeVisible()
  })

  it('RF-26 / CU-26 2a: el gráfico solo con las fincas con abiertas; la tabla con todas, las de cero también', async () => {
    abrir()
    const grafico = (await screen.findByRole('heading', { name: 'Abiertas por finca' })).closest(
      'section',
    )

    const filas = within(grafico).getAllByRole('listitem')
    expect(filas.map((fila) => fila.textContent)).toEqual([
      'Juanca22 abiertas: Mantenimiento 1, Sistemas 1',
      'La Mónica22 abiertas: Mantenimiento 0, Sistemas 2',
      'Vieja (inactiva)11 abierta: Mantenimiento 1, Sistemas 0',
    ])
    expect(within(grafico).getByText('1 finca sin novedades abiertas')).toBeVisible()

    const tabla = screen.getByRole('table', { name: 'Novedades abiertas por finca' })
    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .map((celda) => celda.textContent),
    ).toEqual(['Finca', 'Razón social', 'Mantenimiento', 'Sistemas', 'Total', 'Historial'])
    const tikal = within(tabla).getByRole('row', { name: /Tikal/ })
    expect(
      within(tikal)
        .getAllByRole('cell')
        .map((celda) => celda.textContent),
    ).toEqual(['Agropecuaria Tikal S.A.S.', '0', '0', '0', 'Ver en historial de Tikal'])
  })

  it('RF-26 / CU-26 4–5: una finca abre el historial con su filtro y las abiertas', async () => {
    abrir()

    await userEvent.click(await screen.findByRole('link', { name: 'Ver en historial de Juanca' }))

    expect(await screen.findByText('Historial ?finca=f-juanca&estado=abiertas')).toBeVisible()
  })

  it('RF-26: por estado, solo los que tienen abiertas, con su chip', async () => {
    abrir()
    const grafico = (await screen.findByRole('heading', { name: 'Abiertas por estado' })).closest(
      'section',
    )

    expect(
      within(grafico)
        .getAllByRole('listitem')
        .map((fila) => fila.textContent),
    ).toEqual(['Asignada4', 'En atención2', 'Escalada3', 'Aprobada1', 'Resuelta1'])
  })
})

describe('Pantallas 24 y 24-B · Tiempos de atención (RF-27, CU-27)', () => {
  it('RF-27 / CU-27 3: el promedio de cada área y cuántas se resolvieron', async () => {
    abrir('/panel?indicador=tiempos')

    expect(await screen.findByText('4,3 días')).toBeVisible()
    expect(screen.getByText('16 resueltas en el período')).toBeVisible()
    expect(screen.getByText('1,6 días')).toBeVisible()
    expect(
      screen.getByText('Se mide desde la fecha de registro en finca, no desde la sincronización.'),
    ).toBeVisible()
  })

  it('RF-27 / CU-27 2: la evolución mensual, con sus datos en una tabla para el lector de pantalla', async () => {
    abrir('/panel?indicador=tiempos')

    const tabla = await screen.findByRole('table', { name: 'Promedio mensual por área, en días' })
    expect(
      within(tabla)
        .getAllByRole('row')
        .map((fila) => fila.textContent),
    ).toEqual([
      'MesMantenimientoSistemas',
      'Julio5,2 días1,9 días',
      'Agosto4,0 díasSin resueltas',
      'Septiembre3,8 días1,4 días',
    ])
    expect(screen.getByText('Mantenimiento · 3,8 días')).toBeInTheDocument()
  })

  it('RF-27: «Abiertas con más tiempo» abre el detalle, que vuelve al panel', async () => {
    abrir('/panel?indicador=tiempos')
    const tabla = await screen.findByRole('table', { name: /Las cinco novedades abiertas/ })

    expect(within(tabla).getAllByRole('row')[1].querySelectorAll('td')[5].textContent).toBe(
      '9 d 4 h',
    )
    await userEvent.click(within(tabla).getByRole('link', { name: 'NOV-0138' }))

    expect(
      await screen.findByText('Detalle /novedades/n-138 desde /panel?indicador=tiempos'),
    ).toBeVisible()
  })

  it('RF-27 / CU-27 3a (24-B): un área sin resueltas dice «No disponible»; con un solo mes no hay gráfico', async () => {
    vi.mocked(obtenerTiemposDeAtencion).mockResolvedValue({
      ...TIEMPOS,
      desde: '2026-09-01',
      areas: [
        { ...MANTENIMIENTO, resueltas: 0, promedio_horas: null },
        { ...SISTEMAS, resueltas: 6, promedio_horas: 33.6 },
      ],
      meses: [{ mes: '2026-09-01', area_id: 'a-s', resueltas: 6, promedio_horas: 33.6 }],
    })
    abrir('/panel?indicador=tiempos&periodo=mes')

    expect(await screen.findByText('No disponible')).toBeVisible()
    expect(screen.getByText('No hay novedades resueltas en el período')).toBeVisible()
    expect(screen.getByText('6 resueltas en el período')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Promedio mensual por área' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Abiertas con más tiempo' })).toBeVisible()
  })
})

describe('Panel en el teléfono (decisión 26)', () => {
  beforeEach(() => {
    simularPantalla('telefono')
  })

  it('RF-26: pestañas cortas en pastillas, el período corto y sin «Datos al» ni «Actualizar»', async () => {
    abrir('/panel?indicador=tiempos')

    expect(await screen.findByText('4,3 días')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Tiempos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Abiertas' })).toBeVisible()
    const periodo = screen.getByRole('combobox', { name: 'Período' })
    expect(within(periodo).getByRole('option', { selected: true })).toHaveTextContent(
      'Últimos 3 meses',
    )
    expect(screen.queryByText(/Datos al/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Actualizar' })).toBeNull()
  })
})
