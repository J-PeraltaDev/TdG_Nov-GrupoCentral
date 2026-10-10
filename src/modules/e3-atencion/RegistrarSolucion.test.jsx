import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listarLineaDeTiempo,
  obtenerNovedad,
  registrarSolucion,
} from '../../core/supabase/repositorios/novedades.js'
import { sugerirTiposFalla } from '../../core/supabase/repositorios/tiposFalla.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import RegistrarSolucion from './RegistrarSolucion.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  obtenerNovedad: vi.fn(),
  listarLineaDeTiempo: vi.fn(),
  registrarSolucion: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/tiposFalla.js', () => ({
  sugerirTiposFalla: vi.fn(),
}))

const ID = '00000000-0000-4000-e000-000000000149'
// 11:10 p. m. del 24 de septiembre en Colombia: en UTC ya es 25.
const AHORA = new Date('2026-09-25T04:10:00Z')

const EN_ATENCION = {
  id: ID,
  codigo: 149,
  descripcion: 'El biométrico registra al personal pero no le deja marcar entrada ni salida.',
  prioridad: 'alto',
  estado: 'en_atencion',
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
const APROBADA = { ...EN_ATENCION, estado: 'aprobada' }
const DECISION = {
  id: 5,
  estado_anterior: 'escalada',
  estado_nuevo: 'aprobada',
  observacion: 'Aprobado. Comprar con el proveedor habitual.',
  fecha_hora: '2026-09-22T13:10:00Z',
  area_anterior: null,
  area_nueva: null,
  usuario: { nombre: 'Hernán Darío Úsuga', rol_id: 3, area: null },
}
const BIOMETRICO = {
  id: 'tipo-b',
  nombre: 'Biométrico',
  cantidad_novedades: 11,
  coincidencia_exacta: true,
}

/** El detalle, reducido a lo que la pantalla le entrega al volver. */
function DetalleDePrueba() {
  const { state } = useLocation()
  return (
    <>
      <h1>Detalle de la novedad</h1>
      <p data-testid="origen">{state?.origen}</p>
      <p data-testid="aviso">{state?.aviso}</p>
      <p data-testid="error">{String(Boolean(state?.avisoDeError))}</p>
    </>
  )
}

function abrir({ rol = 'aprobador', id = ID, origen = '/bandeja?pestana=en_atencion' } = {}) {
  return pintarConSesion(
    <Routes>
      <Route path="/novedades/:id/solucion" element={<RegistrarSolucion />} />
      <Route path="/novedades/:id" element={<DetalleDePrueba />} />
    </Routes>,
    { ruta: { pathname: `/novedades/${id}/solucion`, state: { origen } }, rol },
  )
}

function conNovedad(novedad = EN_ATENCION, transiciones = []) {
  vi.mocked(obtenerNovedad).mockResolvedValue(novedad)
  vi.mocked(listarLineaDeTiempo).mockResolvedValue(transiciones)
}

const solucion = () => screen.getByRole('textbox', { name: '¿Qué se hizo?' })
// La etiqueta lleva el asterisco de «obligatorio», que no se lee pero sí es texto.
const fecha = () => screen.getByLabelText(/^Fecha de ejecución/)
const tipo = () => screen.getByRole('combobox', { name: 'Tipo de falla' })
const enviar = () => screen.getByRole('button', { name: 'Marcar como resuelta' })
const listo = () => screen.findByRole('heading', { level: 1, name: 'Registrar solución' })

/** Escribe en el campo del tipo y elige la opción con ese nombre. */
async function elegirTipo(texto, opcion) {
  await userEvent.type(tipo(), texto)
  await userEvent.click(await screen.findByRole('option', { name: opcion }))
}

/** Llena los tres datos con un tipo existente. */
async function llenar() {
  await userEvent.type(solucion(), 'Se actualizó el firmware del biométrico.')
  await elegirTipo('biometrico', /Biométrico/)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: AHORA })
  simularPantalla('telefono')
  vi.mocked(obtenerNovedad).mockReset()
  vi.mocked(listarLineaDeTiempo).mockReset()
  vi.mocked(registrarSolucion).mockReset()
  vi.mocked(sugerirTiposFalla).mockReset()
  vi.mocked(sugerirTiposFalla).mockResolvedValue([BIOMETRICO])
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Pantalla 18 · Registrar solución y tipo de falla (RF-14 / CU-14)', () => {
  it('RF-14 / CU-14 2: pide qué se hizo, la fecha de ejecución y el tipo de falla de la novedad', async () => {
    conNovedad()
    abrir()
    await listo()

    expect(screen.getByText('NOV-0149')).toBeVisible()
    expect(screen.getByText(/Finca de prueba 01/)).toBeVisible()
    expect(solucion()).toBeRequired()
    expect(solucion()).toHaveValue('')
    expect(screen.getByText('0/500')).toBeVisible()
    expect(fecha()).toBeRequired()
    expect(fecha()).toHaveAccessibleDescription('No puede ser posterior a hoy')
    expect(tipo()).toBeRequired()
    expect(screen.getByText('La finca deberá confirmar el cierre')).toBeVisible()
    expect(enviar()).toBeEnabled()
    // No es una novedad aprobada: no hay recuadro del director.
    expect(screen.queryByRole('region', { name: 'Aprobación del director' })).toBeNull()
  })

  it('RF-14: la fecha de ejecución empieza en hoy en Colombia y no deja elegir una posterior', async () => {
    conNovedad()
    abrir()
    await listo()

    // A las 11:10 p. m. en Colombia ya es 25 en UTC; el campo dice 24.
    expect(fecha()).toHaveValue('2026-09-24')
    expect(fecha()).toHaveAttribute('max', '2026-09-24')
    expect(fecha()).toHaveAttribute('type', 'date')
  })

  it('la descripción de la novedad va recogida y se puede desplegar', async () => {
    conNovedad()
    abrir()
    await listo()

    const resumen = screen.getByRole('button', { name: /El biométrico registra al personal/ })
    expect(resumen).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(resumen)
    expect(resumen).toHaveAttribute('aria-expanded', 'true')
  })

  it('RF-14 / CU-14 5 a 8: con un tipo existente llama a la función con su identificador y vuelve al detalle con el aviso', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockResolvedValue({ id: ID, estado: 'resuelta' })
    abrir()
    await listo()

    await llenar()
    await userEvent.click(enviar())

    expect(registrarSolucion).toHaveBeenCalledExactlyOnceWith(ID, {
      solucion: 'Se actualizó el firmware del biométrico.',
      fecha_ejecucion: '2026-09-24',
      tipo_falla_id: 'tipo-b',
      tipo_falla_nombre: null,
    })
    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
    expect(screen.getByTestId('aviso')).toHaveTextContent(
      'Solución registrada. La finca debe confirmar el cierre.',
    )
    expect(screen.getByTestId('error')).toHaveTextContent('false')
    // El detalle sigue sabiendo de qué lista se abrió.
    expect(screen.getByTestId('origen')).toHaveTextContent('/bandeja?pestana=en_atencion')
  })

  it('RF-14 / CU-14 5: con un tipo nuevo envía su nombre, sin identificador', async () => {
    conNovedad()
    vi.mocked(sugerirTiposFalla).mockResolvedValue([])
    vi.mocked(registrarSolucion).mockResolvedValue({ id: ID, estado: 'resuelta' })
    abrir()
    await listo()

    await userEvent.type(solucion(), '  Se templó el cable.  ')
    await elegirTipo('Cable vía', 'Crear tipo nuevo «Cable vía»')
    fireEvent.change(fecha(), { target: { value: '2026-09-22' } })
    await userEvent.click(enviar())

    expect(registrarSolucion).toHaveBeenCalledExactlyOnceWith(ID, {
      solucion: 'Se templó el cable.',
      fecha_ejecucion: '2026-09-22',
      tipo_falla_id: null,
      tipo_falla_nombre: 'Cable vía',
    })
  })

  it('RF-14 / CU-14 6a: sin datos señala los tres campos, lleva el foco al primero y no envía', async () => {
    conNovedad()
    abrir()
    await listo()
    fireEvent.change(fecha(), { target: { value: '' } })

    await userEvent.click(enviar())

    expect(registrarSolucion).not.toHaveBeenCalled()
    expect(solucion()).toBeInvalid()
    expect(solucion()).toHaveAccessibleDescription('Describe qué se hizo.')
    expect(fecha()).toBeInvalid()
    expect(fecha()).toHaveAccessibleDescription('Indica la fecha de ejecución.')
    expect(tipo()).toBeInvalid()
    expect(tipo()).toHaveAccessibleDescription('Elige un tipo de falla o crea uno nuevo.')
    expect(solucion()).toHaveFocus()

    // Al corregir un campo, su error se quita.
    await userEvent.type(solucion(), 'Se reinició')
    expect(solucion()).not.toBeInvalid()
  })

  it('RF-14 / CU-14 6a (18-B): una fecha posterior a hoy no se envía; lo dice con la fecha de hoy', async () => {
    conNovedad()
    abrir()
    await listo()
    await llenar()
    fireEvent.change(fecha(), { target: { value: '2026-09-26' } })

    await userEvent.click(enviar())

    expect(registrarSolucion).not.toHaveBeenCalled()
    expect(fecha()).toBeInvalid()
    expect(fecha()).toHaveAccessibleDescription(
      'La fecha de ejecución no puede ser posterior a hoy (24 sep 2026)',
    )
    expect(fecha()).toHaveFocus()

    // Con una fecha válida el error se quita y se puede enviar.
    vi.mocked(registrarSolucion).mockResolvedValue({ id: ID, estado: 'resuelta' })
    fireEvent.change(fecha(), { target: { value: '2026-09-24' } })
    expect(fecha()).not.toBeInvalid()
    await userEvent.click(enviar())
    expect(registrarSolucion).toHaveBeenCalledOnce()
  })

  it('RF-14 (18-B): si es el servidor el que responde FECHA_INVALIDA, la pantalla queda en el mismo estado', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockRejectedValue({ code: 'P0001', message: 'FECHA_INVALIDA' })
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    await vi.waitFor(() => expect(fecha()).toBeInvalid())
    expect(fecha()).toHaveAccessibleDescription(
      'La fecha de ejecución no puede ser posterior a hoy (24 sep 2026)',
    )
    // Lo escrito sigue ahí.
    expect(solucion()).toHaveValue('Se actualizó el firmware del biométrico.')
    expect(screen.queryByRole('heading', { name: 'Detalle de la novedad' })).toBeNull()
  })

  it('RF-14: si el tipo dejó de estar disponible, lo dice en su campo y pide elegir otro', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockRejectedValue({
      code: 'P0001',
      message: 'TIPO_FALLA_INVALIDO',
    })
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    await vi.waitFor(() => expect(tipo()).toBeInvalid())
    // El tipo elegido se quita: vuelve el campo de búsqueda, con su error.
    expect(tipo()).toHaveAccessibleDescription('Ese tipo de falla no está disponible. Elige otro.')
  })

  it('RF-14: mientras guarda, el botón dice «Guardando…» y no admite otro toque', async () => {
    conNovedad()
    let terminar
    vi.mocked(registrarSolucion).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    const ocupado = await screen.findByRole('button', { name: 'Guardando…' })
    expect(ocupado).toBeDisabled()
    await userEvent.click(ocupado)
    expect(registrarSolucion).toHaveBeenCalledOnce()

    terminar({ id: ID, estado: 'resuelta' })
    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
  })

  it('RF-25 / CU-14 1a (14-C): si se pierde la conexión dice que no se aplicó, conserva lo escrito y deja reintentar', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se aplicó: se perdió la conexión. La novedad sigue En atención.',
    )
    expect(solucion()).toHaveValue('Se actualizó el firmware del biométrico.')

    vi.mocked(registrarSolucion).mockResolvedValue({ id: ID, estado: 'resuelta' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
    expect(registrarSolucion).toHaveBeenCalledTimes(2)
  })

  it('RF-14: si alguien cambió el estado antes, vuelve al detalle con el aviso de error', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockRejectedValue({
      code: 'P0001',
      message: 'TRANSICION_INVALIDA',
    })
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
    expect(screen.getByTestId('aviso')).toHaveTextContent('La novedad cambió de estado.')
    expect(screen.getByTestId('error')).toHaveTextContent('true')
  })

  it('RNF-11: si el servidor niega el permiso, muestra su mensaje y se queda en la pantalla', async () => {
    conNovedad()
    vi.mocked(registrarSolucion).mockRejectedValue({ code: 'P0001', message: 'SIN_PERMISO' })
    abrir()
    await listo()
    await llenar()

    await userEvent.click(enviar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(enviar()).toBeEnabled()
  })

  it('«Cerrar» vuelve al detalle sin registrar nada', async () => {
    conNovedad()
    abrir()
    await listo()

    await userEvent.click(screen.getByRole('link', { name: 'Cerrar sin registrar la solución' }))

    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
    expect(registrarSolucion).not.toHaveBeenCalled()
    expect(screen.getByTestId('origen')).toHaveTextContent('/bandeja?pestana=en_atencion')
    expect(screen.getByTestId('aviso')).toBeEmptyDOMElement()
  })
})

