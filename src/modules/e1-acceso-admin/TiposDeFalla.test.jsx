import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  desactivarTipoFalla,
  fusionarTiposFalla,
  listarCambios,
  listarCatalogo,
  reactivarTipoFalla,
  renombrarTipoFalla,
} from '../../core/supabase/repositorios/tiposFalla.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import TiposDeFalla from './TiposDeFalla.jsx'

// Se simula el repositorio, nunca la red.
vi.mock('../../core/supabase/repositorios/tiposFalla.js', () => ({
  listarCatalogo: vi.fn(),
  listarCambios: vi.fn(),
  renombrarTipoFalla: vi.fn(),
  fusionarTiposFalla: vi.fn(),
  desactivarTipoFalla: vi.fn(),
  reactivarTipoFalla: vi.fn(),
}))

const tipo = (id, nombre, novedades, cambios = {}) => ({
  id,
  nombre,
  activo: true,
  novedades,
  creado_en: '2026-04-14T15:00:00+00:00',
  creado_por: 'Jhon Fredy Mosquera',
  ...cambios,
})

const TIPOS = [
  tipo('radio', 'Radio de comunicación', 1, { activo: false }),
  tipo('bio', 'Biométrico', 11),
  tipo('falla-bio', 'Falla biometrico', 2),
  tipo('internet', 'Conectividad a internet', 16),
  // Fusionado: inactivo, sin novedades y con su auditoría.
  tipo('viejo', 'Biometrico viejo', 0, { activo: false }),
]

const CAMBIOS = [
  {
    id: 'c-3',
    tipo_falla_id: 'internet',
    tipo_destino_id: null,
    accion: 'renombrar',
    valor_anterior: 'internet',
    fecha: '2026-09-20T15:00:00+00:00',
    usuario: 'Paula Giraldo',
  },
  {
    id: 'c-2',
    tipo_falla_id: 'radio',
    tipo_destino_id: null,
    accion: 'desactivar',
    valor_anterior: 'Radio de comunicación',
    fecha: '2026-09-18T15:00:00+00:00',
    usuario: 'Paula Giraldo',
  },
  {
    id: 'c-1',
    tipo_falla_id: 'viejo',
    tipo_destino_id: 'bio',
    accion: 'fusionar',
    valor_anterior: 'Biometrico viejo',
    fecha: '2026-09-01T15:00:00+00:00',
    usuario: 'Paula Giraldo',
  },
]

function abrir() {
  return pintarConSesion(<TiposDeFalla />, { ruta: '/tipos-de-falla', rol: 'administrador' })
}

const tablaDeTipos = async () =>
  within(await screen.findByRole('table', { name: 'Tipos de falla' }))
const dialogo = () => within(screen.getByRole('dialog'))

