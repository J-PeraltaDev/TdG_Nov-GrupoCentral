import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { listarFincasConConteos } from '../../core/supabase/repositorios/fincas.js'
import {
  activarUsuario,
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from '../../core/supabase/repositorios/usuarios.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { alPedirRevisionDelPerfil } from '../../core/sesion/perfilVigente.js'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Usuarios from './Usuarios.jsx'

// Se simulan los repositorios, nunca la red.
vi.mock('../../core/supabase/repositorios/usuarios.js', () => ({
  listarUsuarios: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarUsuario: vi.fn(),
  desactivarUsuario: vi.fn(),
  activarUsuario: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/fincas.js', () => ({
  listarFincasConConteos: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({
  listarAreas: vi.fn(),
}))
// La contraseña generada es al azar: aquí interesa lo que el formulario hace con ella.
vi.mock('./generarContrasena.js', () => ({ generarContrasena: () => 'Banano-4821' }))

// 8:05 a. m. del 24 de septiembre de 2026 en Colombia.
const AHORA = new Date('2026-09-24T13:05:00Z')

const AREAS = [
  { id: 'area-m', nombre: 'Mantenimiento' },
  { id: 'area-s', nombre: 'Sistemas' },
]
const FINCAS = [
  {
    id: 'f-1',
    nombre: 'Altamira',
    activo: true,
    razon_social: 'Razón social de prueba A',
    novedades_abiertas: 2,
  },
  {
    id: 'f-2',
    nombre: 'El Jardín',
    activo: true,
    razon_social: 'Razón social de prueba B',
    novedades_abiertas: 0,
  },
  {
    id: 'f-3',
    nombre: 'Maracaná',
    activo: false,
    razon_social: 'Razón social de prueba A',
    novedades_abiertas: 0,
  },
]

const usuario = (id, nombre, rolId, cambios = {}) => ({
  id,
  nombre,
  correo: `${nombre.split(' ')[0].toLowerCase()}@novedades.test`,
  rol_id: rolId,
  finca_id: null,
  area_id: null,
  activo: true,
  ultimo_ingreso: null,
  ...cambios,
})

const YO = PERFILES.administrador
const USUARIOS = [
  usuario(YO.id, YO.nombre, 4, { correo: 'administrador@novedades.test' }),
  usuario('u-1', 'Ana Reportante', 1, { finca_id: 'f-1', ultimo_ingreso: '2026-09-24T12:18:00Z' }),
  usuario('u-2', 'Beto Aprobador', 2, {
    area_id: 'area-m',
    ultimo_ingreso: '2026-09-23T15:00:00Z',
  }),
  usuario('u-3', 'Carla Aprobadora', 2, {
    area_id: 'area-s',
    ultimo_ingreso: '2026-09-22T15:00:00Z',
  }),
  usuario('u-5', 'Diego Director', 3),
  usuario('u-7', 'Elena Inactiva', 1, {
    finca_id: 'f-2',
    activo: false,
    ultimo_ingreso: '2026-08-12T15:00:00Z',
  }),
]

function abrir() {
  return pintarConSesion(<Usuarios />, { ruta: '/usuarios', rol: 'administrador' })
}

const filas = () => screen.getAllByRole('row').slice(1)
// El nombre como lo anuncia la fila: el encabezado trae además las iniciales, que son un adorno.
const nombres = () =>
  filas().map((fila) =>
    within(fila)
      .getByRole('button', { name: /^Editar / })
      .getAttribute('aria-label')
      .replace('Editar ', ''),
  )
const fila = (nombre) => screen.getByRole('row', { name: new RegExp(nombre) })
const celdas = (nombre) =>
  within(fila(nombre))
    .getAllByRole('cell')
    .map((celda) => celda.textContent)
const filtroDeRol = () => screen.getByRole('combobox', { name: 'Rol' })
const filtroDeEstado = () => screen.getByRole('combobox', { name: 'Estado' })
const buscar = () => screen.getByRole('searchbox', { name: 'Buscar por nombre o correo' })
const panel = (titulo) => within(screen.getByRole('dialog', { name: titulo }))
const campo = (nombre) => screen.getByRole('textbox', { name: nombre })
const rol = (nombre) => screen.getByRole('radio', { name: nombre })
const guardar = () => screen.getByRole('button', { name: 'Guardar usuario' })

beforeEach(() => {
  // Solo se fija la fecha: los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'], now: AHORA })
  simularPantalla('escritorio')
  vi.mocked(listarUsuarios).mockResolvedValue(USUARIOS)
  vi.mocked(listarFincasConConteos).mockResolvedValue(FINCAS)
  vi.mocked(listarAreas).mockResolvedValue(AREAS)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Pantalla 28 · Usuarios (RF-03 / CU-03 2)', () => {
  it('RF-03 / CU-03 2: lista todos los usuarios, activos e inactivos, con las columnas de Figma', async () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible()
    expect(
      screen.getByText(
        'Crea las cuentas y asigna el rol y la finca o el área. Un usuario desactivado no puede ingresar, pero su historial se conserva.',
      ),
    ).toBeVisible()
    await screen.findByRole('table', { name: 'Usuarios' })

    expect(screen.getAllByRole('columnheader').map((encabezado) => encabezado.textContent)).toEqual(
      ['Nombre', 'Correo', 'Rol', 'Finca o área', 'Estado', 'Último ingreso', 'Acciones'],
    )
    // Por defecto, todos (Figma: «Estado: Todos»), en el orden que entrega el servidor.
    expect(filas()).toHaveLength(6)
    expect(celdas('Ana Reportante').slice(0, 5)).toEqual([
      'ana@novedades.test',
      'Reportante',
      'Finca Altamira',
      'Activo',
      'hoy 7:18 a. m.',
    ])
    expect(celdas('Beto Aprobador').slice(0, 5)).toEqual([
      'beto@novedades.test',
      'Aprobador de área',
      'Mantenimiento',
      'Activo',
      'ayer',
    ])
    expect(celdas('Carla Aprobadora')[4]).toBe('22 sep')
    expect(celdas('Diego Director').slice(1, 5)).toEqual([
      'Director de agricultura',
      '—',
      'Activo',
      'Nunca',
    ])
    expect(celdas('Elena Inactiva').slice(2, 5)).toEqual(['Finca El Jardín', 'Inactivo', '12 ago'])
    expect(screen.getByText('1–6 de 6 usuarios')).toBeVisible()
  })

  it('RNF-06: pide los usuarios, las fincas y las áreas una sola vez', async () => {
    abrir()
    await screen.findByRole('table')

    expect(listarUsuarios).toHaveBeenCalledOnce()
    expect(listarFincasConConteos).toHaveBeenCalledOnce()
    expect(listarAreas).toHaveBeenCalledOnce()
  })

  it('RF-03: busca por nombre o por correo, sin distinguir mayúsculas ni tildes', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.type(buscar(), 'APROBAD')
    expect(nombres()).toEqual(['Beto Aprobador', 'Carla Aprobadora'])

    await userEvent.clear(buscar())
    await userEvent.type(buscar(), 'diego@')
    expect(nombres()).toEqual(['Diego Director'])
    expect(screen.getByText('1–1 de 1 usuario')).toBeVisible()
  })

  it('RF-03: filtra por rol y por estado', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.selectOptions(filtroDeRol(), 'Reportante')
    expect(nombres()).toEqual(['Ana Reportante', 'Elena Inactiva'])

    await userEvent.selectOptions(filtroDeEstado(), 'Estado: Inactivos')
    expect(nombres()).toEqual(['Elena Inactiva'])

    await userEvent.selectOptions(filtroDeRol(), 'Rol: Todos')
    await userEvent.selectOptions(filtroDeEstado(), 'Estado: Activos')
    expect(filas()).toHaveLength(5)
  })

  it('RF-03: si nada coincide, lo dice', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.type(buscar(), 'zzz')

    expect(screen.getByText('No hay usuarios que coincidan.')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('RF-03: pagina de a 20, con el rango y las flechas', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue(
      Array.from({ length: 23 }, (_, i) =>
        usuario(`u-${i + 100}`, `Persona ${String(i + 1).padStart(2, '0')}`, 3),
      ),
    )
    abrir()
    await screen.findByRole('table')

    expect(filas()).toHaveLength(20)
    expect(screen.getByText('1–20 de 23 usuarios')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(filas()).toHaveLength(3)
    expect(screen.getByText('21–23 de 23 usuarios')).toBeVisible()
  })

  it('RF-03: si la consulta falla, avisa y deja reintentar', async () => {
    vi.mocked(listarUsuarios).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No hay conexión')

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table')).toBeVisible()
  })

  it('Tabla 23: en su propia fila no puede desactivarse, y dice por qué', async () => {
    abrir()
    await screen.findByRole('table')

    const propia = within(fila(YO.nombre))
    expect(propia.getByText('Tu cuenta')).toBeVisible()
    const desactivar = propia.getByRole('button', { name: `Desactivar ${YO.nombre}` })
    expect(desactivar).toBeDisabled()
    expect(desactivar).toHaveAccessibleDescription('No puedes desactivar tu propia cuenta.')
    expect(propia.getByRole('button', { name: `Editar ${YO.nombre}` })).toBeEnabled()
  })

  it('RNF-01: en el teléfono la tabla pasa a tarjetas, con las mismas acciones', async () => {
    simularPantalla('telefono')
    abrir()

    const tarjetas = await screen.findAllByRole('article')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(tarjetas).toHaveLength(6)
    const ana = within(tarjetas[1])
    expect(ana.getByRole('heading', { level: 2, name: 'Ana Reportante' })).toBeVisible()
    expect(ana.getByText('ana@novedades.test')).toBeVisible()
    expect(ana.getByText('Reportante · Finca Altamira')).toBeVisible()
    expect(ana.getByText('Último ingreso: hoy 7:18 a. m.')).toBeVisible()
    expect(ana.getByRole('button', { name: 'Editar Ana Reportante' })).toBeVisible()
    expect(ana.getByRole('button', { name: 'Desactivar Ana Reportante' })).toBeVisible()
  })
})

describe('Pantalla 28-B · Desactivar y reactivar un usuario (RF-03 / CU-03 3a)', () => {
  it('RF-03 / CU-03 3a: pregunta antes de desactivar y dice qué pasa', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Carla Aprobadora' }))

    const dialogo = screen.getByRole('dialog', { name: '¿Desactivar a Carla Aprobadora?' })
    expect(dialogo).toHaveAccessibleDescription(
      'No podrá ingresar a la plataforma. Sus novedades y su historial se conservan.',
    )
    expect(desactivarUsuario).not.toHaveBeenCalled()
  })

  it('RF-03: advierte si es el único aprobador activo de su área', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Beto Aprobador' }))

    expect(
      within(screen.getByRole('dialog')).getByText(
        'Es el único aprobador activo de Mantenimiento: sus novedades quedarán sin quien las atienda.',
      ),
    ).toBeVisible()
  })

  it('RF-03 / CU-03 3a: al confirmar lo desactiva, avisa y recarga la lista', async () => {
    vi.mocked(desactivarUsuario).mockResolvedValue({ id: 'u-3', activo: false })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Carla Aprobadora' }))
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(desactivarUsuario).toHaveBeenCalledExactlyOnceWith('u-3')
    expect(await screen.findByRole('status')).toHaveTextContent('Usuario desactivado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarUsuarios).toHaveBeenCalledTimes(2)
  })

  it('RF-03: «Cancelar» no desactiva', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Carla Aprobadora' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(desactivarUsuario).not.toHaveBeenCalled()
  })

  it('RF-03: si falla, lo dice dentro del diálogo y deja intentar de nuevo', async () => {
    vi.mocked(desactivarUsuario)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'u-3', activo: false })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Carla Aprobadora' }))
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'No hay conexión',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Usuario desactivado.')
  })

  it('RF-03: un usuario inactivo se reactiva en un toque, sin diálogo', async () => {
    vi.mocked(activarUsuario).mockResolvedValue({ id: 'u-7', activo: true })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar Elena Inactiva' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(activarUsuario).toHaveBeenCalledExactlyOnceWith('u-7')
    expect(await screen.findByRole('status')).toHaveTextContent('Usuario reactivado.')
  })

  it('RNF-11: si la función responde que no tiene permiso, lo dice y pide releer el perfil', async () => {
    vi.mocked(activarUsuario).mockRejectedValue(new Error('SIN_PERMISO'))
    const alPedirRevision = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(alPedirRevision)
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar Elena Inactiva' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(alPedirRevision).toHaveBeenCalledOnce()
    dejarDeEscuchar()
  })

  it('RNF-11: si ya no es administrador, la lista lo dice y pide releer el perfil', async () => {
    vi.mocked(listarUsuarios).mockRejectedValue({ message: 'SIN_PERMISO' })
    const alPedirRevision = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(alPedirRevision)
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(alPedirRevision).toHaveBeenCalledOnce()
    dejarDeEscuchar()
  })
})

