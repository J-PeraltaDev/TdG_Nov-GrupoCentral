import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarFincas } from '../../core/supabase/repositorios/catalogos.js'
import {
  contarBandeja,
  listarBandeja,
  listarTransicionesDeBandeja,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import { formatearFechaCorta } from '../../core/utils/fechas.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Bandeja from './Bandeja.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  NOVEDADES_POR_PAGINA: 20,
  listarBandeja: vi.fn(),
  contarBandeja: vi.fn(),
  listarTransicionesDeBandeja: vi.fn(),
  tomarNovedad: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({
  listarFincas: vi.fn(),
}))

const haceMinutos = (minutos) => new Date(Date.now() - minutos * 60_000).toISOString()

const FINCAS = [
  { id: 'finca-1', nombre: 'Finca de prueba 01' },
  { id: 'finca-2', nombre: 'Finca de prueba 02' },
]

// Como las entrega el servidor: por prioridad y, dentro de cada una, la más antigua primero.
const POR_ATENDER = [
  {
    id: 'n-153',
    codigo: 153,
    descripcion: 'El torniquete de la entrada principal marca luz verde pero no gira.',
    prioridad: 'critico',
    estado: 'asignada',
    area_id: 'area-m',
    area: 'Mantenimiento',
    finca_id: 'finca-1',
    finca: 'Finca de prueba 01',
    fecha_registro: haceMinutos(25),
  },
  {
    id: 'n-147',
    codigo: 147,
    descripcion: 'El puente que comunica los lotes 12 y 14 está sin tablones.',
    prioridad: 'alto',
    estado: 'aprobada',
    area_id: 'area-m',
    area: 'Mantenimiento',
    finca_id: 'finca-2',
    finca: 'Finca de prueba 02',
    fecha_registro: haceMinutos(27 * 60 + 40),
  },
  {
    id: 'n-152',
    codigo: 152,
    descripcion: 'El aire acondicionado de la oficina gotea sobre el escritorio.',
    prioridad: 'normal',
    estado: 'asignada',
    area_id: 'area-m',
    area: 'Mantenimiento',
    finca_id: 'finca-1',
    finca: 'Finca de prueba 01',
    fecha_registro: haceMinutos(35),
  },
]
const EN_ATENCION = [
  { ...POR_ATENDER[0], id: 'n-150', codigo: 150, estado: 'en_atencion', prioridad: 'alto' },
]
const EN_ESPERA = [
  { ...POR_ATENDER[0], id: 'n-140', codigo: 140, estado: 'escalada' },
  { ...POR_ATENDER[2], id: 'n-141', codigo: 141, estado: 'resuelta' },
]

const TRANSICIONES = [
  { id: 1, novedad_id: 'n-147', estado_nuevo: 'asignada', area_anterior: null },
  {
    id: 2,
    novedad_id: 'n-147',
    estado_nuevo: 'escalada',
    observacion: 'Se requiere comprar 8 tablones de 3 m; no hay material en bodega.',
  },
  {
    id: 3,
    novedad_id: 'n-147',
    estado_nuevo: 'aprobada',
    observacion: 'Aprobado. Comprar con el proveedor habitual.',
    fecha_hora: '2026-09-22T13:10:00Z',
    usuario: { nombre: 'Hernán Darío Úsuga' },
  },
  { id: 4, novedad_id: 'n-152', estado_nuevo: 'asignada', area_anterior: { nombre: 'Sistemas' } },
  { id: 5, novedad_id: 'n-153', estado_nuevo: 'asignada', area_anterior: null },
]

/** Simula el servidor: qué hay en cada pestaña, con el filtro de finca aplicado. */
function conBandeja({
  porAtender = POR_ATENDER,
  enAtencion = EN_ATENCION,
  enEspera = EN_ESPERA,
} = {}) {
  const grupo = ({ estados, fincaId }) => {
    const todas = estados.includes('asignada')
      ? porAtender
      : estados.includes('en_atencion')
        ? enAtencion
        : enEspera
    return fincaId ? todas.filter((novedad) => novedad.finca_id === fincaId) : todas
  }
  vi.mocked(listarBandeja).mockImplementation(async (filtro) => ({
    novedades: grupo(filtro),
    total: grupo(filtro).length,
  }))
  vi.mocked(contarBandeja).mockImplementation(async (filtro) => grupo(filtro).length)
  vi.mocked(listarTransicionesDeBandeja).mockResolvedValue(TRANSICIONES)
  vi.mocked(listarFincas).mockResolvedValue(FINCAS)
}

