import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarFinca,
  crearFinca,
  listarFincasConConteos,
  listarRazonesSociales,
} from '../../core/supabase/repositorios/fincas.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Fincas from './Fincas.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/fincas.js', () => ({
  listarFincasConConteos: vi.fn(),
  listarRazonesSociales: vi.fn(),
  crearFinca: vi.fn(),
  actualizarFinca: vi.fn(),
}))

const RAZONES = [
  { id: 'rs-a', nombre: 'Razón social de prueba A' },
  { id: 'rs-b', nombre: 'Razón social de prueba B' },
]

const finca = (id, nombre, razon, cambios = {}) => ({
  id,
  nombre,
  activo: true,
  razon_social_id: razon.id,
  razon_social: razon.nombre,
  novedades_abiertas: 0,
  reportantes_activos: 0,
  ...cambios,
})

const FINCAS = [
  finca('f-1', 'Altamira', RAZONES[0], { novedades_abiertas: 2, reportantes_activos: 2 }),
  finca('f-2', 'El Jardín', RAZONES[1], { novedades_abiertas: 1, reportantes_activos: 1 }),
  finca('f-3', 'Maracaná', RAZONES[0], { activo: false, novedades_abiertas: 2 }),
  finca('f-4', 'Villa Rosa', RAZONES[1], { reportantes_activos: 3 }),
]

function abrir() {
  return pintarConSesion(<Fincas />, { ruta: '/fincas', rol: 'administrador' })
}

const filas = () => screen.getAllByRole('row').slice(1)
const nombres = () => filas().map((fila) => within(fila).getByRole('rowheader').textContent)
const fila = (nombre) => screen.getByRole('row', { name: new RegExp(`^${nombre}`) })
const estado = () => screen.getByRole('combobox', { name: 'Estado' })
const razonSocial = () => screen.getByRole('combobox', { name: 'Razón social' })
const buscar = () => screen.getByRole('searchbox', { name: 'Buscar finca' })

