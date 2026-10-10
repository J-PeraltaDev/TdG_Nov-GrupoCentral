// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { esErrorDeRed, traducirError } from '../../errores/traducir.js'
import { supabase } from '../cliente.js'
import { invocarFuncion } from './funciones.js'
import { confirmarResolucion, decidirEscalamiento, reportarFallaPersiste } from './novedades.js'
import {
  contarSolicitudesPendientes,
  generarCodigoRecuperacion,
  listarSolicitudes,
  restablecerContrasena,
  solicitarRecuperacion,
} from './recuperacion.js'
import {
  activarUsuario,
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from './usuarios.js'

// Se simula el módulo del cliente, no la red: aquí solo importa qué se llama y con qué
// (SDD, Tablas 21 y 23).
vi.mock('../cliente.js', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), functions: { invoke: vi.fn() } },
}))

const NOVEDAD = { id: 'novedad-1', codigo: 153, estado: 'aprobada' }
const USUARIO = { id: 'u-9', nombre: 'Persona de prueba', correo: 'persona@novedades.test' }

/** El error con que supabase-js responde cuando la función contesta un estado de error. */
function errorDeFuncion(estado, cuerpo) {
  return Object.assign(new Error('Edge Function returned a non-2xx status code'), {
    name: 'FunctionsHttpError',
    context: new Response(JSON.stringify(cuerpo), { status: estado }),
  })
}

beforeEach(() => {
  vi.mocked(supabase.rpc).mockReset()
  vi.mocked(supabase.from).mockReset()
  vi.mocked(supabase.functions.invoke).mockReset()
})

describe('Transiciones del Sprint 3 (SDD, Tabla 21)', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: NOVEDAD, error: null })
  })

  it.each([
    [
      'RF-13 / CU-13: aprobar con observación',
      () => decidirEscalamiento('novedad-1', true, 'Comprar con el proveedor habitual'),
      'decidir_escalamiento',
      {
        p_novedad_id: 'novedad-1',
        p_aprobar: true,
        p_observacion: 'Comprar con el proveedor habitual',
      },
    ],
    [
      'RF-13 / CU-13: aprobar sin observación',
      () => decidirEscalamiento('novedad-1', true),
      'decidir_escalamiento',
      { p_novedad_id: 'novedad-1', p_aprobar: true, p_observacion: null },
    ],
    [
      'RF-13 / CU-13: rechazar',
      () => decidirEscalamiento('novedad-1', false, 'No hay presupuesto'),
      'decidir_escalamiento',
      { p_novedad_id: 'novedad-1', p_aprobar: false, p_observacion: 'No hay presupuesto' },
    ],
    [
      'RF-15 / CU-15 3: confirmar sin observación',
      () => confirmarResolucion('novedad-1'),
      'confirmar_resolucion',
      { p_novedad_id: 'novedad-1', p_observacion: null },
    ],
    [
      'RF-15 / CU-15 3: confirmar con observación',
      () => confirmarResolucion('novedad-1', 'Quedó bien'),
      'confirmar_resolucion',
      { p_novedad_id: 'novedad-1', p_observacion: 'Quedó bien' },
    ],
    [
      'RF-15 / CU-15 3a: la falla persiste',
      () => reportarFallaPersiste('novedad-1', 'Sigue sin imprimir'),
      'reportar_falla_persiste',
      { p_novedad_id: 'novedad-1', p_observacion: 'Sigue sin imprimir' },
    ],
  ])('%s', async (_, llamar, funcion, parametros) => {
    await expect(llamar()).resolves.toBe(NOVEDAD)

    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith(funcion, parametros)
  })

  it('RF-13: lanza el error de Supabase tal cual, con su código de la Tabla 22', async () => {
    const error = { code: 'P0001', message: 'TRANSICION_INVALIDA', details: null, hint: null }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error })

    await expect(decidirEscalamiento('novedad-1', true)).rejects.toBe(error)
  })
})

