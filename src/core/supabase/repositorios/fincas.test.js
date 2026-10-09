// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { traducirError } from '../../errores/traducir.js'
import { supabase } from '../cliente.js'
import {
  actualizarFinca,
  crearFinca,
  listarFincasConConteos,
  listarRazonesSociales,
} from './fincas.js'

// Se simula el módulo del cliente, no la red: aquí importa qué consulta se arma.
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/**
 * Simula el constructor de consultas de supabase-js: anota cada método que se le encadena y,
 * al esperarlo, entrega la respuesta.
 */
function simularConsulta(respuesta) {
  const pasos = []
  vi.mocked(supabase.from).mockImplementation((tabla) => {
    pasos.push(['from', tabla])
    const consulta = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar)
          }
          return (...argumentos) => {
            pasos.push([metodo, ...argumentos])
            return consulta
          }
        },
      },
    )
    return consulta
  })
  return pasos
}

const NOMBRE_REPETIDO = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "finca_razon_social_nombre_unico"',
}

describe('Repositorio de fincas (RF-04 / CU-04)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-04 / CU-04 2: lista las fincas con su razón social y sus conteos, por nombre', async () => {
    const fincas = [{ id: 'f-1', nombre: 'Juanca', novedades_abiertas: 2, reportantes_activos: 2 }]
    const pasos = simularConsulta({ data: fincas, error: null })

    await expect(listarFincasConConteos()).resolves.toEqual(fincas)

    expect(pasos[0]).toEqual(['from', 'v_finca'])
    const columnas = pasos[1][1]
    expect(columnas).not.toBe('*')
    for (const columna of [
      'id',
      'nombre',
      'activo',
      'razon_social_id',
      'razon_social',
      'novedades_abiertas',
      'reportantes_activos',
    ]) {
      expect(columnas).toContain(columna)
    }
    expect(pasos).toContainEqual(['order', 'nombre'])
  })

  it('RF-04: lista las razones sociales activas, por nombre', async () => {
    const razones = [{ id: 'rs-1', nombre: 'Agropecuaria Juanca S.A.S.' }]
    const pasos = simularConsulta({ data: razones, error: null })

    await expect(listarRazonesSociales()).resolves.toEqual(razones)

    expect(pasos[0]).toEqual(['from', 'razon_social'])
    expect(pasos).toContainEqual(['select', 'id, nombre'])
    expect(pasos).toContainEqual(['eq', 'activo', true])
    expect(pasos).toContainEqual(['order', 'nombre'])
  })

  it('RF-04 / CU-04 5 y 6: crea la finca con el nombre sin espacios sobrantes', async () => {
    const pasos = simularConsulta({ data: { id: 'f-9' }, error: null })

    await expect(crearFinca({ nombre: '  La Mónica  ', razonSocialId: 'rs-1' })).resolves.toEqual({
      id: 'f-9',
    })

    expect(pasos[0]).toEqual(['from', 'finca'])
    expect(pasos).toContainEqual(['insert', { nombre: 'La Mónica', razon_social_id: 'rs-1' }])
  })

  it('RF-04 / CU-04 6a: un nombre repetido en la razón social se entrega como FINCA_EXISTENTE', async () => {
    simularConsulta({ data: null, error: NOMBRE_REPETIDO })

    const fallo = await crearFinca({ nombre: 'Juanca', razonSocialId: 'rs-1' }).catch((e) => e)

    expect(fallo.message).toBe('FINCA_EXISTENTE')
    expect(traducirError(fallo)).toMatchObject({
      tipo: 'negocio',
      codigo: 'FINCA_EXISTENTE',
      mensaje: 'Ya existe una finca con ese nombre en esta razón social',
    })
  })

  it('RF-04 / CU-04 5: edita solo lo que cambia', async () => {
    const pasos = simularConsulta({ data: { id: 'f-1' }, error: null })

    await actualizarFinca('f-1', { nombre: ' Juanca Norte ', razonSocialId: 'rs-2' })

    expect(pasos[0]).toEqual(['from', 'finca'])
    expect(pasos).toContainEqual(['update', { nombre: 'Juanca Norte', razon_social_id: 'rs-2' }])
    expect(pasos).toContainEqual(['eq', 'id', 'f-1'])
  })

  it('RF-04 / CU-04 3: desactivar y reactivar solo cambian `activo`', async () => {
    const pasos = simularConsulta({ data: { id: 'f-1' }, error: null })

    await actualizarFinca('f-1', { activo: false })

    expect(pasos).toContainEqual(['update', { activo: false }])
  })

  it('RF-04 / CU-04 6a: al editar, un nombre repetido también es FINCA_EXISTENTE', async () => {
    simularConsulta({ data: null, error: NOMBRE_REPETIDO })

    await expect(actualizarFinca('f-1', { nombre: 'Tumaradó' })).rejects.toThrow('FINCA_EXISTENTE')
  })

  it('RNF-11: si la política no deja tocar la fila, responde SIN_PERMISO', async () => {
    // La actualización no falla, pero no devuelve ninguna fila.
    simularConsulta({ data: null, error: null })

    await expect(actualizarFinca('f-1', { activo: false })).rejects.toThrow('SIN_PERMISO')
  })

  it('los demás errores pasan como llegan, para que el traductor los reconozca', async () => {
    const deRed = new TypeError('Failed to fetch')
    simularConsulta({ data: null, error: deRed })

    await expect(listarFincasConConteos()).rejects.toBe(deRed)
    await expect(crearFinca({ nombre: 'X', razonSocialId: 'rs-1' })).rejects.toBe(deRed)
  })
})
