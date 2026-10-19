import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  obtenerEscalamiento,
  obtenerNovedadesAbiertas,
  obtenerRecurrencia,
  obtenerTiemposDeAtencion,
} from '../../core/supabase/repositorios/reportes.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Panel from './Panel.jsx'

vi.mock('../../core/supabase/repositorios/reportes.js', () => ({
  obtenerNovedadesAbiertas: vi.fn(),
  obtenerTiemposDeAtencion: vi.fn(),
  obtenerEscalamiento: vi.fn(),
  obtenerRecurrencia: vi.fn(),
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

// Figma 25.
const ESCALAMIENTO = {
  datos_al: '2026-09-24T14:30:00Z',
  desde: '2026-07-01',
  hasta: '2026-09-24',
  registradas: 38,
  escaladas: 7,
  areas: [
    { ...MANTENIMIENTO, registradas: 19, escaladas: 5 },
    { ...SISTEMAS, registradas: 19, escaladas: 2 },
  ],
  decisiones: { aprobadas: 3, rechazadas: 1, en_espera: 3 },
  novedades: [
    {
      id: 'n-147',
      codigo: 147,
      finca: 'Juanca',
      area_id: 'a-m',
      area: 'Mantenimiento',
      justificacion: 'Se requiere comprar 8 tablones de 3 m; no hay madera en bodega.',
      escalada_en: '2026-09-20T13:00:00Z',
      decision: 'aprobada',
      decidida_en: '2026-09-21T06:40:00Z',
    },
    {
      id: 'n-143',
      codigo: 143,
      finca: 'Tumaradó',
      area_id: 'a-s',
      area: 'Sistemas',
      justificacion: 'Hay que reemplazar el disco duro del grabador.',
      escalada_en: '2026-09-19T13:00:00Z',
      decision: null,
      decidida_en: null,
    },
  ],
}

const celda = (finca, tipo, cantidad) => ({
  finca_id: `f-${finca}`,
  finca,
  tipo_falla_id: `t-${tipo}`,
  tipo_falla: tipo,
  cantidad,
})
// Figma 26, con nueve fincas: siete a la vista y «Otras 2 fincas».
const RECURRENCIA = {
  datos_al: '2026-09-24T14:30:00Z',
  desde: '2026-04-01',
  hasta: '2026-09-24',
  total: 30,
  excluidas: 12,
  celdas: [
    celda('La Mónica', 'Biométrico', 5),
    celda('La Mónica', 'Internet', 1),
    celda('Juanca', 'Internet', 2),
    celda('Juanca', 'Biométrico', 1),
    celda('Pavarandó', 'Internet', 4),
    celda('Tumaradó', 'Torniquete', 3),
    celda('Truandó', 'Bombas', 3),
    celda('El Gran Cedro', 'Bombas', 2),
    celda('Tikal', 'Internet', 2),
    celda('Zungo', 'Bombas', 1),
    celda('Coquitos', 'Internet', 6),
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
  vi.mocked(obtenerEscalamiento).mockReset().mockResolvedValue(ESCALAMIENTO)
  vi.mocked(obtenerRecurrencia).mockReset().mockResolvedValue(RECURRENCIA)
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

  it('RF-27 (decisión 23): aplicar «Desde» no borra lo que se escribe después en «Hasta»', async () => {
    abrir('/panel?indicador=tiempos')
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Período' }),
      'Personalizado',
    )

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2001-01-01' } })
    fireEvent.blur(screen.getByLabelText('Desde'))
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2001-12-31' } })
    await waitFor(() =>
      expect(obtenerTiemposDeAtencion).toHaveBeenLastCalledWith({
        desde: '2001-01-01',
        hasta: '2026-09-24',
      }),
    )
    fireEvent.blur(screen.getByLabelText('Hasta'))

    await waitFor(() =>
      expect(obtenerTiemposDeAtencion).toHaveBeenLastCalledWith({
        desde: '2001-01-01',
        hasta: '2001-12-31',
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

describe('Pantallas 25 y 25-B · Escalamiento (RF-28, CU-28)', () => {
  it('RF-28 / CU-28 2: la proporción escalada, por área, con «Últimos 3 meses» por omisión', async () => {
    abrir('/panel?indicador=escalamiento')

    // Testing Library normaliza el espacio que no se parte: se busca con \s.
    expect(await screen.findByText(/^18,4\s%$/)).toBeVisible()
    expect(obtenerEscalamiento).toHaveBeenCalledExactlyOnceWith({
      desde: '2026-07-01',
      hasta: '2026-09-24',
    })
    expect(screen.getByText('7 de 38 registradas en el período')).toBeVisible()
    const porArea = screen
      .getByRole('heading', { name: 'Proporción escalada por área' })
      .closest('section')
    expect(
      within(porArea)
        .getAllByRole('listitem')
        .map((fila) => fila.textContent),
    ).toEqual(['Mantenimiento26,3\u00a0%5 de 19', 'Sistemas10,5\u00a0%2 de 19'])
  })

  it('RF-28 / CU-28 3: las decisiones del director, con su nombre y su cantidad', async () => {
    abrir('/panel?indicador=escalamiento')

    expect(await screen.findByText('Aprobadas · 3')).toBeVisible()
    expect(screen.getByText('Rechazadas · 1')).toBeVisible()
    expect(screen.getByText('En espera · 3')).toBeVisible()
  })

  it('RF-28: cada escalada con su decisión y el tiempo hasta ella; abre su detalle', async () => {
    abrir('/panel?indicador=escalamiento')
    const tabla = await screen.findByRole('table', { name: /Novedades escaladas en el período/ })

    const [, aprobada, enEspera] = within(tabla).getAllByRole('row')
    expect(within(aprobada).getByText('Aprobada')).toBeVisible()
    expect(within(aprobada).getByText('17 h 40 min')).toBeVisible()
    expect(within(enEspera).getByText('En espera')).toBeVisible()
    expect(within(enEspera).getByText('Sin decisión')).toBeInTheDocument()

    await userEvent.click(within(tabla).getByRole('link', { name: 'NOV-0147' }))
    expect(
      await screen.findByText('Detalle /novedades/n-147 desde /panel?indicador=escalamiento'),
    ).toBeVisible()
  })

  it('RF-28 / CU-28 2a (25-B): un período sin novedades lo dice', async () => {
    vi.mocked(obtenerEscalamiento).mockResolvedValue({
      ...ESCALAMIENTO,
      registradas: 0,
      escaladas: 0,
      decisiones: { aprobadas: 0, rechazadas: 0, en_espera: 0 },
      novedades: [],
    })
    abrir('/panel?indicador=escalamiento')

    expect(await screen.findByText('No hay novedades registradas en este período')).toBeVisible()
    expect(screen.getByText('Elige otro período.')).toBeVisible()
    expect(screen.queryByText('Decisiones del director')).toBeNull()
  })
})

describe('Pantalla 26 · Fallas recurrentes (RF-29, CU-29)', () => {
  it('RF-29 / CU-29 2 y 2b: el total, las que quedaron por fuera y «Últimos 6 meses» por omisión', async () => {
    abrir('/panel?indicador=recurrencia')

    expect(await screen.findByText('30 novedades resueltas y cerradas en el período')).toBeVisible()
    expect(obtenerRecurrencia).toHaveBeenCalledExactlyOnceWith({
      desde: '2026-04-01',
      hasta: '2026-09-24',
    })
    expect(
      screen.getByText(
        '12 novedades quedaron por fuera porque todavía no tienen tipo de falla (abiertas o rechazadas).',
      ),
    ).toBeVisible()
  })

  it('RF-29 / CU-29 3–5: cada celda es un enlace con su nombre que abre el historial filtrado', async () => {
    abrir('/panel?indicador=recurrencia')

    const celda = await screen.findByRole('link', { name: 'La Mónica · Biométrico: 5 novedades' })
    expect(celda).toHaveAttribute(
      'href',
      '/historial?finca=f-La Mónica&estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24&tipo=t-Biométrico'
        .replaceAll(' ', '+')
        .replace('Mónica', 'M%C3%B3nica')
        .replace('Biométrico', 'Biom%C3%A9trico'),
    )
    // Una celda vacía se oye en cero.
    const matriz = screen.getByRole('table', { name: /por finca y tipo de falla/ })
    const monica = within(matriz).getByRole('row', { name: /^La Mónica/ })
    expect(within(monica).getAllByText('0 novedades').length).toBeGreaterThan(0)
  })

  it('RF-29 (decisión 22): siete fincas y «Otras 2 fincas», que se despliega', async () => {
    abrir('/panel?indicador=recurrencia')
    const otras = await screen.findByRole('button', { name: 'Otras 2 fincas' })
    const matriz = screen.getByRole('table', { name: /por finca y tipo de falla/ })

    expect(within(matriz).queryByRole('rowheader', { name: 'Zungo' })).toBeNull()
    expect(otras).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(otras)
    expect(otras).toHaveAttribute('aria-expanded', 'true')
    expect(within(matriz).getByRole('rowheader', { name: 'Zungo' })).toBeVisible()
  })

  it('RF-29: las cinco combinaciones más repetidas, cada una con su historial', async () => {
    abrir('/panel?indicador=recurrencia')
    const combinaciones = (
      await screen.findByRole('heading', { name: 'Combinaciones más repetidas' })
    ).closest('section')

    expect(within(combinaciones).getAllByRole('listitem')).toHaveLength(5)
    expect(
      within(combinaciones).getByRole('link', { name: 'Ver novedades de Coquitos · Internet' }),
    ).toBeVisible()
  })

  it('RF-29 / CU-29 2a: sin resueltas en el período, el aviso de 25-B', async () => {
    vi.mocked(obtenerRecurrencia).mockResolvedValue({
      ...RECURRENCIA,
      total: 0,
      excluidas: 0,
      celdas: [],
    })
    abrir('/panel?indicador=recurrencia')

    expect(await screen.findByText('No hay novedades registradas en este período')).toBeVisible()
  })
})

describe('Pantalla 27 · Fallas recurrentes en el teléfono (RF-29)', () => {
  beforeEach(() => {
    simularPantalla('telefono')
  })

  it('RF-29: «Más repetidas» con tres y cada finca desplegable, la primera abierta', async () => {
    abrir('/panel?indicador=recurrencia')

    expect(
      await screen.findByText('12 novedades sin tipo de falla quedaron por fuera.'),
    ).toBeVisible()
    const masRepetidas = screen.getByRole('heading', { name: 'Más repetidas' }).closest('section')
    expect(within(masRepetidas).getAllByRole('listitem')).toHaveLength(3)

    const coquitos = screen.getByRole('button', { name: 'Coquitos 6 novedades' })
    const monica = screen.getByRole('button', { name: 'La Mónica 6 novedades' })
    expect(coquitos).toHaveAttribute('aria-expanded', 'true')
    expect(monica).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Ver en historial de Coquitos' })).toBeVisible()

    await userEvent.click(monica)
    expect(monica).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Ver en historial de La Mónica' })).toHaveAttribute(
      'href',
      expect.stringContaining('estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24'),
    )
    expect(screen.getByRole('tab', { name: 'Recurrencia' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
