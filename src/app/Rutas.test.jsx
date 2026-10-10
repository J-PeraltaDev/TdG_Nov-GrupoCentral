import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { obtenerNovedad } from '../core/supabase/repositorios/novedades.js'
import { pintarConSesion } from '../pruebas/sesionDePrueba.jsx'
import { Rutas } from './Rutas.jsx'

// Las pantallas del reportante consultan el servidor: aquí solo interesan las rutas.
vi.mock('../core/supabase/repositorios/novedades.js', () => ({
  NOVEDADES_POR_PAGINA: 20,
  listarNovedades: vi.fn().mockResolvedValue({ novedades: [], total: 0 }),
  contarNovedades: vi.fn().mockResolvedValue(0),
  registrarNovedad: vi.fn(),
  listarBandeja: vi.fn().mockResolvedValue({ novedades: [], total: 0 }),
  contarBandeja: vi.fn().mockResolvedValue(0),
  listarTransicionesDeBandeja: vi.fn().mockResolvedValue([]),
  listarEscaladas: vi.fn().mockResolvedValue({ novedades: [], total: 0 }),
  listarEscalamientos: vi.fn().mockResolvedValue([]),
  contarDecisionesDelMes: vi.fn().mockResolvedValue({ aprobadas: 0, rechazadas: 0 }),
  obtenerNovedad: vi.fn().mockResolvedValue({
    id: '00000000-0000-4000-e000-000000000153',
    codigo: 153,
    descripcion: 'El torniquete de la entrada no gira.',
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
    reportante: 'Reportante de prueba',
  }),
  listarLineaDeTiempo: vi.fn().mockResolvedValue([]),
  tomarNovedad: vi.fn(),
  rechazarNovedad: vi.fn(),
  escalarNovedad: vi.fn(),
  reasignarNovedad: vi.fn(),
  registrarSolucion: vi.fn(),
  decidirEscalamiento: vi.fn(),
  confirmarResolucion: vi.fn(),
  reportarFallaPersiste: vi.fn(),
}))
vi.mock('../core/supabase/repositorios/fincas.js', () => ({
  listarFincasConConteos: vi.fn().mockResolvedValue([]),
  listarRazonesSociales: vi.fn().mockResolvedValue([]),
  crearFinca: vi.fn(),
  actualizarFinca: vi.fn(),
}))
vi.mock('../core/supabase/repositorios/usuarios.js', () => ({
  listarUsuarios: vi.fn().mockResolvedValue([]),
  crearUsuario: vi.fn(),
  actualizarUsuario: vi.fn(),
  desactivarUsuario: vi.fn(),
  activarUsuario: vi.fn(),
}))
vi.mock('../core/supabase/repositorios/tiposFalla.js', () => ({
  sugerirTiposFalla: vi.fn().mockResolvedValue([]),
}))
vi.mock('../core/supabase/repositorios/catalogos.js', () => ({
  listarAreas: vi.fn().mockResolvedValue([
    { id: 'area-m', nombre: 'Mantenimiento' },
    { id: 'area-s', nombre: 'Sistemas' },
  ]),
  listarFincas: vi.fn().mockResolvedValue([]),
}))

const abrir = (ruta, rol) => pintarConSesion(<Rutas />, { ruta, rol })

const DETALLE = '/novedades/00000000-0000-4000-e000-000000000153'

/** Textos del menú de la barra lateral (escritorio). */
async function menuDelEscritorio() {
  const [lateral] = await screen.findAllByRole('navigation', { name: 'Principal' })
  return within(lateral)
    .getAllByRole('link')
    .map((enlace) => enlace.textContent)
}

