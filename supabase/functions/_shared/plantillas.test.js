// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mensajeDelPush, textoDelAviso } from './plantillas.js'

const REPORTANTE = 1
const APROBADOR = 2
const DIRECTOR = 3
const ADMINISTRADOR = 4

const NOVEDAD = {
  codigo: 153,
  finca: 'La Mónica',
  area: 'Sistemas',
  prioridad: 'critico',
  tipo_falla: 'Biométrico',
}

const texto = (estado_nuevo, rolId, cambios = {}) =>
  textoDelAviso({ estado_nuevo }, rolId, { ...NOVEDAD, ...cambios })

describe('Plantillas de los avisos (RF-30 / CU-30 2, SDD Tabla 33)', () => {
  it('RF-30 / CU-07: a los aprobadores les llega la novedad nueva de su área, con la finca y la prioridad', () => {
    expect(texto('asignada', APROBADOR)).toBe('Nueva novedad de La Mónica · Crítico.')
    expect(texto('asignada', APROBADOR, { prioridad: 'bajo' })).toBe(
      'Nueva novedad de La Mónica · Bajo.',
    )
  })

  it('RF-30 / CU-17: al reportante, «asignada» solo le llega por una reasignación', () => {
    expect(texto('asignada', REPORTANTE)).toBe('Tu novedad fue reasignada a Sistemas.')
  })

  it('RF-30 / CU-10 y CU-15: «en atención» depende de quién lo recibe', () => {
    expect(texto('en_atencion', REPORTANTE)).toBe('Sistemas tomó tu novedad para atención.')
    expect(texto('en_atencion', APROBADOR)).toBe('La finca La Mónica indica que la falla persiste.')
  })

  it('RF-30 / CU-12: la escalada pide la decisión del director y le avisa al reportante', () => {
    expect(texto('escalada', DIRECTOR)).toBe('Escalada por Sistemas: requiere tu decisión.')
    expect(texto('escalada', REPORTANTE)).toBe(
      'Tu novedad fue escalada al director de agricultura.',
    )
  })

  it('RF-30 / CU-13: aprobada y rechazada tienen un solo texto para todos', () => {
    for (const rol of [REPORTANTE, APROBADOR]) {
      expect(texto('aprobada', rol)).toBe(
        'El director de agricultura aprobó la novedad; vuelve a Sistemas para ejecutarla.',
      )
      expect(texto('rechazada', rol)).toBe('La novedad fue rechazada. Ábrela para ver el motivo.')
    }
  })

  it('RF-30 / CU-14: «resuelta» le pide la confirmación al reportante y la revisión del tipo al administrador', () => {
    expect(texto('resuelta', REPORTANTE)).toBe(
      'Sistemas registró la solución. Confirma si quedó resuelta.',
    )
    expect(texto('resuelta', ADMINISTRADOR)).toBe(
      'Se creó el tipo de falla «Biométrico»; revísalo en el catálogo.',
    )
    // Si la falla persistió después, la novedad ya no tiene tipo.
    expect(texto('resuelta', ADMINISTRADOR, { tipo_falla: null })).toBe(
      'Se creó un tipo de falla nuevo; revísalo en el catálogo.',
    )
  })

  it('RF-30 / CU-15: el cierre se le avisa al área', () => {
    expect(texto('cerrada', APROBADOR)).toBe('La finca La Mónica confirmó el cierre.')
  })

  it('RF-30: una combinación que la Tabla 33 no tiene dice a qué estado pasó', () => {
    expect(texto('registrada', DIRECTOR)).toBe('La novedad pasó a «Registrada».')
    expect(texto('cerrada', REPORTANTE)).toBe('La novedad pasó a «Cerrada».')
  })
})

describe('Mensaje del push (RF-31; plan del Sprint 5, decisión 47)', () => {
  it('RF-31: el título es el código y el estado; el cuerpo, el mismo texto de la pantalla 10; sin la descripción', () => {
    const aviso = {
      id: '11111111-1111-4111-8111-111111111111',
      novedad_id: '33333333-3333-4333-8333-333333333333',
      estado_nuevo: 'asignada',
    }

    expect(
      mensajeDelPush(aviso, APROBADOR, { ...NOVEDAD, descripcion: 'Texto libre del reporte' }),
    ).toEqual({
      titulo: 'NOV-0153 · Asignada',
      cuerpo: 'Nueva novedad de La Mónica · Crítico.',
      url: '/novedades/33333333-3333-4333-8333-333333333333?aviso=11111111-1111-4111-8111-111111111111',
      novedad_id: '33333333-3333-4333-8333-333333333333',
    })
  })

  it('RF-31: un código de más de cuatro dígitos se muestra completo', () => {
    const { titulo } = mensajeDelPush(
      { id: 'a', novedad_id: 'b', estado_nuevo: 'en_atencion' },
      REPORTANTE,
      { ...NOVEDAD, codigo: 12345 },
    )
    expect(titulo).toBe('NOV-12345 · En atención')
  })
})
