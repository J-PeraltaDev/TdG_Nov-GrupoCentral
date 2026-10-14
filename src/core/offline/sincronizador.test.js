import 'fake-indexeddb/auto'
import { renderHook } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alPedirRevisionDelPerfil } from '../sesion/perfilVigente.js'
import { confirmarSesion } from '../sesion/sesion.js'
import { registrarNovedad } from '../supabase/repositorios/novedades.js'
import { cerrarBd, leerMeta, NOMBRE_BD, VERSION_BD } from './bd.js'
import { leerSincronizacion } from './estadoDeSincronizacion.js'
import { reintentar, sincronizar, useSincronizacionAutomatica } from './sincronizador.js'

vi.mock('../supabase/repositorios/novedades.js', () => ({ registrarNovedad: vi.fn() }))
vi.mock('../sesion/sesion.js', () => ({ confirmarSesion: vi.fn() }))

const YO = 'u-1'

/** Una pendiente de la Tabla 32, registrada en el minuto `minuto` de la mañana. */
const pendiente = (n, cambios = {}) => ({
  id_local: `0000000${n}-0000-4000-8000-000000000000`,
  fecha_registro: `2026-09-24T11:${String(50 + n).padStart(2, '0')}:00.000Z`,
  descripcion: `Pendiente ${n}`,
  prioridad: 'normal',
  area_id: 'area-m',
  area: 'Mantenimiento',
  finca_id: 'finca-1',
  reportante_id: YO,
  envio: 'pendiente',
  intentos: 0,
  ultimo_error: null,
  ...cambios,
})

async function sembrar(...pendientes) {
  await leerMeta('abrir')
  await cerrarBd()
  const bd = await openDB(NOMBRE_BD, VERSION_BD)
  for (const p of pendientes) await bd.put('pendientes', p)
  bd.close()
}

async function cola() {
  await cerrarBd()
  const bd = await openDB(NOMBRE_BD, VERSION_BD)
  const todas = await bd.getAll('pendientes')
  bd.close()
  return Object.fromEntries(todas.map((p) => [p.descripcion, p]))
}

const registrada = (p, codigo) => ({ id: `n-${codigo}`, codigo, id_local: p.id_local })