describe('Rutas y guardián de rol (RF-01 / CU-01, SDD 6.1.11)', () => {
  it('RNF-10: sin sesión, / lleva al ingreso', () => {
    abrir('/', null)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Novedades · Grupo Central' }),
    ).toBeVisible()
  })

  it('RNF-10: sin sesión no se entra a una ruta protegida', () => {
    abrir('/novedades', null)

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  it('mientras se recupera la sesión no decide todavía a dónde ir', () => {
    pintarConSesion(<Rutas />, { ruta: '/novedades', sesion: { fase: 'cargando' } })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it.each([
    ['reportante', 'Mis novedades'],
    ['aprobador', 'Bandeja · Mantenimiento'],
    ['director', 'Novedades escaladas'],
    // Hasta que llegue el panel de reportes (Sprint 5), el administrador entra a Usuarios.
    ['administrador', 'Usuarios'],
  ])('RF-01 / CU-01 4: el %s entra a su pantalla de inicio («%s»)', async (rol, titulo) => {
    abrir('/', rol)

    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeVisible()
  })

  it.each([
    ['reportante', ['Novedades', 'Registrar', 'Avisos', 'Cuenta']],
    ['aprobador', ['Bandeja', 'Historial', 'Avisos']],
    ['director', ['Escaladas', 'Historial', 'Panel de reportes', 'Avisos']],
    [
      'administrador',
      [
        'Panel de reportes',
        'Historial',
        'Usuarios',
        'Fincas',
        'Tipos de falla',
        'Recuperación de contraseñas',
        'Avisos',
      ],
    ],
  ])('RF-01 / CU-01 4: el %s ve el menú de su rol (SDD, Tabla 10)', async (rol, menu) => {
    abrir('/', rol)

    expect(await menuDelEscritorio()).toEqual(menu)
  })

  it('en el teléfono la barra inferior tiene cuatro opciones', async () => {
    abrir('/', 'aprobador')

    const [, inferior] = await screen.findAllByRole('navigation', { name: 'Principal' })
    expect(
      within(inferior)
        .getAllByRole('link')
        .map((enlace) => enlace.textContent),
    ).toEqual(['Bandeja', 'Historial', 'Avisos', 'Cuenta'])
  })

  it.each([
    ['reportante', '/bandeja', 'Mis novedades'],
    ['reportante', '/usuarios', 'Mis novedades'],
    ['aprobador', '/registrar', 'Bandeja · Mantenimiento'],
    ['aprobador', '/panel', 'Bandeja · Mantenimiento'],
    ['director', '/usuarios', 'Novedades escaladas'],
    ['reportante', '/fincas', 'Mis novedades'],
    ['aprobador', '/fincas', 'Bandeja · Mantenimiento'],
    ['director', '/fincas', 'Novedades escaladas'],
    ['aprobador', '/usuarios', 'Bandeja · Mantenimiento'],
    ['administrador', '/registrar', 'Usuarios'],
  ])(
    'RF-18: el %s no entra a %s; el guardián lo devuelve a su inicio',
    async (rol, ruta, titulo) => {
      abrir(ruta, rol)

      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeVisible()
    },
  )

  it('RF-05: el registro va sin las barras de navegación del teléfono (pantalla 05)', async () => {
    abrir('/registrar', 'reportante')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Registrar novedad' }),
    ).toBeVisible()
    // Solo queda el menú de la barra lateral (escritorio); la barra inferior no se pinta.
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Cerrar sin registrar' })).toBeVisible()
  })

  it('RF-06: la constancia sin una novedad recién registrada lleva a Mis novedades', async () => {
    abrir('/registrar/recibida', 'reportante')

    expect(await screen.findByRole('heading', { level: 1, name: 'Mis novedades' })).toBeVisible()
  })

  it('el reportante ve su finca y su razón social en la barra superior', async () => {
    abrir('/novedades', 'reportante')

    expect(await screen.findByText('Finca de prueba 01')).toBeInTheDocument()
    expect(screen.getByText('Razón social de prueba A')).toBeInTheDocument()
  })

  it('RF-09: en el teléfono, la barra superior del aprobador presenta la bandeja de su área', async () => {
    abrir('/bandeja', 'aprobador')

    expect(
      await screen.findByText('Bandeja · Mantenimiento', { selector: 'p' }),
    ).toBeInTheDocument()
    // El título reemplaza al nombre y al rol, que en el teléfono quedan en Cuenta.
    expect(
      screen.queryByText('Carlos Mario Restrepo', { selector: 'header p' }),
    ).not.toBeInTheDocument()
  })

  it.each(['reportante', 'aprobador', 'director', 'administrador'])(
    'RF-18 / CU-18: el %s entra al detalle de una novedad',
    async (rol) => {
      abrir(DETALLE, rol)

      expect(await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })).toBeVisible()
    },
  )

  it('RF-14 / CU-14: el aprobador entra a registrar la solución de una novedad en atención, sin las barras del teléfono', async () => {
    const enAtencion = { ...(await obtenerNovedad()), estado: 'en_atencion' }
    vi.mocked(obtenerNovedad).mockResolvedValueOnce(enAtencion)
    abrir(`${DETALLE}/solucion`, 'aprobador')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Registrar solución' }),
    ).toBeVisible()
    // Solo queda el menú de la barra lateral (escritorio); la barra inferior no se pinta.
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Cerrar sin registrar la solución' })).toBeVisible()
  })

  it.each([
    ['reportante', 'Mis novedades'],
    ['director', 'Novedades escaladas'],
    ['administrador', 'Usuarios'],
  ])(
    'RF-14: el %s no entra a registrar una solución; el guardián lo devuelve a su inicio',
    async (rol, titulo) => {
      abrir(`${DETALLE}/solucion`, rol)

      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeVisible()
    },
  )

  it('RF-14: sin sesión no se entra a registrar una solución', () => {
    abrir(`${DETALLE}/solucion`, null)

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  it('RF-18: sin sesión no se entra al detalle', () => {
    abrir(DETALLE, null)

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  it.each([
    ['reportante', 'Novedades'],
    ['aprobador', 'Bandeja'],
    ['director', 'Escaladas'],
  ])(
    'RF-18: en el detalle, el menú del %s deja marcada la pantalla de origen («%s»)',
    async (rol, origen) => {
      abrir(DETALLE, rol)
      await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })

      const [lateral] = screen.getAllByRole('navigation', { name: 'Principal' })
      const marcados = within(lateral)
        .getAllByRole('link')
        .filter((enlace) => enlace.classList.contains('bg-primario-contenedor'))
      expect(marcados.map((enlace) => enlace.textContent)).toEqual([origen])
    },
  )

  it('RF-18: en el teléfono el detalle trae su propia barra superior y conserva la navegación', async () => {
    abrir(DETALLE, 'aprobador')
    await screen.findByRole('heading', { level: 1, name: 'NOV-0153' })

    // La barra del marco, con el nombre de la persona, no se pinta; la inferior sí.
    expect(screen.queryByText('Carlos Mario Restrepo', { selector: 'header p' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Volver a la bandeja' })).toBeVisible()
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(2)
  })

  it('RF-23: el indicador de conexión está siempre a la vista', async () => {
    abrir('/novedades', 'reportante')

    expect((await screen.findAllByRole('status')).some((e) => e.textContent === 'En línea')).toBe(
      true,
    )
  })

  it('con sesión, el ingreso redirige al inicio del rol', async () => {
    abrir('/ingresar', 'aprobador')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bandeja · Mantenimiento' }),
    ).toBeVisible()
  })

  it('una ruta que no existe muestra la página de no encontrada', () => {
    abrir('/no-existe', null)

    expect(
      screen.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible()
  })

  it('RF-04: el administrador abre la pantalla de fincas', async () => {
    abrir('/fincas', 'administrador')

    expect(await screen.findByRole('heading', { level: 1, name: 'Fincas' })).toBeVisible()
    expect(await screen.findByRole('button', { name: 'Nueva finca' })).toBeVisible()
  })

  it('RF-04: desde «Cuenta», el administrador abre las pantallas que no caben en la barra del teléfono', async () => {
    abrir('/cuenta', 'administrador')

    const administracion = within(await screen.findByRole('navigation', { name: 'Administración' }))
    expect(administracion.getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Fincas',
      'Tipos de falla',
      'Recuperación de contraseñas',
    ])

    await userEvent.click(administracion.getByRole('link', { name: 'Fincas' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Fincas' })).toBeVisible()
  })

  it.each(['reportante', 'aprobador', 'director'])(
    'en «Cuenta», el %s no tiene la sección de administración',
    async (rol) => {
      abrir('/cuenta', rol)

      expect(await screen.findByRole('heading', { level: 1, name: 'Cuenta' })).toBeVisible()
      expect(screen.queryByRole('navigation', { name: 'Administración' })).not.toBeInTheDocument()
    },
  )

  it('/_dev/componentes muestra las 28 variantes de los componentes base y los de los Sprints 2 y 3', async () => {
    abrir('/_dev/componentes', null)

    expect(await screen.findByRole('heading', { level: 1, name: 'Componentes base' })).toBeVisible()
    expect(document.querySelectorAll('[data-estado]')).toHaveLength(9)
    expect(document.querySelectorAll('[data-prioridad]')).toHaveLength(4)
    expect(document.querySelectorAll('[data-conexion]')).toHaveLength(3)
    // 12 botones del sistema de diseño, «Reintentar» del aviso y los que abren la hoja y el
    // diálogo.
    expect(screen.getAllByRole('button')).toHaveLength(15)
    expect(screen.getAllByRole('tablist')).toHaveLength(2)
    expect(document.querySelectorAll('[data-aviso-temporal]')).toHaveLength(2)
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })
})