describe('Pantalla 18-C · Novedad aprobada por el director (RF-14 / CU-14)', () => {
  it('muestra la decisión del director: quién, cuándo y su observación', async () => {
    conNovedad(APROBADA, [DECISION])
    abrir()
    await listo()

    const aprobacion = within(screen.getByRole('region', { name: 'Aprobación del director' }))
    expect(aprobacion.getByText('Aprobada por el director de agricultura')).toBeVisible()
    expect(aprobacion.getByText('Hernán Darío Úsuga · 22 sep, 8:10 a. m.')).toBeVisible()
    expect(aprobacion.getByText('«Aprobado. Comprar con el proveedor habitual.»')).toBeVisible()
  })

  it('toma la última aprobación y no escribe comillas si el director no dejó observación', async () => {
    conNovedad(APROBADA, [
      { ...DECISION, id: 9, observacion: null, fecha_hora: '2026-09-23T15:00:00Z' },
      { ...DECISION, id: 8, estado_anterior: 'aprobada', estado_nuevo: 'en_atencion' },
      DECISION,
    ])
    abrir()
    await listo()

    const aprobacion = within(screen.getByRole('region', { name: 'Aprobación del director' }))
    expect(aprobacion.getByText('Hernán Darío Úsuga · 23 sep, 10:00 a. m.')).toBeVisible()
    expect(aprobacion.queryByText(/«/)).not.toBeInTheDocument()
  })

  it('registra la solución igual que una novedad en atención', async () => {
    conNovedad(APROBADA, [DECISION])
    vi.mocked(registrarSolucion).mockResolvedValue({ id: ID, estado: 'resuelta' })
    abrir()
    await listo()

    await llenar()
    await userEvent.click(enviar())

    expect(registrarSolucion).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
  })
})

