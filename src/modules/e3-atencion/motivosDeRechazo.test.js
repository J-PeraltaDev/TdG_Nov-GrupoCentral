import { describe, expect, it } from 'vitest'
import {
  alternarMotivoFrecuente,
  MOTIVOS_FRECUENTES,
  motivoFrecuenteDe,
} from './motivosDeRechazo.js'

describe('Motivos frecuentes de rechazo (RF-11, Figma 16)', () => {
  it('son los tres de Figma, en su orden', () => {
    expect(MOTIVOS_FRECUENTES).toEqual([
      'Duplicada',
      'Es una solicitud de insumos',
      'No corresponde a Mantenimiento ni a Sistemas',
    ])
  })

  it.each([
    ['', null],
    ['Duplicada', 'Duplicada'],
    ['Duplicada: ya está en atención como NOV-0149.', 'Duplicada'],
    ['Duplicada, ver NOV-0149', 'Duplicada'],
    ['Duplicadas las dos', null],
    ['Está duplicada', null],
    ['Es una solicitud de insumos', 'Es una solicitud de insumos'],
  ])('«%s» empieza con el motivo frecuente %s', (motivo, esperado) => {
    expect(motivoFrecuenteDe(motivo)).toBe(esperado)
  })

  it('en un campo vacío escribe el motivo frecuente', () => {
    expect(alternarMotivoFrecuente('', 'Duplicada')).toBe('Duplicada')
    expect(alternarMotivoFrecuente('   ', 'Duplicada')).toBe('Duplicada')
  })

  it('conserva lo que la persona ya escribió, después del motivo frecuente', () => {
    expect(alternarMotivoFrecuente('ya está en atención como NOV-0149.', 'Duplicada')).toBe(
      'Duplicada: ya está en atención como NOV-0149.',
    )
  })

  it('reemplaza otro motivo frecuente y conserva el detalle', () => {
    expect(
      alternarMotivoFrecuente('Duplicada: la pidieron ayer', 'Es una solicitud de insumos'),
    ).toBe('Es una solicitud de insumos: la pidieron ayer')
    expect(alternarMotivoFrecuente('Duplicada', 'Es una solicitud de insumos')).toBe(
      'Es una solicitud de insumos',
    )
  })

  it('tocar el mismo motivo lo quita y deja el detalle', () => {
    expect(alternarMotivoFrecuente('Duplicada', 'Duplicada')).toBe('')
    expect(alternarMotivoFrecuente('Duplicada: la pidieron ayer', 'Duplicada')).toBe(
      'la pidieron ayer',
    )
  })

  it('no pasa del máximo de caracteres', () => {
    const largo = 'a'.repeat(500)

    expect(alternarMotivoFrecuente(largo, 'Duplicada')).toHaveLength(500)
  })
})
