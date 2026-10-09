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

/** Dependencias simuladas: quién llama y qué perfil tiene. */
function dependencias({ sub = ADMINISTRADOR.id, perfil = ADMINISTRADOR } = {}) {
  return {
    token: 'un.token.cualquiera',
    identificar: vi.fn().mockResolvedValue(sub),
    leerPerfil: vi.fn().mockResolvedValue(perfil),
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

describe('gestionar-usuario · contrato (Sprint 3, antes de implementar)', () => {
  it('RF-03 / CU-03 6b: al administrador le señala los campos de una solicitud incompleta', async () => {
    expect(await manejar({ accion: 'crear' }, dependencias())).toEqual({
      estado: 400,
      cuerpo: {
        codigo: 'DATO_OBLIGATORIO',
        campos: ['nombre', 'correo', 'contrasena_inicial', 'rol_id'],
      },
    })
  })

  it('una solicitud válida de un administrador responde 501 NO_IMPLEMENTADO', async () => {
    expect(await manejar(CREAR, dependencias())).toEqual({
      estado: 501,
      cuerpo: { codigo: 'NO_IMPLEMENTADO' },
    })
  })
})