describe('Edge Functions (SDD, Tabla 23)', () => {
  it('devuelve el cuerpo de la respuesta', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { ok: true }, error: null })

    await expect(invocarFuncion('una-funcion', { a: 1 })).resolves.toEqual({ ok: true })
    expect(supabase.functions.invoke).toHaveBeenCalledExactlyOnceWith('una-funcion', {
      body: { a: 1 },
    })
  })

  it('RF-03 / CU-03 6b: un error de la función se lanza con su código, sus campos y su estado', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: errorDeFuncion(400, { codigo: 'DATO_OBLIGATORIO', campos: ['finca_id'] }),
    })

    const fallo = await invocarFuncion('gestionar-usuario', {}).catch((e) => e)

    expect(fallo).toMatchObject({ message: 'DATO_OBLIGATORIO', campos: ['finca_id'], status: 400 })
    expect(traducirError(fallo)).toMatchObject({ tipo: 'negocio', codigo: 'DATO_OBLIGATORIO' })
  })

  it('RF-03 / CU-03 6a: el correo repetido llega como CORREO_EXISTENTE, con su mensaje', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: errorDeFuncion(409, { codigo: 'CORREO_EXISTENTE', campos: ['correo'] }),
    })

    const fallo = await invocarFuncion('gestionar-usuario', {}).catch((e) => e)

    expect(traducirError(fallo)).toEqual({
      tipo: 'negocio',
      codigo: 'CORREO_EXISTENTE',
      mensaje: 'Este correo ya está registrado.',
    })
  })

  it('RNF-10: el 401 de la plataforma (sin `codigo`) se trata como sesión vencida', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: errorDeFuncion(401, {
        code: 'UNAUTHORIZED_INVALID_JWT_FORMAT',
        message: 'Invalid JWT',
      }),
    })

    const fallo = await invocarFuncion('gestionar-usuario', {}).catch((e) => e)

    expect(fallo).toMatchObject({ status: 401, campos: [] })
    expect(traducirError(fallo).tipo).toBe('sesion')
  })

  it('una respuesta de error sin cuerpo JSON no revienta: queda como desconocida', async () => {
    const error = Object.assign(new Error('x'), {
      name: 'FunctionsHttpError',
      context: new Response('no es JSON', { status: 500 }),
    })
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error })

    const fallo = await invocarFuncion('una-funcion', {}).catch((e) => e)

    expect(fallo).toMatchObject({ status: 500, campos: [] })
    expect(traducirError(fallo).tipo).toBe('desconocido')
  })

  it('RF-25: si la petición no llega a la función, es un error de red', async () => {
    const error = Object.assign(new Error('Failed to send a request to the Edge Function'), {
      name: 'FunctionsFetchError',
    })
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error })

    const fallo = await invocarFuncion('una-funcion', {}).catch((e) => e)

    expect(fallo).toBe(error)
    expect(esErrorDeRed(fallo)).toBe(true)
  })
})

describe('Usuarios (RF-03; SDD, Tabla 23)', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { usuario: USUARIO },
      error: null,
    })
  })

  it('RF-03 / CU-03 2: listarUsuarios llama a su función y devuelve las filas', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [USUARIO], error: null })

    await expect(listarUsuarios()).resolves.toEqual([USUARIO])
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('listar_usuarios')
  })

  it.each([
    [
      'RF-03 / CU-03 5: crear',
      () => crearUsuario({ nombre: 'Persona', correo: 'p@novedades.test', rol_id: 3 }),
      { accion: 'crear', nombre: 'Persona', correo: 'p@novedades.test', rol_id: 3 },
    ],
    [
      'RF-03 / CU-03 5: actualizar',
      () => actualizarUsuario('u-9', { nombre: 'Otro nombre', rol_id: 3 }),
      { accion: 'actualizar', usuario_id: 'u-9', nombre: 'Otro nombre', rol_id: 3 },
    ],
    [
      'RF-03 / CU-03 3a: desactivar',
      () => desactivarUsuario('u-9'),
      { accion: 'desactivar', usuario_id: 'u-9' },
    ],
    ['RF-03: activar', () => activarUsuario('u-9'), { accion: 'activar', usuario_id: 'u-9' }],
  ])('%s llama a gestionar-usuario con el cuerpo de la Tabla 23', async (_, llamar, cuerpo) => {
    await expect(llamar()).resolves.toBe(USUARIO)

    expect(supabase.functions.invoke).toHaveBeenCalledExactlyOnceWith('gestionar-usuario', {
      body: cuerpo,
    })
  })
})

