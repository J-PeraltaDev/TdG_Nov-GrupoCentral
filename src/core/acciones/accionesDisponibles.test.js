// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ACCION, accionesDisponibles } from './accionesDisponibles.js'

const FINCA = 'finca-1'
const AREA = 'area-m'

const PERFILES = {
  reportante: { rol_id: 1, finca_id: FINCA, area_id: null, activo: true },
  aprobador: { rol_id: 2, finca_id: null, area_id: AREA, activo: true },
  director: { rol_id: 3, finca_id: null, area_id: null, activo: true },
  administrador: { rol_id: 4, finca_id: null, area_id: null, activo: true },
}

const novedad = (estado, cambios = {}) => ({ estado, finca_id: FINCA, area_id: AREA, ...cambios })

const {
  ADJUNTAR_FOTO,
  TOMAR,
  REASIGNAR,
  RECHAZAR,
  REGISTRAR_SOLUCION,
  ESCALAR,
  APROBAR,
  RECHAZAR_ESCALAMIENTO,
  CONFIRMAR_CIERRE,
  FALLA_PERSISTE,
  CORREGIR_TIPO_FALLA,
} = ACCION

// La Tabla 35 del SDD, celda por celda: estado × rol → acciones, en su orden.
const TABLA_35 = [
  ['registrada', 'reportante', []],
  ['registrada', 'aprobador', []],
  ['registrada', 'director', []],
  ['registrada', 'administrador', []],
  ['asignada', 'reportante', [ADJUNTAR_FOTO]],
  ['asignada', 'aprobador', [TOMAR, REASIGNAR, RECHAZAR]],
  ['asignada', 'director', []],
  ['asignada', 'administrador', []],
  ['en_atencion', 'reportante', [ADJUNTAR_FOTO]],
  ['en_atencion', 'aprobador', [REGISTRAR_SOLUCION, ESCALAR, REASIGNAR, RECHAZAR]],
  ['en_atencion', 'director', []],
  ['en_atencion', 'administrador', []],
  ['escalada', 'reportante', [ADJUNTAR_FOTO]],
  ['escalada', 'aprobador', []],
  ['escalada', 'director', [APROBAR, RECHAZAR_ESCALAMIENTO]],
  ['escalada', 'administrador', []],
  ['aprobada', 'reportante', [ADJUNTAR_FOTO]],
  ['aprobada', 'aprobador', [REGISTRAR_SOLUCION]],
  ['aprobada', 'director', []],
  ['aprobada', 'administrador', []],
  ['resuelta', 'reportante', [CONFIRMAR_CIERRE, FALLA_PERSISTE, ADJUNTAR_FOTO]],
  ['resuelta', 'aprobador', []],
  ['resuelta', 'director', []],
  ['resuelta', 'administrador', []],
  ['cerrada', 'reportante', []],
  ['cerrada', 'aprobador', []],
  ['cerrada', 'director', []],
  ['cerrada', 'administrador', [CORREGIR_TIPO_FALLA]],
  ['rechazada', 'reportante', []],
  ['rechazada', 'aprobador', []],
  ['rechazada', 'director', []],
  ['rechazada', 'administrador', []],
]

describe('Mapa de acciones (RF-18 / CU-18 5, SDD Tabla 35)', () => {
  it('la prueba cubre los 8 estados × 4 roles', () => {
    expect(TABLA_35).toHaveLength(32)
    expect(new Set(TABLA_35.map(([estado, rol]) => `${estado}/${rol}`)).size).toBe(32)
  })

  it.each(TABLA_35)('RF-18 / CU-18 5: %s · %s → %j', (estado, rol, acciones) => {
    expect(accionesDisponibles(PERFILES[rol], novedad(estado))).toEqual(acciones)
  })

  it('RF-18: los estados finales no admiten cambios de estado para ningún rol', () => {
    for (const rol of Object.keys(PERFILES)) {
      expect(accionesDisponibles(PERFILES[rol], novedad('rechazada'))).toEqual([])
    }
    expect(accionesDisponibles(PERFILES.reportante, novedad('cerrada'))).toEqual([])
  })

  it('RNF-11: el aprobador no tiene acciones sobre una novedad de otra área', () => {
    expect(
      accionesDisponibles(PERFILES.aprobador, novedad('asignada', { area_id: 'area-s' })),
    ).toEqual([])
  })

  it('RNF-11: el reportante no tiene acciones sobre una novedad de otra finca', () => {
    expect(
      accionesDisponibles(PERFILES.reportante, novedad('resuelta', { finca_id: 'finca-2' })),
    ).toEqual([])
  })

  it('RF-13 y RF-32: el director y el administrador alcanzan las novedades de cualquier finca y área', () => {
    const lejana = { finca_id: 'finca-9', area_id: 'area-s' }

    expect(accionesDisponibles(PERFILES.director, novedad('escalada', lejana))).toEqual([
      APROBAR,
      RECHAZAR_ESCALAMIENTO,
    ])
    expect(accionesDisponibles(PERFILES.administrador, novedad('cerrada', lejana))).toEqual([
      CORREGIR_TIPO_FALLA,
    ])
  })

  it('RF-01: un usuario desactivado, sin perfil o sin novedad no tiene acciones', () => {
    expect(
      accionesDisponibles({ ...PERFILES.aprobador, activo: false }, novedad('asignada')),
    ).toEqual([])
    expect(accionesDisponibles(null, novedad('asignada'))).toEqual([])
    expect(accionesDisponibles(PERFILES.aprobador, null)).toEqual([])
  })

  it('un estado desconocido no ofrece acciones', () => {
    expect(accionesDisponibles(PERFILES.aprobador, novedad('pendiente'))).toEqual([])
  })
})