beforeEach(() => {
  simularPantalla('escritorio')
  vi.mocked(listarCatalogo).mockResolvedValue(TIPOS)
  vi.mocked(listarCambios).mockResolvedValue(CAMBIOS)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('Pantalla 31 · Tipos de falla (RF-32 / CU-32)', () => {
  it('RF-32 / CU-32 2: los activos por novedades y los inactivos al final; sin los fusionados', async () => {
    abrir()

    const tabla = await tablaDeTipos()
    const filas = tabla.getAllByRole('row').slice(1)
    expect(filas.map((fila) => within(fila).getByRole('rowheader').textContent)).toEqual([
      'Conectividad a internet',
      'Biométrico',
      'Falla biometrico',
      'Radio de comunicación',
    ])
    expect(
      within(filas[0])
        .getAllByRole('cell')
        .map((celda) => celda.textContent),
    ).toEqual(['16', 'Jhon Fredy Mosquera', '14 abr 2026', 'Activo', 'RenombrarFusionarDesactivar'])
  })

  it('RF-32 / cambio 39: un tipo desactivado solo se reactiva, sin confirmación', async () => {
    vi.mocked(reactivarTipoFalla).mockResolvedValue({})
    abrir()

    const fila = (await tablaDeTipos()).getByRole('row', { name: /^Radio de comunicación/ })
    expect(within(fila).getByText('Inactivo')).toBeVisible()
    for (const accion of ['Renombrar', 'Fusionar', 'Desactivar']) {
      expect(
        within(fila).queryByRole('button', { name: `${accion} Radio de comunicación` }),
      ).not.toBeInTheDocument()
    }

    await userEvent.click(
      within(fila).getByRole('button', { name: 'Reactivar Radio de comunicación' }),
    )

    expect(reactivarTipoFalla).toHaveBeenCalledExactlyOnceWith('radio')
    expect(await screen.findByText('Tipo de falla reactivado.')).toBeVisible()
    expect(listarCatalogo).toHaveBeenCalledTimes(2)
  })

  it('RF-32 / cambio 39: si no se puede reactivar, lo dice', async () => {
    vi.mocked(reactivarTipoFalla).mockRejectedValue({ message: 'TIPO_FALLA_INVALIDO' })
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Reactivar Radio de comunicación' }),
    )

    expect(
      await screen.findByText('Ese tipo de falla no está disponible. Elige otro.'),
    ).toBeVisible()
  })

  it('RF-32: el registro de cambios dice fecha, usuario, acción y el antes y el después', async () => {
    abrir()

    const registro = within(await screen.findByRole('table', { name: 'Registro de cambios' }))
    const filas = registro.getAllByRole('row').slice(1)
    expect(filas.map((fila) => fila.textContent)).toEqual([
      '20 sep 2026Paula GiraldoRenombrar«internet» → «Conectividad a internet»',
      '18 sep 2026Paula GiraldoDesactivar«Radio de comunicación»',
      '1 sep 2026Paula GiraldoFusionar«Biometrico viejo» → «Biométrico»',
    ])
  })

  it('RF-32 / CU-32 3: renombra un tipo y vuelve a cargar el catálogo', async () => {
    vi.mocked(renombrarTipoFalla).mockResolvedValue({})
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Renombrar Conectividad a internet' }),
    )
    const campo = dialogo().getByRole('textbox', { name: 'Nombre nuevo' })
    expect(campo).toHaveValue('Conectividad a internet')
    await userEvent.clear(campo)
    await userEvent.type(campo, '  Internet   satelital ')
    await userEvent.click(dialogo().getByRole('button', { name: 'Renombrar' }))

    expect(renombrarTipoFalla).toHaveBeenCalledExactlyOnceWith('internet', 'Internet satelital')
    expect(await screen.findByText('Tipo de falla renombrado.')).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarCatalogo).toHaveBeenCalledTimes(2)
  })

  it('RF-32 / CU-32 3a: el nombre de otro tipo activo propone fusionarlos en su lugar (31-B)', async () => {
    vi.mocked(fusionarTiposFalla).mockResolvedValue({})
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Renombrar Falla biometrico' }),
    )
    const campo = dialogo().getByRole('textbox', { name: 'Nombre nuevo' })
    await userEvent.clear(campo)
    await userEvent.type(campo, 'biométrico')

    expect(
      dialogo().getByText('Ya existe «Biométrico». ¿Quieres fusionar los dos tipos?'),
    ).toBeVisible()
    await userEvent.click(dialogo().getByRole('button', { name: 'Fusionar en su lugar' }))

    // 31: los dos ya elegidos, con lo que va a pasar.
    expect(screen.getByRole('dialog', { name: 'Fusionar tipos de falla' })).toBeVisible()
    expect(dialogo().getByRole('combobox', { name: 'Tipo de origen' })).toHaveValue('falla-bio')
    expect(dialogo().getByRole('combobox', { name: 'Tipo de destino' })).toHaveValue('bio')
    expect(
      dialogo().getByText(
        'Las 2 novedades de «Falla biometrico» pasarán a «Biométrico», que quedará con 13. «Falla biometrico» saldrá de la lista.',
      ),
    ).toBeVisible()
    expect(renombrarTipoFalla).not.toHaveBeenCalled()

    await userEvent.click(dialogo().getByRole('button', { name: 'Fusionar' }))
    expect(fusionarTiposFalla).toHaveBeenCalledExactlyOnceWith('falla-bio', 'bio')
    expect(await screen.findByText('Tipos de falla fusionados.')).toBeVisible()
  })

  it('RF-32 / decisión 49: el nombre de un tipo inactivo no se puede usar', async () => {
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Renombrar Biométrico' }),
    )
    const campo = dialogo().getByRole('textbox', { name: 'Nombre nuevo' })
    await userEvent.clear(campo)
    await userEvent.type(campo, 'RADIO DE COMUNICACION')
    await userEvent.click(dialogo().getByRole('button', { name: 'Renombrar' }))

    expect(campo).toHaveAccessibleDescription(
      'Ya existe «Radio de comunicación», pero está inactivo. Elige otro nombre.',
    )
    expect(renombrarTipoFalla).not.toHaveBeenCalled()
  })

  it('RF-32 / decisión 49: si el servidor responde TIPO_FALLA_DUPLICADO, recarga la lista y muestra 31-B', async () => {
    vi.mocked(renombrarTipoFalla).mockRejectedValue({ message: 'TIPO_FALLA_DUPLICADO' })
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Renombrar Biométrico' }),
    )
    // Mientras tanto, un aprobador creó «Lector biométrico».
    vi.mocked(listarCatalogo).mockResolvedValue([...TIPOS, tipo('lector', 'Lector biométrico', 1)])
    const campo = dialogo().getByRole('textbox', { name: 'Nombre nuevo' })
    await userEvent.clear(campo)
    await userEvent.type(campo, 'Lector biometrico')
    await userEvent.click(dialogo().getByRole('button', { name: 'Renombrar' }))

    expect(
      await screen.findByText('Ya existe «Lector biométrico». ¿Quieres fusionar los dos tipos?'),
    ).toBeVisible()
    expect(dialogo().getByRole('button', { name: 'Fusionar en su lugar' })).toBeVisible()
  })

  it('RF-32 / CU-32 4a: un tipo no se fusiona consigo mismo (31-C)', async () => {
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Fusionar Biométrico' }),
    )
    await userEvent.selectOptions(
      dialogo().getByRole('combobox', { name: 'Tipo de destino' }),
      'Biométrico (11 novedades)',
    )

    expect(
      dialogo().getByRole('combobox', { name: 'Tipo de destino' }),
    ).toHaveAccessibleDescription('El tipo de origen y el de destino deben ser distintos')
    const fusionar = dialogo().getByRole('button', { name: 'Fusionar' })
    expect(fusionar).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(fusionar)
    expect(fusionarTiposFalla).not.toHaveBeenCalled()
  })

  it('RF-32: los dos tipos son obligatorios al fusionar', async () => {
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Fusionar Biométrico' }),
    )
    const origen = dialogo().getByRole('combobox', { name: 'Tipo de origen' })
    // Las opciones van por nombre.
    expect(
      within(origen)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual([
      'Elige el tipo de origen',
      'Biométrico (11 novedades)',
      'Conectividad a internet (16 novedades)',
      'Falla biometrico (2 novedades)',
    ])
    await userEvent.selectOptions(origen, 'Elige el tipo de origen')
    await userEvent.click(dialogo().getByRole('button', { name: 'Fusionar' }))

    expect(origen).toHaveAccessibleDescription('Elige el tipo de origen.')
    expect(
      dialogo().getByRole('combobox', { name: 'Tipo de destino' }),
    ).toHaveAccessibleDescription('Elige el tipo de destino.')
    expect(origen).toHaveFocus()
    expect(fusionarTiposFalla).not.toHaveBeenCalled()
  })

  it('RF-32: desactivar pide la confirmación y dice qué pasa con sus novedades', async () => {
    vi.mocked(desactivarTipoFalla).mockResolvedValue({})
    abrir()

    await userEvent.click(
      (await tablaDeTipos()).getByRole('button', { name: 'Desactivar Biométrico' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Desactivar tipo de falla' }),
    ).toHaveAccessibleDescription(
      '«Biométrico» saldrá de las sugerencias. Sus 11 novedades lo conservan.',
    )
    await userEvent.click(dialogo().getByRole('button', { name: 'Desactivar' }))

    expect(desactivarTipoFalla).toHaveBeenCalledExactlyOnceWith('bio')
    expect(await screen.findByText('Tipo de falla desactivado.')).toBeVisible()
  })

  it('RF-32 / decisión 64: en el teléfono cada tipo es una tarjeta con sus acciones', async () => {
    simularPantalla('telefono')
    abrir()

    const tarjeta = await screen.findByRole('article', { name: 'Biométrico' })
    expect(tarjeta).toHaveTextContent(
      '11 novedades · Creado por Jhon Fredy Mosquera el 14 abr 2026',
    )
    expect(within(tarjeta).getByRole('button', { name: 'Renombrar Biométrico' })).toBeEnabled()
  })
})