beforeEach(() => {
  simularPantalla('escritorio')
  vi.mocked(listarFincasConConteos).mockResolvedValue(FINCAS)
  vi.mocked(listarRazonesSociales).mockResolvedValue(RAZONES)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Pantalla 30 · Fincas (RF-04 / CU-04)', () => {
  it('RF-04 / CU-04 2: lista las fincas activas con su razón social, sus novedades abiertas y sus reportantes', async () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Fincas' })).toBeVisible()
    expect(
      screen.getByText(
        'Una finca desactivada no aparece para nuevos registros, pero conserva su historial.',
      ),
    ).toBeVisible()
    await screen.findByRole('table', { name: 'Fincas' })

    expect(screen.getAllByRole('columnheader').map((encabezado) => encabezado.textContent)).toEqual(
      [
        'Finca',
        'Razón social',
        'Novedades abiertas',
        'Reportantes asignados',
        'Estado',
        'Acciones',
      ],
    )
    // Por defecto, solo las activas (Figma: «Estado: Activas»).
    expect(nombres()).toEqual(['Altamira', 'El Jardín', 'Villa Rosa'])
    const celdas = within(fila('Altamira'))
      .getAllByRole('cell')
      .map((celda) => celda.textContent)
    expect(celdas.slice(0, 4)).toEqual(['Razón social de prueba A', '2', '2', 'Activa'])
    expect(screen.getByText('1–3 de 3 fincas')).toBeVisible()
  })

  it('RF-04: el filtro de estado muestra las inactivas o todas', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.selectOptions(estado(), 'Estado: Inactivas')
    expect(nombres()).toEqual(['Maracaná'])
    expect(within(fila('Maracaná')).getByText('Inactiva')).toBeVisible()

    await userEvent.selectOptions(estado(), 'Estado: Todas')
    expect(nombres()).toEqual(['Altamira', 'El Jardín', 'Maracaná', 'Villa Rosa'])
    expect(screen.getByText('1–4 de 4 fincas')).toBeVisible()
  })

  it('RF-04: el filtro de razón social deja solo sus fincas', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.selectOptions(razonSocial(), 'Razón social de prueba B')

    expect(nombres()).toEqual(['El Jardín', 'Villa Rosa'])
  })

  it('RF-04: la búsqueda no distingue mayúsculas ni tildes', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.type(buscar(), 'JARDIN')

    expect(nombres()).toEqual(['El Jardín'])
    expect(screen.getByText('1–1 de 1 finca')).toBeVisible()
  })

  it('RF-04: si nada coincide, lo dice', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.type(buscar(), 'zzz')

    expect(screen.getByText('No hay fincas que coincidan.')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('RF-04: pagina de a 20, con el rango y las flechas', async () => {
    vi.mocked(listarFincasConConteos).mockResolvedValue(
      Array.from({ length: 25 }, (_, i) =>
        finca(`f-${i}`, `Finca ${String(i + 1).padStart(2, '0')}`, RAZONES[0]),
      ),
    )
    abrir()
    await screen.findByRole('table')

    expect(filas()).toHaveLength(20)
    expect(screen.getByText('1–20 de 25 fincas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(nombres()).toEqual(['Finca 21', 'Finca 22', 'Finca 23', 'Finca 24', 'Finca 25'])
    expect(screen.getByText('21–25 de 25 fincas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()

    // Al filtrar se vuelve a la primera página.
    await userEvent.type(buscar(), 'Finca 0')
    expect(screen.getByText('1–9 de 9 fincas')).toBeVisible()
  })

  it('RF-04: si la consulta falla, avisa y deja reintentar', async () => {
    vi.mocked(listarFincasConConteos).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No hay conexión')

    await userEvent.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table')).toBeVisible()
  })

  it('RNF-01: en el teléfono la tabla pasa a tarjetas, con las mismas acciones', async () => {
    simularPantalla('telefono')
    abrir()

    const tarjetas = await screen.findAllByRole('article')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(tarjetas).toHaveLength(3)
    const primera = within(tarjetas[0])
    expect(primera.getByRole('heading', { level: 2, name: 'Altamira' })).toBeVisible()
    expect(primera.getByText('Razón social de prueba A')).toBeVisible()
    expect(primera.getByText('2 novedades abiertas')).toBeVisible()
    expect(primera.getByText('2 reportantes')).toBeVisible()
    expect(primera.getByRole('button', { name: 'Editar Altamira' })).toBeVisible()
    expect(primera.getByRole('button', { name: 'Desactivar Altamira' })).toBeVisible()
  })
})

describe('Pantalla 30-B · Nueva finca y editar finca (RF-04 / CU-04 5, 6 y 6a)', () => {
  const dialogo = (nombre) => within(screen.getByRole('dialog', { name: nombre }))
  const nombre = () => screen.getByRole('textbox', { name: 'Nombre de la finca' })
  const razon = () =>
    within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Razón social' })
  const guardar = () => screen.getByRole('button', { name: 'Guardar finca' })

  it('RF-04 / CU-04 4 y 5: «Nueva finca» pide el nombre y la razón social', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    expect(dialogo('Nueva finca').getByRole('textbox', { name: 'Nombre de la finca' })).toHaveValue(
      '',
    )
    expect(nombre()).toBeRequired()
    expect(razon()).toBeRequired()
    expect(razon()).toHaveValue('')
  })

  it('RF-04 / CU-04 5: sin nombre o sin razón social no guarda, y señala lo que falta', async () => {
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    await userEvent.click(guardar())

    expect(nombre()).toBeInvalid()
    expect(nombre()).toHaveAccessibleDescription('Escribe el nombre de la finca.')
    expect(razon()).toHaveAccessibleDescription('Elige la razón social.')
    expect(nombre()).toHaveFocus()
    expect(crearFinca).not.toHaveBeenCalled()
  })

  it('RF-04 / CU-04 6: crea la finca, avisa y recarga la lista', async () => {
    vi.mocked(crearFinca).mockResolvedValue({ id: 'f-9' })
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    await userEvent.type(nombre(), '  Nueva Esperanza ')
    await userEvent.selectOptions(razon(), 'Razón social de prueba B')
    await userEvent.click(guardar())

    expect(crearFinca).toHaveBeenCalledExactlyOnceWith({
      nombre: 'Nueva Esperanza',
      razonSocialId: 'rs-b',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Finca creada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarFincasConConteos).toHaveBeenCalledTimes(2)
  })

  it('RF-04 / CU-04 6a: antes de guardar compara el nombre sin mayúsculas ni tildes con las fincas de esa razón social', async () => {
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    // «Maracaná» existe en esa razón social, aunque esté inactiva.
    await userEvent.type(nombre(), 'maracana')
    await userEvent.selectOptions(razon(), 'Razón social de prueba A')
    await userEvent.click(guardar())

    expect(nombre()).toHaveAccessibleDescription(
      'Ya existe una finca con ese nombre en esta razón social',
    )
    expect(crearFinca).not.toHaveBeenCalled()

    // En otra razón social, el mismo nombre sí se puede.
    vi.mocked(crearFinca).mockResolvedValue({ id: 'f-9' })
    await userEvent.selectOptions(razon(), 'Razón social de prueba B')
    await userEvent.click(guardar())
    expect(crearFinca).toHaveBeenCalledOnce()
  })

  it('RF-04 / CU-04 6a: si el servidor dice que ya existe, lo señala en el campo y no cierra', async () => {
    vi.mocked(crearFinca).mockRejectedValue(new Error('FINCA_EXISTENTE'))
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    await userEvent.type(nombre(), 'Otra')
    await userEvent.selectOptions(razon(), 'Razón social de prueba A')
    await userEvent.click(guardar())

    expect(
      await screen.findByText('Ya existe una finca con ese nombre en esta razón social'),
    ).toBeVisible()
    expect(nombre()).toBeInvalid()
    expect(screen.getByRole('dialog', { name: 'Nueva finca' })).toBeVisible()
  })

  it('RF-04: si se cae la conexión, lo dice dentro del diálogo y conserva lo escrito', async () => {
    vi.mocked(crearFinca).mockRejectedValue(new TypeError('Failed to fetch'))
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))

    await userEvent.type(nombre(), 'Nueva Esperanza')
    await userEvent.selectOptions(razon(), 'Razón social de prueba A')
    await userEvent.click(guardar())

    expect(await dialogo('Nueva finca').findByRole('alert')).toHaveTextContent('No hay conexión')
    expect(nombre()).toHaveValue('Nueva Esperanza')
  })

  it('RF-04 / CU-04 5: «Editar» abre la finca con sus datos y guarda los cambios', async () => {
    vi.mocked(actualizarFinca).mockResolvedValue({ id: 'f-2' })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Editar El Jardín' }))
    expect(
      dialogo('Editar finca').getByRole('textbox', { name: 'Nombre de la finca' }),
    ).toHaveValue('El Jardín')
    expect(razon()).toHaveValue('rs-b')

    await userEvent.clear(nombre())
    await userEvent.type(nombre(), 'El Jardín Norte')
    await userEvent.click(guardar())

    expect(actualizarFinca).toHaveBeenCalledExactlyOnceWith('f-2', {
      nombre: 'El Jardín Norte',
      razonSocialId: 'rs-b',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Finca actualizada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-04: al editar, la finca no choca con su propio nombre', async () => {
    vi.mocked(actualizarFinca).mockResolvedValue({ id: 'f-1' })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Editar Altamira' }))
    await userEvent.selectOptions(razon(), 'Razón social de prueba B')
    await userEvent.click(guardar())

    expect(actualizarFinca).toHaveBeenCalledExactlyOnceWith('f-1', {
      nombre: 'Altamira',
      razonSocialId: 'rs-b',
    })
  })

  it('RF-04: «Cancelar» cierra sin guardar', async () => {
    abrir()
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva finca' }))
    await userEvent.type(nombre(), 'Borrador')

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(crearFinca).not.toHaveBeenCalled()
  })
})

describe('Pantalla 30 · Desactivar y reactivar una finca (RF-04 / CU-04 3, 3a y 3b)', () => {
  const desactivar = () => screen.getByRole('button', { name: 'Desactivar finca' })

  it('RF-04 / CU-04 3b: con novedades abiertas advierte cuántas son y qué pasa con ellas', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Altamira' }))

    const dialogo = within(screen.getByRole('dialog', { name: '¿Desactivar la finca Altamira?' }))
    expect(
      dialogo.getByText(
        'Tiene 2 novedades abiertas. Seguirán su curso, pero no se podrán registrar novedades nuevas para esta finca.',
      ),
    ).toBeVisible()
    expect(dialogo.getByText('2 reportantes activos dejarán de poder registrar.')).toBeVisible()
    expect(actualizarFinca).not.toHaveBeenCalled()
  })

  it('RF-04 / CU-04 3b: con una sola novedad abierta lo dice en singular', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar El Jardín' }))

    expect(
      screen.getByText(
        'Tiene 1 novedad abierta. Seguirá su curso, pero no se podrán registrar novedades nuevas para esta finca.',
      ),
    ).toBeVisible()
    expect(screen.getByText('1 reportante activo dejará de poder registrar.')).toBeVisible()
  })

  it('RF-04 / CU-04 3a: sin novedades abiertas pide la confirmación, sin la advertencia', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Villa Rosa' }))

    const dialogo = screen.getByRole('dialog', { name: '¿Desactivar la finca Villa Rosa?' })
    expect(dialogo).toHaveAccessibleDescription(
      'No aparecerá para nuevos registros, pero conserva su historial.',
    )
    expect(within(dialogo).queryByText(/novedades? abiertas?/)).not.toBeInTheDocument()
  })

  it('RF-04 / CU-04 3: al confirmar la desactiva, avisa y recarga la lista', async () => {
    vi.mocked(actualizarFinca).mockResolvedValue({ id: 'f-1' })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Altamira' }))
    await userEvent.click(desactivar())

    expect(actualizarFinca).toHaveBeenCalledExactlyOnceWith('f-1', { activo: false })
    expect(await screen.findByRole('status')).toHaveTextContent('Finca desactivada.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarFincasConConteos).toHaveBeenCalledTimes(2)
  })

  it('RF-04: «Cancelar» no desactiva', async () => {
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Altamira' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(actualizarFinca).not.toHaveBeenCalled()
  })

  it('RF-04: si falla, lo dice dentro del diálogo y deja intentar de nuevo', async () => {
    vi.mocked(actualizarFinca)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'f-1' })
    abrir()
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Altamira' }))
    await userEvent.click(desactivar())

    const dialogo = within(screen.getByRole('dialog'))
    expect(await dialogo.findByRole('alert')).toHaveTextContent('No hay conexión')

    await userEvent.click(desactivar())
    expect(await screen.findByRole('status')).toHaveTextContent('Finca desactivada.')
  })

  it('RF-04: una finca inactiva se reactiva en un toque, sin diálogo', async () => {
    vi.mocked(actualizarFinca).mockResolvedValue({ id: 'f-3' })
    abrir()
    await screen.findByRole('table')
    await userEvent.selectOptions(estado(), 'Estado: Inactivas')

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar Maracaná' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(actualizarFinca).toHaveBeenCalledExactlyOnceWith('f-3', { activo: true })
    expect(await screen.findByRole('status')).toHaveTextContent('Finca reactivada.')
  })

  it('RNF-11: si ya no tiene permiso, lo dice', async () => {
    vi.mocked(actualizarFinca).mockRejectedValue(new Error('SIN_PERMISO'))
    abrir()
    await screen.findByRole('table')
    await userEvent.selectOptions(estado(), 'Estado: Inactivas')

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar Maracaná' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
  })
})
