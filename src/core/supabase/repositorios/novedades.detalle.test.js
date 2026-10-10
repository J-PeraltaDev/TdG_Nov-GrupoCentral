// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../cliente.js'
import { listarLineaDeTiempo, obtenerNovedad } from './novedades.js'

// Se simula el módulo del cliente, no la red: aquí importa qué consulta se arma.
vi.mock('../cliente.js', () => ({ supabase: { from: vi.fn() } }))

/** Anota cada método que se le encadena a la consulta y, al esperarla, entrega la respuesta. */
function simularConsulta(respuesta) {
  const pasos = []
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
  vi.mocked(supabase.from).mockReturnValue(consulta)
  return pasos
}

const ID = '00000000-0000-4000-e000-000000000153'

describe('Consultas del detalle de una novedad (RF-18)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('RF-18 / CU-18 3: pide la novedad por su id, con columnas explícitas de v_novedad', async () => {
    const novedad = { id: ID, codigo: 153 }
    const pasos = simularConsulta({ data: novedad, error: null })

    await expect(obtenerNovedad(ID)).resolves.toBe(novedad)

    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('v_novedad')
    expect(pasos).toEqual([
      ['select', expect.not.stringContaining('*')],
      ['eq', 'id', ID],
      ['maybeSingle'],
    ])
    for (const columna of ['codigo', 'finca', 'razon_social', 'area', 'tipo_falla', 'reportante']) {
      expect(pasos[0][1]).toContain(columna)
    }
  })

  it('RF-18 / CU-18 2a: sin filas (fuera del alcance o inexistente) devuelve null, sin error', async () => {
    simularConsulta({ data: null, error: null })

    await expect(obtenerNovedad(ID)).resolves.toBeNull()
  })

  it('RF-18 / CU-18 4: pide el historial de la novedad, del más reciente al más antiguo', async () => {
    const transiciones = [{ id: 2 }, { id: 1 }]
    const pasos = simularConsulta({ data: transiciones, error: null })

    await expect(listarLineaDeTiempo(ID)).resolves.toBe(transiciones)

    expect(supabase.from).toHaveBeenCalledExactlyOnceWith('historial_transicion')
    expect(pasos.slice(1)).toEqual([
      ['eq', 'novedad_id', ID],
      ['order', 'id', { ascending: false }],
    ])
  })

  it('RNF-18: los nombres salen de usuario_publico y el correo nunca se pide (ADR 0010)', async () => {
    const pasos = simularConsulta({ data: [], error: null })

    await listarLineaDeTiempo(ID)

    expect(pasos[0][1]).toContain('usuario_publico')
    expect(pasos[0][1]).not.toContain('correo')
    expect(pasos[0][1]).not.toContain('*')
  })

  it.each([
    ['obtenerNovedad', () => obtenerNovedad(ID)],
    ['listarLineaDeTiempo', () => listarLineaDeTiempo(ID)],
  ])('%s lanza el error de Supabase tal cual', async (_, llamar) => {
    const error = { code: 'PGRST000', message: 'fallo' }
    simularConsulta({ data: null, error })

    await expect(llamar()).rejects.toBe(error)
  })
})
