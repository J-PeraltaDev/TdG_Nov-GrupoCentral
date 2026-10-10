import { describe, expect, it } from 'vitest'
import { estadoDeSolicitud, estaAbierta } from './estadoDeSolicitud.js'

const AHORA = new Date('2026-09-24T13:05:00Z')
const en = (minutos) => new Date(AHORA.getTime() + minutos * 60_000).toISOString()

const solicitud = (cambios = {}) => ({
  id: 's-1',
  usuario_id: 'u-1',
  creada_en: en(-12),
  expira_en: null,
  usado: false,
  intentos_fallidos: 0,
  ...cambios,
})

describe('Pantalla 32 · Estado de una solicitud de recuperación (RF-02; SDD 6.1.10)', () => {
  it('sin código, está pendiente', () => {
    expect(estadoDeSolicitud(solicitud(), AHORA)).toBe('pendiente')
  })

  it('con un código que no ha vencido, «código generado»', () => {
    expect(estadoDeSolicitud(solicitud({ expira_en: en(18) }), AHORA)).toBe('codigo_generado')
  })

  it('RF-02 / CU-02 9a: con el código vencido, vencida', () => {
    expect(estadoDeSolicitud(solicitud({ expira_en: en(-1) }), AHORA)).toBe('vencida')
    // En el minuto exacto ya no sirve: el servidor compara igual.
    expect(estadoDeSolicitud(solicitud({ expira_en: en(0) }), AHORA)).toBe('vencida')
  })

  it('RF-02: con los cinco intentos agotados, vencida aunque le quede tiempo', () => {
    expect(estadoDeSolicitud(solicitud({ expira_en: en(18), intentos_fallidos: 5 }), AHORA)).toBe(
      'vencida',
    )
    expect(estadoDeSolicitud(solicitud({ expira_en: en(18), intentos_fallidos: 4 }), AHORA)).toBe(
      'codigo_generado',
    )
  })

  it('RF-02 / CU-02 9: usada, sin importar lo demás', () => {
    expect(estadoDeSolicitud(solicitud({ usado: true, expira_en: en(18) }), AHORA)).toBe('usada')
    expect(estadoDeSolicitud(solicitud({ usado: true, expira_en: en(-90) }), AHORA)).toBe('usada')
  })

  it('RF-02: si desactivaron al usuario, su solicitud abierta está vencida; la usada sigue usada', () => {
    expect(estadoDeSolicitud(solicitud(), AHORA, false)).toBe('vencida')
    expect(estadoDeSolicitud(solicitud({ expira_en: en(18) }), AHORA, false)).toBe('vencida')
    expect(estadoDeSolicitud(solicitud({ usado: true, expira_en: en(18) }), AHORA, false)).toBe(
      'usada',
    )
  })

  it('están abiertas las pendientes y las que tienen un código vigente', () => {
    expect(['pendiente', 'codigo_generado', 'usada', 'vencida'].map(estaAbierta)).toEqual([
      true,
      true,
      false,
      false,
    ])
  })
})