describe('Registrar solución: cuándo no hay formulario (RF-14, RNF-11)', () => {
  it.each(['asignada', 'escalada', 'resuelta', 'cerrada', 'rechazada'])(
    'una novedad %s no admite la solución: va al detalle',
    async (estado) => {
      conNovedad({ ...EN_ATENCION, estado })
      abrir()

      expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
      expect(screen.getByTestId('origen')).toHaveTextContent('/bandeja?pestana=en_atencion')
    },
  )

  it('una novedad de otra área tampoco: va al detalle, que decide qué mostrar', async () => {
    conNovedad({ ...EN_ATENCION, area_id: 'area-s', area: 'Sistemas' })
    abrir()

    expect(await screen.findByRole('heading', { name: 'Detalle de la novedad' })).toBeVisible()
  })

  it('RF-18 / CU-18 2a: si la novedad no está en su alcance, muestra «No puedes ver esta novedad»', async () => {
    conNovedad(null)
    abrir()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Marcar como resuelta' })).toBeNull()
  })

  it('un identificador que no es un uuid no consulta el servidor', async () => {
    abrir({ id: 'no-es-un-id' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No puedes ver esta novedad' }),
    ).toBeVisible()
    expect(obtenerNovedad).not.toHaveBeenCalled()
  })

  it('si la novedad no carga por la red, lo dice y deja reintentar', async () => {
    vi.mocked(obtenerNovedad).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.mocked(listarLineaDeTiempo).mockResolvedValue([])
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión.')
    vi.mocked(obtenerNovedad).mockResolvedValue(EN_ATENCION)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await listo()).toBeVisible()
  })
})

describe('Registrar solución en el escritorio (RF-14)', () => {
  it('el título va en el contenido, con «Cancelar» junto al botón', async () => {
    simularPantalla('escritorio')
    conNovedad()
    abrir()

    expect(await listo()).toBeVisible()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.queryByRole('link', { name: 'Cerrar sin registrar la solución' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      `/novedades/${ID}`,
    )
  })
})
