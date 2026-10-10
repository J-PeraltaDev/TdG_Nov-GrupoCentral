// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { manejar } from './manejar.js'

const ADMINISTRADOR = { id: 'u-admin', rol_id: 4, activo: true }

const CREAR = {
  accion: 'crear',
  nombre: 'Persona de prueba',
  correo: 'persona@novedades.test',
  contrasena_inicial: 'Banano-4821',
  rol_id: 3,
}

const CREADO = {
  id: 'u-nuevo',
  nombre: CREAR.nombre,
  correo: CREAR.correo,
  rol_id: 3,
  finca_id: null,
  area_id: null,
  activo: true,
}

/** Dependencias simuladas: quién llama, qué perfil tiene y unas cuentas que siempre responden. */
function dependencias({ sub = ADMINISTRADOR.id, perfil = ADMINISTRADOR } = {}) {
  return {
    token: 'un.token.cualquiera',
    identificar: vi.fn().mockResolvedValue(sub),
    leerPerfil: vi.fn().mockResolvedValue(perfil),
    cuentas: {
      leerUsuario: vi.fn().mockResolvedValue(CREADO),
      fincaActiva: vi.fn().mockResolvedValue(true),
      areaActiva: vi.fn().mockResolvedValue(true),
      crearCuenta: vi.fn().mockResolvedValue({ id: CREADO.id }),
      borrarCuenta: vi.fn().mockResolvedValue(undefined),
      suspenderCuenta: vi.fn().mockResolvedValue(undefined),
      reactivarCuenta: vi.fn().mockResolvedValue(undefined),
      insertarUsuario: vi.fn(async (usuario) => ({ usuario })),
      actualizarUsuario: vi.fn(async (id, cambios) => ({ ...CREADO, id, ...cambios })),
    },
  }
}

describe('gestionar-usuario · quién puede llamarla (SDD, Tabla 23)', () => {
  it('sin token responde 401 y no consulta nada', async () => {
    const deps = { ...dependencias(), token: null }

    expect(await manejar(CREAR, deps)).toEqual({ estado: 401, cuerpo: { codigo: 'SIN_SESION' } })
    expect(deps.identificar).not.toHaveBeenCalled()
  })

  it('con un token que Auth no reconoce responde 401', async () => {
    const deps = dependencias({ sub: null })

    expect(await manejar(CREAR, deps)).toEqual({ estado: 401, cuerpo: { codigo: 'SIN_SESION' } })
    expect(deps.leerPerfil).not.toHaveBeenCalled()
  })

  it.each([
    ['no tiene perfil', null],
    ['está inactivo', { ...ADMINISTRADOR, activo: false }],
    ['es reportante', { id: 'u-1', rol_id: 1, activo: true }],
    ['es aprobador', { id: 'u-2', rol_id: 2, activo: true }],
    ['es director', { id: 'u-3', rol_id: 3, activo: true }],
  ])('RNF-11: si quien llama %s responde 403 SIN_PERMISO', async (_, perfil) => {
    expect(await manejar(CREAR, dependencias({ perfil }))).toEqual({
      estado: 403,
      cuerpo: { codigo: 'SIN_PERMISO' },
    })
  })

  it('RNF-11: a quien no es administrador no le dice qué campos faltan', async () => {
    const respuesta = await manejar({ accion: 'crear' }, dependencias({ perfil: null }))

    expect(respuesta.estado).toBe(403)
    expect(respuesta.cuerpo).not.toHaveProperty('campos')
  })

  it('lee el perfil de quien dice el token, no el de la solicitud', async () => {
    const deps = dependencias({ sub: 'u-del-token' })
    await manejar({ ...CREAR, usuario_id: 'u-de-la-solicitud' }, deps)

    expect(deps.identificar).toHaveBeenCalledWith('un.token.cualquiera')
    expect(deps.leerPerfil).toHaveBeenCalledWith('u-del-token')
  })
})

describe('gestionar-usuario · de la solicitud a la acción (RF-03 / CU-03)', () => {
  it('RF-03 / CU-03 6b: al administrador le señala los campos de una solicitud incompleta', async () => {
    expect(await manejar({ accion: 'crear' }, dependencias())).toEqual({
      estado: 400,
      cuerpo: {
        codigo: 'DATO_OBLIGATORIO',
        campos: ['nombre', 'correo', 'contrasena_inicial', 'rol_id'],
      },
    })
  })

  it('RNF-11: sin permiso o sin datos válidos no toca Auth ni la base de datos', async () => {
    const sinPermiso = dependencias({ perfil: null })
    await manejar(CREAR, sinPermiso)
    const incompleta = dependencias()
    await manejar({ accion: 'crear' }, incompleta)

    for (const { cuentas } of [sinPermiso, incompleta]) {
      for (const operacion of Object.values(cuentas)) expect(operacion).not.toHaveBeenCalled()
    }
  })

  it('RF-03 / CU-03 6: «crear» crea la cuenta y responde 201 con el usuario, sin la contraseña', async () => {
    const deps = dependencias()

    const respuesta = await manejar(CREAR, deps)

    expect(respuesta).toEqual({ estado: 201, cuerpo: { usuario: CREADO } })
    expect(deps.cuentas.crearCuenta).toHaveBeenCalledExactlyOnceWith({
      correo: CREAR.correo,
      contrasena: CREAR.contrasena_inicial,
    })
    expect(JSON.stringify(respuesta)).not.toContain(CREAR.contrasena_inicial)
  })

  it('el correo llega a Auth y al perfil en minúsculas y sin espacios', async () => {
    const deps = dependencias()

    await manejar({ ...CREAR, correo: '  Persona@Novedades.TEST ' }, deps)

    expect(deps.cuentas.crearCuenta.mock.calls[0][0].correo).toBe('persona@novedades.test')
    expect(deps.cuentas.insertarUsuario.mock.calls[0][0].correo).toBe('persona@novedades.test')
  })

  it.each([
    ['actualizar', { nombre: 'Otro nombre', rol_id: 3 }, 'actualizarUsuario'],
    ['desactivar', {}, 'suspenderCuenta'],
    ['activar', {}, 'reactivarCuenta'],
  ])('«%s» llega a su acción y responde 200 con el usuario', async (accion, datos, operacion) => {
    const deps = dependencias()

    const respuesta = await manejar(
      { accion, usuario_id: '00000000-0000-4000-a000-000000000009', ...datos },
      deps,
    )

    expect(respuesta.estado).toBe(200)
    expect(respuesta.cuerpo.usuario).toMatchObject({ correo: CREADO.correo })
    expect(deps.cuentas[operacion]).toHaveBeenCalled()
  })

  it('Tabla 23: las acciones saben quién llama: el administrador no se desactiva a sí mismo', async () => {
    const yo = '00000000-0000-4000-a000-000000000006'
    const deps = dependencias({ sub: yo, perfil: { ...ADMINISTRADOR, id: yo } })

    expect(await manejar({ accion: 'desactivar', usuario_id: yo }, deps)).toEqual({
      estado: 403,
      cuerpo: { codigo: 'SIN_PERMISO', campos: ['usuario_id'] },
    })
  })

  it('una acción que no existe responde 400 y la señala', async () => {
    expect(await manejar({ accion: 'borrar', usuario_id: 'u-1' }, dependencias())).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: ['accion'] },
    })
  })
})
