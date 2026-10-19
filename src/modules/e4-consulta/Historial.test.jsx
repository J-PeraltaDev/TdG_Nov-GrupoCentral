import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listarHistorial,
  listarOpcionesDelHistorial,
  listarParaExportar,
} from '../../core/supabase/repositorios/historial.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Historial from './Historial.jsx'

vi.mock('../../core/supabase/repositorios/historial.js', () => ({
  listarHistorial: vi.fn(),
  listarOpcionesDelHistorial: vi.fn(),
  listarParaExportar: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/novedades.js', () => ({ NOVEDADES_POR_PAGINA: 20 }))

const FINCA = '0a000000-0000-4000-a000-000000000001'
const AREA = '0b000000-0000-4000-a000-000000000002'
const TIPO = '0c000000-0000-4000-a000-000000000003'

const OPCIONES = {
  fincas: [
    { id: FINCA, nombre: 'La Mónica', activo: true },
    { id: '0a000000-0000-4000-a000-000000000009', nombre: 'Juanca', activo: false },
  ],
  areas: [{ id: AREA, nombre: 'Sistemas', activo: true }],
  tipos: [{ id: TIPO, nombre: 'Biométrico', activo: true }],
}

const NOVEDADES = [
  {
    id: 'n-149',
    codigo: 149,
    prioridad: 'alto',
    estado: 'resuelta',
    fecha_registro: '2026-09-24T13:15:00Z',
    resuelta_en: '2026-09-24T17:15:00Z',
    finca: 'La Mónica',
    area: 'Sistemas',
    tipo_falla: 'Biométrico',
    reportante: 'Marisol Rentería',
  },
  {
    id: 'n-131',
    codigo: 131,
    prioridad: 'critico',
    estado: 'asignada',
    fecha_registro: '2025-12-30T13:15:00Z',
    resuelta_en: null,
    finca: 'Tumaradó',
    area: 'Sistemas',
    tipo_falla: null,
    reportante: 'Yuli Andrea Mena',
  },
]

const SIN_FILTROS = {
  finca: null,
  area: null,
  estados: [],
  desde: null,
  hasta: null,
  tipo: null,
}

/** El detalle, que muestra a qué ruta vuelve. */
function Detalle() {
  const { pathname, state } = useLocation()
  return (
    <p>
      Detalle {pathname} desde {state?.origen}
    </p>
  )
}

function abrir({ ruta = '/historial', rol = 'administrador' } = {}) {
  return pintarConSesion(
    <Routes>
      <Route path="/historial" element={<Historial />} />
      <Route path="/novedades/:id" element={<Detalle />} />
    </Routes>,
    { ruta, rol },
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-24T19:00:00Z') })
  simularPantalla('escritorio')
  vi.mocked(listarHistorial).mockReset().mockResolvedValue({ novedades: NOVEDADES, total: 9 })
  vi.mocked(listarOpcionesDelHistorial).mockReset().mockResolvedValue(OPCIONES)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Pantalla 21 · Historial de novedades (RF-19, CU-19)', () => {
  it('RF-19 / CU-19 4: la tabla con sus columnas, de la más reciente a la más antigua', async () => {
    abrir()

    const tabla = await screen.findByRole('table', { name: 'Historial de novedades' })
    expect(listarHistorial).toHaveBeenCalledExactlyOnceWith(SIN_FILTROS, 0)
    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .map((celda) => celda.textContent),
    ).toEqual([
      'Código',
      'Registrada en finca',
      'Finca',
      'Área',
      'Prioridad',
      'Estado',
      'Tipo de falla',
      'Tiempo hasta resolver',
      'Reportada por',
    ])
    const [, resuelta, abierta] = within(tabla).getAllByRole('row')
    expect(
      within(resuelta)
        .getAllByRole('cell')
        .map((celda) => celda.textContent),
    ).toEqual([
      'NOV-0149',
      '24 sep, 8:15 a. m.',
      'La Mónica',
      'Sistemas',
      'Alto',
      'Resuelta',
      'Biométrico',
      '4 h',
      'Marisol Rentería',
    ])
    // De otro año, con el año; sin resolver, «—» y para el lector «Sin resolver».
    expect(within(abierta).getByText('30 dic 2025, 8:15 a. m.')).toBeVisible()
    expect(within(abierta).getByText('Sin resolver')).toBeInTheDocument()
    expect(screen.getByText('9 novedades')).toBeVisible()
    expect(screen.getByText('de la más reciente a la más antigua')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Historial de novedades' })).toBeVisible()
  })

  it('RF-19 / CU-19 5: tocar una fila abre el detalle, que vuelve al historial con sus filtros', async () => {
    abrir({ ruta: '/historial?estado=resuelta' })

    await userEvent.click(await screen.findByText('Marisol Rentería'))

    expect(
      await screen.findByText('Detalle /novedades/n-149 desde /historial?estado=resuelta'),
    ).toBeVisible()
  })

  it('RF-19 / CU-19 2: los filtros de la dirección llegan a la consulta y se ven como chips', async () => {
    abrir({
      ruta: `/historial?estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24&tipo=${TIPO}`,
    })

    expect(await screen.findByText('Tipo de falla: Biométrico')).toBeVisible()
    expect(listarHistorial).toHaveBeenCalledWith(
      {
        ...SIN_FILTROS,
        estados: ['resuelta', 'cerrada'],
        desde: '2026-04-01',
        hasta: '2026-09-24',
        tipo: TIPO,
      },
      0,
    )
    const chips = screen.getByRole('list', { name: 'Filtros aplicados' })
    expect(
      within(chips)
        .getAllByRole('listitem')
        .map((chip) => chip.textContent),
    ).toEqual([
      'Estado: Resuelta, Cerrada',
      'Desde 01 abr hasta 24 sep 2026',
      'Tipo de falla: Biométrico',
    ])
    expect(screen.getByRole('button', { name: 'Estado Resuelta, Cerrada' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Rango de fechas 01 abr 2026 – 24 sep 2026' }),
    ).toBeVisible()
  })

  it('RF-19 / CU-19 3: lo elegido se aplica con «Aplicar filtros», no antes', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.selectOptions(screen.getByLabelText('Finca'), 'La Mónica')
    await userEvent.click(screen.getByRole('button', { name: 'Estado Todos' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cerrada' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Resuelta' }))
    expect(listarHistorial).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() =>
      expect(listarHistorial).toHaveBeenLastCalledWith(
        { ...SIN_FILTROS, finca: FINCA, estados: ['resuelta', 'cerrada'] },
        0,
      ),
    )
    expect(await screen.findByText('Finca: La Mónica')).toBeVisible()
  })

  it('RF-19 (decisión 9): las fincas inactivas se ofrecen al final, marcadas', async () => {
    abrir()

    const finca = await screen.findByLabelText('Finca')
    await screen.findByRole('option', { name: 'Juanca (inactiva)' })
    expect(
      within(finca)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Todas', 'La Mónica', 'Juanca (inactiva)'])
  })

  it('RF-19 / CU-19 3a (21-B): con el rango invertido, «Aplicar filtros» no está disponible', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Rango de fechas Todas las fechas' }))
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-30' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-01' } })

    const error = screen.getByText('La fecha inicial debe ser anterior a la final')
    expect(error).toBeVisible()
    // Aparece sin enviar nada: el lector de pantalla lo oye al aparecer.
    expect(error.closest('[aria-live="polite"]')).not.toBeNull()
    const aplicar = screen.getByRole('button', { name: 'Aplicar filtros' })
    expect(aplicar).toHaveAttribute('aria-disabled', 'true')
    expect(aplicar).toHaveAccessibleDescription('La fecha inicial debe ser anterior a la final')
    await userEvent.click(aplicar)
    expect(listarHistorial).toHaveBeenCalledTimes(1)
  })

  it('RF-19: quitar un chip lo aplica de inmediato; «Limpiar» quita todos', async () => {
    abrir({ ruta: `/historial?estado=resuelta&tipo=${TIPO}` })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Quitar el filtro Estado: Resuelta' }),
    )
    await waitFor(() =>
      expect(listarHistorial).toHaveBeenLastCalledWith({ ...SIN_FILTROS, tipo: TIPO }, 0),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    await waitFor(() => expect(listarHistorial).toHaveBeenLastCalledWith(SIN_FILTROS, 0))
    expect(screen.queryByRole('list', { name: 'Filtros aplicados' })).toBeNull()
  })

  it('RF-19 / CU-19 4a (21-C): sin resultados, lo dice y ofrece limpiar los filtros', async () => {
    vi.mocked(listarHistorial).mockResolvedValueOnce({ novedades: [], total: 0 })
    abrir({ ruta: '/historial?desde=2001-01-01&hasta=2001-12-31' })

    expect(await screen.findByText('Ninguna novedad cumple estos filtros')).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(listarHistorial).toHaveBeenLastCalledWith(SIN_FILTROS, 0))
  })

  it('RF-19 (decisión 12): 20 por página, con los números', async () => {
    vi.mocked(listarHistorial).mockResolvedValue({ novedades: NOVEDADES, total: 45 })
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Página 2' }))

    await waitFor(() => expect(listarHistorial).toHaveBeenLastCalledWith(SIN_FILTROS, 1))
    expect(await screen.findByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('RF-19: una página que ya no existe lleva a la primera', async () => {
    vi.mocked(listarHistorial).mockResolvedValueOnce({ novedades: [], total: 0 })
    abrir({ ruta: '/historial?pagina=9' })

    await waitFor(() => expect(listarHistorial).toHaveBeenLastCalledWith(SIN_FILTROS, 0))
    expect(await screen.findByRole('table')).toBeVisible()
  })

  it('RF-19: si falla, lo dice y deja reintentar', async () => {
    vi.mocked(listarHistorial).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('table')).toBeVisible()
  })

  it('RF-19: el error de unos filtros no se queda mientras cargan otros', async () => {
    vi.mocked(listarHistorial)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockReturnValueOnce(new Promise(() => {}))
    abrir({ ruta: '/historial?estado=resuelta' })
    await screen.findByRole('button', { name: 'Reintentar' })

    await userEvent.click(screen.getByRole('button', { name: 'Quitar el filtro Estado: Resuelta' }))

    expect(await screen.findByText('Cargando…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
  })

  it('RF-19 (decisión 11): la lista de estados se cierra con un clic fuera o con Escape', async () => {
    abrir()
    await screen.findByRole('table')
    const estado = screen.getByRole('button', { name: 'Estado Todos' })

    await userEvent.click(estado)
    expect(estado).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('heading', { level: 1 }))
    expect(estado).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(estado)
    await userEvent.keyboard('{Escape}')
    expect(estado).toHaveAttribute('aria-expanded', 'false')
    expect(estado).toHaveFocus()
  })

  it('RF-19 (decisión 13): sin conexión no pide nada y deja los filtros deshabilitados', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    abrir({ ruta: '/historial?estado=resuelta' })

    expect(
      await screen.findByText('El historial necesita conexión. Ábrelo cuando tengas internet.'),
    ).toBeVisible()
    expect(listarHistorial).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Finca')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeDisabled()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('RF-19 / RF-20 (decisión 14): el aprobador no filtra por área y ve la nota del CSV', async () => {
    abrir({ rol: 'aprobador', ruta: `/historial?area=${AREA}` })

    await screen.findByRole('table')
    expect(listarHistorial).toHaveBeenCalledWith(SIN_FILTROS, 0)
    expect(screen.queryByLabelText('Área')).toBeNull()
    expect(
      screen.getByText(
        'La exportación a CSV solo está disponible para el administrador y el director de agricultura.',
      ),
    ).toBeVisible()
  })

  it('RF-20: el administrador no ve la nota del CSV', async () => {
    abrir()

    await screen.findByRole('table')
    expect(screen.queryByText(/La exportación a CSV solo está disponible/)).toBeNull()
  })
})

describe('Exportar CSV (RF-20 / CU-20)', () => {
  /** Simula la descarga: devuelve el archivo y el nombre con que se descargó. */
  function simularDescarga() {
    const descarga = { archivo: null, nombre: null }
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((archivo) => {
        descarga.archivo = archivo
        return 'blob:historial'
      }),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      descarga.nombre = this.download
    })
    return descarga
  }

  it.each(['administrador', 'director'])(
    'RF-20 / CU-20 1: el %s ve «Exportar CSV» junto al resultado',
    async (rol) => {
      abrir({ rol })

      expect(await screen.findByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
    },
  )

  it('RF-20 / CU-20 1a: el aprobador no ve «Exportar CSV»', async () => {
    abrir({ rol: 'aprobador' })

    await screen.findByRole('table', { name: 'Historial de novedades' })
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).toBeNull()
  })

  it('RF-20: sin resultados no hay nada que exportar', async () => {
    vi.mocked(listarHistorial).mockResolvedValue({ novedades: [], total: 0 })
    abrir()

    await screen.findByText('Todavía no hay novedades.')
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).toBeNull()
  })

  it('RF-20 / CU-20 2 y 3: descarga todo el resultado de los filtros puestos, con su nombre', async () => {
    const descarga = simularDescarga()
    vi.mocked(listarParaExportar).mockResolvedValue([
      {
        codigo: 149,
        fecha_registro: '2026-09-24T13:15:00Z',
        finca: 'La Mónica',
        razon_social: 'Agropecuaria La Mónica S.A.S.',
        area: 'Sistemas',
        prioridad: 'alto',
        estado: 'resuelta',
        tipo_falla: 'Biométrico',
        fecha_ejecucion: '2026-09-24',
        reportante: 'Marisol Rentería',
        resuelta_en: '2026-09-24T17:15:00Z',
      },
    ])
    abrir({ ruta: `/historial?estado=resuelta,cerrada&tipo=${TIPO}&pagina=2` })

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    // Los filtros, no la página.
    expect(listarParaExportar).toHaveBeenCalledExactlyOnceWith({
      ...SIN_FILTROS,
      estados: ['resuelta', 'cerrada'],
      tipo: TIPO,
    })
    await waitFor(() => expect(descarga.nombre).toBe('historial-novedades-2026-09-24.csv'))
    const texto = await descarga.archivo.text()
    expect(descarga.archivo.type).toBe('text/csv;charset=utf-8')
    expect(texto.split('\r\n')[1]).toBe(
      'NOV-0149;2026-09-24 08:15;La Mónica;Agropecuaria La Mónica S.A.S.;Sistemas;Alto;Resuelta;' +
        'Biométrico;2026-09-24;Marisol Rentería;4,0',
    )
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
  })

  it('RF-20: mientras exporta, el botón conserva el foco y otro clic no pide de nuevo', async () => {
    simularDescarga()
    let terminar
    vi.mocked(listarParaExportar).mockReturnValue(new Promise((listo) => (terminar = listo)))
    abrir()

    const boton = await screen.findByRole('button', { name: 'Exportar CSV' })
    await userEvent.click(boton)
    const ocupado = screen.getByRole('button', { name: 'Exportando…' })
    expect(ocupado).toHaveFocus()
    expect(ocupado).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(ocupado)
    expect(listarParaExportar).toHaveBeenCalledTimes(1)

    terminar([])
    expect(await screen.findByRole('button', { name: 'Exportar CSV' })).toHaveFocus()
  })

  it('RF-20: si algo falla a mitad, no descarga nada y lo dice', async () => {
    const descarga = simularDescarga()
    vi.mocked(listarParaExportar).mockRejectedValue(new TypeError('Failed to fetch'))
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se descargó el archivo. No hay conexión. Revisa tu internet e intenta de nuevo.',
    )
    expect(descarga.archivo).toBeNull()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
  })

  it('RF-20: en el teléfono, «Exportar CSV» va al final de la lista', async () => {
    simularPantalla('telefono')
    abrir({ rol: 'director' })

    const boton = await screen.findByRole('button', { name: 'Exportar CSV' })
    const ultimaTarjeta = screen.getAllByRole('link').at(-1)
    expect(
      ultimaTarjeta.compareDocumentPosition(boton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

describe('Pantalla 21-D · Historial en el teléfono (RF-19)', () => {
  beforeEach(() => {
    simularPantalla('telefono')
  })

  it('RF-19: tarjetas con el tipo de falla, quién la reportó, la finca y el día', async () => {
    abrir({ rol: 'aprobador' })

    const tarjetas = within(
      await screen.findByRole('list', { name: 'Historial de novedades' }),
    ).getAllByRole('listitem')
    const primera = within(tarjetas[0])
    expect(primera.getByRole('link', { name: 'NOV-0149' })).toHaveAttribute(
      'href',
      '/novedades/n-149',
    )
    expect(
      primera.getByText('Tipo de falla: Biométrico · Reportada por Marisol Rentería'),
    ).toBeVisible()
    expect(primera.getByText('La Mónica')).toBeVisible()
    expect(primera.getByText('24 sep')).toBeVisible()
    // Sin tipo de falla todavía, solo quién la reportó.
    expect(within(tarjetas[1]).getByText('Reportada por Yuli Andrea Mena')).toBeVisible()
    expect(within(tarjetas[1]).getByText('30 dic 2025')).toBeVisible()
    expect(screen.getByText('9 novedades')).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('RF-19: «Filtros (3)» abre la hoja con los campos; los chips son cortos', async () => {
    abrir({
      rol: 'aprobador',
      ruta: `/historial?estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24&tipo=${TIPO}`,
    })

    expect(await screen.findByText('01 abr – 24 sep')).toBeVisible()
    expect(screen.getByText('Resuelta, Cerrada')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Filtros (3)' }))

    const hoja = screen.getByRole('dialog', { name: 'Filtros' })
    expect(within(hoja).getByLabelText('Finca')).toBeVisible()
    expect(within(hoja).queryByLabelText('Área')).toBeNull()
    await userEvent.click(within(hoja).getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
