import { describe, expect, it } from 'vitest'
import { advertenciaDeAlcance } from './advertenciaDeAlcance.js'

const FINCAS = [
  { id: 'f-1', nombre: 'Altamira', novedades_abiertas: 2 },
  { id: 'f-2', nombre: 'El Jardín', novedades_abiertas: 0 },
  { id: 'f-3', nombre: 'Villa Rosa', novedades_abiertas: 1 },
]
const AREAS = [
  { id: 'area-m', nombre: 'Mantenimiento' },
  { id: 'area-s', nombre: 'Sistemas' },
]
const CATALOGOS = { fincas: FINCAS, areas: AREAS }

const usuario = (id, rolId, cambios = {}) => ({
  id,
  nombre: `Usuario ${id}`,
  rol_id: rolId,
  finca_id: null,
  area_id: null,
  activo: true,
  ...cambios,
})

const APROBADOR = usuario('u-2', 2, { area_id: 'area-m' })
const REPORTANTE = usuario('u-1', 1, { finca_id: 'f-1' })

describe('Advertencia al dejar un alcance sin nadie (RF-03, decisión 15b del plan)', () => {
  it('avisa si es el único aprobador activo de su área', () => {
    const otros = [
      usuario('u-3', 2, { area_id: 'area-s' }),
      usuario('u-4', 2, { area_id: 'area-m', activo: false }),
    ]

    expect(advertenciaDeAlcance(APROBADOR, [APROBADOR, ...otros], CATALOGOS)).toBe(
      'Es el único aprobador activo de Mantenimiento: sus novedades quedarán sin quien las atienda.',
    )
  })

  it('no avisa si hay otro aprobador activo en el área', () => {
    const colega = usuario('u-3', 2, { area_id: 'area-m' })

    expect(advertenciaDeAlcance(APROBADOR, [APROBADOR, colega], CATALOGOS)).toBeNull()
  })

  it('avisa si es el único reportante activo de una finca con novedades abiertas', () => {
    expect(advertenciaDeAlcance(REPORTANTE, [REPORTANTE, APROBADOR], CATALOGOS)).toBe(
      'Es el único reportante activo de Altamira, que tiene 2 novedades abiertas: nadie podrá confirmar su cierre.',
    )
  })

  it('con una sola novedad abierta lo dice en singular', () => {
    const solo = usuario('u-9', 1, { finca_id: 'f-3' })

    expect(advertenciaDeAlcance(solo, [solo], CATALOGOS)).toBe(
      'Es el único reportante activo de Villa Rosa, que tiene 1 novedad abierta: nadie podrá confirmar su cierre.',
    )
  })

  it('no avisa si la finca no tiene novedades abiertas', () => {
    const tranquilo = usuario('u-9', 1, { finca_id: 'f-2' })

    expect(advertenciaDeAlcance(tranquilo, [tranquilo], CATALOGOS)).toBeNull()
  })

  it('no avisa si hay otro reportante activo en la finca', () => {
    const colega = usuario('u-8', 1, { finca_id: 'f-1' })

    expect(advertenciaDeAlcance(REPORTANTE, [REPORTANTE, colega], CATALOGOS)).toBeNull()
  })

  it.each([3, 4])('el rol %i no tiene alcance que dejar solo', (rolId) => {
    const sinAlcance = usuario('u-5', rolId)

    expect(advertenciaDeAlcance(sinAlcance, [sinAlcance], CATALOGOS)).toBeNull()
  })

  it('un usuario que ya está inactivo no deja nada solo', () => {
    const inactivo = { ...APROBADOR, activo: false }

    expect(advertenciaDeAlcance(inactivo, [inactivo], CATALOGOS)).toBeNull()
  })

  it('si no conoce la finca o el área, no inventa la advertencia', () => {
    const perdido = usuario('u-9', 1, { finca_id: 'f-desconocida' })

    expect(advertenciaDeAlcance(perdido, [perdido], CATALOGOS)).toBeNull()
    expect(advertenciaDeAlcance(null, [], CATALOGOS)).toBeNull()
  })
})