describe('Pantallas 29 y 29-B · Nuevo usuario (RF-03 / CU-03 4 a 6)', () => {
  /** Abre el panel y llena lo que no depende del rol. */
  async function nuevo({ nombre = 'Fabio Nuevo', correo = 'fabio@novedades.test' } = {}) {
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }))
    if (nombre) await userEvent.type(campo('Nombre completo'), nombre)
    if (correo) await userEvent.type(campo('Correo de la plataforma'), correo)
  }

  /** El error que entrega `invocarFuncion`: el código en el mensaje y los campos aparte. */
  function errorDeFuncion(codigo, estado, campos = []) {
    return Object.assign(new Error(codigo), { name: 'ErrorDeFuncion', status: estado, campos })
  }

  it('RF-03 / CU-03 4: pide el nombre, el correo, la contraseña inicial, el rol y si queda activo', async () => {
    await nuevo({ nombre: '', correo: '' })

    const formulario = panel('Nuevo usuario')
    expect(formulario.getByRole('textbox', { name: 'Nombre completo' })).toBeRequired()
    expect(campo('Correo de la plataforma')).toHaveAccessibleDescription(
      'Correo exclusivo de la plataforma; no recibe mensajes',
    )
    expect(campo('Contraseña inicial')).toHaveAccessibleDescription(
      'Entrégala al usuario; podrá cambiarla después',
    )
    expect(formulario.getAllByRole('radio')).toHaveLength(4)
    expect(rol('Reportante')).toHaveAccessibleDescription(
      'Registra novedades de su finca y confirma el cierre',
    )
    expect(rol('Aprobador de área')).toHaveAccessibleDescription(
      'Atiende las novedades de Mantenimiento o de Sistemas',
    )
    expect(rol('Director de agricultura')).toHaveAccessibleDescription(
      'Aprueba o rechaza las novedades escaladas',
    )
    expect(rol('Administrador')).toHaveAccessibleDescription(
      'Gestiona usuarios, fincas y tipos de falla',
    )
    expect(screen.getByRole('switch', { name: 'Usuario activo' })).toBeChecked()
    // Sin rol elegido no se pregunta todavía por la finca ni por el área.
    expect(screen.queryByRole('combobox', { name: 'Finca asignada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Área' })).not.toBeInTheDocument()
  })

  it('RF-03 / CU-03 4: «Generar» escribe una contraseña inicial que el administrador puede leer', async () => {
    await nuevo()

    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))

    expect(campo('Contraseña inicial')).toHaveValue('Banano-4821')
    expect(campo('Contraseña inicial')).toHaveAttribute('type', 'text')
  })

  it('RF-03 / CU-03 5 (29): el reportante pide la finca, entre las activas, con su razón social', async () => {
    await nuevo()

    await userEvent.click(rol('Reportante'))

    const finca = screen.getByRole('combobox', { name: 'Finca asignada' })
    expect(finca).toBeRequired()
    expect(
      within(finca)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual([
      'Elige la finca',
      'Altamira · Razón social de prueba A',
      'El Jardín · Razón social de prueba B',
    ])
    expect(screen.queryByRole('radiogroup', { name: 'Área' })).not.toBeInTheDocument()
  })

  it('RF-03 / CU-03 5 (29-B): el aprobador pide el área, y deja de pedir la finca', async () => {
    await nuevo()
    await userEvent.click(rol('Reportante'))

    await userEvent.click(rol('Aprobador de área'))

    const areas = within(screen.getByRole('radiogroup', { name: 'Área' }))
    expect(areas.getAllByRole('radio').map((opcion) => opcion.getAttribute('value'))).toEqual([
      'area-m',
      'area-s',
    ])
    expect(screen.queryByRole('combobox', { name: 'Finca asignada' })).not.toBeInTheDocument()

    // El director y el administrador no tienen ni finca ni área.
    await userEvent.click(rol('Director de agricultura'))
    expect(screen.queryByRole('radiogroup', { name: 'Área' })).not.toBeInTheDocument()
  })

  it('RF-03 / CU-03 6: crea un reportante con su finca, avisa y recarga la lista', async () => {
    vi.mocked(crearUsuario).mockResolvedValue({ id: 'u-9' })
    await nuevo({ nombre: '  Fabio Nuevo ', correo: ' Fabio@Novedades.test ' })

    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await userEvent.click(rol('Reportante'))
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Finca asignada' }),
      'El Jardín · Razón social de prueba B',
    )
    await userEvent.click(guardar())

    expect(crearUsuario).toHaveBeenCalledExactlyOnceWith({
      nombre: 'Fabio Nuevo',
      correo: 'fabio@novedades.test',
      contrasena_inicial: 'Banano-4821',
      rol_id: 1,
      finca_id: 'f-2',
      area_id: null,
      activo: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Usuario creado. Entrégale su contraseña inicial.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarUsuarios).toHaveBeenCalledTimes(2)
  })

  it('RF-03 / CU-03 6 (29-B): crea un aprobador con su área, inactivo si se apaga el interruptor', async () => {
    vi.mocked(crearUsuario).mockResolvedValue({ id: 'u-9' })
    await nuevo()

    await userEvent.type(campo('Contraseña inicial'), 'Clave-2026')
    await userEvent.click(rol('Aprobador de área'))
    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Área' })).getByRole('radio', {
        name: 'Sistemas',
      }),
    )
    await userEvent.click(screen.getByRole('switch', { name: 'Usuario activo' }))
    await userEvent.click(guardar())

    expect(crearUsuario).toHaveBeenCalledExactlyOnceWith({
      nombre: 'Fabio Nuevo',
      correo: 'fabio@novedades.test',
      contrasena_inicial: 'Clave-2026',
      rol_id: 2,
      finca_id: null,
      area_id: 'area-s',
      activo: false,
    })
  })

  it('RF-03 / CU-03 6b: sin datos no guarda; señala cada campo y lleva el foco al primero', async () => {
    await nuevo({ nombre: '', correo: '' })

    await userEvent.click(guardar())

    expect(campo('Nombre completo')).toHaveAccessibleDescription('Escribe el nombre completo.')
    expect(campo('Correo de la plataforma')).toHaveAccessibleDescription(
      'Escribe un correo válido.',
    )
    expect(campo('Contraseña inicial')).toHaveAccessibleDescription(
      'Usa mínimo 8 caracteres, con al menos una letra y un número.',
    )
    expect(screen.getByRole('radiogroup', { name: 'Rol' })).toHaveAccessibleDescription(
      'Elige el rol.',
    )
    expect(campo('Nombre completo')).toHaveFocus()
    expect(crearUsuario).not.toHaveBeenCalled()
  })

  it.each([
    [
      'un correo sin forma de correo',
      { correo: 'fabio.novedades' },
      'Correo de la plataforma',
      'Escribe un correo válido.',
    ],
  ])('RF-03 / CU-03 6b: con %s lo señala', async (_, datos, etiqueta, mensaje) => {
    await nuevo(datos)
    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await userEvent.click(rol('Administrador'))

    await userEvent.click(guardar())

    expect(campo(etiqueta)).toHaveAccessibleDescription(mensaje)
    expect(crearUsuario).not.toHaveBeenCalled()
  })

  it('RF-03 / CU-03 6b: una contraseña débil, o un reportante sin finca, no pasan', async () => {
    await nuevo()
    await userEvent.type(campo('Contraseña inicial'), 'corta1')
    await userEvent.click(rol('Reportante'))

    await userEvent.click(guardar())

    expect(campo('Contraseña inicial')).toBeInvalid()
    expect(screen.getByRole('combobox', { name: 'Finca asignada' })).toHaveAccessibleDescription(
      'Elige la finca.',
    )
    expect(crearUsuario).not.toHaveBeenCalled()
  })

  it('RF-03 / CU-03 6a: si el correo ya existe, lo señala en su campo y no cierra', async () => {
    vi.mocked(crearUsuario).mockRejectedValue(errorDeFuncion('CORREO_EXISTENTE', 409, ['correo']))
    await nuevo()
    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await userEvent.click(rol('Administrador'))

    await userEvent.click(guardar())

    expect(await screen.findByText('Este correo ya está registrado')).toBeVisible()
    expect(campo('Correo de la plataforma')).toBeInvalid()
    expect(campo('Correo de la plataforma')).toHaveFocus()
    expect(screen.getByRole('dialog', { name: 'Nuevo usuario' })).toBeVisible()
    // Lo escrito se conserva, incluida la contraseña.
    expect(campo('Contraseña inicial')).toHaveValue('Banano-4821')
  })

  it('RF-03 / CU-03 6b: los campos que rechaza el servidor se señalan uno por uno', async () => {
    vi.mocked(crearUsuario).mockRejectedValue(
      errorDeFuncion('DATO_OBLIGATORIO', 400, ['contrasena_inicial', 'finca_id']),
    )
    await nuevo()
    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await userEvent.click(rol('Reportante'))
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Finca asignada' }),
      'Altamira · Razón social de prueba A',
    )

    await userEvent.click(guardar())

    expect(
      await screen.findByText('Usa mínimo 8 caracteres, con al menos una letra y un número.'),
    ).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Finca asignada' })).toHaveAccessibleDescription(
      'Elige una finca activa.',
    )
    expect(campo('Contraseña inicial')).toHaveFocus()
  })

  it('RF-03: si se cae la conexión, lo dice dentro del panel y conserva lo escrito', async () => {
    vi.mocked(crearUsuario).mockRejectedValue(new TypeError('Failed to fetch'))
    await nuevo()
    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))
    await userEvent.click(rol('Administrador'))

    await userEvent.click(guardar())

    expect(await panel('Nuevo usuario').findByRole('alert')).toHaveTextContent('No hay conexión')
    expect(campo('Nombre completo')).toHaveValue('Fabio Nuevo')
  })

  it('RF-03: «Cancelar» y la equis cierran sin guardar, y la contraseña no queda en ningún lado', async () => {
    await nuevo()
    await userEvent.click(screen.getByRole('button', { name: 'Generar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(crearUsuario).not.toHaveBeenCalled()

    // Al abrirlo otra vez empieza en blanco.
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }))
    expect(campo('Contraseña inicial')).toHaveValue('')
    expect(campo('Nombre completo')).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})