function abrir(ruta = '/bandeja') {
  return pintarConSesion(
    <Routes>
      <Route path="/bandeja" element={<Bandeja />} />
      <Route path="/novedades/:id" element={<h1>Detalle de la novedad</h1>} />
    </Routes>,
    { ruta, rol: 'aprobador' },
  )
}

const codigos = () =>
  screen.getAllByRole('heading', { level: 2 }).map((titulo) => titulo.textContent)

beforeEach(() => {
  vi.mocked(listarBandeja).mockReset()
  vi.mocked(contarBandeja).mockReset()
  vi.mocked(listarTransicionesDeBandeja).mockReset()
  vi.mocked(listarFincas).mockReset()
  vi.mocked(tomarNovedad).mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Pantalla 11 · Bandeja del área en el teléfono (RF-09 / CU-09)', () => {
  it('RF-09 / CU-09 2: pide las novedades por atender del área del aprobador', async () => {
    conBandeja()
    abrir()

    await screen.findAllByRole('listitem')

    expect(listarBandeja).toHaveBeenCalledExactlyOnceWith({
      areaId: 'area-m',
      fincaId: null,
      estados: ['asignada', 'aprobada'],
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Bandeja · Mantenimiento' })).toBeVisible()
  })

  it('RF-09 / CU-09 2: las muestra en el orden del servidor: prioridad y antigüedad', async () => {
    conBandeja()
    abrir()

    await screen.findAllByRole('listitem')

    expect(codigos()).toEqual(['NOV-0153', 'NOV-0147', 'NOV-0152'])
  })

  it('RF-09 / CU-09 3: de cada novedad muestra el código, la finca, la prioridad, el estado y el tiempo', async () => {
    conBandeja()
    abrir()

    const [primera, segunda] = await screen.findAllByRole('listitem')

    expect(within(primera).getByRole('heading', { level: 2, name: 'NOV-0153' })).toBeVisible()
    expect(within(primera).getByText('Finca de prueba 01')).toBeVisible()
    expect(within(primera).getByText('Crítico')).toBeVisible()
    expect(within(primera).getByText('Asignada')).toBeVisible()
    expect(within(primera).getByText('hace 25 min')).toBeVisible()
    expect(within(segunda).getByText('Aprobada')).toBeVisible()
    expect(within(segunda).getByText('hace 1 d')).toBeVisible()
  })

  it('RF-09: los contadores dicen cuántas hay en cada pestaña', async () => {
    conBandeja()
    abrir()

    await screen.findAllByRole('listitem')

    expect(screen.getAllByRole('term').map((nombre) => nombre.textContent)).toEqual([
      'Por atender',
      'En atención',
      'En espera',
    ])
    expect(screen.getAllByRole('definition').map((cantidad) => cantidad.textContent)).toEqual([
      '3',
      '1',
      '2',
    ])
  })

  it('RF-09: explica qué agrupa cada pestaña, con el texto de Figma', async () => {
    conBandeja()
    abrir()

    expect(
      await screen.findByText(
        'Por atender: asignadas y aprobadas por el director. En espera: escaladas y resueltas sin confirmar.',
      ),
    ).toBeVisible()
  })

  it('RF-09: al cambiar de pestaña pide los estados de esa pestaña', async () => {
    conBandeja()
    abrir()
    await screen.findAllByRole('listitem')

    await userEvent.click(screen.getByRole('tab', { name: 'En atención' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'NOV-0150' })).toBeVisible()
    expect(listarBandeja).toHaveBeenLastCalledWith({
      areaId: 'area-m',
      fincaId: null,
      estados: ['en_atencion'],
    })
    expect(screen.getByRole('tab', { name: 'En atención' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel', { name: 'En atención' })).toBeVisible()

    await userEvent.click(screen.getByRole('tab', { name: 'En espera' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'NOV-0140' })).toBeVisible()
    expect(listarBandeja).toHaveBeenLastCalledWith({
      areaId: 'area-m',
      fincaId: null,
      estados: ['escalada', 'resuelta'],
    })
  })

  it('RF-09: la pestaña queda en la dirección y se respeta al abrirla', async () => {
    conBandeja()
    abrir('/bandeja?pestana=en_espera')

    expect(await screen.findByRole('heading', { level: 2, name: 'NOV-0140' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'En espera' })).toHaveAttribute('aria-selected', 'true')
    expect(listarBandeja).toHaveBeenCalledExactlyOnceWith({
      areaId: 'area-m',
      fincaId: null,
      estados: ['escalada', 'resuelta'],
    })
  })

  it('RF-09 / CU-09 4: cada tarjeta abre el detalle de su novedad', async () => {
    conBandeja()
    abrir()
    await screen.findAllByRole('listitem')

    await userEvent.click(screen.getByRole('link', { name: 'NOV-0147' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Detalle de la novedad' })).toBeVisible()
  })

  it('RNF-05: en el teléfono no pide el historial ni las fincas, que solo usa el escritorio', async () => {
    conBandeja()
    abrir()

    await screen.findAllByRole('listitem')

    expect(listarTransicionesDeBandeja).not.toHaveBeenCalled()
    expect(listarFincas).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('Pantalla 11-C / CU-09 2b: sin novedades pendientes lo informa, con el nombre del área', async () => {
    conBandeja({ porAtender: [], enAtencion: [], enEspera: [] })
    abrir()

    expect(await screen.findByText('No hay novedades pendientes en Mantenimiento')).toBeVisible()
    expect(screen.getByText('Te avisaremos cuando llegue una nueva.')).toBeVisible()
    expect(screen.getAllByRole('definition').map((cantidad) => cantidad.textContent)).toEqual([
      '0',
      '0',
      '0',
    ])
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('CU-09 2b: si la pestaña está vacía pero hay novedades en otra, no dice que no hay pendientes', async () => {
    conBandeja({ porAtender: [] })
    abrir()

    expect(await screen.findByText('No hay novedades en esta lista.')).toBeVisible()
    expect(screen.queryByText(/No hay novedades pendientes/)).not.toBeInTheDocument()
  })

  it('RNF-06: carga por páginas y trae más cuando se pide', async () => {
    const pagina = (desde, cantidad) =>
      Array.from({ length: cantidad }, (_, i) => ({
        ...POR_ATENDER[0],
        id: `n-${desde + i}`,
        codigo: desde + i,
      }))
    vi.mocked(contarBandeja).mockResolvedValue(0)
    vi.mocked(listarBandeja).mockImplementation(async ({ pagina: numero = 0 }) => ({
      novedades: numero === 0 ? pagina(100, 20) : pagina(200, 5),
      total: 25,
    }))
    abrir()

    expect(await screen.findAllByRole('listitem')).toHaveLength(20)
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('25')

    await userEvent.click(screen.getByRole('button', { name: 'Ver más' }))

    expect(await screen.findAllByRole('listitem')).toHaveLength(25)
    expect(listarBandeja).toHaveBeenLastCalledWith({
      areaId: 'area-m',
      fincaId: null,
      estados: ['asignada', 'aprobada'],
      pagina: 1,
    })
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument()
  })

  it('si no hay conexión lo informa y deja reintentar', async () => {
    conBandeja()
    vi.mocked(listarBandeja).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Pantalla 12 · Bandeja del área en el escritorio (RF-09 / CU-09)', () => {
  beforeEach(() => {
    simularPantalla('escritorio')
  })

  const filas = async () => (await screen.findAllByRole('row')).slice(1)

  it('RF-09: presenta el título del área y lo que contiene la bandeja', async () => {
    conBandeja()
    abrir()
    await filas()

    expect(screen.getByRole('heading', { level: 1, name: 'Bandeja · Mantenimiento' })).toBeVisible()
    expect(
      screen.getByText('Novedades no cerradas de tu área, por prioridad y antigüedad'),
    ).toBeVisible()
  })

  it('RF-09 / CU-09 3: la tabla muestra código, finca, prioridad, descripción, estado y fecha de registro', async () => {
    conBandeja()
    abrir()

    const [primera] = await filas()

    expect(screen.getAllByRole('columnheader').map((columna) => columna.textContent)).toEqual([
      'Novedad',
      'Descripción',
      'Estado',
      'Registrada en finca',
    ])
    expect(within(primera).getByRole('button', { name: 'NOV-0153' })).toBeVisible()
    expect(within(primera).getByText('Finca de prueba 01')).toBeVisible()
    expect(within(primera).getByText('Crítico')).toBeVisible()
    expect(within(primera).getByText(POR_ATENDER[0].descripcion)).toBeVisible()
    expect(within(primera).getByText('Asignada')).toBeVisible()
    expect(
      within(primera).getByText(formatearFechaCorta(POR_ATENDER[0].fecha_registro)),
    ).toBeVisible()
    expect(within(primera).getByText('25 min')).toBeVisible()
  })

  it('RF-09 / CU-09 2: conserva el orden del servidor y dice cuánto lleva abierta cada una', async () => {
    conBandeja()
    abrir()

    const lasFilas = await filas()

    expect(lasFilas.map((fila) => within(fila).getByRole('button').textContent)).toEqual([
      'NOV-0153',
      'NOV-0147',
      'NOV-0152',
    ])
    expect(within(lasFilas[1]).getByText('1 d 3 h')).toBeVisible()
    expect(within(lasFilas[2]).getByText('35 min')).toBeVisible()
  })

  it('RF-09: las pestañas llevan su conteo', async () => {
    conBandeja()
    abrir()
    await filas()

    expect(screen.getAllByRole('tab').map((pestana) => pestana.textContent)).toEqual([
      'Por atender (3)',
      'En atención (1)',
      'En espera (2)',
    ])
    // Los contadores son del teléfono: en el escritorio el conteo va en la pestaña.
    expect(screen.getAllByRole('term').map((nombre) => nombre.textContent)).toEqual([
      'Finca',
      'Área',
    ])
  })

  it('RF-13 y RF-17: aclara el estado de las aprobadas y de las reasignadas', async () => {
    conBandeja()
    abrir()

    const [primera, segunda, tercera] = await filas()

    expect(await within(tercera).findByText('Reasignada desde Sistemas')).toBeVisible()
    expect(within(segunda).getByText('Aprobada por el director')).toBeVisible()
    expect(within(primera).queryByText(/Reasignada|Aprobada por/)).not.toBeInTheDocument()
    expect(listarTransicionesDeBandeja).toHaveBeenCalledExactlyOnceWith(['n-153', 'n-147', 'n-152'])
  })

  it('RF-09: la vista previa muestra la primera novedad y lleva a su detalle', async () => {
    conBandeja()
    abrir()
    const [primera] = await filas()

    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0153' }))
    expect(vista.getByRole('heading', { level: 2, name: 'NOV-0153' })).toBeVisible()
    expect(vista.getByText('Finca de prueba 01')).toBeVisible()
    expect(vista.getByText('Mantenimiento')).toBeVisible()
    expect(vista.getByText(POR_ATENDER[0].descripcion)).toBeVisible()
    expect(within(primera).getByRole('button', { name: 'NOV-0153' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(vista.getByRole('link', { name: 'Ver detalle completo' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Detalle de la novedad' })).toBeVisible()
  })

  it('RF-12 y RF-13: al elegir una aprobada, la vista previa muestra la justificación y la decisión', async () => {
    conBandeja()
    abrir()
    const [, segunda] = await filas()

    await userEvent.click(within(segunda).getByRole('button', { name: 'NOV-0147' }))

    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0147' }))
    // El historial llega después de la lista: se espera a que aparezca.
    expect(await vista.findByText('Justificación del escalamiento')).toBeVisible()
    expect(
      vista.getByText('Se requiere comprar 8 tablones de 3 m; no hay material en bodega.'),
    ).toBeVisible()
    expect(vista.getByText('Decisión del director')).toBeVisible()
    expect(vista.getByText('Aprobado. Comprar con el proveedor habitual.')).toBeVisible()
    expect(vista.getByText('Hernán Darío Úsuga · 22 sep, 8:10 a. m.')).toBeVisible()
    expect(within(segunda).getByRole('button', { name: 'NOV-0147' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('RF-09: una asignada no muestra justificación ni decisión en la vista previa', async () => {
    conBandeja()
    abrir()
    await filas()

    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0153' }))
    expect(vista.queryByText('Justificación del escalamiento')).not.toBeInTheDocument()
    expect(vista.queryByText('Decisión del director')).not.toBeInTheDocument()
  })

  it('RF-09: el filtro ofrece todas las fincas y filtra la lista y los conteos', async () => {
    conBandeja()
    abrir()
    await filas()

    const filtro = screen.getByRole('combobox', { name: 'Filtrar por finca' })
    expect(
      within(filtro)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Todas las fincas', 'Finca de prueba 01', 'Finca de prueba 02'])

    await userEvent.selectOptions(filtro, 'Finca de prueba 02')

    expect(await screen.findByRole('tab', { name: 'Por atender (1)' })).toBeVisible()
    expect((await filas()).map((fila) => within(fila).getByRole('button').textContent)).toEqual([
      'NOV-0147',
    ])
    expect(listarBandeja).toHaveBeenLastCalledWith({
      areaId: 'area-m',
      fincaId: 'finca-2',
      estados: ['asignada', 'aprobada'],
    })
    expect(screen.getByRole('tab', { name: 'En atención (0)' })).toBeVisible()
  })

  it('RF-09: el filtro de finca queda en la dirección y se respeta al abrirla', async () => {
    conBandeja()
    abrir('/bandeja?finca=finca-2')

    expect((await filas()).map((fila) => within(fila).getByRole('button').textContent)).toEqual([
      'NOV-0147',
    ])
    expect(await screen.findByRole('combobox', { name: 'Filtrar por finca' })).toHaveValue(
      'finca-2',
    )
  })

  it('Pantalla 11-C / CU-09 2b: sin novedades pendientes lo informa y no pinta la tabla', async () => {
    conBandeja({ porAtender: [], enAtencion: [], enEspera: [] })
    abrir()

    expect(await screen.findByText('No hay novedades pendientes en Mantenimiento')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('RF-10 / CU-10: desde la vista previa se toma una asignada; avisa y la bandeja se recarga', async () => {
    conBandeja()
    vi.mocked(tomarNovedad).mockResolvedValue({ id: 'n-153', estado: 'en_atencion' })
    abrir()
    await filas()
    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0153' }))

    await userEvent.click(vista.getByRole('button', { name: 'Tomar para atención' }))

    expect(tomarNovedad).toHaveBeenCalledExactlyOnceWith('n-153')
    expect(await screen.findByText('Novedad tomada. Ya está En atención.')).toBeVisible()
    // La lista se pidió otra vez: la novedad cambió de pestaña.
    expect(listarBandeja).toHaveBeenCalledTimes(2)
  })

  it('RF-14 / CU-14 1: la vista previa de una aprobada ofrece registrar la solución, no tomarla', async () => {
    conBandeja()
    abrir()
    const [, segunda] = await filas()

    await userEvent.click(within(segunda).getByRole('button', { name: 'NOV-0147' }))

    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0147' }))
    expect(vista.getByRole('link', { name: 'Registrar solución' })).toHaveAttribute(
      'href',
      '/novedades/n-147/solucion',
    )
    expect(vista.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-14: la vista previa de una novedad en atención también lleva a registrar la solución', async () => {
    conBandeja()
    abrir('/bandeja?pestana=en_atencion')
    await filas()

    const vista = within(screen.getByRole('complementary', { name: 'Vista previa de NOV-0150' }))
    expect(vista.getByRole('link', { name: 'Registrar solución' })).toHaveAttribute(
      'href',
      '/novedades/n-150/solucion',
    )
  })

  it('RF-25 (14-C): si se pierde la conexión al tomarla, lo dice y deja reintentar', async () => {
    conBandeja()
    vi.mocked(tomarNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()
    await filas()

    await userEvent.click(screen.getByRole('button', { name: 'Tomar para atención' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue Asignada.',
    )
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible()
    expect(listarBandeja).toHaveBeenCalledOnce()
  })

  it('RF-17 / CU-17: al llegar del detalle después de reasignar, muestra el aviso y lo quita de la navegación', async () => {
    conBandeja()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      abrir({
        pathname: '/bandeja',
        search: '?pestana=en_atencion',
        state: { aviso: 'Novedad reasignada a Sistemas.' },
      })

      const aviso = await screen.findByText('Novedad reasignada a Sistemas.')
      expect(aviso.closest('[data-aviso-temporal]')).toHaveAttribute('role', 'status')
      // Sigue en la pestaña en la que estaba.
      const pestana = () => screen.getByRole('tab', { name: /En atención/ })
      expect(pestana()).toHaveAttribute('aria-selected', 'true')

      // Cumplido su tiempo se quita, y con él el estado de la navegación.
      await vi.advanceTimersByTimeAsync(6100)
      await vi.waitFor(() =>
        expect(screen.queryByText('Novedad reasignada a Sistemas.')).not.toBeInTheDocument(),
      )
      expect(pestana()).toHaveAttribute('aria-selected', 'true')
    } finally {
      vi.useRealTimers()
    }
  })

  it('RNF-11: un aviso que no es un texto no se pinta', async () => {
    conBandeja()
    abrir({ pathname: '/bandeja', state: { aviso: { mensaje: 'x' } } })
    await filas()

    expect(document.querySelector('[data-aviso-temporal]')).toBeNull()
  })

  it('si el historial no carga, la tabla se muestra igual, sin las notas de reasignación', async () => {
    conBandeja()
    vi.mocked(listarTransicionesDeBandeja).mockRejectedValue(new TypeError('Failed to fetch'))
    abrir()

    const [, segunda, tercera] = await filas()

    expect(within(segunda).getByText('Aprobada por el director')).toBeVisible()
    expect(within(tercera).queryByText(/Reasignada/)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
