import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cerrarBd,
  contarPendientes,
  guardarMeta,
  leerCatalogo,
  leerMeta,
  NOMBRE_BD,
} from '../offline/bd.js'
import { cerrarSesion, iniciarSesion, restaurarSesion, revisarSesion } from './sesion.js'

// Cliente de Supabase simulado: las unitarias nunca llaman a la red.
const supabase = vi.hoisted(() => ({
  auth: { signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn() },
  from: vi.fn(),
}))
vi.mock('../supabase/cliente.js', () => ({ supabase }))

const AREAS = [
  { id: 'area-m', nombre: 'Mantenimiento' },
  { id: 'area-s', nombre: 'Sistemas' },
]
const FINCA = {
  id: 'finca-1',
  nombre: 'Finca de prueba 01',
  razon_social: { id: 'rs-a', nombre: 'Razón social de prueba A' },
}
const REPORTANTE = {
  id: 'u-1',
  nombre: 'Reportante de prueba 01',
  rol_id: 1,
  finca_id: 'finca-1',
  area_id: null,
  activo: true,
}
const APROBADOR = {
  id: 'u-3',
  nombre: 'Aprobador de prueba',
  rol_id: 2,
  finca_id: null,
  area_id: 'area-m',
  activo: true,
}
const ERROR_DE_RED = { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }

/** Consulta encadenable de supabase-js que termina en `resultado`. */
function consulta(resultado) {
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    order: vi.fn(() => q),
    maybeSingle: vi.fn(async () => resultado),
    then: (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar),
  }
  return q
}

/** Simula las tablas que lee el ingreso. */
function conTablas({ usuario, areas = AREAS, finca = FINCA }) {
  const consultas = {
    usuario: consulta({ data: usuario, error: null }),
    area: consulta({ data: areas, error: null }),
    finca: consulta({ data: finca, error: null }),
  }
  supabase.from.mockImplementation((tabla) => consultas[tabla])
  return consultas
}

function conConexion(enLinea) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(enLinea)
}

