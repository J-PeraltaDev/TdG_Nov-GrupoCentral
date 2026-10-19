import 'fake-indexeddb/auto'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarBd, guardarMeta, leerMeta, NOMBRE_BD, VERSION_BD } from '../../core/offline/bd.js'
import {
  cambiarSincronizacion,
  leerSincronizacion,
} from '../../core/offline/estadoDeSincronizacion.js'
import { reintentar } from '../../core/offline/sincronizador.js'
import { PERFILES, pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Pendientes from './Pendientes.jsx'

vi.mock('../../core/offline/sincronizador.js', () => ({ reintentar: vi.fn() }))

const YO = PERFILES.reportante.id

/** Pendientes como las de Figma 08: 7F3A ya enviada, 81C2 y 8A10 en la cola. */
const pendiente = (id, minuto, cambios = {}) => ({
  id_local: `${id}0000-0000-4000-8000-000000000000`,
  fecha_registro: `2026-10-14T${String(11 + Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}:00.000Z`,
  descripcion: `Novedad ${id}`,
  prioridad: 'normal',
  area_id: 'area-m',
  area: 'Mantenimiento',
  finca_id: PERFILES.reportante.finca_id,
  reportante_id: YO,
  envio: 'pendiente',
  intentos: 0,
  ultimo_error: null,
  ...cambios,
})
const P1 = pendiente('7f3a', 52)
const P2 = pendiente('81c2', 65)
const P3 = pendiente('8a10', 78, {
  envio: 'error',
  intentos: 1,
  ultimo_error: { tipo: 'red', codigo: 'RED', mensaje: 'No hay conexión.' },
})

async function sembrar(...pendientes) {
  await leerMeta('abrir')
  await cerrarBd()
  const bd = await openDB(NOMBRE_BD, VERSION_BD)
  for (const p of pendientes) await bd.put('pendientes', p)
  bd.close()
}

function abrir() {
  return pintarConSesion(
    <Routes>
      <Route path="/pendientes" element={<Pendientes />} />
      <Route path="/ingresar" element={<h1>Ingreso</h1>} />
    </Routes>,
    { ruta: '/pendientes', rol: 'reportante' },
  )
}

const tarjeta = (codigo) => screen.getByText(codigo).closest('li')

describe('Pantalla 08 · Pendientes de sincronizar (RF-22, RF-23 / CU-22, CU-23)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    vi.mocked(reintentar).mockReset()
    cambiarSincronizacion({
      enCurso: false,
      total: 0,
      hechas: 0,
      enviando: null,
      enviadas: [],
      sesionVencida: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('RF-22 / CU-23 3a: muestra cada una en el orden en que se registró, con su identificador, su hora y cómo va', async () => {
    // 08 muestra solo la hora cuando el registro es de hoy: el reloj va el día de las pendientes.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-14T15:00:00Z') })
    await sembrar(P3, P2)
    cambiarSincronizacion({ enviadas: [{ ...P1, codigo: 155 }] })
    abrir()

    // La enviada sale del estado; las demás, de IndexedDB: se espera la última.
    await screen.findByText('LOC-8A10')
    const lista = screen.getByRole('list', { name: 'Pendientes de sincronizar' })
    const codigos = within(lista)
      .getAllByText(/^LOC-/)
      .map((e) => e.textContent)
    expect(codigos).toEqual(['LOC-7F3A', 'LOC-81C2', 'LOC-8A10'])

    expect(within(tarjeta('LOC-7F3A')).getByText('Enviada · código NOV-0155')).toBeVisible()
    expect(within(tarjeta('LOC-7F3A')).getByText('Registrada en finca: 6:52 a. m.')).toBeVisible()
    expect(within(tarjeta('LOC-81C2')).getByText('En espera')).toBeVisible()
    expect(within(tarjeta('LOC-8A10')).getByText('Error al enviar')).toBeVisible()
    expect(
      within(tarjeta('LOC-8A10')).getByText('Se perdió la conexión durante el envío'),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Cada novedad conserva la fecha y hora en que la registraste en la finca. Si un envío se repite, no se crea un duplicado.',
      ),
    ).toBeVisible()
  })

  it('RF-22 / CU-22: mientras envía dice cuál va y cuántas faltan', async () => {
    await sembrar(P2, P3)
    cambiarSincronizacion({
      enCurso: true,
      total: 3,
      hechas: 1,
      enviando: P2.id_local,
      enviadas: [{ ...P1, codigo: 155 }],
    })
    abrir()

    await screen.findByText('LOC-81C2')
    expect(screen.getByText('Enviando 2 de 3')).toBeVisible()
    expect(within(tarjeta('LOC-81C2')).getByText('Enviando…')).toBeVisible()
    // Un reintento a mitad del ciclo no entraría en él: se espera a que termine.
    expect(within(tarjeta('LOC-8A10')).getByRole('button', { name: 'Reintentar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reintentar todo' })).toBeDisabled()
  })

  it('RF-22 / CU-22 4b y CU-23 3a: una regla de negocio se muestra con su mensaje y se reintenta a mano', async () => {
    const rechazada = pendiente('9b20', 90, {
      envio: 'error',
      ultimo_error: {
        tipo: 'negocio',
        codigo: 'FINCA_NO_ASIGNADA',
        mensaje: 'Tu usuario no tiene una finca asignada.',
      },
    })
    await sembrar(rechazada)
    abrir()

    const enLaTarjeta = within(await screen.findByRole('listitem'))
    expect(enLaTarjeta.getByText('Tu usuario no tiene una finca asignada.')).toBeVisible()
    await userEvent.click(enLaTarjeta.getByRole('button', { name: 'Reintentar' }))

    expect(reintentar).toHaveBeenCalledWith(YO, rechazada.id_local)
  })

  it('RF-22 (08): «Reintentar todo» vuelve a enviar todas las que quedan', async () => {
    await sembrar(P2, P3)
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar todo' }))

    expect(reintentar).toHaveBeenCalledWith(YO)
  })

  it('RF-22 / CU-22 3a (08-B): con la sesión vencida pide ingresar; la cola se conserva', async () => {
    await sembrar(P2, P3)
    cambiarSincronizacion({ sesionVencida: true })
    const { sesion } = abrir()

    const aviso = await screen.findByRole('alert')
    expect(within(aviso).getByText('Tu sesión venció')).toBeVisible()
    expect(
      within(aviso).getByText(
        'Ingresa de nuevo para enviar las 2 novedades pendientes; siguen guardadas en este teléfono.',
      ),
    ).toBeVisible()
    expect(await screen.findByText('Sincronización detenida')).toBeVisible()

    await userEvent.click(within(aviso).getByRole('button', { name: 'Ingresar' }))

    expect(sesion.salir).toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Ingreso' })).toBeVisible()
  })

  it('RF-22 (08): sin pendientes lo dice, con la última sincronización completa', async () => {
    await guardarMeta('ultima_sincronizacion', new Date().toISOString())
    abrir()

    expect(await screen.findByText(/^Última sincronización completa: hoy /)).toBeVisible()
    expect(screen.getByText('Todo está sincronizado')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Reintentar todo' })).not.toBeInTheDocument()
  })

  it('RF-22 (08): al salir de la pantalla, las enviadas dejan de mostrarse', async () => {
    cambiarSincronizacion({ enviadas: [{ ...P1, codigo: 155 }] })
    const { unmount } = abrir()
    await screen.findByText('LOC-7F3A')

    unmount()

    await waitFor(() => expect(leerSincronizacion().enviadas).toEqual([]))
  })
})