describe('Recuperación de contraseña (RF-02; SDD, Tablas 20, 21 y 23)', () => {
  it('RF-02 / CU-02 3: solicitarRecuperacion envía el correo y no devuelve nada', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

    await expect(solicitarRecuperacion('persona@novedades.test')).resolves.toBeUndefined()
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('solicitar_recuperacion', {
      p_correo: 'persona@novedades.test',
    })
  })

  it('RF-02 / CU-02 5: listarSolicitudes pide columnas explícitas, sin el resumen del código', async () => {
    const filas = [
      {
        id: 's-1',
        usuario_id: 'u-9',
        expira_en: null,
        usado: false,
        intentos_fallidos: 0,
        creada_en: 'x',
      },
    ]
    const order = vi.fn().mockResolvedValue({ data: filas, error: null })
    const select = vi.fn().mockReturnValue({ order })
    vi.mocked(supabase.from).mockReturnValue({ select })

    await expect(listarSolicitudes()).resolves.toBe(filas)
    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('solicitud_recuperacion')
    expect(select).toHaveBeenCalledExactlyOnceWith(
      'id, usuario_id, expira_en, usado, intentos_fallidos, creada_en',
    )
    expect(order).toHaveBeenCalledExactlyOnceWith('creada_en', { ascending: false })
  })

  it('RF-02 / CU-02 5: contarSolicitudesPendientes cuenta las que esperan un código, sin traer filas', async () => {
    const is = vi.fn().mockResolvedValue({ count: 3, error: null })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select })

    await expect(contarSolicitudesPendientes()).resolves.toBe(3)
    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('solicitud_recuperacion')
    expect(select).toHaveBeenCalledExactlyOnceWith('id', { count: 'exact', head: true })
    expect(eq).toHaveBeenCalledExactlyOnceWith('usado', false)
    expect(is).toHaveBeenCalledExactlyOnceWith('expira_en', null)
  })

  it('contarSolicitudesPendientes lanza el error de la consulta, y sin cuenta responde cero', async () => {
    const error = { code: '42501', message: 'permission denied' }
    const is = vi.fn().mockResolvedValueOnce({ count: null, error })
    vi.mocked(supabase.from).mockReturnValue({ select: () => ({ eq: () => ({ is }) }) })

    await expect(contarSolicitudesPendientes()).rejects.toBe(error)

    is.mockResolvedValueOnce({ count: null, error: null })
    await expect(contarSolicitudesPendientes()).resolves.toBe(0)
  })

  it('RF-02 / CU-02 6: generarCodigoRecuperacion devuelve el código y su vencimiento', async () => {
    const fila = { codigo: '482719', expira_en: '2026-10-09T15:12:00Z' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [fila], error: null })

    await expect(generarCodigoRecuperacion('s-1')).resolves.toEqual(fila)
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('generar_codigo_recuperacion', {
      p_solicitud_id: 's-1',
    })
  })

  it('RF-02 / CU-02 8: restablecerContrasena llama a su función con el cuerpo de la Tabla 23', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { ok: true }, error: null })
    const datos = { correo: 'persona@novedades.test', codigo: '482719', contrasena: 'Banano-4821' }

    await expect(restablecerContrasena(datos)).resolves.toBeUndefined()
    expect(supabase.functions.invoke).toHaveBeenCalledExactlyOnceWith('restablecer-contrasena', {
      body: datos,
    })
  })

  it.each([
    ['CODIGO_INVALIDO', 'El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.'],
    ['CODIGO_VENCIDO', 'El código venció. Pide uno nuevo al administrador.'],
  ])('RF-02 / CU-02 9a y 9b: %s llega con su mensaje', async (codigo, mensaje) => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: errorDeFuncion(400, { codigo }),
    })

    const fallo = await restablecerContrasena({}).catch((e) => e)

    expect(traducirError(fallo)).toEqual({ tipo: 'negocio', codigo, mensaje })
  })
})