describe('Pantalla 29 · Editar usuario (RF-03 / CU-03 5)', () => {
  async function editar(nombre) {
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: `Editar ${nombre}` }))
    return panel('Editar usuario')
  }

  it('RF-03: abre con sus datos; el correo no se puede cambiar y no hay contraseña', async () => {
    const formulario = await editar('Ana Reportante')

    expect(formulario.getByRole('textbox', { name: 'Nombre completo' })).toHaveValue(
      'Ana Reportante',
    )
    const correo = campo('Correo de la plataforma')
    expect(correo).toHaveValue('ana@novedades.test')
    expect(correo).toHaveAttribute('readonly')
    expect(correo).toHaveAccessibleDescription('El correo no se puede cambiar.')
    expect(screen.queryByRole('textbox', { name: 'Contraseña inicial' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generar' })).not.toBeInTheDocument()
    expect(rol('Reportante')).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Finca asignada' })).toHaveValue('f-1')
    expect(screen.getByRole('switch', { name: 'Usuario activo' })).toBeChecked()
  })

  it('RF-03 / CU-03 5: guarda el nombre, el rol y el alcance, y avisa', async () => {
    vi.mocked(actualizarUsuario).mockResolvedValue({ id: 'u-1' })
    await editar('Ana Reportante')

    await userEvent.clear(campo('Nombre completo'))
    await userEvent.type(campo('Nombre completo'), 'Ana María Reportante')
    await userEvent.click(rol('Aprobador de área'))
    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Área' })).getByRole('radio', {
        name: 'Mantenimiento',
      }),
    )
    await userEvent.click(guardar())

    expect(actualizarUsuario).toHaveBeenCalledExactlyOnceWith('u-1', {
      nombre: 'Ana María Reportante',
      rol_id: 2,
      finca_id: null,
      area_id: 'area-m',
      activo: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Usuario actualizado.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-03: un reportante de una finca inactiva conserva su finca en la lista', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue([
      ...USUARIOS,
      usuario('u-8', 'Gloria Antigua', 1, { finca_id: 'f-3' }),
    ])
    await editar('Gloria Antigua')

    const finca = screen.getByRole('combobox', { name: 'Finca asignada' })
    expect(finca).toHaveValue('f-3')
    expect(within(finca).getByRole('option', { name: /^Maracaná .* \(inactiva\)$/ })).toBeVisible()
  })

  it('RF-03: advierte si el cambio deja su área sin aprobadores activos', async () => {
    await editar('Beto Aprobador')
    expect(screen.queryByText(/Es el único aprobador activo/)).not.toBeInTheDocument()

    await userEvent.click(rol('Director de agricultura'))

    expect(
      screen.getByText(
        'Es el único aprobador activo de Mantenimiento: sus novedades quedarán sin quien las atienda.',
      ),
    ).toBeVisible()

    // Si vuelve a su rol y a su área, no hay nada que advertir.
    await userEvent.click(rol('Aprobador de área'))
    expect(screen.queryByText(/Es el único aprobador activo/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: 'Usuario activo' }))
    expect(screen.getByText(/Es el único aprobador activo/)).toBeVisible()
  })

  it('Tabla 23: al editarse a sí mismo no puede cambiar su rol ni desactivarse, y dice por qué', async () => {
    vi.mocked(actualizarUsuario).mockResolvedValue({ id: YO.id })
    await editar(YO.nombre)

    for (const opcion of screen.getAllByRole('radio')) expect(opcion).toBeDisabled()
    expect(rol('Administrador')).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Usuario activo' })).toBeDisabled()
    expect(
      screen.getByText('No puedes cambiar tu propio rol ni desactivar tu cuenta.'),
    ).toBeVisible()

    // El nombre sí.
    await userEvent.type(campo('Nombre completo'), ' Ajustado')
    await userEvent.click(guardar())
    expect(actualizarUsuario).toHaveBeenCalledExactlyOnceWith(YO.id, {
      nombre: `${YO.nombre} Ajustado`,
      rol_id: 4,
      finca_id: null,
      area_id: null,
      activo: true,
    })
  })

  it('RF-03: si el usuario ya no existe, lo dice dentro del panel', async () => {
    vi.mocked(actualizarUsuario).mockRejectedValue(
      Object.assign(new Error('NO_ENCONTRADO'), { status: 404, campos: [] }),
    )
    await editar('Diego Director')

    await userEvent.click(guardar())

    expect(await panel('Editar usuario').findByRole('alert')).toHaveTextContent(
      'No encontramos ese usuario.',
    )
  })
})
