// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { notaDelEstado, PESTANAS, resumirTransiciones } from './reglasDeBandeja.js'

const ABIERTOS_DEL_AREA = ['asignada', 'en_atencion', 'escalada', 'aprobada', 'resuelta']

describe('Reglas de la bandeja del área (RF-09, SDD 6.1.11)', () => {
  it('RF-09 / CU-09 2: las pestañas agrupan los estados como dice el SDD', () => {
    expect(PESTANAS.map(({ nombre, estados }) => [nombre, estados])).toEqual([
      ['Por atender', ['asignada', 'aprobada']],
      ['En atención', ['en_atencion']],
      ['En espera', ['escalada', 'resuelta']],
    ])
  })

  it('RF-09: entre las tres cubren los estados abiertos del área, sin repetir ni incluir los finales', () => {
    const estados = PESTANAS.flatMap((pestana) => pestana.estados)

    expect(estados.toSorted()).toEqual(ABIERTOS_DEL_AREA.toSorted())
    expect(estados).not.toContain('rechazada')
    expect(estados).not.toContain('cerrada')
  })

  it('RF-17: una novedad reasignada dice de qué área llegó', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-1', estado_nuevo: 'asignada', area_anterior: null },
      { novedad_id: 'n-1', estado_nuevo: 'asignada', area_anterior: { nombre: 'Sistemas' } },
    ])

    expect(resumen['n-1'].reasignadaDesde).toBe('Sistemas')
    expect(notaDelEstado({ estado: 'asignada' }, resumen['n-1'])).toBe('Reasignada desde Sistemas')
  })

  it('RF-07: una novedad que llegó por el enrutamiento no lleva nota', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-2', estado_nuevo: 'asignada', area_anterior: null },
    ])

    expect(notaDelEstado({ estado: 'asignada' }, resumen['n-2'])).toBeNull()
    expect(notaDelEstado({ estado: 'asignada' }, undefined)).toBeNull()
  })

  it('RF-10: una reasignada que ya se tomó deja de llevar la nota', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-1', estado_nuevo: 'asignada', area_anterior: { nombre: 'Sistemas' } },
    ])

    expect(notaDelEstado({ estado: 'en_atencion' }, resumen['n-1'])).toBeNull()
  })

  it('RF-13: una aprobada dice que la aprobó el director, aunque no se conozca su historial', () => {
    expect(notaDelEstado({ estado: 'aprobada' }, undefined)).toBe('Aprobada por el director')
  })

  it('RF-12 y RF-13: conserva la justificación del escalamiento y la decisión del director', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-3', estado_nuevo: 'asignada', area_anterior: null },
      { novedad_id: 'n-3', estado_nuevo: 'escalada', observacion: 'Hay que comprar tablones.' },
      {
        novedad_id: 'n-3',
        estado_nuevo: 'aprobada',
        observacion: 'Aprobado.',
        fecha_hora: '2026-09-22T13:10:00Z',
        usuario: { nombre: 'Hernán Darío Úsuga' },
      },
    ])

    expect(resumen['n-3']).toEqual({
      reasignadaDesde: null,
      justificacion: 'Hay que comprar tablones.',
      decision: {
        observacion: 'Aprobado.',
        usuario: 'Hernán Darío Úsuga',
        fecha_hora: '2026-09-22T13:10:00Z',
      },
    })
  })

  it('si una novedad se escaló dos veces, queda la última justificación', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-4', estado_nuevo: 'escalada', observacion: 'Primera' },
      { novedad_id: 'n-4', estado_nuevo: 'escalada', observacion: 'Segunda' },
    ])

    expect(resumen['n-4'].justificacion).toBe('Segunda')
  })

  it('separa las transiciones de cada novedad', () => {
    const resumen = resumirTransiciones([
      { novedad_id: 'n-1', estado_nuevo: 'escalada', observacion: 'De la uno' },
      { novedad_id: 'n-2', estado_nuevo: 'asignada', area_anterior: { nombre: 'Mantenimiento' } },
    ])

    expect(Object.keys(resumen)).toEqual(['n-1', 'n-2'])
    expect(resumen['n-1'].reasignadaDesde).toBeNull()
    expect(resumen['n-2'].justificacion).toBeNull()
  })
})
