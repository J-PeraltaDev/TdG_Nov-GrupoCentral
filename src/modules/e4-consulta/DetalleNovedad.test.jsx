import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listarLineaDeTiempo,
  obtenerNovedad,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import DetalleNovedad from './DetalleNovedad.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  obtenerNovedad: vi.fn(),
  listarLineaDeTiempo: vi.fn(),
  tomarNovedad: vi.fn(),
}))

const ID = '00000000-0000-4000-e000-000000000153'
// 8:05 a. m. del 24 de septiembre en Colombia.
const AHORA = new Date('2026-09-24T13:05:00Z')

const REPORTANTE = { nombre: 'Luz Marina Córdoba', rol_id: 1, area: null }
const APROBADOR = { nombre: 'Carlos Mario Restrepo', rol_id: 2, area: 'Mantenimiento' }

const ASIGNADA = {
  id: ID,
  codigo: 153,
  descripcion: 'El torniquete de la entrada principal marca luz verde pero no gira.',
  prioridad: 'critico',
  estado: 'asignada',
  solucion: null,
  fecha_ejecucion: null,
  fecha_registro: '2026-09-24T12:40:00Z',
  fecha_sincronizacion: '2026-09-24T12:41:00Z',
  finca_id: 'finca-1',
  finca: 'Finca de prueba 01',
  razon_social: 'Razón social de prueba A',
  area_id: 'area-m',
  area: 'Mantenimiento',
  tipo_falla: null,
  reportante: 'Luz Marina Córdoba',
}

const paso = (id, anterior, nuevo, cambios = {}) => ({
  id,
  estado_anterior: anterior,
  estado_nuevo: nuevo,
  observacion: null,
  fecha_hora: '2026-09-24T12:40:00Z',
  area_anterior: null,
  area_nueva: null,
  usuario: REPORTANTE,
  ...cambios,
})

const REGISTRO = [
  paso(2, 'registrada', 'asignada', {
    fecha_hora: '2026-09-24T12:41:00Z',
    area_nueva: { nombre: 'Mantenimiento' },
  }),
  paso(1, null, 'registrada'),
]
const TOMADA = paso(3, 'asignada', 'en_atencion', {
  usuario: APROBADOR,
  fecha_hora: '2026-09-24T12:55:00Z',
})

const RESUELTA = {
  ...ASIGNADA,
  estado: 'resuelta',
  fecha_registro: '2026-09-21T11:48:00Z',
  fecha_sincronizacion: '2026-09-21T14:15:00Z',
  solucion: 'Se cambió el motor del torniquete.',
  fecha_ejecucion: '2026-09-23',
  tipo_falla: 'Torniquetes',
}
const HISTORIA_RESUELTA = [
  paso(4, 'en_atencion', 'resuelta', { usuario: APROBADOR, fecha_hora: '2026-09-23T21:45:00Z' }),
  { ...TOMADA, fecha_hora: '2026-09-21T15:02:00Z' },
  ...REGISTRO.map((transicion) => ({ ...transicion, fecha_hora: '2026-09-21T14:15:00Z' })),
]

function conNovedad(novedad = ASIGNADA, transiciones = REGISTRO) {
  vi.mocked(obtenerNovedad).mockResolvedValue(novedad)
  vi.mocked(listarLineaDeTiempo).mockResolvedValue(transiciones)
}

function abrir({ rol = 'aprobador', id = ID, origen } = {}) {
  return pintarConSesion(
    <Routes>
      <Route
        path="/novedades/:id"
        element={
          // El contenido de la página, como lo pone el marco.
          <main tabIndex={-1}>
            <DetalleNovedad />
          </main>
        }
      />
      <Route path="/novedades" element={<h1>Mis novedades</h1>} />
      <Route path="/bandeja" element={<h1>Bandeja del área</h1>} />
      <Route path="/escaladas" element={<h1>Novedades escaladas</h1>} />
    </Routes>,
    {
      ruta: origen ? { pathname: `/novedades/${id}`, state: { origen } } : `/novedades/${id}`,
      rol,
    },
  )
}

const dato = (nombre) => screen.getByText(nombre, { selector: 'dt' }).nextElementSibling

