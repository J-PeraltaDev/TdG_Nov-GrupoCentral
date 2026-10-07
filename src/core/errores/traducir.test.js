// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { esErrorDeRed, esErrorDeSesion, traducirError } from './traducir.js'

/** Error de una función RPC tal como lo entrega PostgREST (HTTP 400). */
const errorDeNegocio = (codigo) => ({ code: 'P0001', message: codigo, details: null, hint: null })

describe('Traductor de errores (SDD, Tabla 22)', () => {
  it.each([
    ['SIN_PERMISO', 'No tienes permiso para esta acción.'],
    ['TRANSICION_INVALIDA', 'La novedad cambió de estado.'],
    ['AREA_INVALIDA', 'Elige otra área.'],
    ['FINCA_NO_ASIGNADA', 'Tu usuario no tiene una finca asignada.'],
  ])('%s → «%s»', (codigo, mensaje) => {
    expect(traducirError(errorDeNegocio(codigo))).toEqual({ tipo: 'negocio', codigo, mensaje })
  })

  it.each([
    'DATO_OBLIGATORIO',
    'FECHA_INVALIDA',
    'TIPO_FALLA_INVALIDO',
    'CODIGO_INVALIDO',
    'CODIGO_VENCIDO',
  ])('%s es un error de negocio con mensaje en español', (codigo) => {
    const traducido = traducirError(errorDeNegocio(codigo))

    expect(traducido.tipo).toBe('negocio')
    expect(traducido.codigo).toBe(codigo)
    expect(traducido.mensaje).not.toContain(codigo)
  })

  it.each([
    ['fetch del navegador', new TypeError('Failed to fetch')],
    ['Safari', new TypeError('Load failed')],
    ['Firefox', new TypeError('NetworkError when attempting to fetch resource.')],
    ['PostgREST sin red', { message: 'TypeError: Failed to fetch', details: '', code: '' }],
    ['Auth sin red', { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }],
  ])('RF-05 / CU-05 5a: fallo de red (%s) → tipo «red»', (_, error) => {
    expect(esErrorDeRed(error)).toBe(true)
    expect(traducirError(error)).toMatchObject({ tipo: 'red', codigo: 'RED' })
  })

  it.each([
    ['HTTP 401', { status: 401, message: 'Unauthorized' }],
    ['JWT vencido', { code: 'PGRST301', message: 'JWT expired' }],
    ['sin sesión', { name: 'AuthSessionMissingError', message: 'Auth session missing!' }],
  ])('RNF-10: sesión vencida (%s) → tipo «sesion»', (_, error) => {
    expect(esErrorDeSesion(error)).toBe(true)
    expect(traducirError(error)).toMatchObject({ tipo: 'sesion', codigo: 'SESION_VENCIDA' })
  })

  it('un error que no conoce no muestra detalles técnicos', () => {
    const traducido = traducirError({
      code: '42501',
      message: 'permission denied for table novedad',
    })

    expect(traducido).toEqual({
      tipo: 'desconocido',
      codigo: 'DESCONOCIDO',
      mensaje: 'Algo salió mal. Intenta de nuevo.',
    })
  })

  it.each([null, undefined, 'texto', 42])('tolera %s', (valor) => {
    expect(traducirError(valor).tipo).toBe('desconocido')
  })
})
