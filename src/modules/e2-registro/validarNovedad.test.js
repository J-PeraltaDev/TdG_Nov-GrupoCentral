import { describe, expect, it } from 'vitest'
import { resumenDeFaltantes, validarNovedad } from './validarNovedad.js'

const COMPLETA = { descripcion: 'La bomba no enciende', prioridad: 'alto', areaId: 'area-m' }

describe('validarNovedad (RF-05 / CU-05 4a)', () => {
  it('RF-05: con descripción, prioridad y área no hay errores', () => {
    expect(validarNovedad(COMPLETA)).toEqual({})
  })

  it('RF-05 / CU-05 4a: sin ningún dato señala los tres campos con los textos de Figma', () => {
    expect(validarNovedad({ descripcion: '', prioridad: '', areaId: '' })).toEqual({
      descripcion: 'Describe la novedad',
      prioridad: 'Elige la prioridad',
      area: 'Elige el área',
    })
  })

  it('RF-05 / CU-05 4a: una descripción de solo espacios cuenta como vacía', () => {
    expect(validarNovedad({ ...COMPLETA, descripcion: '   \n ' })).toEqual({
      descripcion: 'Describe la novedad',
    })
  })

  it('RF-05: la descripción admite hasta 500 caracteres', () => {
    expect(validarNovedad({ ...COMPLETA, descripcion: 'a'.repeat(500) })).toEqual({})
    expect(validarNovedad({ ...COMPLETA, descripcion: 'a'.repeat(501) })).toEqual({
      descripcion: 'Usa máximo 500 caracteres',
    })
  })

  it('RF-05 / CU-05 4a: señala solo el campo que falta', () => {
    expect(validarNovedad({ ...COMPLETA, prioridad: '' })).toEqual({
      prioridad: 'Elige la prioridad',
    })
    expect(validarNovedad({ ...COMPLETA, areaId: '' })).toEqual({ area: 'Elige el área' })
  })
})

describe('resumenDeFaltantes (pantalla 05-C)', () => {
  it('concuerda en singular y en plural', () => {
    expect(resumenDeFaltantes(1)).toBe('Falta 1 dato obligatorio')
    expect(resumenDeFaltantes(3)).toBe('Faltan 3 datos obligatorios')
  })
})