beforeEach(() => {
  // Solo se fija la fecha: los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'], now: AHORA })
  vi.mocked(obtenerNovedad).mockReset()
  vi.mocked(listarLineaDeTiempo).mockReset()
  vi.mocked(tomarNovedad).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Pantallas 13 y 14 · Detalle de la novedad en el teléfono (RF-18 / CU-18)', () => {
  it('RF-18 / CU-18 3: muestra el código, el estado, la prioridad, la finca, el área y la descripción', async () => {
    conNovedad()
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })).toBeVisible()
    const encabezado = within(screen.getByRole('group', { name: 'Datos de la novedad' }))
    expect(encabezado.getByText('Asignada')).toBeVisible()
    expect(encabezado.getByText('Crítico')).toBeVisible()
    expect(encabezado.getByText('Finca de prueba 01')).toBeVisible()
    expect(encabezado.getByText('Mantenimiento')).toBeVisible()
    expect(screen.getByText(ASIGNADA.descripcion)).toBeVisible()
    expect(screen.getByText('Registrada hace 25 min')).toBeVisible()
  })

  it('RF-18: la etiqueta de la finca antepone «Finca» al nombre, como Figma, sin repetirlo', async () => {
    conNovedad({ ...ASIGNADA, finca: 'El Ejemplo' })
    abrir()
    await screen.findByRole('heading', { level: 1 })

    const encabezado = within(screen.getByRole('group', { name: 'Datos de la novedad' }))
    expect(encabezado.getByText('Finca El Ejemplo')).toBeVisible()
  })

  it('RNF-09: distingue quién la reportó, cuándo se registró en la finca y cuándo se sincronizó', async () => {
    conNovedad()
    abrir()
    await screen.findByRole('heading', { level: 1 })

    expect(dato('Reportada por')).toHaveTextContent(
      'Luz Marina Córdoba (Reportante · Finca de prueba 01)',
    )
    expect(dato('Registrada en finca')).toHaveTextContent('24 sep 2026, 7:40 a. m. (Sem 39)')
    expect(dato('Sincronizada')).toHaveTextContent('24 sep 2026, 7:41 a. m.')
  })

  it('RF-18 / CU-18 4: muestra la línea de tiempo con cada transición', async () => {
    conNovedad()
    abrir()

    const linea = within(await screen.findByRole('region', { name: 'Línea de tiempo' }))
    const pasos = linea.getAllByRole('listitem')
    expect(pasos).toHaveLength(2)
    expect(within(pasos[0]).getByText('Sistema')).toBeVisible()
    expect(within(pasos[0]).getByText('24 sep, 7:41 a. m.').parentElement).toHaveTextContent(
      '24 sep, 7:41 a. m. · Área: Mantenimiento',
    )
    expect(within(pasos[1]).getByText('Luz Marina Córdoba · Reportante')).toBeVisible()
  })

  it('RNF-06: pide la novedad y su historial una sola vez, sin esperar una a la otra', async () => {
    conNovedad()
    abrir()
    await screen.findByRole('heading', { level: 1 })

    expect(obtenerNovedad).toHaveBeenCalledExactlyOnceWith(ID)
    expect(listarLineaDeTiempo).toHaveBeenCalledExactlyOnceWith(ID)
  })

  it('RF-10: una novedad en atención dice quién la tomó y a qué hora', async () => {
    conNovedad({ ...ASIGNADA, estado: 'en_atencion' }, [TOMADA, ...REGISTRO])
    abrir()

    expect(
      await screen.findByText(
        'Registrada hace 25 min · Tomada por Carlos Mario Restrepo, 7:55 a. m.',
      ),
    ).toBeVisible()
  })

  it('RF-10: si la tomaron otro día, dice también la fecha', async () => {
    conNovedad({ ...ASIGNADA, estado: 'en_atencion', fecha_registro: '2026-09-22T12:40:00Z' }, [
      { ...TOMADA, fecha_hora: '2026-09-22T15:20:00Z' },
      ...REGISTRO,
    ])
    abrir()

    expect(
      await screen.findByText(
        'Registrada hace 2 d · Tomada por Carlos Mario Restrepo, 22 sep, 10:20 a. m.',
      ),
    ).toBeVisible()
  })

  it('RF-18 / CU-18 3: una resuelta muestra la solución, el tipo de falla, la fecha de ejecución y quién la registró', async () => {
    conNovedad(RESUELTA, HISTORIA_RESUELTA)
    abrir({ rol: 'reportante', origen: '/novedades' })

    const solucion = within(
      await screen.findByRole('region', { name: 'Solución registrada por Mantenimiento' }),
    )
    expect(solucion.getByText('Se cambió el motor del torniquete.')).toBeVisible()
    expect(dato('Tipo de falla')).toHaveTextContent('Torniquetes')
    expect(dato('Fecha de ejecución')).toHaveTextContent('23 sep 2026')
    expect(dato('Registró')).toHaveTextContent('Carlos Mario Restrepo')
    // Ya no está en manos del área: no dice hace cuánto se registró ni quién la tomó.
    expect(screen.queryByText(/Tomada por/)).not.toBeInTheDocument()
  })

  it('RF-18: una novedad sin resolver no muestra el bloque de la solución', async () => {
    conNovedad()
    abrir()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.queryByText(/Solución registrada/)).not.toBeInTheDocument()
    expect(screen.queryByText('Tipo de falla')).not.toBeInTheDocument()
  })

  it('RF-08 y RF-32 llegan después: no hay evidencias, ni corrección del tipo, ni acciones todavía', async () => {
    conNovedad(RESUELTA, HISTORIA_RESUELTA)
    abrir({ rol: 'administrador' })
    await screen.findByRole('heading', { level: 1 })

    expect(screen.queryByText('Evidencias')).not.toBeInTheDocument()
    expect(screen.queryByText('Corregir tipo')).not.toBeInTheDocument()
    expect(screen.queryByText('Registrada sin conexión')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it.each([
    ['aprobador', undefined, 'Volver a la bandeja', 'Bandeja del área'],
    ['reportante', undefined, 'Volver a mis novedades', 'Mis novedades'],
    ['director', undefined, 'Volver a las escaladas', 'Novedades escaladas'],
    ['aprobador', '/bandeja?pestana=en_espera', 'Volver a la bandeja', 'Bandeja del área'],
  ])(
    'RF-18: el %s vuelve a la pantalla de donde vino (origen %s)',
    async (rol, origen, texto, titulo) => {
      conNovedad()
      abrir({ rol, origen })
      await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })

      await userEvent.click(screen.getByRole('link', { name: texto }))

      expect(screen.getByRole('heading', { level: 1, name: titulo })).toBeVisible()
    },
  )

  it('RF-23: el indicador de conexión sigue a la vista', async () => {
    conNovedad()
    abrir()
    await screen.findByRole('heading', { level: 1 })

    expect(screen.getByRole('status')).toHaveTextContent('En línea')
  })

  it('si no hay conexión lo informa y deja reintentar', async () => {
    vi.mocked(obtenerNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.mocked(listarLineaDeTiempo).mockResolvedValue(REGISTRO)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión.')
    expect(screen.queryByText('No puedes ver esta novedad')).not.toBeInTheDocument()

    vi.mocked(obtenerNovedad).mockResolvedValue(ASIGNADA)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Acciones en el detalle (RF-18 / CU-18 5 y RF-10 / CU-10)', () => {
  it('RF-18 / CU-18 5: el aprobador del área ve «Tomar para atención» en una asignada', async () => {
    conNovedad()
    abrir({ rol: 'aprobador' })

    expect(await screen.findByRole('button', { name: 'Tomar para atención' })).toBeEnabled()
  })

  it.each(['reportante', 'director', 'administrador'])(
    'RF-18 / CU-18 5: el %s consulta una asignada sin acciones de atención',
    async (rol) => {
      conNovedad()
      abrir({ rol })
      await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    },
  )

  it('RNF-11: el aprobador no ve acciones sobre una novedad que no es de su área', async () => {
    // No debería llegarle (la base no se la entrega), pero el mapa tampoco le daría acciones.
    conNovedad({ ...ASIGNADA, area_id: 'area-s', area: 'Sistemas' })
    abrir({ rol: 'aprobador' })
    await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('RF-10 / CU-10: al tomarla, el detalle se recarga sin dejar de mostrarse y queda en atención', async () => {
    conNovedad()
    vi.mocked(tomarNovedad).mockImplementation(async () => {
      // Lo que el servidor entrega después de la transición.
      conNovedad({ ...ASIGNADA, estado: 'en_atencion' }, [TOMADA, ...REGISTRO])
      return { id: ID, estado: 'en_atencion' }
    })
    abrir({ rol: 'aprobador' })

    await userEvent.click(await screen.findByRole('button', { name: 'Tomar para atención' }))

    expect(tomarNovedad).toHaveBeenCalledExactlyOnceWith(ID)
    expect(await screen.findByText('Novedad tomada. Ya está En atención.')).toBeVisible()
    // Mientras llega lo nuevo no se vuelve a «Cargando…»: el aviso y el contenido siguen ahí.
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
    expect(
      await screen.findByText(
        'Registrada hace 25 min · Tomada por Carlos Mario Restrepo, 7:55 a. m.',
      ),
    ).toBeVisible()
    expect(obtenerNovedad).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: 'Tomar para atención' })).not.toBeInTheDocument()
    // El botón que tenía el foco ya no está: el foco pasa al contenido, no se pierde.
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('RF-10: en el escritorio la acción va bajo el encabezado', async () => {
    simularPantalla('escritorio')
    conNovedad()
    abrir({ rol: 'aprobador' })

    expect(await screen.findByRole('button', { name: 'Tomar para atención' })).toBeEnabled()
    expect(document.querySelector('[data-barra-de-acciones]')).toBeNull()
  })
})

describe('Pantalla 22-B · Sin permiso sobre la novedad (RF-18 / CU-18 2a)', () => {
  it.each([
    [
      'reportante',
      'Solo puedes consultar las novedades de tu finca.',
      'Volver a mis novedades',
      'Mis novedades',
    ],
    [
      'aprobador',
      'Solo puedes consultar las novedades de tu área.',
      'Volver a la bandeja',
      'Bandeja del área',
    ],
  ])(
    'RF-18 / CU-18 2a: al %s le niega una novedad fuera de su alcance y lo devuelve a su inicio',
    async (rol, explicacion, boton, titulo) => {
      // Fuera del alcance, la base de datos responde sin filas (RNF-11).
      conNovedad(null, [])
      abrir({ rol })

      expect(
        await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
      ).toBeVisible()
      expect(screen.getByText(explicacion)).toBeVisible()
      expect(screen.queryByText(/NOV-/)).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('link', { name: boton }))

      expect(screen.getByRole('heading', { level: 1, name: titulo })).toBeVisible()
    },
  )

  it('RF-18: al director, que ve todas, le dice que la novedad no existe', async () => {
    conNovedad(null, [])
    abrir({ rol: 'director' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
    ).toBeVisible()
    expect(screen.getByText('Esta novedad no existe o ya no está disponible.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/escaladas',
    )
  })

  it.each(['no-es-un-uuid', '153', '00000000-0000-4000-e000-00000000015Z'])(
    'RF-18 / CU-18 2a: con un identificador que no es un uuid («%s») no consulta el servidor',
    async (id) => {
      abrir({ id })

      expect(
        await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
      ).toBeVisible()
      expect(obtenerNovedad).not.toHaveBeenCalled()
      expect(listarLineaDeTiempo).not.toHaveBeenCalled()
    },
  )
})

describe('Pantalla 22 · Detalle completo en el escritorio (RF-18 / CU-18)', () => {
  beforeEach(() => {
    simularPantalla('escritorio')
  })

  it('RF-18 / CU-18 3: el encabezado reúne el código, el estado, la prioridad, el área, la finca y la razón social', async () => {
    conNovedad()
    abrir()

    expect(await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })).toBeVisible()
    const encabezado = within(screen.getByRole('group', { name: 'Datos de la novedad' }))
    expect(encabezado.getByText('Asignada')).toBeVisible()
    expect(encabezado.getByText('Crítico')).toBeVisible()
    expect(encabezado.getByText('Mantenimiento')).toBeVisible()
    expect(encabezado.getByText('Finca de prueba 01')).toBeVisible()
    expect(screen.getByText('Razón social de prueba A')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a la bandeja' })).toHaveAttribute(
      'href',
      '/bandeja',
    )
  })

  it('RNF-09: los datos separan la fecha de registro en la finca, con su semana, de la de sincronización', async () => {
    conNovedad()
    abrir()
    await screen.findByRole('heading', { level: 1 })

    expect(dato('Reportada por')).toHaveTextContent('Luz Marina Córdoba')
    expect(dato('Registrada en finca')).toHaveTextContent('24 sep 2026, 7:40 a. m. (Sem 39)')
    expect(dato('Sincronizada')).toHaveTextContent('24 sep 2026, 7:41 a. m.')
    expect(screen.queryByText('Tiempo hasta resolver')).not.toBeInTheDocument()
  })

  it('RF-18 / CU-18 3: una resuelta agrega el tiempo hasta resolver, el tipo de falla, la fecha de ejecución y la solución', async () => {
    conNovedad(RESUELTA, HISTORIA_RESUELTA)
    abrir()
    await screen.findByRole('heading', { level: 1 })

    // Del 21 sep, 6:48 a. m., al 23 sep, 4:45 p. m.
    expect(dato('Tiempo hasta resolver')).toHaveTextContent('2 d 9 h')
    expect(dato('Tipo de falla')).toHaveTextContent('Torniquetes')
    expect(dato('Fecha de ejecución')).toHaveTextContent('23 sep 2026')
    expect(
      within(screen.getByRole('region', { name: 'Solución aplicada' })).getByText(
        'Se cambió el motor del torniquete.',
      ),
    ).toBeVisible()
  })

  it('RF-18 / CU-18 4 y RNF-12: la línea de tiempo va completa y aclara que no se puede cambiar', async () => {
    conNovedad(RESUELTA, HISTORIA_RESUELTA)
    abrir()

    const linea = within(await screen.findByRole('region', { name: 'Línea de tiempo' }))
    expect(linea.getAllByRole('listitem')).toHaveLength(4)
    expect(linea.getByText('El historial no se puede editar ni borrar.')).toBeVisible()
  })

  it('RF-18 / CU-18 2a: fuera del alcance muestra el mismo aviso que en el teléfono', async () => {
    conNovedad(null, [])
    abrir()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a la bandeja' })).toHaveAttribute(
      'href',
      '/bandeja',
    )
  })
})