describe('Sincronización de las pendientes (RF-22 / CU-22, SDD 6.1.5 y Figura 18)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    vi.mocked(registrarNovedad).mockReset()
    vi.mocked(confirmarSesion).mockReset().mockResolvedValue('vigente')
    // Web Locks: el bloqueo está libre, salvo que la prueba diga otra cosa.
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: true,
      locks: { request: vi.fn((_nombre, _opciones, trabajo) => trabajo({ name: 'libre' })) },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('RF-22 / CU-22 2 a 7: envía en el orden en que se registraron, con su identificador y su fecha, y las retira de la cola', async () => {
    const [p1, p2, p3] = [pendiente(1), pendiente(2), pendiente(3)]
    await sembrar(p3, p1, p2)
    vi.mocked(registrarNovedad).mockImplementation(async (p) =>
      registrada(p, 150 + Number(p.descripcion.at(-1))),
    )

    await sincronizar(YO)

    expect(vi.mocked(registrarNovedad).mock.calls.map(([p]) => p.descripcion)).toEqual([
      'Pendiente 1',
      'Pendiente 2',
      'Pendiente 3',
    ])
    expect(registrarNovedad).toHaveBeenCalledWith(
      expect.objectContaining({ id_local: p1.id_local, fecha_registro: p1.fecha_registro }),
    )
    expect(await cola()).toEqual({})
    expect(leerSincronizacion().enviadas.map((e) => e.codigo)).toEqual([151, 152, 153])
  })

  it('RF-22 / CU-22 4a: si el servidor ya la tenía, la da por sincronizada sin duplicarla', async () => {
    const p1 = pendiente(1)
    await sembrar(p1)
    // registrar_novedad es idempotente: con el mismo id_local devuelve la novedad que ya existe.
    vi.mocked(registrarNovedad).mockResolvedValue(registrada(p1, 151))

    await sincronizar(YO)
    await sincronizar(YO)

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
    expect(await cola()).toEqual({})
  })

  it('RF-22 / CU-22 3b: si la red se cae a mitad, marca la que se enviaba, conserva las demás y la reintenta sola al volver', async () => {
    await sembrar(pendiente(1), pendiente(2), pendiente(3))
    vi.mocked(registrarNovedad)
      .mockImplementationOnce(async (p) => registrada(p, 151))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await sincronizar(YO)

    const despues = await cola()
    expect(Object.keys(despues)).toEqual(['Pendiente 2', 'Pendiente 3'])
    expect(despues['Pendiente 2']).toMatchObject({
      envio: 'error',
      intentos: 1,
      ultimo_error: { tipo: 'red' },
    })
    expect(despues['Pendiente 3']).toMatchObject({ envio: 'pendiente', intentos: 0 })

    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 160))
    await sincronizar(YO)
    expect(await cola()).toEqual({})
  })

  it('RF-22 / CU-22 3a: con la sesión vencida no envía nada, conserva la cola y pide el ingreso (08-B)', async () => {
    await sembrar(pendiente(1))
    vi.mocked(confirmarSesion).mockResolvedValue('vencida')

    await sincronizar(YO)

    expect(registrarNovedad).not.toHaveBeenCalled()
    expect(leerSincronizacion().sesionVencida).toBe(true)
    expect((await cola())['Pendiente 1']).toMatchObject({ envio: 'pendiente' })
  })

  it('RF-22 / CU-22 3a: un 401 a mitad del envío detiene el ciclo y deja la novedad como estaba', async () => {
    await sembrar(pendiente(1), pendiente(2))
    vi.mocked(registrarNovedad).mockRejectedValue({ status: 401, message: 'JWT expired' })

    await sincronizar(YO)

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
    expect(leerSincronizacion().sesionVencida).toBe(true)
    expect((await cola())['Pendiente 1']).toMatchObject({ envio: 'pendiente' })
  })

  it('RF-22 / CU-22 4b: una regla de negocio la deja con el error y sigue con la siguiente; el ciclo automático no la repite, el reintento manual sí', async () => {
    await sembrar(pendiente(1), pendiente(2))
    vi.mocked(registrarNovedad)
      .mockRejectedValueOnce({ code: 'P0001', message: 'FINCA_NO_ASIGNADA' })
      .mockImplementationOnce(async (p) => registrada(p, 152))

    await sincronizar(YO)

    expect((await cola())['Pendiente 1']).toMatchObject({
      envio: 'error',
      ultimo_error: { tipo: 'negocio', codigo: 'FINCA_NO_ASIGNADA' },
    })
    expect(await cola()).not.toHaveProperty('Pendiente 2')

    await sincronizar(YO)
    expect(registrarNovedad).toHaveBeenCalledTimes(2)

    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 151))
    await reintentar(YO, pendiente(1).id_local)
    expect(registrarNovedad).toHaveBeenCalledTimes(3)
    expect(await cola()).toEqual({})
  })

  it('Decisión 8: SIN_PERMISO no marca toda la cola: deja esa con el error, pide releer el perfil y se detiene', async () => {
    await sembrar(pendiente(1), pendiente(2))
    vi.mocked(registrarNovedad).mockRejectedValue({ code: 'P0001', message: 'SIN_PERMISO' })
    const alPedir = vi.fn()
    const dejar = alPedirRevisionDelPerfil(alPedir)

    await sincronizar(YO)

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
    expect(alPedir).toHaveBeenCalledOnce()
    const despues = await cola()
    expect(despues['Pendiente 1']).toMatchObject({ envio: 'error' })
    expect(despues['Pendiente 2']).toMatchObject({ envio: 'pendiente', ultimo_error: null })
    dejar()
  })

  it('Decisión 6: dos llamadas a la vez hacen un solo ciclo', async () => {
    await sembrar(pendiente(1))
    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 151))

    await Promise.all([sincronizar(YO), sincronizar(YO)])

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
  })

  it('Decisión 6: si otra pestaña tiene el bloqueo, esta no envía nada', async () => {
    await sembrar(pendiente(1))
    navigator.locks.request.mockImplementation((_nombre, _opciones, trabajo) => trabajo(null))

    await sincronizar(YO)

    expect(navigator.locks.request).toHaveBeenCalledWith(
      'novedades-sincronizacion',
      { ifAvailable: true },
      expect.any(Function),
    )
    expect(registrarNovedad).not.toHaveBeenCalled()
  })

  it('Decisión 9: una que quedó «enviando» porque se cerró la aplicación se vuelve a enviar', async () => {
    await sembrar(pendiente(1, { envio: 'enviando', intentos: 1 }))
    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 151))

    await sincronizar(YO)

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
    expect(await cola()).toEqual({})
  })

  it('RNF-10: las pendientes de otra persona del dispositivo no se envían con esta sesión', async () => {
    await sembrar(pendiente(1, { reportante_id: 'u-2' }))

    await sincronizar(YO)

    expect(registrarNovedad).not.toHaveBeenCalled()
    expect(Object.keys(await cola())).toEqual(['Pendiente 1'])
  })

  it('RF-22: sin conexión no intenta nada', async () => {
    await sembrar(pendiente(1))
    navigator.onLine = false

    await sincronizar(YO)

    expect(confirmarSesion).not.toHaveBeenCalled()
    expect(registrarNovedad).not.toHaveBeenCalled()
  })

  it('RF-23 (08): guarda la fecha de la última sincronización completa', async () => {
    await sembrar(pendiente(1))
    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 151))

    await sincronizar(YO)

    expect(Date.parse(await leerMeta('ultima_sincronizacion'))).toBeLessThanOrEqual(Date.now())
  })

  it('Decisión 5: al abrir con sesión sincroniza, y cada vez que el monitor vuelve a «en línea»', async () => {
    await sembrar(pendiente(1))
    navigator.onLine = false
    vi.mocked(registrarNovedad).mockImplementation(async (p) => registrada(p, 151))

    const { unmount } = renderHook(() => useSincronizacionAutomatica(YO))
    await new Promise((r) => setTimeout(r, 50))
    expect(registrarNovedad).not.toHaveBeenCalled()

    navigator.onLine = true
    window.dispatchEvent(new Event('online'))

    await vi.waitFor(() => expect(registrarNovedad).toHaveBeenCalledTimes(1))
    await vi.waitFor(async () => expect(await cola()).toEqual({}))
    unmount()
  })

  it('RF-22 (08): cuenta las que ya intentó y dice cuál se está enviando', async () => {
    await sembrar(pendiente(1), pendiente(2))
    const vistos = []
    vi.mocked(registrarNovedad).mockImplementation(async (p) => {
      vistos.push({ ...leerSincronizacion() })
      return registrada(p, 150)
    })

    await sincronizar(YO)

    expect(vistos.map((v) => [v.total, v.hechas, v.enviando])).toEqual([
      [2, 0, pendiente(1).id_local],
      [2, 1, pendiente(2).id_local],
    ])
    expect(leerSincronizacion()).toMatchObject({ enCurso: false, hechas: 2, enviando: null })
  })
})