describe('Sesión y perfil (RF-01 / CU-01, SDD 6.1.10)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    vi.clearAllMocks()
    conConexion(true)
    supabase.auth.signOut.mockResolvedValue({ error: null })
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist: vi.fn().mockResolvedValue(true) },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('iniciarSesion', () => {
    it('RF-01 / CU-01 curso normal: ingresa y deja el perfil y los catálogos en el dispositivo', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u-1' } },
        error: null,
      })
      conTablas({ usuario: REPORTANTE })

      const resultado = await iniciarSesion('  reportante.01@novedades.test ', 'una-clave')

      expect(resultado).toEqual({ ok: true, perfil: { ...REPORTANTE, finca: FINCA, area: null } })
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'reportante.01@novedades.test',
        password: 'una-clave',
      })
      expect(await leerMeta('perfil')).toEqual(resultado.perfil)
      expect(await leerCatalogo('areas')).toEqual(AREAS)
      expect(await leerCatalogo('finca')).toEqual(FINCA)
    })

    it('RF-01: el perfil del aprobador trae su área y no pide ninguna finca', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u-3' } },
        error: null,
      })
      conTablas({ usuario: APROBADOR })

      const resultado = await iniciarSesion('aprobador@novedades.test', 'una-clave')

      expect(resultado.perfil.area).toEqual({ id: 'area-m', nombre: 'Mantenimiento' })
      expect(resultado.perfil.finca).toBeNull()
      expect(supabase.from).not.toHaveBeenCalledWith('finca')
    })

    it('RNF-18: pide el perfil con columnas explícitas, sin el correo', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u-1' } },
        error: null,
      })
      const { usuario } = conTablas({ usuario: REPORTANTE })

      await iniciarSesion('reportante.01@novedades.test', 'una-clave')

      expect(usuario.select).toHaveBeenCalledWith('id, nombre, rol_id, finca_id, area_id, activo')
      expect(usuario.eq).toHaveBeenCalledWith('id', 'u-1')
    })

    it('RNF-07: pide al navegador almacenamiento persistente', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u-1' } },
        error: null,
      })
      conTablas({ usuario: REPORTANTE })

      await iniciarSesion('reportante.01@novedades.test', 'una-clave')

      expect(navigator.storage.persist).toHaveBeenCalledTimes(1)
    })

    it('RF-01 / CU-01 4a: credenciales incorrectas', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: {
          name: 'AuthApiError',
          code: 'invalid_credentials',
          status: 400,
          message: 'Invalid login credentials',
        },
      })

      expect(await iniciarSesion('alguien@novedades.test', 'mala')).toEqual({
        ok: false,
        motivo: 'credenciales',
      })
      expect(await leerMeta('perfil')).toBeUndefined()
    })

    it('RF-01 / CU-01 4b: un perfil inactivo cierra la sesión y niega el acceso', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u-7' } },
        error: null,
      })
      // Un usuario desactivado no puede leer ni su propia fila.
      conTablas({ usuario: null })

      expect(await iniciarSesion('desactivado@novedades.test', 'una-clave')).toEqual({
        ok: false,
        motivo: 'desactivado',
      })
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
      expect(await leerMeta('perfil')).toBeUndefined()
    })

    it('RF-01 / CU-01 4b: una cuenta suspendida en Auth también es «desactivado»', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: {
          name: 'AuthApiError',
          code: 'user_banned',
          status: 400,
          message: 'User is banned',
        },
      })

      expect(await iniciarSesion('suspendido@novedades.test', 'una-clave')).toEqual({
        ok: false,
        motivo: 'desactivado',
      })
    })

    it('RF-01 / CU-01 2a: sin conexión no intenta ingresar', async () => {
      conConexion(false)

      expect(await iniciarSesion('reportante.01@novedades.test', 'una-clave')).toEqual({
        ok: false,
        motivo: 'sin_conexion',
      })
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('RF-01 / CU-01 2a: si la red falla durante el ingreso, también es «sin conexión»', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: ERROR_DE_RED,
      })

      expect(await iniciarSesion('reportante.01@novedades.test', 'una-clave')).toEqual({
        ok: false,
        motivo: 'sin_conexion',
      })
    })
  })

  describe('restaurarSesion', () => {
    it('sin sesión guardada, no hay perfil', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      expect(await restaurarSesion()).toBeNull()
    })

    it('con sesión y con red, actualiza el perfil desde el servidor', async () => {
      await guardarMeta('perfil', {
        ...REPORTANTE,
        nombre: 'Nombre viejo',
        finca: FINCA,
        area: null,
      })
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u-1' } } },
        error: null,
      })
      conTablas({ usuario: REPORTANTE })

      const perfil = await restaurarSesion()

      expect(perfil.nombre).toBe('Reportante de prueba 01')
      expect((await leerMeta('perfil')).nombre).toBe('Reportante de prueba 01')
    })

    it('RNF-10 / CU-01 2b: sin red entra de inmediato con el perfil guardado, sin esperar a supabase-js', async () => {
      const guardado = { ...REPORTANTE, finca: FINCA, area: null }
      await guardarMeta('perfil', guardado)
      conConexion(false)
      // Con el token vencido y sin red, getSession() tarda cerca de medio minuto en responder.
      supabase.auth.getSession.mockReturnValue(new Promise(() => {}))

      expect(await restaurarSesion()).toEqual(guardado)
      expect(supabase.auth.getSession).not.toHaveBeenCalled()
      expect(supabase.auth.signOut).not.toHaveBeenCalled()
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('RNF-10 / CU-01 2a: sin red y sin haber ingresado antes en el dispositivo, no hay sesión', async () => {
      conConexion(false)

      expect(await restaurarSesion()).toBeNull()
    })

    it('RNF-10: si la renovación del token falla por la red, conserva la sesión y entra con el perfil guardado', async () => {
      const guardado = { ...REPORTANTE, finca: FINCA, area: null }
      await guardarMeta('perfil', guardado)
      // supabase-js no pudo renovar el token: no entrega sesión, pero tampoco la borra.
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: ERROR_DE_RED })

      expect(await restaurarSesion()).toEqual(guardado)
      expect(supabase.auth.signOut).not.toHaveBeenCalled()
    })

    it('RNF-10: si la red no responde, no se queda esperando: entra con el perfil guardado', async () => {
      const guardado = { ...REPORTANTE, finca: FINCA, area: null }
      await guardarMeta('perfil', guardado)
      await leerMeta('perfil')
      vi.useFakeTimers()
      supabase.auth.getSession.mockReturnValue(new Promise(() => {}))

      const pendiente = restaurarSesion()
      await vi.advanceTimersByTimeAsync(4000)

      expect(await pendiente).toEqual(guardado)
      vi.useRealTimers()
    })

    it('RF-01: si el usuario fue desactivado, cierra la sesión al volver a abrir', async () => {
      await guardarMeta('perfil', { ...REPORTANTE, finca: FINCA, area: null })
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u-1' } } },
        error: null,
      })
      conTablas({ usuario: null })

      expect(await restaurarSesion()).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(await leerMeta('perfil')).toBeUndefined()
    })

    it('RNF-10: si la red se cae al leer el perfil, no entra con el perfil guardado de otro usuario', async () => {
      await guardarMeta('perfil', { ...APROBADOR, finca: null, area: AREAS[0] })
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u-1' } } },
        error: null,
      })
      supabase.from.mockImplementation(() =>
        consulta({ data: null, error: new TypeError('Failed to fetch') }),
      )

      expect(await restaurarSesion()).toBeNull()
    })
  })

  describe('revisarSesion (RF-03 / CU-01 4b: el perfil se relee con la sesión viva)', () => {
    const conSesion = () =>
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'u-1' } } },
        error: null,
      })

    it('si el usuario fue desactivado, cierra la sesión local, dice por qué y conserva las pendientes', async () => {
      await guardarMeta('perfil', { ...REPORTANTE, finca: FINCA, area: null })
      const pendientes = await contarPendientes()
      conSesion()
      // La política ya no le deja leer ni su propia fila.
      conTablas({ usuario: null })

      expect(await revisarSesion()).toEqual({ perfil: null, desactivado: true })
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
      expect(await leerMeta('perfil')).toBeUndefined()
      expect(await contarPendientes()).toBe(pendientes)
    })

    it('si le cambiaron el rol y el alcance, entrega el perfil nuevo y lo guarda', async () => {
      await guardarMeta('perfil', { ...REPORTANTE, finca: FINCA, area: null })
      conSesion()
      conTablas({ usuario: { ...REPORTANTE, rol_id: 2, finca_id: null, area_id: 'area-m' } })

      const { perfil, desactivado } = await revisarSesion()

      expect(desactivado).toBe(false)
      expect(perfil).toMatchObject({ rol_id: 2, finca_id: null, area: AREAS[0] })
      expect((await leerMeta('perfil')).rol_id).toBe(2)
    })

    it('sin sesión no hay perfil, y no es porque lo hayan desactivado', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      expect(await revisarSesion()).toEqual({ perfil: null, desactivado: false })
    })

    it('RNF-10: sin red sigue con el perfil guardado, sin cerrar nada', async () => {
      const guardado = { ...REPORTANTE, finca: FINCA, area: null }
      await guardarMeta('perfil', guardado)
      conConexion(false)

      expect(await revisarSesion()).toEqual({ perfil: guardado, desactivado: false })
      expect(supabase.auth.signOut).not.toHaveBeenCalled()
    })
  })

  describe('cerrarSesion', () => {
    it('RF-01 / CU-01 5a: borra el perfil y los catálogos, y conserva las pendientes', async () => {
      await guardarMeta('perfil', { ...REPORTANTE, finca: FINCA, area: null })
      await cerrarBd()
      await new Promise((resolver, rechazar) => {
        const solicitud = indexedDB.open(NOMBRE_BD)
        solicitud.onerror = () => rechazar(solicitud.error)
        solicitud.onsuccess = () => {
          const bd = solicitud.result
          const tx = bd.transaction('pendientes', 'readwrite')
          tx.objectStore('pendientes').put({
            id_local: 'p-1',
            fecha_registro: '2026-10-13T12:00:00Z',
          })
          tx.oncomplete = () => {
            bd.close()
            resolver()
          }
        }
      })

      await cerrarSesion()

      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
      expect(await leerMeta('perfil')).toBeUndefined()
      expect(await contarPendientes()).toBe(1)
    })

    it('RF-01: cierra la sesión local aunque Auth no responda', async () => {
      await guardarMeta('perfil', { ...REPORTANTE, finca: FINCA, area: null })
      supabase.auth.signOut.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(cerrarSesion()).resolves.toBeUndefined()
      expect(await leerMeta('perfil')).toBeUndefined()
    })
  })
})
